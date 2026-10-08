import { Prisma, SeoMeta } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../error/ApiError";
import prisma from "../models";
import { analyzeSeoMetadata } from "../../../lib/seo-analysis/analyzeSeoMetadata";
import { sanitizeAndExtractImages } from "../../../lib/seo-analysis/sanitizeContentHtml";
import {
  normalizeSeoContentType,
  SeoContentType,
  SeoContentTypeInput,
  SeoUpdateInput,
} from "../validation/seo.validation";

type ContentRow = {
  id: string;
  type: SeoContentType;
  title: string;
  slug: string | null;
  contentHtml: string | null;
  published: boolean;
  updatedAt: Date;
  seoMeta: SeoMeta | null;
  schemaMarkups: Array<{ id: string; type: string; json: Prisma.JsonValue }>;
  contentImages: Array<{
    id: string;
    url: string;
    alt: string | null;
    title: string | null;
    fileName: string | null;
  }>;
};

const notFound = (): ApiError =>
  new ApiError(StatusCodes.NOT_FOUND, "Content not found");

const mapPage = (
  row: Awaited<ReturnType<typeof prisma.page.findMany>>[number] & {
    seoMeta: SeoMeta | null;
    schemaMarkups: ContentRow["schemaMarkups"];
    contentImages: ContentRow["contentImages"];
  },
): ContentRow => ({
  id: row.id,
  type: "page",
  title: row.title,
  slug: row.slug,
  contentHtml: row.contentHtml,
  published: row.published,
  updatedAt: row.updatedAt,
  seoMeta: row.seoMeta,
  schemaMarkups: row.schemaMarkups,
  contentImages: row.contentImages,
});

const mapBlogPost = (
  row: Awaited<ReturnType<typeof prisma.blogPost.findMany>>[number] & {
    seoMeta: SeoMeta | null;
    schemaMarkups: ContentRow["schemaMarkups"];
    contentImages: ContentRow["contentImages"];
  },
): ContentRow => ({
  id: row.id,
  type: "blog",
  title: row.title,
  slug: row.slug,
  contentHtml: row.contentHtml,
  published: row.published,
  updatedAt: row.updatedAt,
  seoMeta: row.seoMeta,
  schemaMarkups: row.schemaMarkups,
  contentImages: row.contentImages,
});

const mapReview = (
  row: Awaited<ReturnType<typeof prisma.review.findMany>>[number] & {
    seoMeta: SeoMeta | null;
    schemaMarkups: ContentRow["schemaMarkups"];
    contentImages: ContentRow["contentImages"];
  },
): ContentRow => ({
  id: row.id,
  type: "review",
  title: row.title,
  slug: row.slug,
  contentHtml: row.contentHtml,
  published: row.published,
  updatedAt: row.updatedAt,
  seoMeta: row.seoMeta,
  schemaMarkups: row.schemaMarkups,
  contentImages: row.contentImages,
});

const contentInclude = {
  seoMeta: true,
  schemaMarkups: { select: { id: true, type: true, json: true } },
  contentImages: {
    select: {
      id: true,
      url: true,
      alt: true,
      title: true,
      fileName: true,
      position: true,
    },
    orderBy: { position: "asc" },
  },
} satisfies Prisma.PageInclude;

export const listSeoContent = async () => {
  const [pages, blogPosts, reviews] = await Promise.all([
    prisma.page.findMany({ include: contentInclude }),
    prisma.blogPost.findMany({
      include: {
        seoMeta: true,
        schemaMarkups: contentInclude.schemaMarkups,
        contentImages: contentInclude.contentImages,
      },
    }),
    prisma.review.findMany({
      include: {
        seoMeta: true,
        schemaMarkups: contentInclude.schemaMarkups,
        contentImages: contentInclude.contentImages,
      },
    }),
  ]);

  return [
    ...pages.map(mapPage),
    ...blogPosts.map(mapBlogPost),
    ...reviews.map(mapReview),
  ]
    .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())
    .map((content) => ({
      id: content.id,
      type: content.type,
      title: content.title,
      slug: content.slug,
      published: content.published,
      updatedAt: content.updatedAt,
      seoMeta: content.seoMeta,
      seoStatus: analyzeSeoMetadata(content.slug, content.seoMeta),
    }));
};

export const getSeoContent = async (type: SeoContentTypeInput, id: string) => {
  const contentType = normalizeSeoContentType(type);
  let content: ContentRow | null = null;

  switch (contentType) {
    case "page": {
      const row = await prisma.page.findUnique({
        where: { id },
        include: contentInclude,
      });
      content = row ? mapPage(row) : null;
      break;
    }
    case "blog": {
      const row = await prisma.blogPost.findUnique({
        where: { id },
        include: {
          seoMeta: true,
          schemaMarkups: contentInclude.schemaMarkups,
          contentImages: contentInclude.contentImages,
        },
      });
      content = row ? mapBlogPost(row) : null;
      break;
    }
    case "review": {
      const row = await prisma.review.findUnique({
        where: { id },
        include: {
          seoMeta: true,
          schemaMarkups: contentInclude.schemaMarkups,
          contentImages: contentInclude.contentImages,
        },
      });
      content = row ? mapReview(row) : null;
      break;
    }
  }

  if (!content) {
    throw notFound();
  }

  return {
    ...content,
    seoStatus: analyzeSeoMetadata(content.slug, content.seoMeta),
  };
};

const ensureUniqueSlug = async (
  type: SeoContentType,
  id: string,
  slug: string,
): Promise<void> => {
  const [page, blogPost, review] = await Promise.all([
    prisma.page.findFirst({
      where: { slug, ...(type === "page" ? { id: { not: id } } : {}) },
      select: { id: true },
    }),
    prisma.blogPost.findFirst({
      where: { slug, ...(type === "blog" ? { id: { not: id } } : {}) },
      select: { id: true },
    }),
    prisma.review.findFirst({
      where: { slug, ...(type === "review" ? { id: { not: id } } : {}) },
      select: { id: true },
    }),
  ]);

  if (page || blogPost || review) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Slug is already in use by another content item",
    );
  }
};

const upsertSeoMeta = async (
  tx: Prisma.TransactionClient,
  type: SeoContentType,
  id: string,
  slug: string | null,
  input: SeoUpdateInput,
): Promise<void> => {
  const update: Prisma.SeoMetaUncheckedUpdateInput = {
    seoTitle: input.seoTitle,
    metaDescription: input.metaDescription,
    slug: input.slug,
    focusKeyword: input.focusKeyword,
    canonicalUrl: input.canonicalUrl,
    noindex: input.noindex,
    ogTitle: input.ogTitle,
    ogDescription: input.ogDescription,
    ogImage: input.ogImage,
    twitterTitle: input.twitterTitle,
    twitterDescription: input.twitterDescription,
    twitterImage: input.twitterImage,
  };
  const create = {
    seoTitle: input.seoTitle,
    metaDescription: input.metaDescription,
    slug: input.slug ?? slug,
    focusKeyword: input.focusKeyword,
    canonicalUrl: input.canonicalUrl,
    noindex: input.noindex,
    ogTitle: input.ogTitle,
    ogDescription: input.ogDescription,
    ogImage: input.ogImage,
    twitterTitle: input.twitterTitle,
    twitterDescription: input.twitterDescription,
    twitterImage: input.twitterImage,
  };

  switch (type) {
    case "page":
      await tx.seoMeta.upsert({
        where: { pageId: id },
        create: { ...create, pageId: id },
        update,
      });
      break;
    case "blog":
      await tx.seoMeta.upsert({
        where: { blogPostId: id },
        create: { ...create, blogPostId: id },
        update,
      });
      break;
    case "review":
      await tx.seoMeta.upsert({
        where: { reviewId: id },
        create: { ...create, reviewId: id },
        update,
      });
      break;
  }
};

const replaceSchemaMarkups = async (
  tx: Prisma.TransactionClient,
  type: SeoContentType,
  id: string,
  schemaMarkups: NonNullable<SeoUpdateInput["schemaMarkup"]>,
): Promise<void> => {
  switch (type) {
    case "page":
      await tx.schemaMarkup.deleteMany({ where: { pageId: id } });
      await tx.schemaMarkup.createMany({
        data: schemaMarkups.map((item) => ({ ...item, pageId: id })),
      });
      break;
    case "blog":
      await tx.schemaMarkup.deleteMany({ where: { blogPostId: id } });
      await tx.schemaMarkup.createMany({
        data: schemaMarkups.map((item) => ({ ...item, blogPostId: id })),
      });
      break;
    case "review":
      await tx.schemaMarkup.deleteMany({ where: { reviewId: id } });
      await tx.schemaMarkup.createMany({
        data: schemaMarkups.map((item) => ({ ...item, reviewId: id })),
      });
      break;
  }
};

const replaceContentImages = async (
  tx: Prisma.TransactionClient,
  type: SeoContentType,
  id: string,
  images: NonNullable<SeoUpdateInput["contentImages"]>,
): Promise<void> => {
  switch (type) {
    case "page":
      await tx.contentImage.deleteMany({ where: { pageId: id } });
      await tx.contentImage.createMany({
        data: images.map((image, position) => ({
          ...image,
          position,
          pageId: id,
        })),
      });
      break;
    case "blog":
      await tx.contentImage.deleteMany({ where: { blogPostId: id } });
      await tx.contentImage.createMany({
        data: images.map((image, position) => ({
          ...image,
          position,
          blogPostId: id,
        })),
      });
      break;
    case "review":
      await tx.contentImage.deleteMany({ where: { reviewId: id } });
      await tx.contentImage.createMany({
        data: images.map((image, position) => ({
          ...image,
          position,
          reviewId: id,
        })),
      });
      break;
  }
};

export const updateSeoContent = async (
  type: SeoContentTypeInput,
  id: string,
  input: SeoUpdateInput,
) => {
  const contentType = normalizeSeoContentType(type);
  const current = await getSeoContent(contentType, id);
  if (input.slug) {
    await ensureUniqueSlug(contentType, id, input.slug);
  }

  const sanitizedContent =
    input.contentHtml === undefined
      ? null
      : sanitizeAndExtractImages(input.contentHtml);
  const contentUpdate = {
    title: input.title,
    slug: input.slug,
    contentHtml: sanitizedContent?.html,
    published: input.published,
  };

  try {
    await prisma.$transaction(async (tx) => {
      switch (contentType) {
        case "page":
          await tx.page.update({ where: { id }, data: contentUpdate });
          break;
        case "blog":
          await tx.blogPost.update({ where: { id }, data: contentUpdate });
          break;
        case "review":
          await tx.review.update({
            where: { id },
            data: {
              ...contentUpdate,
              ...(input.published === undefined
                ? {}
                : {
                    status: input.published ? "PUBLISHED" : "UNPUBLISHED",
                  }),
            },
          });
          break;
      }

      await upsertSeoMeta(tx, contentType, id, current.slug, input);

      if (input.schemaMarkup !== undefined) {
        await replaceSchemaMarkups(tx, contentType, id, input.schemaMarkup);
      }
      if (sanitizedContent) {
        switch (contentType) {
          case "page":
            await tx.contentImage.deleteMany({ where: { pageId: id } });
            if (sanitizedContent.images.length > 0) {
              await tx.contentImage.createMany({
                data: sanitizedContent.images.map((image) => ({
                  ...image,
                  pageId: id,
                })),
              });
            }
            break;
          case "blog":
            await tx.contentImage.deleteMany({ where: { blogPostId: id } });
            if (sanitizedContent.images.length > 0) {
              await tx.contentImage.createMany({
                data: sanitizedContent.images.map((image) => ({
                  ...image,
                  blogPostId: id,
                })),
              });
            }
            break;
          case "review":
            await tx.contentImage.deleteMany({ where: { reviewId: id } });
            if (sanitizedContent.images.length > 0) {
              await tx.contentImage.createMany({
                data: sanitizedContent.images.map((image) => ({
                  ...image,
                  reviewId: id,
                })),
              });
            }
            break;
        }
      } else if (input.contentImages !== undefined) {
        await replaceContentImages(tx, contentType, id, input.contentImages);
      }
    });
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Slug is already in use by another content item",
      );
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw notFound();
    }
    throw error;
  }

  return getSeoContent(contentType, id);
};

export type { ContentRow };
