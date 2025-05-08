import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ReviewStatus } from '@prisma/client';

import { AdminReviewService } from '../services/adminReview.service';
import { IPaginationOptions } from '../../interface/file';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import ApiError from '../../error/ApiError';

const getAllReviews = catchAsync(async (req: Request, res: Response) => {
  // Extract filter and pagination parameters from query
  const filters = {
    status: req.query.status as ReviewStatus | 'ALL',
    categoryId: req.query.categoryId as string,
    userId: req.query.userId as string,
    searchTerm: req.query.searchTerm as string,
    isPremium: req.query.isPremium ? req.query.isPremium === 'true' : undefined
  };

  const paginationOptions: IPaginationOptions = {
    page: Number(req.query.page || 1),
    limit: Number(req.query.limit || 10),
    sortBy: req.query.sortBy as string || 'createdAt',
    sortOrder: req.query.sortOrder as 'asc' | 'desc' || 'desc'
  };

  const result = await AdminReviewService.getAllReviewsForAdmin(filters, paginationOptions);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Reviews retrieved successfully',
    meta: result.meta,
    data: result.data
  });
});

const getReviewStats = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminReviewService.getReviewStatsByStatus();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Review statistics retrieved successfully',
    data: result
  });
});

const manageReview = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, moderationNote, isPremium } = req.body;

  // Check if there's anything to update
  if (status === undefined && moderationNote === undefined && isPremium === undefined) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'No update parameters provided');
  }

  let result;
  let premiumSettings;
  
  // Set premiumSettings if isPremium is provided
  if (isPremium !== undefined) {
    premiumSettings = { isPremium };
  }

  try {
    // Get current status if no status is provided
    if (status === undefined) {
      const prisma = require('../models').default;
      
      // Find the review to get its current status
      const review = await prisma.review.findUnique({
        where: { id },
        select: { status: true }
      });
      
      if (!review) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Review not found');
      }
      
      // Update using existing status
      result = await AdminReviewService.updateReviewStatus(
        id, 
        review.status, 
        premiumSettings, 
        moderationNote
      );
    } else {
      // Validate provided status
      if (!Object.values(ReviewStatus).includes(status)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid status provided');
      }
      
      // Update with new status
      result = await AdminReviewService.updateReviewStatus(
        id, 
        status, 
        premiumSettings, 
        moderationNote
      );
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    console.error('Error updating review:', error);
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to update review. Please try again.'
    );
  }

  // Create appropriate response message
  let message = 'Review updated successfully';
  
  // Determine the most specific message based on what was updated
  if (status !== undefined && isPremium !== undefined && moderationNote !== undefined) {
    if (status === ReviewStatus.PUBLISHED) {
      message = isPremium 
        ? 'Review published as premium with moderation note' 
        : 'Review published with moderation note';
    } else if (status === ReviewStatus.UNPUBLISHED) {
      message = 'Review unpublished with moderation note';
    } else {
      message = `Review status updated to ${status} with premium settings and moderation note`;
    }
  } else if (status !== undefined && isPremium !== undefined) {
    if (status === ReviewStatus.PUBLISHED) {
      message = isPremium ? 'Review published as premium content' : 'Review published';
    } else {
      message = `Review status updated to ${status} with premium settings`;
    }
  } else if (status !== undefined && moderationNote !== undefined) {
    message = `Review status updated to ${status} with moderation note`;
  } else if (isPremium !== undefined && moderationNote !== undefined) {
    message = isPremium 
      ? 'Premium status set with moderation note' 
      : 'Premium status removed with moderation note';
  } else if (status !== undefined) {
    if (status === ReviewStatus.PUBLISHED) {
      message = 'Review published successfully';
    } else if (status === ReviewStatus.UNPUBLISHED) {
      message = 'Review unpublished successfully';
    } else {
      message = `Review status updated to ${status} successfully`;
    }
  } else if (isPremium !== undefined) {
    message = isPremium ? 'Review set as premium content' : 'Premium status removed';
  } else if (moderationNote !== undefined) {
    message = 'Moderation note updated successfully';
  }

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message,
    data: result
  });
});


export const AdminReviewController = {
  getAllReviews,
  getReviewStats,
  manageReview
};