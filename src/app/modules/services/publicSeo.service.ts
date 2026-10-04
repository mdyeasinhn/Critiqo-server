import { Prisma, SeoMeta } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../error/ApiError";
import prisma from "../models";
import { resolveSeo } from "../../../lib/seo-analysis/resolveSeo";
import { excludeNoindexFromSitemap } from "../../../lib/seo-analysis/sitemap";
import { SeoContentType } from "../validation/seo.validation";
import { getSiteSettings } from "./siteSettings.service";

const contentRelations = {
  schemaMarkups: {
    select: { id: true, type: true, json: true },
  },
} as const;

export const getPublicSeoBySlug = async (
  type: SeoContentType,
  slug: string,
) => {
  let content: {
    title: string;
    slug: string | null;
    seoMeta: SeoMeta | null;
    schemaMarkups: Array<{
      id: string;
      type: string;
      json: Prisma.JsonValue;
    }>;
  } | null = null;

  switch (type) {
    case "page":
      content = await prisma.page.findFirst({
        where: { slug, published: true },
        select: { title: true, slug: true, seoMeta: true, ...contentRelations },
      });
      break;
    case "blogPost":
      content = await prisma.blogPost.findFirst({
        where: { slug, published: true },
        select: { title: true, slug: true, seoMeta: true, ...contentRelations },
      });
      break;
    case "review":
      content = await prisma.review.findFirst({
        where: { slug, published: true },
        select: { title: true, slug: true, seoMeta: true, ...contentRelations },
      });
      break;
  }

  if (!content) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Published content not found");
  }

  const siteSettings = await getSiteSettings();
  return {
    ...resolveSeo(
      {
        ...content.seoMeta,
        slug: content.seoMeta?.slug || content.slug,
      },
      siteSettings,
    ),
    schema: content.schemaMarkups.map(({ type: schemaType, json }) => ({
      type: schemaType,
      json,
    })),
  };
};

const buildUrl = (baseUrl: string, path: string): string => {
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(path, normalizedBaseUrl).toString();
};

export const getSitemap = async () => {
  const settings = await getSiteSettings();
  const [pages, blogPosts, reviews] = await Promise.all([
    prisma.page.findMany({
      where: { published: true },
      select: {
        slug: true,
        updatedAt: true,
        seoMeta: { select: { noindex: true } },
      },
    }),
    prisma.blogPost.findMany({
      where: { published: true },
      select: {
        slug: true,
        updatedAt: true,
        seoMeta: { select: { noindex: true } },
      },
    }),
    prisma.review.findMany({
      where: { published: true, slug: { not: null } },
      select: {
        slug: true,
        updatedAt: true,
        seoMeta: { select: { noindex: true } },
      },
    }),
  ]);

  const lastModified = settings.updatedAt;
  const staticEntries = ["", "about", "contact", "blog", "reviews"].map(
    (path) => ({
      url: buildUrl(settings.baseUrl, path),
      lastModified,
      noindex: false,
    }),
  );
  const dynamicEntries = [...pages, ...blogPosts, ...reviews].flatMap(
    (content) =>
      content.slug
        ? [
            {
              url: buildUrl(settings.baseUrl, content.slug),
              lastModified: content.updatedAt,
              noindex: content.seoMeta?.noindex ?? false,
            },
          ]
        : [],
  );

  return excludeNoindexFromSitemap([...staticEntries, ...dynamicEntries]);
};

export const getRobots = async () => {
  const settings = await getSiteSettings();
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemapUrl: buildUrl(settings.baseUrl, "api/seo/sitemap"),
  };
};
