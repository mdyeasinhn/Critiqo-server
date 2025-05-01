import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { AdminService } from "../services/admin.service";
import sendResponse from "../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import pick from "../../shared/pick";
import { paginationFields } from "../../../constants/pagination";
import prisma from "../models"; // Import the Prisma client

interface AuthenticatedRequest extends Request {
    user: {
        userId?: string;
        id?: string;
        role: string;
        email: string; 
    };
}

/**
 * Get dashboard statistics for admin
 */
const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
    const result = await AdminService.getDashboardStats();

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Dashboard statistics retrieved successfully!",
        data: result
    });
});

/**
 * Get pending reviews that need moderation
 */
const getPendingReviews = catchAsync(async (req: Request, res: Response) => {
    const paginationOptions = pick(req.query, paginationFields);
    
    const result = await AdminService.getPendingReviews(paginationOptions);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Pending reviews retrieved successfully!",
        meta: result.meta,
        data: result.data
    });
});

/**
 * Moderate a review (approve or unpublish)
 */
const moderateReview = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { action, moderationNote } = req.body;
    
    const result = await AdminService.moderateReview(id, action, moderationNote);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: `Review ${action === 'publish' ? 'published' : 'unpublished'} successfully!`,
        data: result
    });
});

/**
 * Get admin profile information
 */
const getAdminProfile = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    // Log the user object to debug
    console.log('User in getAdminProfile:', req.user);
    
    // Try to find a valid user ID
    const userId = req.user?.userId || req.user?.id;
    
    // Make sure userId exists
    if (!userId) {
        // Try to find user by email if we have it
        if (req.user?.email) {
            try {
                const user = await prisma.user.findUnique({
                    where: { email: req.user.email }
                });
                
                if (user) {
                    const result = await AdminService.getAdminProfile(user.id);
                    return sendResponse(res, {
                        statusCode: StatusCodes.OK,
                        success: true,
                        message: "Admin profile retrieved successfully!",
                        data: result
                    });
                }
            } catch (error) {
                console.error('Error finding user by email:', error);
            }
        }
        
        return sendResponse(res, {
            statusCode: StatusCodes.UNAUTHORIZED,
            success: false,
            message: "User ID is missing from authentication token",
            data: null
        });
    }
    
    const result = await AdminService.getAdminProfile(userId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Admin profile retrieved successfully!",
        data: result
    });
});

/**
 * Update admin profile information
 */
const updateAdminProfile = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    // Try to find a valid user ID
    const userId = req.user?.userId || req.user?.id;
    
    // Make sure userId exists
    if (!userId) {
        // Try to find user by email if we have it
        if (req.user?.email) {
            try {
                const user = await prisma.user.findUnique({
                    where: { email: req.user.email }
                });
                
                if (user) {
                    const result = await AdminService.updateAdminProfile(user.id, req.body, req.file);
                    return sendResponse(res, {
                        statusCode: StatusCodes.OK,
                        success: true,
                        message: "Admin profile updated successfully!",
                        data: result
                    });
                }
            } catch (error) {
                console.error('Error finding user by email:', error);
            }
        }
        
        return sendResponse(res, {
            statusCode: StatusCodes.UNAUTHORIZED,
            success: false,
            message: "User ID is missing from authentication token",
            data: null
        });
    }
    
    const updateData = req.body;
    const file = req.file;
    
    const result = await AdminService.updateAdminProfile(userId, updateData, file);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Admin profile updated successfully!",
        data: result
    });
});

/**
 * Get payment analytics
 */
const getPaymentAnalytics = catchAsync(async (req: Request, res: Response) => {
    const paginationOptions = pick(req.query, paginationFields);
    
    const result = await AdminService.getPaymentAnalytics(paginationOptions);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Payment analytics retrieved successfully!",
        meta: result.meta,
        data: result
    });
});

/**
 * Remove inappropriate comment
 */
const removeInappropriateComment = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const result = await AdminService.removeInappropriateComment(id);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Comment removed successfully!",
        data: result
    });
});

export const AdminController = {
    getDashboardStats,
    getPendingReviews,
    moderateReview,
    getAdminProfile,
    updateAdminProfile,
    getPaymentAnalytics,
    removeInappropriateComment
};