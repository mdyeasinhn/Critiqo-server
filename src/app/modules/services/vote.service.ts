import prisma from "../models";
import { VoteType, ReviewStatus } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../error/ApiError";

/**
 * Add a vote to a review
 */
const addVote = async (
  reviewId: string,
  userId: string,
  voteType: VoteType,
) => {
  // Check if review exists and is published
  const review = await prisma.review.findFirst({
    where: {
      id: reviewId,
      status: ReviewStatus.PUBLISHED,
    },
  });

  if (!review) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      "Review not found or not published",
    );
  }

  // Check if user already voted on this review
  const existingVote = await prisma.vote.findFirst({
    where: {
      reviewId,
      userId,
    },
  });

  // If user already voted with the same type, remove the vote (toggle)
  if (existingVote && existingVote.type === voteType) {
    await prisma.vote.delete({
      where: {
        id: existingVote.id,
      },
    });

    return {
      reviewId,
      action: "removed",
      voteType,
    };
  }

  // If user already voted with different type, update the vote
  if (existingVote) {
    const updatedVote = await prisma.vote.update({
      where: {
        id: existingVote.id,
      },
      data: {
        type: voteType,
      },
    });

    return {
      id: updatedVote.id,
      reviewId,
      action: "updated",
      voteType,
    };
  }

  // Otherwise, create a new vote
  const newVote = await prisma.vote.create({
    data: {
      type: voteType,
      reviewId,
      userId,
    },
  });

  return {
    id: newVote.id,
    reviewId,
    action: "created",
    voteType,
  };
};

/**
 * Get votes for a review
 */
const getVotes = async (reviewId: string) => {
  // Check if review exists
  const review = await prisma.review.findUnique({
    where: {
      id: reviewId,
    },
  });

  if (!review) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Review not found");
  }

  // Count votes by type
  const voteCount = await prisma.vote.groupBy({
    by: ["type"],
    where: {
      reviewId,
    },
    _count: {
      id: true,
    },
  });

  // Format vote counts
  const upvotes =
    voteCount.find((v) => v.type === VoteType.UPVOTE)?._count.id || 0;
  const downvotes =
    voteCount.find((v) => v.type === VoteType.DOWNVOTE)?._count.id || 0;

  return {
    reviewId,
    upvotes,
    downvotes,
    total: upvotes + downvotes,
    score: upvotes - downvotes,
  };
};

/**
 * Get user's vote on a review
 */
const getUserVote = async (reviewId: string, userId: string) => {
  // Check if review exists
  const review = await prisma.review.findUnique({
    where: {
      id: reviewId,
    },
  });

  if (!review) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Review not found");
  }

  // Get user's vote
  const vote = await prisma.vote.findFirst({
    where: {
      reviewId,
      userId,
    },
  });

  return {
    reviewId,
    hasVoted: !!vote,
    voteType: vote?.type || null,
  };
};

export const VoteService = {
  addVote,
  getVotes,
  getUserVote,
};
