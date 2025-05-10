import prisma from "../models";
import { ReviewStatus } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../error/ApiError";
import { IPaginationOptions } from "../../interface/file";

/**
 * Add a comment to a review
 */
const addComment = async (
  reviewId: string,
  userId: string,
  content: string,
  parentId?: string,
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

  // If it's a reply, check if parent comment exists
  if (parentId) {
    const parentComment = await prisma.comment.findUnique({
      where: {
        id: parentId,
        reviewId, // Ensure parent comment belongs to the same review
      },
    });

    if (!parentComment) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Parent comment not found");
    }
  }

  // Create the comment
  const comment = await prisma.comment.create({
    data: {
      content,
      reviewId,
      userId,
      parentId: parentId || null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return {
    id: comment.id,
    content: comment.content,
    reviewId: comment.reviewId,
    parentId: comment.parentId,
    author: comment.user.name,
    authorId: comment.user.id,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  };
};

/**
 * Get comments for a review
 */
const getReviewComments = async (
  reviewId: string,
  paginationOptions: IPaginationOptions,
) => {
  const { page = 1, limit = 10 } = paginationOptions;
  const skip = (page - 1) * limit;
  const take = Number(limit);

  // Check if review exists
  const review = await prisma.review.findUnique({
    where: {
      id: reviewId,
    },
  });

  if (!review) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Review not found");
  }

  // Get top-level comments (no parent)
  const comments = await prisma.comment.findMany({
    where: {
      reviewId,
      parentId: null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      replies: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      _count: {
        select: {
          replies: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take,
  });

  // Get total count of top-level comments
  const total = await prisma.comment.count({
    where: {
      reviewId,
      parentId: null,
    },
  });

  // Format comments
  const formattedComments = comments.map((comment) => ({
    id: comment.id,
    content: comment.content,
    author: comment.user.name,
    authorId: comment.user.id,
    reviewId: comment.reviewId,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    replyCount: comment._count.replies,
    replies: comment.replies.map((reply) => ({
      id: reply.id,
      content: reply.content,
      author: reply.user.name,
      authorId: reply.user.id,
      parentId: reply.parentId,
      createdAt: reply.createdAt,
      updatedAt: reply.updatedAt,
    })),
  }));

  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
    },
    data: formattedComments,
  };
};

/**
 * Update a comment
 */
const updateComment = async (
  commentId: string,
  userId: string,
  content: string,
) => {
  // Check if comment exists
  const comment = await prisma.comment.findUnique({
    where: {
      id: commentId,
    },
  });

  if (!comment) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Comment not found");
  }

  // Check if user is the comment author
  if (comment.userId !== userId) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "You are not authorized to update this comment",
    );
  }

  // Update the comment
  const updatedComment = await prisma.comment.update({
    where: {
      id: commentId,
    },
    data: {
      content,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return {
    id: updatedComment.id,
    content: updatedComment.content,
    reviewId: updatedComment.reviewId,
    parentId: updatedComment.parentId,
    author: updatedComment.user.name,
    authorId: updatedComment.user.id,
    createdAt: updatedComment.createdAt,
    updatedAt: updatedComment.updatedAt,
  };
};

/**
 * Delete a comment
 */
const deleteComment = async (
  commentId: string,
  userId: string,
  isAdmin: boolean,
) => {
  // Check if comment exists
  const comment = await prisma.comment.findUnique({
    where: {
      id: commentId,
    },
  });

  if (!comment) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Comment not found");
  }

  // Check if user is authorized (comment author or admin)
  if (comment.userId !== userId && !isAdmin) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "You are not authorized to delete this comment",
    );
  }

  // Handle deletion of parent comment with replies
  if (!comment.parentId) {
    // First, check if this comment has replies
    const replyCount = await prisma.comment.count({
      where: {
        parentId: commentId,
      },
    });

    if (replyCount > 0) {
      // Update content instead of deleting
      await prisma.comment.update({
        where: {
          id: commentId,
        },
        data: {
          content: isAdmin
            ? "[This comment was removed by an administrator]"
            : "[This comment was deleted by the user]",
        },
      });

      return {
        id: commentId,
        message: "Comment content removed but kept for reply context",
        retainedReplies: replyCount,
      };
    }
  }

  // If no replies or it's a reply itself, delete the comment
  await prisma.comment.delete({
    where: {
      id: commentId,
    },
  });

  return {
    id: commentId,
    message: "Comment deleted successfully",
  };
};

/**
 * Get comment replies
 */
const getCommentReplies = async (
  commentId: string,
  paginationOptions: IPaginationOptions,
) => {
  const { page = 1, limit = 10 } = paginationOptions;
  const skip = (page - 1) * limit;
  const take = Number(limit);

  // Check if comment exists
  const comment = await prisma.comment.findUnique({
    where: {
      id: commentId,
    },
  });

  if (!comment) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Comment not found");
  }

  // Get replies to the comment
  const replies = await prisma.comment.findMany({
    where: {
      parentId: commentId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    skip,
    take,
  });

  // Get total count of replies
  const total = await prisma.comment.count({
    where: {
      parentId: commentId,
    },
  });

  // Format replies
  const formattedReplies = replies.map((reply) => ({
    id: reply.id,
    content: reply.content,
    author: reply.user.name,
    authorId: reply.user.id,
    parentId: reply.parentId,
    createdAt: reply.createdAt,
    updatedAt: reply.updatedAt,
  }));

  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
    },
    data: formattedReplies,
  };
};

export const CommentService = {
  addComment,
  getReviewComments,
  updateComment,
  deleteComment,
  getCommentReplies,
};
