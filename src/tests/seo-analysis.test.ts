import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeSeoContentType,
  seoContentTypeSchema,
  seoParamsSchema,
} from "../app/modules/validation/seo.validation";
import { analyzeSeoMetadata } from "../lib/seo-analysis/analyzeSeoMetadata";
import { resolveSeo } from "../lib/seo-analysis/resolveSeo";
import { excludeNoindexFromSitemap } from "../lib/seo-analysis/sitemap";
import { seoUpdateSchema } from "../app/modules/validation/seo.validation";
import { analyzeImages } from "../lib/seo-analysis/analyzeImages";
import {
  sanitizeAndExtractImages,
  sanitizeContentHtml,
} from "../lib/seo-analysis/sanitizeContentHtml";
import {
  calculateKeywordDensity,
  calculateSeoScore,
  checkDescriptionLength,
  checkHeadings,
  checkTitleLength,
  countWords,
  analyzeContent,
} from "../lib/seo-analysis/contentChecks";
import {
  buildArticleJsonLd,
  buildBreadcrumbListJsonLd,
  buildFaqPageJsonLd,
  buildOrganizationJsonLd,
  buildProductJsonLd,
  buildReviewJsonLd,
  buildWebSiteJsonLd,
  escapeJsonLdForScript,
} from "../lib/seo-analysis/jsonLd";

test("SEO analysis reports completeness for content", () => {
  const analysis = analyzeSeoMetadata("a-good-slug", {
    seoTitle: "Example",
    metaDescription: "An example description",
    focusKeyword: "example",
    ogImage: "https://example.com/image.png",
  });

  assert.deepEqual(analysis, {
    score: 100,
    grade: "good",
    missing: [],
  });
});

test("SEO update rejects invalid slugs and non-HTTP URLs", () => {
  assert.equal(
    seoUpdateSchema.safeParse({ slug: "Not a slug" }).success,
    false,
  );
  assert.equal(
    seoUpdateSchema.safeParse({ canonicalUrl: "javascript:alert(1)" }).success,
    false,
  );
});

test("SEO routes use blog as the canonical type and retain the blogPost alias", () => {
  assert.equal(seoContentTypeSchema.parse("blog"), "blog");
  assert.equal(seoParamsSchema.parse({ type: "blog", id: "post-id" }).type, "blog");
  assert.equal(normalizeSeoContentType("blogPost"), "blog");
  assert.equal(normalizeSeoContentType("blog"), "blog");
  assert.equal(seoContentTypeSchema.safeParse("blogPost").success, false);
});

test("SEO update enforces title and description limits", () => {
  assert.equal(
    seoUpdateSchema.safeParse({ seoTitle: "x".repeat(61) }).success,
    false,
  );
  assert.equal(
    seoUpdateSchema.safeParse({ metaDescription: "x".repeat(161) }).success,
    false,
  );
});

test("SEO resolution uses site defaults for empty metadata fields", () => {
  const resolved = resolveSeo(null, {
    siteName: "Example site",
    baseUrl: "https://example.com",
    defaultTitle: "Default title",
    defaultDescription: "Default description",
    defaultOgImage: "https://example.com/default.png",
  });

  assert.equal(resolved.title, "Default title");
  assert.equal(resolved.description, "Default description");
  assert.equal(resolved.canonical, "https://example.com/");
  assert.deepEqual(resolved.openGraph.images, [
    "https://example.com/default.png",
  ]);
  assert.deepEqual(resolved.twitter.images, [
    "https://example.com/default.png",
  ]);
});

test("SEO resolution replaces empty metadata with site defaults", () => {
  const resolved = resolveSeo(
    {
      seoTitle: "",
      metaDescription: " ",
      slug: "example-page",
      ogTitle: "",
      ogDescription: "",
      ogImage: "",
      twitterTitle: "",
      twitterDescription: "",
      twitterImage: "",
    },
    {
      siteName: "Example site",
      baseUrl: "https://example.com",
      defaultTitle: "Default title",
      defaultDescription: "Default description",
      defaultOgImage: "https://example.com/default.png",
    },
  );

  assert.equal(resolved.title, "Default title");
  assert.equal(resolved.description, "Default description");
  assert.equal(resolved.canonical, "https://example.com/example-page");
  assert.equal(resolved.openGraph.title, "Default title");
  assert.equal(resolved.openGraph.description, "Default description");
  assert.deepEqual(resolved.twitter.images, [
    "https://example.com/default.png",
  ]);
});

test("sitemap filtering excludes noindex content", () => {
  const lastModified = new Date("2026-01-01T00:00:00.000Z");
  const entries = excludeNoindexFromSitemap([
    {
      url: "https://example.com/public",
      lastModified,
      noindex: false,
    },
    {
      url: "https://example.com/private",
      lastModified,
      noindex: true,
    },
  ]);

  assert.deepEqual(entries, [
    { url: "https://example.com/public", lastModified },
  ]);
});

test("HTML sanitization strips scripts, event handlers, and unsafe URLs", () => {
  const html = sanitizeContentHtml(
    '<p onclick="evil()">Hello<script>alert(1)</script><img src="https://example.com/a.jpg" onerror="evil()"></p><a href="https://outside.example" target="_blank">outside</a><a href="javascript:alert(1)">unsafe</a>',
  );

  assert.doesNotMatch(html, /<script|onclick=|onerror=|javascript:/i);
  assert.match(html, /rel="noopener noreferrer"/);
  assert.match(html, /<img src="https:\/\/example\.com\/a\.jpg"/);
});

test("sanitization extracts images with positions and descriptive metadata", () => {
  const result = sanitizeAndExtractImages(
    '<p>Intro</p><img src="https://example.com/photo.jpg" alt="A blue bicycle" title="Bicycle">',
  );

  assert.equal(result.images.length, 1);
  assert.deepEqual(result.images[0], {
    url: "https://example.com/photo.jpg",
    alt: "A blue bicycle",
    title: "Bicycle",
    fileName: "photo.jpg",
    position: 0,
  });
});

test("image analysis reports every issue with an explanatory reason", () => {
  const [image] = analyzeImages(
    [
      {
        id: "img-1",
        url: "https://example.com/IMG_001.jpg",
        alt: "SEO SEO",
        fileName: "IMG_001.jpg",
      },
    ],
    "SEO",
  );
  const issueTypes = image.issues.map((issue) => issue.type);

  assert.deepEqual(issueTypes, [
    "alt-too-short",
    "keyword-stuffing",
    "non-descriptive-file-name",
  ]);
  assert.ok(image.issues.every((issue) => issue.reason.length > 0));

  const [missing] = analyzeImages(
    [
      {
        id: "img-2",
        url: "https://example.com/image1.jpg",
        alt: null,
        fileName: "image1.jpg",
      },
    ],
    "",
  );
  assert.deepEqual(
    missing.issues.map((issue) => issue.type),
    ["missing-alt", "non-descriptive-file-name"],
  );

  const [tooLong] = analyzeImages(
    [
      {
        id: "img-3",
        url: "https://example.com/DSC_009.jpg",
        alt: "A".repeat(126),
        fileName: "DSC_009.jpg",
      },
    ],
    "example",
  );
  assert.deepEqual(
    tooLong.issues.map((issue) => issue.type),
    ["alt-too-long", "non-descriptive-file-name"],
  );
});

test("keyword density handles empty inputs and calculates a stable percentage", () => {
  const emptyKeyword = calculateKeywordDensity("A short body of text", "");
  const emptyText = calculateKeywordDensity("", "search term");
  const validDensity = calculateKeywordDensity(
    `${"keyword ".repeat(10)}${"ordinary ".repeat(990)}`,
    "keyword",
  );

  assert.equal(emptyKeyword.status, "warn");
  assert.equal(emptyKeyword.value, 0);
  assert.equal(emptyText.status, "warn");
  assert.equal(validDensity.status, "pass");
  assert.equal(validDensity.value, 1);
  assert.ok(
    [emptyKeyword, emptyText, validDensity].every((check) => check.message),
  );
});

test("heading check detects exactly-one-H1 violations and skipped levels", () => {
  const skipped = checkHeadings("<h1>Main</h1><h3>Skipped</h3><h4>Next</h4>");
  const multipleH1 = checkHeadings("<h1>One</h1><h1>Two</h1>");
  const valid = checkHeadings("<h1>Main</h1><h2>Section</h2><h3>Detail</h3>");

  assert.equal(skipped.status, "fail");
  assert.deepEqual(skipped.value.skippedLevels, [2]);
  assert.equal(multipleH1.value.h1Count, 2);
  assert.equal(valid.status, "pass");
  assert.ok([skipped, multipleH1, valid].every((check) => check.message));
});

test("title and description length checks report limits and empty values", () => {
  assert.equal(checkTitleLength("").status, "warn");
  assert.equal(checkTitleLength("x".repeat(55)).status, "pass");
  assert.equal(checkTitleLength("x".repeat(61)).status, "warn");
  assert.equal(checkDescriptionLength("").status, "warn");
  assert.equal(checkDescriptionLength("x".repeat(150)).status, "pass");
  assert.equal(checkDescriptionLength("x".repeat(161)).status, "warn");
});

test("SEO score uses fixed weights and is deterministic for identical inputs", () => {
  const input = {
    html: "<h1>SEO guide</h1><p>SEO guide content</p>",
    title: "SEO guide",
    description: "SEO guide",
    slug: "seo-guide",
    keyword: "SEO",
  };
  const checks = analyzeContent(input, "example.com");
  const expectedScore = calculateSeoScore(checks);

  assert.equal(
    expectedScore,
    calculateSeoScore(analyzeContent(input, "example.com")),
  );
  assert.equal(expectedScore, 63);
  assert.equal(
    calculateSeoScore([
      { id: "keyword-placement", status: "pass", message: "ok", value: {} },
      { id: "keyword-density", status: "warn", message: "ok", value: 0 },
      { id: "headings", status: "fail", message: "bad", value: {} },
      { id: "title-length", status: "pass", message: "ok", value: 55 },
      { id: "description-length", status: "warn", message: "ok", value: 0 },
      { id: "word-count", status: "pass", message: "ok", value: 300 },
      { id: "links", status: "pass", message: "ok", value: {} },
      { id: "paragraph-length", status: "warn", message: "ok", value: {} },
    ]),
    68,
  );
  assert.ok(checks.every((check) => check.id && check.message));
  assert.equal(countWords("").status, "warn");
});

test("JSON-LD builders produce their expected schema types and aggregates", () => {
  const site = {
    siteName: "Critiqo",
    baseUrl: "https://example.com",
    defaultDescription: "Trusted reviews",
    defaultOgImage: "https://example.com/og.png",
  };
  const page = {
    title: "Product guide",
    slug: "product-guide",
    contentHtml:
      "<h2>What is this guide?</h2><p>This guide explains products.</p>",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    images: ["https://example.com/product.png"],
    rating: 4.5,
    reviewCount: 8,
  };

  assert.equal(buildOrganizationJsonLd(site)["@type"], "Organization");
  assert.equal(buildWebSiteJsonLd(site)["@type"], "WebSite");
  assert.equal(buildArticleJsonLd(page, site)["@type"], "Article");
  assert.equal(buildReviewJsonLd(page, site)["@type"], "Review");
  assert.equal(buildProductJsonLd(page, site)["@type"], "Product");
  assert.equal(
    (
      buildProductJsonLd(page, site).aggregateRating as {
        ratingValue: number;
        reviewCount: number;
      }
    ).reviewCount,
    8,
  );
  assert.equal(buildFaqPageJsonLd(page)["@type"], "FAQPage");
  assert.equal(
    buildBreadcrumbListJsonLd(page, site)["@type"],
    "BreadcrumbList",
  );
});

test("JSON-LD serialization escapes less-than characters for script contexts", () => {
  const serialized = escapeJsonLdForScript({
    "@context": "https://schema.org",
    name: "</script><script>alert(1)</script>",
  });

  assert.doesNotMatch(serialized, /<\/script/i);
  assert.match(serialized, /\\u003c\/script/i);
});
