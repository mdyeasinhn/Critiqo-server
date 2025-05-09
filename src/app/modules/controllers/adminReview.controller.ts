import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ReviewStatus } from "@prisma/client";

import { AdminReviewService } from "../services/adminReview.service";
import { IPaginationOptions } from "../../interface/file";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import ApiError from "../../error/ApiError";

const getAllReviews = catchAsync(async (req: Request, res: Response) => {
  // Extract filter and pagination parameters from query
  const filters = {
    status: req.query.status as ReviewStatus | "ALL",
    categoryId: req.query.categoryId as string,
    userId: req.query.userId as string,
    searchTerm: req.query.searchTerm as string,
    isPremium: req.query.isPremium ? req.query.isPremium === "true" : undefined,
  };

  const paginationOptions: IPaginationOptions = {
    page: Number(req.query.page || 1),
    limit: Number(req.query.limit || 10),
    sortBy: (req.query.sortBy as string) || "createdAt",
    sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
  };

  const result = await AdminReviewService.getAllReviewsForAdmin(
    filters,
    paginationOptions,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Reviews retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getReviewStats = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminReviewService.getReviewStatsByStatus();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Review statistics retrieved successfully",
    data: result,
  });
});

const updateReview = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const result = await AdminReviewService.update(id, req.body);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Updateing My Profile Data!",
      data: result,
    });
  },
);

export const AdminReviewController = {
  getAllReviews,
  getReviewStats,
  updateReview,
};
