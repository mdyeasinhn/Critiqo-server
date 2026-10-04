import assert from "node:assert/strict";
import test from "node:test";
import { analyzeSeoMetadata } from "../lib/seo-analysis/analyzeSeoMetadata";
import { resolveSeo } from "../lib/seo-analysis/resolveSeo";
import { excludeNoindexFromSitemap } from "../lib/seo-analysis/sitemap";
import { seoUpdateSchema } from "../app/modules/validation/seo.validation";
import { analyzeImages } from "../lib/seo-analysis/analyzeImages";
import {
  sanitizeAndExtractImages,
  sanitizeContentHtml,
} from "../lib/seo-analysis/sanitizeContentHtml";

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
