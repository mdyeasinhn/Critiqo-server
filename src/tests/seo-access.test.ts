import assert from "node:assert/strict";
import test from "node:test";
import jwt from "jsonwebtoken";
import request from "supertest";
import { UserRole } from "@prisma/client";
import app from "../app";
import config from "../app/config";

const userToken = jwt.sign(
  {
    userId: "seo-access-test-user",
    email: "seo-access-test@example.invalid",
    role: UserRole.USER,
  },
  config.jwt.secret,
);
const userAuthorization = "Bearer ".concat(userToken);
const adminAuthorization = "Bearer ".concat(
  jwt.sign(
    {
      userId: "seo-access-test-admin",
      email: "seo-access-test-admin@example.invalid",
      role: UserRole.ADMIN,
    },
    config.jwt.secret,
  ),
);

test("unauthenticated callers cannot read SEO data", async () => {
  const response = await request(app).get("/api/admin/seo");
  assert.equal(response.status, 401);
});

test("a non-admin cannot read or write SEO data", async () => {
  const getResponse = await request(app)
    .get("/api/admin/seo")
    .set("Authorization", userAuthorization);
  const putResponse = await request(app)
    .put("/api/admin/seo/page/not-a-real-page")
    .set("Authorization", userAuthorization)
    .send({ seoTitle: "Attempted change" });

  assert.equal(getResponse.status, 403);
  assert.equal(putResponse.status, 403);
});

test("all admin route groups reject non-admin JWTs before handling requests", async () => {
  const adminRequests = [
    request(app).get("/api/admin/seo"),
    request(app).post("/api/admin/seo/analyze").send({
      html: "",
      seoTitle: "",
      metaDescription: "",
      slug: "",
      focusKeyword: "",
    }),
    request(app)
      .put("/api/admin/seo/page/not-a-real-page")
      .send({ seoTitle: "No" }),
    request(app).get(
      "/api/admin/schema/page/not-a-real-page/generate?schemaType=Article",
    ),
    request(app).put("/api/admin/schema/page/not-a-real-page").send({}),
    request(app).get("/api/admin/site-settings"),
    request(app).put("/api/admin/site-settings").send({ siteName: "No" }),
    request(app).post("/api/admin/content/blogPost").send({}),
    request(app)
      .put("/api/admin/content/blogPost/not-a-real-post")
      .send({ title: "No" }),
    request(app).get("/api/admin/images/blogPost/not-a-real-post"),
    request(app)
      .patch("/api/admin/images/not-a-real-image")
      .send({ alt: "No" }),
    request(app).get("/api/v1/admin/dashboard"),
    request(app).get("/api/v1/admin/reviews"),
  ];

  const responses = await Promise.all(
    adminRequests.map((pendingRequest) =>
      pendingRequest.set("Authorization", userAuthorization),
    ),
  );
  assert.deepEqual(
    responses.map((response) => response.status),
    adminRequests.map(() => 403),
  );
});

test("versioned SEO analysis returns scored checks and enforces the rate limit", async () => {
  const input = {
    html: "<h1>SEO guide</h1><h2>SEO tips</h2><p>SEO guide content for readers.</p><a href=\"https://example.com/guide\">Related guide</a>",
    seoTitle: "SEO guide for better content",
    metaDescription:
      "Learn practical SEO tips to improve your content and help readers find useful information online.",
    slug: "seo-guide",
    focusKeyword: "SEO",
  };

  const unauthenticatedResponse = await request(app)
    .post("/api/v1/admin/seo/analyze")
    .send(input);
  assert.equal(unauthenticatedResponse.status, 401);

  const nonAdminResponse = await request(app)
    .post("/api/v1/admin/seo/analyze")
    .set("Authorization", userAuthorization)
    .send(input);
  assert.equal(nonAdminResponse.status, 403);

  const response = await request(app)
    .post("/api/v1/admin/seo/analyze")
    .set("Authorization", adminAuthorization)
    .send(input);

  assert.equal(response.status, 200);
  assert.equal(typeof response.body.data.score, "number");
  assert.equal(response.body.data.checks.length, 8);
  assert.ok(
    response.body.data.checks.every(
      (check: Record<string, unknown>) =>
        typeof check.id === "string" &&
        ["pass", "warn", "fail"].includes(String(check.status)) &&
        typeof check.message === "string" &&
        "value" in check,
    ),
  );

  let rateLimited = false;
  for (let attempt = 1; attempt < 21; attempt += 1) {
    const limitedResponse = await request(app)
      .post("/api/v1/admin/seo/analyze")
      .set("Authorization", adminAuthorization)
      .send(input);
    if (limitedResponse.status === 429) {
      rateLimited = true;
      assert.match(limitedResponse.body.message, /Too many SEO analysis requests/);
      break;
    }
  }
  assert.equal(rateLimited, true);
});

test("invalid schema edits return clear parsing and required-field reasons", async () => {
  const invalidSchemas: Array<{
    schemaType: string;
    json: unknown;
    reason: RegExp;
  }> = [
    {
      schemaType: "Article",
      json: "{not-json",
      reason: /Schema JSON is invalid/,
    },
    { schemaType: "Article", json: { "@type": "Article" }, reason: /@context/ },
    {
      schemaType: "Article",
      json: { "@context": "https://schema.org", "@type": "Article" },
      reason: /headline|datePublished|author/,
    },
    {
      schemaType: "Product",
      json: {
        "@context": "https://schema.org",
        "@type": "Product",
        name: "Product",
      },
      reason: /aggregateRating/,
    },
  ];

  for (const invalidSchema of invalidSchemas) {
    const response = await request(app)
      .put("/api/admin/schema/page/not-a-real-page")
      .set("Authorization", adminAuthorization)
      .send(invalidSchema);

    assert.equal(response.status, 400);
    assert.match(response.body.message, invalidSchema.reason);
  }
});

test("contactus redirects permanently to contact", async () => {
  const response = await request(app).get("/contactus");
  assert.equal(response.status, 301);
  assert.equal(response.headers.location, "/contact");
});
