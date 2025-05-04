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
    const filters: any = pick(req.query, ['status', 'categoryId', 'userId', 'searchTerm', 'isPremium']);
    
    // Convert status string to enum if provided
    if (filters.status && filters.status !== 'ALL') {
        if (['PUBLISHED', 'DRAFT', 'UNPUBLISHED'].includes(filters.status)) {
            filters.status = filters.status as ReviewStatus;
        } else {
            filters.status = 'ALL';
        }
    }
    
    // Convert isPremium to boolean if provided
    if (filters.isPremium !== undefined) {
        filters.isPremium = filters.isPremium === 'true';
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
 * Publish a review with optional premium settings
 */
const publishReview = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { moderationNote, isPremium, premiumPrice } = req.body;
    
    // Prepare premium settings if provided
    let premiumSettings;
    if (isPremium !== undefined) {
        // Validate premium price if review is premium
        if (isPremium && (!premiumPrice || premiumPrice <= 0)) {
            return sendResponse(res, {
                statusCode: StatusCodes.BAD_REQUEST,
                success: false,
                message: "Premium price is required and must be greater than 0 for premium reviews",
                data: null
            });
        }
        
        premiumSettings = {
            isPremium,
            premiumPrice
        };
    }
    
    const result = await AdminReviewService.publishReview(id, premiumSettings, moderationNote);

    // Create appropriate response message
    let message = "Review published successfully!";
    if (premiumSettings) {
        message = premiumSettings.isPremium 
            ? "Review published as premium successfully!" 
            : "Review published as normal successfully!";
    }

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message,
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