import { Request, Response, NextFunction } from "express";
import catchAsync from "../../shared/catchAsync";
import { ReviewService } from "../services/review.service";
import sendResponse from "../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import pick from "../../shared/pick";
import { paginationFields } from "../../../constants/pagination";
import { UserRole } from "@prisma/client";
import ApiError from "../../error/ApiError";

interface IAuthUser {
  userId: string;
  role: UserRole;
  email: string;
  profilePhoto: string;
}

interface AuthenticatedRequest extends Request {
  user: IAuthUser;
}

// File interface definition
export interface IFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
}

function isAuthUser(user: any): user is IAuthUser {
  return (
    user !== null &&
    typeof user === "object" &&
    "userId" in user &&
    typeof user.userId === "string" &&
    "role" in user &&
    "email" in user &&
    typeof user.email === "string"
  );
}

const createReview = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(
        new ApiError(StatusCodes.UNAUTHORIZED, "Authentication required"),
      );
    }

    if (!isAuthUser(req.user)) {
      return next(
        new ApiError(StatusCodes.UNAUTHORIZED, "Invalid user credentials"),
      );
    }

    try {
      
      const result = await ReviewService.createReview(
        req as AuthenticatedRequest,
      );

      sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: "Review created successfully!",
        data: result,
      });
    } catch (error: any) {
      if (error.name === "ValidationError") {
        return next(new ApiError(StatusCodes.BAD_REQUEST, error.message));
      }

      if (error.code === "P2002") {
        return next(
          new ApiError(
            StatusCodes.CONFLICT,
            "A review with similar unique constraints already exists",
          ),
        );
      }

      next(error);
    }
  },
);

const getAllReviews = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = pick(req.query, [
        "status",
        "categoryId",
        "isPremium",
        "title",
        "rating",
        "userId",
      ]);
      const paginationOptions = pick(req.query, paginationFields);

      // Validate query parameters
      if (req.query.limit && isNaN(Number(req.query.limit))) {
        return next(
          new ApiError(StatusCodes.BAD_REQUEST, "Limit must be a number"),
        );
      }

      if (req.query.page && isNaN(Number(req.query.page))) {
        return next(
          new ApiError(StatusCodes.BAD_REQUEST, "Page must be a number"),
        );
      }

      const result = await ReviewService.getAllReviews(
        filters,
        paginationOptions,
      );

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Reviews retrieved successfully!",
        meta: result.meta,
        data: result.data,
      });
    } catch (error: any) {
      if (error.name === "PrismaClientKnownRequestError") {
        return next(
          new ApiError(StatusCodes.BAD_REQUEST, "Invalid query parameters"),
        );
      }

      next(error);
    }
  },
);

const getReviewById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        return next(
          new ApiError(StatusCodes.BAD_REQUEST, "Review ID is required"),
        );
      }

      const userId =
        req.user && isAuthUser(req.user) ? req.user.userId : undefined;

      const result = await ReviewService.getReviewById(id, userId);

      if (!result) {
        return next(
          new ApiError(StatusCodes.NOT_FOUND, `Review with ID ${id} not found`),
        );
      }

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Review retrieved successfully!",
        data: result,
      });
    } catch (error: any) {
      if (
        error.name === "PrismaClientKnownRequestError" &&
        error.code === "P2023"
      ) {
        return next(
          new ApiError(StatusCodes.BAD_REQUEST, "Invalid review ID format"),
        );
      }

      next(error);
    }
  },
);

const updateReview = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        return next(
          new ApiError(StatusCodes.BAD_REQUEST, "Review ID is required"),
        );
      }

      if (!req.user) {
        return next(
          new ApiError(StatusCodes.UNAUTHORIZED, "Authentication required"),
        );
      }

      if (!isAuthUser(req.user)) {
        return next(
          new ApiError(StatusCodes.UNAUTHORIZED, "Invalid user credentials"),
        );
      }

      const userId = req.user.userId;
      const updateData = req.body;
      const files = req.files;

      let normalizedFiles: IFile[] | undefined;

      if (Array.isArray(files)) {
        normalizedFiles = files;
      } else if (files && typeof files === "object") {
        normalizedFiles = Object.values(files).flat();
      } else {
        normalizedFiles = undefined;
      }

      const result = await ReviewService.updateReview(
        id,
        userId,
        updateData,
        normalizedFiles,
      );

      if (!result) {
        return next(
          new ApiError(
            StatusCodes.NOT_FOUND,
            `Review with ID ${id} not found or not owned by the user`,
          ),
        );
      }

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Review updated successfully!",
        data: result,
      });
    } catch (error: any) {
      if (error.name === "ValidationError") {
        return next(new ApiError(StatusCodes.BAD_REQUEST, error.message));
      }

      if (error.name === "PrismaClientKnownRequestError") {
        if (error.code === "P2025") {
          return next(new ApiError(StatusCodes.NOT_FOUND, "Review not found"));
        }
        if (error.code === "P2023") {
          return next(
            new ApiError(StatusCodes.BAD_REQUEST, "Invalid review ID format"),
          );
        }
      }

      if (error.message.includes("Unauthorized")) {
        return next(
          new ApiError(
            StatusCodes.FORBIDDEN,
            "You are not authorized to update this review",
          ),
        );
      }

      next(error);
    }
  },
);

const deleteReview = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        return next(
          new ApiError(StatusCodes.BAD_REQUEST, "Review ID is required"),
        );
      }

      // Check if user data exists and is valid
      if (!req.user) {
        return next(
          new ApiError(StatusCodes.UNAUTHORIZED, "Authentication required"),
        );
      }

      if (typeof req.user !== "object" || !("userId" in req.user)) {
        return next(
          new ApiError(StatusCodes.UNAUTHORIZED, "Invalid user credentials"),
        );
      }

      const userId = req.user.userId as string;

      const result = await ReviewService.deleteReview(id, userId);

      if (!result) {
        return next(
          new ApiError(
            StatusCodes.NOT_FOUND,
            `Review with ID ${id} not found or not owned by the user`,
          ),
        );
      }

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Review deleted successfully!",
        data: result,
      });
    } catch (error: any) {
      if (error.name === "PrismaClientKnownRequestError") {
        if (error.code === "P2025") {
          return next(new ApiError(StatusCodes.NOT_FOUND, "Review not found"));
        }
        if (error.code === "P2023") {
          return next(
            new ApiError(StatusCodes.BAD_REQUEST, "Invalid review ID format"),
          );
        }
      }

      if (error.message.includes("Unauthorized")) {
        return next(
          new ApiError(
            StatusCodes.FORBIDDEN,
            "You are not authorized to delete this review",
          ),
        );
      }

      next(error);
    }
  },
);

const getFeaturedReviews = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limitParam = req.query.limit as string;
      let limit = 6; // Default limit

      if (limitParam) {
        const parsedLimit = parseInt(limitParam);
        if (isNaN(parsedLimit)) {
          return next(
            new ApiError(StatusCodes.BAD_REQUEST, "Limit must be a number"),
          );
        }
        limit = parsedLimit;
      }

      const result = await ReviewService.getFeaturedReviews(limit);

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Featured reviews retrieved successfully!",
        data: result,
      });
    } catch (error: any) {
      if (error.name === "ValidationError") {
        return next(new ApiError(StatusCodes.BAD_REQUEST, error.message));
      }
      next(error);
    }
  },
);

const getRelatedReviews = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        return next(
          new ApiError(StatusCodes.BAD_REQUEST, "Review ID is required"),
        );
      }

      const limitParam = req.query.limit as string;
      let limit = 4; // Default limit

      if (limitParam) {
        const parsedLimit = parseInt(limitParam);
        if (isNaN(parsedLimit)) {
          return next(
            new ApiError(StatusCodes.BAD_REQUEST, "Limit must be a number"),
          );
        }
        limit = parsedLimit;
      }

      const result = await ReviewService.getRelatedReviews(id, limit);

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Related reviews retrieved successfully!",
        data: result,
      });
    } catch (error: any) {
      if (
        error.name === "PrismaClientKnownRequestError" &&
        error.code === "P2023"
      ) {
        return next(
          new ApiError(StatusCodes.BAD_REQUEST, "Invalid review ID format"),
        );
      }
      next(error);
    }
  },
);

const getUserReviews = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        return next(
          new ApiError(StatusCodes.BAD_REQUEST, "User ID is required"),
        );
      }

      const paginationOptions = pick(req.query, paginationFields);

      // Validate pagination parameters
      if (req.query.limit && isNaN(Number(req.query.limit))) {
        return next(
          new ApiError(StatusCodes.BAD_REQUEST, "Limit must be a number"),
        );
      }

      if (req.query.page && isNaN(Number(req.query.page))) {
        return next(
          new ApiError(StatusCodes.BAD_REQUEST, "Page must be a number"),
        );
      }

      const result = await ReviewService.getUserReviews(
        userId,
        paginationOptions,
      );

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "User reviews retrieved successfully!",
        meta: result.meta,
        data: result.data,
      });
    } catch (error: any) {
      if (error.name === "PrismaClientKnownRequestError") {
        if (error.code === "P2023") {
          return next(
            new ApiError(StatusCodes.BAD_REQUEST, "Invalid user ID format"),
          );
        }
      }
      next(error);
    }
  },
);

const removeImage = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        return next(
          new ApiError(StatusCodes.BAD_REQUEST, "Review ID is required"),
        );
      }

      // Check if user data exists and is valid
      if (!req.user) {
        return next(
          new ApiError(StatusCodes.UNAUTHORIZED, "Authentication required"),
        );
      }

      if (typeof req.user !== "object" || !("userId" in req.user)) {
        return next(
          new ApiError(StatusCodes.UNAUTHORIZED, "Invalid user credentials"),
        );
      }

      const userId = req.user.userId as string;
      const { imageUrl } = req.body;

      if (!imageUrl) {
        return next(
          new ApiError(StatusCodes.BAD_REQUEST, "Image URL is required"),
        );
      }

      const result = await ReviewService.removeImage(id, userId, imageUrl);

      if (!result) {
        return next(
          new ApiError(
            StatusCodes.NOT_FOUND,
            "Review not found or image could not be removed",
          ),
        );
      }

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Image removed successfully!",
        data: result,
      });
    } catch (error: any) {
      if (error.name === "PrismaClientKnownRequestError") {
        if (error.code === "P2025") {
          return next(new ApiError(StatusCodes.NOT_FOUND, "Review not found"));
        }
        if (error.code === "P2023") {
          return next(
            new ApiError(StatusCodes.BAD_REQUEST, "Invalid review ID format"),
          );
        }
      }

      if (
        error.message.includes("Unauthorized") ||
        error.message.includes("Permission denied")
      ) {
        return next(
          new ApiError(
            StatusCodes.FORBIDDEN,
            "You are not authorized to remove images from this review",
          ),
        );
      }

      next(error);
    }
  },
);

export const ReviewController = {
  createReview,
  getAllReviews,
  getReviewById,
  updateReview,
  deleteReview,
  getFeaturedReviews,
  getRelatedReviews,
  getUserReviews,
  removeImage,
};
