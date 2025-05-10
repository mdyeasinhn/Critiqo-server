import { Request, Response, NextFunction } from "express";
import catchAsync from "../../shared/catchAsync";
import { VoteService } from "../services/vote.service";
import sendResponse from "../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { UserRole, VoteType } from "@prisma/client";

interface IAuthUser {
  userId: string;
  role: UserRole;
  email: string;
}

interface AuthenticatedRequest extends Request {
  user: IAuthUser;
}

const addVote = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { reviewId, voteType } = req.body;
    const { userId } = req.user;

    const result = await VoteService.addVote(
      reviewId,
      userId,
      voteType === "upvote" ? VoteType.UPVOTE : VoteType.DOWNVOTE,
    );

    const actionMessage = {
      created: "Vote added successfully!",
      updated: "Vote updated successfully!",
      removed: "Vote removed successfully!",
    };

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: actionMessage[result.action as keyof typeof actionMessage],
      data: result,
    });
  },
);

const getVotes = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { reviewId } = req.params;

    const result = await VoteService.getVotes(reviewId);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Votes retrieved successfully!",
      data: result,
    });
  },
);

const getUserVote = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { reviewId } = req.params;
    const { userId } = req.user;

    const result = await VoteService.getUserVote(reviewId, userId);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "User vote retrieved successfully!",
      data: result,
    });
  },
);

export const VoteController = {
  addVote,
  getVotes,
  getUserVote,
};
