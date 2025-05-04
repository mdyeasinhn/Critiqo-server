import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import pick from "../../shared/pick";
import { paginationFields } from "../../../constants/pagination";
import { ReviewStatus } from "@prisma/client";
import { AdminReviewService } from "../services/adminReview.service";

/**
 * Get all reviews for admin with filtering
 */
const getAllReviews = catchAsync(async (req: Request, res: Response) => {
    // Extract filters from query parameters
    const filters: any = pick(req.query, ['status', 'categoryId', 'userId', 'searchTerm']);
    
    // Convert status string to enum if provided
    if (filters.status && filters.status !== 'ALL') {
        if (['PUBLISHED', 'DRAFT', 'UNPUBLISHED'].includes(filters.status)) {
            filters.status = filters.status as ReviewStatus;
        } else {
            filters.status = 'ALL';
        }
    }
    
    // Extract pagination options
    const paginationOptions = pick(req.query, paginationFields);
    
    const result = await AdminReviewService.getAllReviewsForAdmin(filters, paginationOptions);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Reviews retrieved successfully!",
        meta: result.meta,
        data: result.data
    });
});

/**
 * Get review statistics by status
 */
const getReviewStats = catchAsync(async (req: Request, res: Response) => {
    const result = await AdminReviewService.getReviewStatsByStatus();

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Review statistics retrieved successfully!",
        data: result
    });
});

/**
 * Publish a review
 */
const publishReview = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { moderationNote } = req.body;
    
    const result = await AdminReviewService.publishReview(id, moderationNote);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Review published successfully!",
        data: result
    });
});

/**
 * Unpublish a review
 */
const unpublishReview = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { moderationNote } = req.body;
    
    const result = await AdminReviewService.unpublishReview(id, moderationNote);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Review unpublished successfully!",
        data: result
    });
});

export const AdminReviewController = {
    getAllReviews,
    getReviewStats,
    publishReview,
    unpublishReview
};