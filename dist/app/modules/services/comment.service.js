"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentService = void 0;
const models_1 = __importDefault(require("../models"));
const client_1 = require("@prisma/client");
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../error/ApiError"));
/**
 * Add a comment to a review
 */
const addComment = (reviewId, userId, content, parentId) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if review exists and is published
    const review = yield models_1.default.review.findFirst({
        where: {
            id: reviewId,
            status: client_1.ReviewStatus.PUBLISHED
        },
        include: {
            payments: {
                where: {
                    userId
                }
            }
        }
    });
    if (!review) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Review not found or not published');
    }
    // If premium review, verify user has paid or is the author
    if (review.isPremium && review.userId !== userId && review.payments.length === 0) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'You need to purchase this premium review to comment on it');
    }
    // If it's a reply, check if parent comment exists
    if (parentId) {
        const parentComment = yield models_1.default.comment.findUnique({
            where: {
                id: parentId,
                reviewId // Ensure parent comment belongs to the same review
            }
        });
        if (!parentComment) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Parent comment not found');
        }
    }
    // Create the comment
    const comment = yield models_1.default.comment.create({
        data: {
            content,
            reviewId,
            userId,
            parentId: parentId || null
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
    });
    return {
        id: comment.id,
        content: comment.content,
        reviewId: comment.reviewId,
        parentId: comment.parentId,
        author: comment.user.name,
        authorId: comment.user.id,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt
    };
});
/**
 * Get comments for a review
 */
const getReviewComments = (reviewId, paginationOptions) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 10 } = paginationOptions;
    const skip = (page - 1) * limit;
    const take = Number(limit);
    // Check if review exists
    const review = yield models_1.default.review.findUnique({
        where: {
            id: reviewId
        }
    });
    if (!review) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Review not found');
    }
    // Get top-level comments (no parent)
    const comments = yield models_1.default.comment.findMany({
        where: {
            reviewId,
            parentId: null
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true
                }
            },
            replies: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'asc'
                }
            },
            _count: {
                select: {
                    replies: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        },
        skip,
        take
    });
    // Get total count of top-level comments
    const total = yield models_1.default.comment.count({
        where: {
            reviewId,
            parentId: null
        }
    });
    // Format comments
    const formattedComments = comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        author: comment.user.name,
        authorId: comment.user.id,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        replyCount: comment._count.replies,
        replies: comment.replies.map(reply => ({
            id: reply.id,
            content: reply.content,
            author: reply.user.name,
            authorId: reply.user.id,
            parentId: reply.parentId,
            createdAt: reply.createdAt,
            updatedAt: reply.updatedAt
        }))
    }));
    return {
        meta: {
            page: Number(page),
            limit: Number(limit),
            total
        },
        data: formattedComments
    };
});
/**
 * Update a comment
 */
const updateComment = (commentId, userId, content) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if comment exists
    const comment = yield models_1.default.comment.findUnique({
        where: {
            id: commentId
        }
    });
    if (!comment) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Comment not found');
    }
    // Check if user is the comment author
    if (comment.userId !== userId) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'You are not authorized to update this comment');
    }
    // Update the comment
    const updatedComment = yield models_1.default.comment.update({
        where: {
            id: commentId
        },
        data: {
            content
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
    });
    return {
        id: updatedComment.id,
        content: updatedComment.content,
        reviewId: updatedComment.reviewId,
        parentId: updatedComment.parentId,
        author: updatedComment.user.name,
        authorId: updatedComment.user.id,
        createdAt: updatedComment.createdAt,
        updatedAt: updatedComment.updatedAt
    };
});
/**
 * Delete a comment
 */
const deleteComment = (commentId, userId, isAdmin) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if comment exists
    const comment = yield models_1.default.comment.findUnique({
        where: {
            id: commentId
        }
    });
    if (!comment) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Comment not found');
    }
    // Check if user is authorized (comment author or admin)
    if (comment.userId !== userId && !isAdmin) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'You are not authorized to delete this comment');
    }
    // Handle deletion of parent comment with replies
    if (!comment.parentId) {
        // First, check if this comment has replies
        const replyCount = yield models_1.default.comment.count({
            where: {
                parentId: commentId
            }
        });
        if (replyCount > 0) {
            // Update content instead of deleting
            yield models_1.default.comment.update({
                where: {
                    id: commentId
                },
                data: {
                    content: isAdmin ?
                        '[This comment was removed by an administrator]' :
                        '[This comment was deleted by the user]'
                }
            });
            return {
                id: commentId,
                message: 'Comment content removed but kept for reply context',
                retainedReplies: replyCount
            };
        }
    }
    // If no replies or it's a reply itself, delete the comment
    yield models_1.default.comment.delete({
        where: {
            id: commentId
        }
    });
    return {
        id: commentId,
        message: 'Comment deleted successfully'
    };
});
/**
 * Get comment replies
 */
const getCommentReplies = (commentId, paginationOptions) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 10 } = paginationOptions;
    const skip = (page - 1) * limit;
    const take = Number(limit);
    // Check if comment exists
    const comment = yield models_1.default.comment.findUnique({
        where: {
            id: commentId
        }
    });
    if (!comment) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Comment not found');
    }
    // Get replies to the comment
    const replies = yield models_1.default.comment.findMany({
        where: {
            parentId: commentId
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true
                }
            }
        },
        orderBy: {
            createdAt: 'asc'
        },
        skip,
        take
    });
    // Get total count of replies
    const total = yield models_1.default.comment.count({
        where: {
            parentId: commentId
        }
    });
    // Format replies
    const formattedReplies = replies.map(reply => ({
        id: reply.id,
        content: reply.content,
        author: reply.user.name,
        authorId: reply.user.id,
        parentId: reply.parentId,
        createdAt: reply.createdAt,
        updatedAt: reply.updatedAt
    }));
    return {
        meta: {
            page: Number(page),
            limit: Number(limit),
            total
        },
        data: formattedReplies
    };
});
exports.CommentService = {
    addComment,
    getReviewComments,
    updateComment,
    deleteComment,
    getCommentReplies
};
