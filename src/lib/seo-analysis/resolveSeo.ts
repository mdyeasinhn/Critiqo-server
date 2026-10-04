import { SeoMeta, SiteSettings } from "@prisma/client";

export interface ResolvedSeo {
  title: string;
  description: string;
  canonical: string;
  robots: {
    index: boolean;
    follow: boolean;
  };
  openGraph: {
    title: string;
    description: string;
    url: string;
    images: string[];
  };
  twitter: {
    card: "summary_large_image";
    title: string;
    description: string;
    images: string[];
  };
}

type SeoMetaFields = Pick<
  SeoMeta,
  | "seoTitle"
  | "metaDescription"
  | "slug"
  | "canonicalUrl"
  | "noindex"
  | "ogTitle"
  | "ogDescription"
  | "ogImage"
  | "twitterTitle"
  | "twitterDescription"
  | "twitterImage"
>;

type SiteDefaults = Pick<
  SiteSettings,
  | "siteName"
  | "baseUrl"
  | "defaultTitle"
  | "defaultDescription"
  | "defaultOgImage"
>;

const firstNonEmpty = (...values: Array<string | null | undefined>): string =>
  values.find((value) => value?.trim())?.trim() ?? "";

export const resolveSeo = (
  meta: Partial<SeoMetaFields> | null,
  siteDefaults: SiteDefaults,
): ResolvedSeo => {
  const title = firstNonEmpty(
    meta?.seoTitle,
    siteDefaults.defaultTitle,
    siteDefaults.siteName,
  );
  const description = firstNonEmpty(
    meta?.metaDescription,
    siteDefaults.defaultDescription,
  );
  const baseUrl = siteDefaults.baseUrl.endsWith("/")
    ? siteDefaults.baseUrl
    : `${siteDefaults.baseUrl}/`;
  const canonical =
    firstNonEmpty(meta?.canonicalUrl) ||
    new URL(meta?.slug?.trim() ?? "", baseUrl).toString();
  const openGraphTitle = firstNonEmpty(meta?.ogTitle, meta?.seoTitle, title);
  const openGraphDescription = firstNonEmpty(
    meta?.ogDescription,
    meta?.metaDescription,
    description,
  );
  const image = firstNonEmpty(meta?.ogImage, siteDefaults.defaultOgImage);
  const twitterTitle = firstNonEmpty(
    meta?.twitterTitle,
    meta?.ogTitle,
    meta?.seoTitle,
    title,
  );
  const twitterDescription = firstNonEmpty(
    meta?.twitterDescription,
    meta?.ogDescription,
    meta?.metaDescription,
    description,
  );
  const twitterImage = firstNonEmpty(
    meta?.twitterImage,
    meta?.ogImage,
    siteDefaults.defaultOgImage,
  );

  return {
    title,
    description,
    canonical,
    robots: {
      index: !meta?.noindex,
      follow: true,
    },
    openGraph: {
      title: openGraphTitle,
      description: openGraphDescription,
      url: canonical,
      images: image ? [image] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: twitterTitle,
      description: twitterDescription,
      images: twitterImage ? [twitterImage] : [],
    },
  };
};
