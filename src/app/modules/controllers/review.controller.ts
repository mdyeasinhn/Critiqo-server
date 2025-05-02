import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { ReviewService } from "../services/review.service";
import sendResponse from "../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import pick from "../../shared/pick";
import { paginationFields } from "../../../constants/pagination";

interface AuthenticatedRequest extends Request {
    user: {
        userId: string;
        role: string;
        email: string; 
    };
}

// Path: src/app/interface/file.ts
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
  
  

/**
 * Create a new review
 */
const createReview = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const result = await ReviewService.createReview(req);

    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: "Review created successfully!",
        data: result
    });
});

/**
 * Get all reviews with filtering and pagination
 */
const getAllReviews = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, ['status', 'categoryId', 'isPremium', 'title', 'rating', 'userId']);
    const paginationOptions = pick(req.query, paginationFields);
    
    const result = await ReviewService.getAllReviews(filters, paginationOptions);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Reviews retrieved successfully!",
        meta: result.meta,
        data: result.data
    });
});

/**
 * Get a single review by ID
 */
const getReviewById = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    
    const result = await ReviewService.getReviewById(id, userId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Review retrieved successfully!",
        data: result
    });
});

/**
 * Update a review
 */
const updateReview = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { userId } = req.user;
    const updateData = req.body;
    const files = req.files;
    
    let normalizedFiles: IFile[] | undefined;

    if (Array.isArray(files)) {
      normalizedFiles = files;
    } else if (files && typeof files === 'object') {
      normalizedFiles = Object.values(files).flat();
    } else {
      normalizedFiles = undefined;
    }
    
    const result = await ReviewService.updateReview(id, userId, updateData, normalizedFiles);
    

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Review updated successfully!",
        data: result
    });
});

/**
 * Delete a review
 */
const deleteReview = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { userId } = req.user;
    
    const result = await ReviewService.deleteReview(id, userId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Review deleted successfully!",
        data: result
    });
});

/**
 * Get featured reviews for homepage
 */
const getFeaturedReviews = catchAsync(async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 6;
    
    const result = await ReviewService.getFeaturedReviews(limit);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Featured reviews retrieved successfully!",
        data: result
    });
});

/**
 * Get related reviews
 */
const getRelatedReviews = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 4;
    
    const result = await ReviewService.getRelatedReviews(id, limit);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Related reviews retrieved successfully!",
        data: result
    });
});

/**
 * Get reviews by user
 */
const getUserReviews = catchAsync(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const paginationOptions = pick(req.query, paginationFields);
    
    const result = await ReviewService.getUserReviews(userId, paginationOptions);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "User reviews retrieved successfully!",
        meta: result.meta,
        data: result.data
    });
});

/**
 * Remove image from review
 */
const removeImage = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { userId } = req.user;
    const { imageUrl } = req.body;
    
    const result = await ReviewService.removeImage(id, userId, imageUrl);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Image removed successfully!",
        data: result
    });
});

export const ReviewController = {
    createReview,
    getAllReviews,
    getReviewById,
    updateReview,
    deleteReview,
    getFeaturedReviews,
    getRelatedReviews,
    getUserReviews,
    removeImage
};