import assert from "node:assert/strict";
import test from "node:test";
import { analyzeSeoMetadata } from "../lib/seo-analysis/analyzeSeoMetadata";
import { resolveSeo } from "../lib/seo-analysis/resolveSeo";
import { excludeNoindexFromSitemap } from "../lib/seo-analysis/sitemap";
import { seoUpdateSchema } from "../app/modules/validation/seo.validation";

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
