import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { ReviewService } from "../services/review.service";
import sendResponse from "../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import pick from "../../shared/pick";
import { paginationFields } from "../../../constants/pagination";

const createReview = catchAsync(async (req: Request, res: Response) => {
    const result = await ReviewService.createReview(req);

    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: "Review created successfully!",
        data: result
    });
});

const getAllReviews = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, ['searchTerm', 'categoryId', 'userId', 'status', 'rating', 'isPremium']);
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

const getPublishedReviews = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, ['searchTerm', 'categoryId', 'rating', 'isPremium']);
    const paginationOptions = pick(req.query, paginationFields);

    const result = await ReviewService.getPublishedReviews(filters, paginationOptions);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Published reviews retrieved successfully!",
        meta: result.meta,
        data: result.data
    });
});

const getReviewById = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const userId = req.user?.userId;

    const result = await ReviewService.getReviewById(id, userId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Review retrieved successfully!",
        data: result
    });
});

const updateReview = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const result = await ReviewService.updateReview(id, req);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Review updated successfully!",
        data: result
    });
});

const deleteReview = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const { userId, role } = req.user;

    const result = await ReviewService.deleteReview(id, userId, role);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Review deleted successfully!",
        data: result
    });
});

const updateReviewStatus = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const { status, moderationNote } = req.body;

    const result = await ReviewService.updateReviewStatus(id, { status, moderationNote });

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: `Review ${status.toLowerCase()} successfully!`,
        data: result
    });
});

const removeReviewImage = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const { imageUrl } = req.body;
    const { userId, role } = req.user;

    const result = await ReviewService.removeReviewImage(id, imageUrl, userId, role);

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
    getPublishedReviews,
    getReviewById,
    updateReview,
    deleteReview,
    updateReviewStatus,
    removeReviewImage
};