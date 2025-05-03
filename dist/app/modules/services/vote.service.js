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
exports.VoteService = void 0;
const models_1 = __importDefault(require("../models"));
const client_1 = require("@prisma/client");
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../error/ApiError"));
/**
 * Add a vote to a review
 */
const addVote = (reviewId, userId, voteType) => __awaiter(void 0, void 0, void 0, function* () {
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
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'You need to purchase this premium review to vote on it');
    }
    // Check if user already voted on this review
    const existingVote = yield models_1.default.vote.findFirst({
        where: {
            reviewId,
            userId
        }
    });
    // If user already voted with the same type, remove the vote (toggle)
    if (existingVote && existingVote.type === voteType) {
        yield models_1.default.vote.delete({
            where: {
                id: existingVote.id
            }
        });
        return {
            reviewId,
            action: 'removed',
            voteType
        };
    }
    // If user already voted with different type, update the vote
    if (existingVote) {
        const updatedVote = yield models_1.default.vote.update({
            where: {
                id: existingVote.id
            },
            data: {
                type: voteType
            }
        });
        return {
            id: updatedVote.id,
            reviewId,
            action: 'updated',
            voteType
        };
    }
    // Otherwise, create a new vote
    const newVote = yield models_1.default.vote.create({
        data: {
            type: voteType,
            reviewId,
            userId
        }
    });
    return {
        id: newVote.id,
        reviewId,
        action: 'created',
        voteType
    };
});
/**
 * Get votes for a review
 */
const getVotes = (reviewId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    // Check if review exists
    const review = yield models_1.default.review.findUnique({
        where: {
            id: reviewId
        }
    });
    if (!review) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Review not found');
    }
    // Count votes by type
    const voteCount = yield models_1.default.vote.groupBy({
        by: ['type'],
        where: {
            reviewId
        },
        _count: {
            id: true
        }
    });
    // Format vote counts
    const upvotes = ((_a = voteCount.find(v => v.type === client_1.VoteType.UPVOTE)) === null || _a === void 0 ? void 0 : _a._count.id) || 0;
    const downvotes = ((_b = voteCount.find(v => v.type === client_1.VoteType.DOWNVOTE)) === null || _b === void 0 ? void 0 : _b._count.id) || 0;
    return {
        reviewId,
        upvotes,
        downvotes,
        total: upvotes + downvotes,
        score: upvotes - downvotes
    };
});
/**
 * Get user's vote on a review
 */
const getUserVote = (reviewId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if review exists
    const review = yield models_1.default.review.findUnique({
        where: {
            id: reviewId
        }
    });
    if (!review) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Review not found');
    }
    // Get user's vote
    const vote = yield models_1.default.vote.findFirst({
        where: {
            reviewId,
            userId
        }
    });
    return {
        reviewId,
        hasVoted: !!vote,
        voteType: (vote === null || vote === void 0 ? void 0 : vote.type) || null
    };
});
exports.VoteService = {
    addVote,
    getVotes,
    getUserVote
};
