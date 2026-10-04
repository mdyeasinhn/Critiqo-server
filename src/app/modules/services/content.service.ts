import { Prisma, ReviewStatus, SeoMeta } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../error/ApiError";
import prisma from "../models";
import {
  ExtractedContentImage,
  sanitizeAndExtractImages,
} from "../../../lib/seo-analysis/sanitizeContentHtml";
import {
  CreateBlogPostInput,
  CreateReviewContentInput,
  UpdateBlogPostInput,
  UpdateReviewContentInput,
} from "../validation/content.validation";

export type ManagedContentType = "blogPost" | "review";

const imageSelect = {
  id: true,
  url: true,
  alt: true,
  title: true,
  fileName: true,
  position: true,
} satisfies Prisma.ContentImageSelect;

const contentRelations = {
  seoMeta: true,
  contentImages: { select: imageSelect, orderBy: { position: "asc" } },
  schemaMarkups: { select: { id: true, type: true, json: true } },
} as const;

const contentNotFound = (): ApiError =>
  new ApiError(StatusCodes.NOT_FOUND, "Content not found");

const ensureUniqueSlug = async (
  type: ManagedContentType,
  slug: string,
  excludeId?: string,
): Promise<void> => {
  const [page, blogPost, review] = await Promise.all([
    prisma.page.findFirst({
      where: { slug },
      select: { id: true },
    }),
    prisma.blogPost.findFirst({
      where: {
        slug,
        ...(type === "blogPost" && excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    }),
    prisma.review.findFirst({
      where: {
        slug,
        ...(type === "review" && excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    }),
  ]);

  if (page || blogPost || review) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Slug is already in use");
  }
};

const imageRows = (images: ExtractedContentImage[]) =>
  images.map(({ url, alt, title, fileName, position }) => ({
    url,
    alt,
    title,
    fileName,
    position,
  }));

export const createBlogPost = async (input: CreateBlogPostInput) => {
  await ensureUniqueSlug("blogPost", input.slug);
  const { html, images } = sanitizeAndExtractImages(input.contentHtml);

  try {
    return await prisma.blogPost.create({
      data: {
        title: input.title,
        slug: input.slug,
        contentHtml: html,
        published: input.published,
        contentImages: { create: imageRows(images) },
      },
      include: { ...contentRelations },
    });
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Slug is already in use");
    }
    throw error;
  }
};

export const updateBlogPost = async (
  id: string,
  input: UpdateBlogPostInput,
) => {
  const current = await prisma.blogPost.findUnique({ where: { id } });
  if (!current) throw contentNotFound();
  if (input.slug) await ensureUniqueSlug("blogPost", input.slug, id);

  const prepared =
    input.contentHtml === undefined
      ? null
      : sanitizeAndExtractImages(input.contentHtml);
  try {
    await prisma.$transaction(async (tx) => {
      await tx.blogPost.update({
        where: { id },
        data: {
          title: input.title,
          slug: input.slug,
          published: input.published,
          contentHtml: prepared?.html,
        },
      });
      if (prepared) {
        await tx.contentImage.deleteMany({ where: { blogPostId: id } });
        if (prepared.images.length > 0) {
          await tx.contentImage.createMany({
            data: prepared.images.map((image) => ({
              ...imageRows([image])[0],
              blogPostId: id,
            })),
          });
        }
      }
    });
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Slug is already in use");
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw contentNotFound();
    }
    throw error;
  }

  return prisma.blogPost.findUnique({
    where: { id },
    include: { ...contentRelations },
  });
};

export interface CreateReviewContentOptions extends CreateReviewContentInput {
  userId: string;
}

export const createReviewContent = async (
  input: CreateReviewContentOptions,
) => {
  await ensureUniqueSlug("review", input.slug);
  const { html, images } = sanitizeAndExtractImages(input.contentHtml);
  const { userId, ...content } = input;
  const description = content.description ?? content.title;
  if (content.isPremium && content.premiumPrice === undefined) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Premium price is required for premium reviews",
    );
  }

  try {
    return await prisma.review.create({
      data: {
        title: content.title,
        slug: content.slug,
        contentHtml: html,
        published: content.published,
        status: content.published ? ReviewStatus.PUBLISHED : ReviewStatus.DRAFT,
        categoryId: content.categoryId,
        userId,
        rating: content.rating,
        description,
        images: "",
        purchaseSource: content.purchaseSource,
        isPremium: content.isPremium,
        premiumPrice: content.isPremium ? content.premiumPrice : null,
        contentImages: { create: imageRows(images) },
      },
      include: { ...contentRelations },
    });
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Slug is already in use");
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Review category not found");
    }
    throw error;
  }
};

export const updateReviewContent = async (
  id: string,
  input: UpdateReviewContentInput,
) => {
  const current = await prisma.review.findUnique({ where: { id } });
  if (!current) throw contentNotFound();
  if (input.slug) await ensureUniqueSlug("review", input.slug, id);
  if (
    input.isPremium === true &&
    input.premiumPrice === undefined &&
    current.premiumPrice === null
  ) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Premium price is required for premium reviews",
    );
  }

  const prepared =
    input.contentHtml === undefined
      ? null
      : sanitizeAndExtractImages(input.contentHtml);
  try {
    await prisma.$transaction(async (tx) => {
      await tx.review.update({
        where: { id },
        data: {
          title: input.title,
          slug: input.slug,
          contentHtml: prepared?.html,
          published: input.published,
          ...(input.published === undefined
            ? {}
            : {
                status: input.published
                  ? ReviewStatus.PUBLISHED
                  : ReviewStatus.UNPUBLISHED,
              }),
          categoryId: input.categoryId,
          rating: input.rating,
          description: input.description,
          purchaseSource: input.purchaseSource,
          isPremium: input.isPremium,
          premiumPrice: input.isPremium === false ? null : input.premiumPrice,
        },
      });
      if (prepared) {
        await tx.contentImage.deleteMany({ where: { reviewId: id } });
        if (prepared.images.length > 0) {
          await tx.contentImage.createMany({
            data: prepared.images.map((image) => ({
              ...imageRows([image])[0],
              reviewId: id,
            })),
          });
        }
      }
    });
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Slug is already in use");
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw contentNotFound();
    }
    throw error;
  }

  return prisma.review.findUnique({
    where: { id },
    include: { ...contentRelations },
  });
};

const publicContentSelect = {
  id: true,
  title: true,
  slug: true,
  contentHtml: true,
  published: true,
  updatedAt: true,
  seoMeta: true,
  contentImages: { select: imageSelect, orderBy: { position: "asc" } },
  schemaMarkups: { select: { type: true, json: true } },
} satisfies Prisma.BlogPostSelect;

export const getPublishedContent = async (
  type: ManagedContentType,
  slug: string,
) => {
  const content =
    type === "blogPost"
      ? await prisma.blogPost.findFirst({
          where: { slug, published: true },
          select: publicContentSelect,
        })
      : await prisma.review.findFirst({
          where: { slug, published: true },
          select: {
            ...publicContentSelect,
            description: true,
            rating: true,
            category: { select: { id: true, name: true } },
          },
        });

  if (!content) throw contentNotFound();
  return content;
};

export type SeoContentMeta = SeoMeta;
