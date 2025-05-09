import { Request, Response, NextFunction } from "express";
import catchAsync from "../../shared/catchAsync";
import { AdminService } from "../services/admin.service";
import sendResponse from "../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import pick from "../../shared/pick";
import { paginationFields } from "../../../constants/pagination";
import prisma from "../models";
import { UserRole } from "@prisma/client";

interface IAuthUser {
  email: string;
  role: UserRole;
  userId?: string;
  id?: string;
}

interface AuthenticatedRequest extends Request {
  user?: IAuthUser;
}

const getDashboardStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await AdminService.getDashboardStats();

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Dashboard statistics retrieved successfully!",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

const getPendingReviews = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const paginationOptions = pick(req.query, paginationFields);

      const result = await AdminService.getPendingReviews(paginationOptions);

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Pending reviews retrieved successfully!",
        meta: result.meta,
        data: result.data,
      });
    } catch (error) {
      next(error);
    }
  },
);

const moderateReview = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { action, moderationNote } = req.body;

      const result = await AdminService.moderateReview(
        id,
        action,
        moderationNote,
      );

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: `Review ${action === "publish" ? "published" : "unpublished"} successfully!`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

const getAdminProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;

      // Log the user object to debug
      console.log("User in getAdminProfile:", authReq.user);

      // Try to find a valid user ID
      const userId = authReq.user?.userId || authReq.user?.id;

      // Make sure userId exists
      if (!userId) {
        // Try to find user by email if we have it
        if (authReq.user?.email) {
          try {
            const user = await prisma.user.findUnique({
              where: { email: authReq.user.email },
            });

            if (user) {
              const result = await AdminService.getAdminProfile(user.id);
              return sendResponse(res, {
                statusCode: StatusCodes.OK,
                success: true,
                message: "Admin profile retrieved successfully!",
                data: result,
              });
            }
          } catch (error) {
            console.error("Error finding user by email:", error);
            return next(error);
          }
        }

        return sendResponse(res, {
          statusCode: StatusCodes.UNAUTHORIZED,
          success: false,
          message: "User ID is missing from authentication token",
          data: null,
        });
      }

      const result = await AdminService.getAdminProfile(userId);

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Admin profile retrieved successfully!",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

const updateAdminProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;

      const userId = authReq.user?.userId || authReq.user?.id;

      if (!userId) {
        if (authReq.user?.email) {
          try {
            const user = await prisma.user.findUnique({
              where: { email: authReq.user.email },
            });

            if (user) {
              const result = await AdminService.updateAdminProfile(
                user.id,
                req.body,
                req.file,
              );
              return sendResponse(res, {
                statusCode: StatusCodes.OK,
                success: true,
                message: "Admin profile updated successfully!",
                data: result,
              });
            }
          } catch (error) {
            console.error("Error finding user by email:", error);
            return next(error);
          }
        }

        return sendResponse(res, {
          statusCode: StatusCodes.UNAUTHORIZED,
          success: false,
          message: "User ID is missing from authentication token",
          data: null,
        });
      }

      const updateData = req.body;
      const file = req.file;

      const result = await AdminService.updateAdminProfile(
        userId,
        updateData,
        file,
      );

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Admin profile updated successfully!",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

const removeInappropriateComment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const result = await AdminService.removeInappropriateComment(id);

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Comment removed successfully!",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

export const AdminController = {
  getDashboardStats,
  getPendingReviews,
  moderateReview,
  getAdminProfile,
  updateAdminProfile,
  removeInappropriateComment,
};
