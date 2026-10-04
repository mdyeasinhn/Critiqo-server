import { StatusCodes } from "http-status-codes";
import ApiError from "../../error/ApiError";
import prisma from "../models";
import { analyzeImages } from "../../../lib/seo-analysis/analyzeImages";
import {
  renameImageUrl,
  sanitizeAndSyncImageAttributes,
} from "../../../lib/seo-analysis/sanitizeContentHtml";
import { ManagedContentType } from "./content.service";
import { UpdateImageInput } from "../validation/image.validation";

const notFound = (): ApiError =>
  new ApiError(StatusCodes.NOT_FOUND, "Content image not found");

export const getContentImages = async (
  type: ManagedContentType,
  id: string,
) => {
  if (type === "blogPost") {
    const content = await prisma.blogPost.findUnique({
      where: { id },
      select: {
        id: true,
        seoMeta: { select: { focusKeyword: true } },
        contentImages: {
          orderBy: { position: "asc" },
          select: {
            id: true,
            url: true,
            alt: true,
            title: true,
            fileName: true,
            position: true,
          },
        },
      },
    });
    if (!content)
      throw new ApiError(StatusCodes.NOT_FOUND, "Blog post not found");
    return analyzeImages(content.contentImages, content.seoMeta?.focusKeyword);
  }

  const content = await prisma.review.findUnique({
    where: { id },
    select: {
      id: true,
      seoMeta: { select: { focusKeyword: true } },
      contentImages: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          url: true,
          alt: true,
          title: true,
          fileName: true,
          position: true,
        },
      },
    },
  });
  if (!content) throw new ApiError(StatusCodes.NOT_FOUND, "Review not found");
  return analyzeImages(content.contentImages, content.seoMeta?.focusKeyword);
};

export const updateContentImage = async (
  imageId: string,
  input: UpdateImageInput,
) => {
  const image = await prisma.contentImage.findUnique({
    where: { id: imageId },
    include: {
      blogPost: { select: { id: true, contentHtml: true } },
      review: { select: { id: true, contentHtml: true } },
    },
  });
  if (!image) throw notFound();

  const owner = image.blogPost ?? image.review;
  const type: ManagedContentType | null = image.blogPost
    ? "blogPost"
    : image.review
      ? "review"
      : null;
  if (!owner || !type) throw notFound();

  const siblings = await prisma.contentImage.findMany({
    where: image.blogPost
      ? { blogPostId: image.blogPost.id }
      : { reviewId: image.review?.id },
    orderBy: { position: "asc" },
    select: {
      id: true,
      position: true,
      url: true,
      alt: true,
      title: true,
      fileName: true,
    },
  });
  const updatesByPosition = new Map<
    number,
    { alt: string | null; title: string | null; src?: string }
  >();
  for (const sibling of siblings) {
    if (sibling.id !== imageId) continue;
    const url =
      input.fileName && input.fileName !== sibling.fileName
        ? renameImageUrl(sibling.url, input.fileName)
        : sibling.url;

    updatesByPosition.set(sibling.position, {
      alt: input.alt === undefined ? sibling.alt : input.alt,
      title: input.title === undefined ? sibling.title : input.title,
      ...(url !== sibling.url ? { src: url } : {}),
    });
  }

  const contentHtml = sanitizeAndSyncImageAttributes(
    owner.contentHtml ?? "",
    updatesByPosition,
  );

  await prisma.$transaction(async (tx) => {
    const updatedUrl = input.fileName
      ? renameImageUrl(image.url, input.fileName)
      : undefined;
    await tx.contentImage.update({
      where: { id: imageId },
      data: {
        alt: input.alt,
        title: input.title,
        fileName: input.fileName,
        ...(updatedUrl ? { url: updatedUrl } : {}),
      },
    });

    if (type === "blogPost") {
      await tx.blogPost.update({
        where: { id: owner.id },
        data: { contentHtml },
      });
    } else {
      await tx.review.update({
        where: { id: owner.id },
        data: { contentHtml },
      });
    }
  });

  return prisma.contentImage.findUnique({ where: { id: imageId } });
};
