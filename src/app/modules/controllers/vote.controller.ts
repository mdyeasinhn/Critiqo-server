import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { VoteService } from "../services/vote.service";
import sendResponse from "../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { VoteType } from "@prisma/client";

interface AuthenticatedRequest extends Request {
    user: {
        userId: string;
        role: string;
        email: string; 
    };
}

/**
 * Add a vote to a review
 */
const addVote = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { reviewId, voteType } = req.body;
    const { userId } = req.user;
    
    const result = await VoteService.addVote(
        reviewId, 
        userId, 
        voteType === 'upvote' ? VoteType.UPVOTE : VoteType.DOWNVOTE
    );

    const actionMessage = {
        'created': 'Vote added successfully!',
        'updated': 'Vote updated successfully!',
        'removed': 'Vote removed successfully!'
    };

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: actionMessage[result.action as keyof typeof actionMessage],
        data: result
    });
});

/**
 * Get votes for a review
 */
const getVotes = catchAsync(async (req: Request, res: Response) => {
    const { reviewId } = req.params;
    
    const result = await VoteService.getVotes(reviewId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Votes retrieved successfully!",
        data: result
    });
});

/**
 * Get user's vote on a review
 */
const getUserVote = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { reviewId } = req.params;
    const { userId } = req.user;
    
    const result = await VoteService.getUserVote(reviewId, userId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "User vote retrieved successfully!",
        data: result
    });
});

export const VoteController = {
    addVote,
    getVotes,
    getUserVote
};