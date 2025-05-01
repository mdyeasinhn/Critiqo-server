import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { AdminService } from "../services/admin.service";
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
  

const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
    const result = await AdminService.getDashboardStats();

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Dashboard statistics retrieved successfully!",
        data: result
    });
});

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

const getAdminProfile = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = req.user;
    
    const result = await AdminService.getAdminProfile(userId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Admin profile retrieved successfully!",
        data: result
    });
});

const updateAdminProfile = catchAsync<AuthenticatedRequest>(async (req, res) => {
    const { userId } = req.user;
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

export const AdminController = {
    getDashboardStats,
    getPendingReviews,
    getAdminProfile,
    updateAdminProfile
};