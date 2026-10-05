export const jsonLdTypes = [
  "Organization",
  "WebSite",
  "Article",
  "Review",
  "Product",
  "FAQPage",
  "BreadcrumbList",
] as const;

export type JsonLdType = (typeof jsonLdTypes)[number];

export interface JsonLdPage {
  title: string;
  slug: string;
  contentHtml: string;
  createdAt: Date;
  updatedAt: Date;
  images: string[];
  rating?: number;
  reviewCount?: number;
  authorName?: string;
}

export interface JsonLdSite {
  siteName: string;
  baseUrl: string;
  defaultDescription: string;
  defaultOgImage: string | null;
}

export type JsonLdObject = Record<string, unknown>;

const absoluteUrl = (baseUrl: string, path: string): string =>
  new URL(path, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`).toString();

const extractFaq = (
  html: string,
): Array<{
  "@type": "Question";
  name: string;
  acceptedAnswer: { "@type": "Answer"; text: string };
}> => {
  const headings = Array.from(
    html.matchAll(/<h[2-4]\b[^>]*>([\s\S]*?)<\/h[2-4]\s*>/gi),
  );
  const faq = [];
  for (const heading of headings) {
    const question = (heading[1] ?? "").replace(/<[^>]*>/g, "").trim();
    if (!question.endsWith("?")) continue;

    const afterHeading = html.slice((heading.index ?? 0) + heading[0].length);
    const answerMatch = afterHeading.match(/<p\b[^>]*>([\s\S]*?)<\/p\s*>/i);
    const answer = (answerMatch?.[1] ?? "").replace(/<[^>]*>/g, "").trim();
    if (!answer) continue;

    faq.push({
      "@type": "Question" as const,
      name: question,
      acceptedAnswer: { "@type": "Answer" as const, text: answer },
    });
  }
  return faq;
};

export const buildOrganizationJsonLd = (site: JsonLdSite): JsonLdObject => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.siteName,
  url: site.baseUrl,
  ...(site.defaultOgImage ? { logo: site.defaultOgImage } : {}),
});

export const buildWebSiteJsonLd = (site: JsonLdSite): JsonLdObject => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: site.siteName,
  url: site.baseUrl,
  description: site.defaultDescription,
});

export const buildArticleJsonLd = (
  page: JsonLdPage,
  site: JsonLdSite,
): JsonLdObject => ({
  "@context": "https://schema.org",
  "@type": "Article",
  headline: page.title,
  datePublished: page.createdAt.toISOString(),
  dateModified: page.updatedAt.toISOString(),
  author: {
    "@type": "Person",
    name: page.authorName || site.siteName,
  },
  publisher: { "@type": "Organization", name: site.siteName },
  mainEntityOfPage: absoluteUrl(site.baseUrl, page.slug),
  ...(page.images.length > 0
    ? { image: page.images }
    : site.defaultOgImage
      ? { image: [site.defaultOgImage] }
      : {}),
});

export const buildReviewJsonLd = (
  page: JsonLdPage,
  site: JsonLdSite,
): JsonLdObject => ({
  "@context": "https://schema.org",
  "@type": "Review",
  itemReviewed: {
    "@type": "Product",
    name: page.title,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: page.rating ?? 0,
      reviewCount: page.reviewCount ?? 0,
      bestRating: 5,
      worstRating: 1,
    },
  },
  reviewRating: {
    "@type": "Rating",
    ratingValue: page.rating ?? 0,
    bestRating: 5,
    worstRating: 1,
  },
  author: { "@type": "Organization", name: site.siteName },
  datePublished: page.createdAt.toISOString(),
});

export const buildProductJsonLd = (
  page: JsonLdPage,
  site: JsonLdSite,
): JsonLdObject => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name: page.title,
  url: absoluteUrl(site.baseUrl, page.slug),
  ...(page.images.length > 0
    ? { image: page.images }
    : site.defaultOgImage
      ? { image: [site.defaultOgImage] }
      : {}),
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: page.rating ?? 0,
    reviewCount: page.reviewCount ?? 0,
    bestRating: 5,
    worstRating: 1,
  },
});

export const buildFaqPageJsonLd = (page: JsonLdPage): JsonLdObject => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: extractFaq(page.contentHtml),
});

export const buildBreadcrumbListJsonLd = (
  page: JsonLdPage,
  site: JsonLdSite,
): JsonLdObject => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: site.baseUrl,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: page.title,
      item: absoluteUrl(site.baseUrl, page.slug),
    },
  ],
});

export const buildJsonLd = (
  schemaType: JsonLdType,
  page: JsonLdPage,
  site: JsonLdSite,
): JsonLdObject => {
  switch (schemaType) {
    case "Organization":
      return buildOrganizationJsonLd(site);
    case "WebSite":
      return buildWebSiteJsonLd(site);
    case "Article":
      return buildArticleJsonLd(page, site);
    case "Review":
      return buildReviewJsonLd(page, site);
    case "Product":
      return buildProductJsonLd(page, site);
    case "FAQPage":
      return buildFaqPageJsonLd(page);
    case "BreadcrumbList":
      return buildBreadcrumbListJsonLd(page, site);
  }
};

export const escapeJsonLdForScript = (value: unknown): string =>
  JSON.stringify(value).replace(/</g, "\\u003c");
