import { RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import { UserRole } from "@prisma/client";
import ApiError from "../../error/ApiError";
import catchAsync from "../../shared/catchAsync";
import {
  createBlogPost,
  createReviewContent,
  getPublishedContent,
  updateBlogPost,
  updateReviewContent,
} from "../services/content.service";
import {
  contentParamsSchema,
  contentSlugParamsSchema,
  createBlogPostSchema,
  createReviewContentSchema,
  updateBlogPostSchema,
  updateReviewContentSchema,
} from "../validation/content.validation";

interface AuthenticatedUser {
  userId: string;
  role: UserRole;
}

const hasUserId = (user: unknown): user is AuthenticatedUser =>
  typeof user === "object" &&
  user !== null &&
  "userId" in user &&
  typeof user.userId === "string";

const create: RequestHandler = catchAsync(async (req, res) => {
  const type = req.params.type;
  if (type === "blogPost") {
    const input = createBlogPostSchema.parse(req.body);
    const data = await createBlogPost(input);
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Blog post created successfully",
      data,
    });
    return;
  }

  if (type === "review") {
    if (!hasUserId(req.user)) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        "User ID is missing from authentication token",
      );
    }
    const input = createReviewContentSchema.parse(req.body);
    const data = await createReviewContent({
      ...input,
      userId: req.user.userId,
    });
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Review created successfully",
      data,
    });
    return;
  }

  throw new ApiError(
    StatusCodes.BAD_REQUEST,
    "Content type must be blogPost or review",
  );
});

const update: RequestHandler = catchAsync(async (req, res) => {
  const { type, id } = contentParamsSchema.parse(req.params);
  const data =
    type === "blogPost"
      ? await updateBlogPost(id, updateBlogPostSchema.parse(req.body))
      : await updateReviewContent(
          id,
          updateReviewContentSchema.parse(req.body),
        );

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Content updated successfully",
    data,
  });
});

const getPublic: RequestHandler = catchAsync(async (req, res) => {
  const { type, slug } = contentSlugParamsSchema.parse(req.params);
  const data = await getPublishedContent(type, slug);
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Content retrieved successfully",
    data,
  });
});

export const ContentController = { create, update, getPublic };
