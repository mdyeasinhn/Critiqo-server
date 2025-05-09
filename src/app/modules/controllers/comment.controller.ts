import { Request, Response, NextFunction } from "express";
import catchAsync from "../../shared/catchAsync";
import { CommentService } from "../services/comment.service";
import sendResponse from "../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import pick from "../../shared/pick";
import { paginationFields } from "../../../constants/pagination";
import { UserRole } from "@prisma/client";

interface IAuthUser {
  userId: string;
  role: UserRole;
  email: string;
}

interface AuthenticatedRequest extends Request {
  user: IAuthUser;
}

const addComment = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { reviewId, content, parentId } = req.body;
    const { userId } = req.user;

    const result = await CommentService.addComment(
      reviewId,
      userId,
      content,
      parentId,
    );

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: parentId
        ? "Reply added successfully!"
        : "Comment added successfully!",
      data: result,
    });
  },
);

const getReviewComments = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { reviewId } = req.params;
    const paginationOptions = pick(req.query, paginationFields);

    const result = await CommentService.getReviewComments(
      reviewId,
      paginationOptions,
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Comments retrieved successfully!",
      meta: result.meta,
      data: result.data,
    });
  },
);

const updateComment = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { content } = req.body;
    const { userId } = req.user;

    const result = await CommentService.updateComment(id, userId, content);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Comment updated successfully!",
      data: result,
    });
  },
);

const deleteComment = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { userId, role } = req.user;
    const isAdmin = role === UserRole.ADMIN;

    const result = await CommentService.deleteComment(id, userId, isAdmin);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: result.message,
      data: result,
    });
  },
);

const getCommentReplies = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { commentId } = req.params;
    const paginationOptions = pick(req.query, paginationFields);

    const result = await CommentService.getCommentReplies(
      commentId,
      paginationOptions,
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Comment replies retrieved successfully!",
      meta: result.meta,
      data: result.data,
    });
  },
);

export const CommentController = {
  addComment,
  getReviewComments,
  updateComment,
  deleteComment,
  getCommentReplies,
};
