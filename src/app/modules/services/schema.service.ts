import { Prisma } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../error/ApiError";
import prisma from "../models";
import {
  buildJsonLd,
  JsonLdObject,
  JsonLdType,
} from "../../../lib/seo-analysis/jsonLd";
import { getSiteSettings } from "./siteSettings.service";
import { SchemaContentType } from "../validation/schema.validation";

const contentNotFound = (): ApiError =>
  new ApiError(StatusCodes.NOT_FOUND, "Content not found");

const fetchContent = async (
  type: SchemaContentType,
  id: string,
): Promise<{
  id: string;
  title: string;
  slug: string;
  contentHtml: string;
  createdAt: Date;
  updatedAt: Date;
  images: string[];
  rating?: number;
  reviewCount?: number;
  authorName?: string;
} | null> => {
  if (type === "page") {
    const page = await prisma.page.findUnique({
      where: { id },
      include: { contentImages: { select: { url: true } } },
    });
    return page
      ? { ...page, images: page.contentImages.map((image) => image.url) }
      : null;
  }
  if (type === "blogPost") {
    const page = await prisma.blogPost.findUnique({
      where: { id },
      include: { contentImages: { select: { url: true } } },
    });
    return page
      ? { ...page, images: page.contentImages.map((image) => image.url) }
      : null;
  }

  const review = await prisma.review.findUnique({
    where: { id },
    include: {
      contentImages: { select: { url: true } },
      user: { select: { name: true } },
    },
  });
  if (!review) return null;

  const aggregate = await prisma.review.aggregate({
    where: {
      title: review.title,
    },
    _avg: { rating: true },
    _count: { _all: true },
  });

  return {
    ...review,
    slug: review.slug ?? "",
    contentHtml: review.contentHtml ?? "",
    images: review.contentImages.map((image) => image.url),
    rating: aggregate._avg.rating ?? review.rating,
    reviewCount: aggregate._count._all,
    authorName: review.user.name,
  };
};

const validateSchema = (
  schemaType: JsonLdType,
  value: unknown,
): JsonLdObject => {
  if (typeof value === "string") {
    try {
      value = JSON.parse(value) as unknown;
    } catch (error: unknown) {
      const reason =
        error instanceof Error ? error.message : "Unknown JSON parse error";
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `Schema JSON is invalid: ${reason}`,
      );
    }
  }

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Schema JSON must be an object",
    );
  }

  const json = value as Record<string, unknown>;
  if (!("@context" in json)) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Schema is missing required field @context",
    );
  }
  if (!("@type" in json)) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Schema is missing required field @type",
    );
  }
  if (
    json["@context"] !== "https://schema.org" &&
    json["@context"] !== "http://schema.org"
  ) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Schema @context must be https://schema.org or http://schema.org",
    );
  }
  if (json["@type"] !== schemaType) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Schema @type must match schemaType "${schemaType}"`,
    );
  }

  const missing: string[] = [];
  const requiresString = (field: string): void => {
    if (typeof json[field] !== "string" || !json[field]?.trim()) {
      missing.push(field);
    }
  };
  const requiresObject = (field: string, nestedFields: string[]): void => {
    const nested = json[field];
    if (
      typeof nested !== "object" ||
      nested === null ||
      Array.isArray(nested)
    ) {
      missing.push(field);
      return;
    }
    for (const nestedField of nestedFields) {
      const nestedValue = (nested as Record<string, unknown>)[nestedField];
      if (typeof nestedValue !== "string" && typeof nestedValue !== "number") {
        missing.push(`${field}.${nestedField}`);
      }
    }
  };

  switch (schemaType) {
    case "Organization":
    case "WebSite":
      requiresString("name");
      requiresString("url");
      break;
    case "Article":
      requiresString("headline");
      requiresString("datePublished");
      requiresObject("author", ["name"]);
      break;
    case "Review":
      requiresObject("itemReviewed", ["name"]);
      requiresObject("reviewRating", ["ratingValue"]);
      requiresObject("author", ["name"]);
      break;
    case "Product": {
      requiresString("name");
      requiresObject("aggregateRating", ["ratingValue"]);
      const aggregate = json.aggregateRating;
      if (
        typeof aggregate === "object" &&
        aggregate !== null &&
        !Array.isArray(aggregate) &&
        !("reviewCount" in aggregate) &&
        !("ratingCount" in aggregate)
      ) {
        missing.push(
          "aggregateRating.reviewCount or aggregateRating.ratingCount",
        );
      }
      break;
    }
    case "FAQPage": {
      const entities = json.mainEntity;
      if (!Array.isArray(entities) || entities.length === 0) {
        missing.push("mainEntity (at least one question and answer)");
        break;
      }
      entities.forEach((entity, index) => {
        if (
          typeof entity !== "object" ||
          entity === null ||
          Array.isArray(entity)
        ) {
          missing.push(`mainEntity[${index}]`);
          return;
        }
        const item = entity as Record<string, unknown>;
        if (typeof item.name !== "string" || !item.name.trim()) {
          missing.push(`mainEntity[${index}].name`);
        }
        requiresAnswer(entity, index, missing);
      });
      break;
    }
    case "BreadcrumbList": {
      const items = json.itemListElement;
      if (!Array.isArray(items) || items.length === 0) {
        missing.push("itemListElement (at least one breadcrumb)");
        break;
      }
      items.forEach((item, index) => {
        if (typeof item !== "object" || item === null || Array.isArray(item)) {
          missing.push(`itemListElement[${index}]`);
          return;
        }
        const breadcrumb = item as Record<string, unknown>;
        for (const field of ["position", "name", "item"]) {
          if (!(field in breadcrumb)) {
            missing.push(`itemListElement[${index}].${field}`);
          }
        }
      });
      break;
    }
  }

  if (missing.length > 0) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Schema is missing or has invalid required fields: ${missing.join(", ")}`,
    );
  }

  try {
    JSON.stringify(value);
  } catch {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Schema JSON cannot be serialized",
    );
  }
  return json;
};

function requiresAnswer(
  entity: unknown,
  index: number,
  missing: string[],
): void {
  if (typeof entity !== "object" || entity === null || Array.isArray(entity)) {
    return;
  }
  const acceptedAnswer = (entity as Record<string, unknown>).acceptedAnswer;
  if (
    typeof acceptedAnswer !== "object" ||
    acceptedAnswer === null ||
    Array.isArray(acceptedAnswer) ||
    typeof (acceptedAnswer as Record<string, unknown>).text !== "string" ||
    !(acceptedAnswer as Record<string, unknown>).text
  ) {
    missing.push(`mainEntity[${index}].acceptedAnswer.text`);
  }
}

export const generateSchema = async (
  type: SchemaContentType,
  id: string,
  schemaType: JsonLdType,
) => {
  const content = await fetchContent(type, id);
  if (!content) throw contentNotFound();
  const settings = await getSiteSettings();
  const json = buildJsonLd(schemaType, content, {
    siteName: settings.siteName,
    baseUrl: settings.baseUrl,
    defaultDescription: settings.defaultDescription,
    defaultOgImage: settings.defaultOgImage,
  });
  return validateSchema(schemaType, json);
};

export const saveSchema = async (
  type: SchemaContentType,
  id: string,
  schemaType: JsonLdType,
  input: unknown,
) => {
  const json = validateSchema(schemaType, input);
  const content = await fetchContent(type, id);
  if (!content) throw contentNotFound();

  const contentIdField =
    type === "page"
      ? { pageId: id }
      : type === "blogPost"
        ? { blogPostId: id }
        : { reviewId: id };

  return prisma.$transaction(async (tx) => {
    await tx.schemaMarkup.deleteMany({
      where: { ...contentIdField, type: schemaType },
    });
    return tx.schemaMarkup.create({
      data: {
        ...contentIdField,
        type: schemaType,
        json: json as Prisma.InputJsonValue,
      },
    });
  });
};
