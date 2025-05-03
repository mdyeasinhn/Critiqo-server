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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewService = void 0;
const models_1 = __importDefault(require("../models"));
const client_1 = require("@prisma/client");
const http_status_codes_1 = require("http-status-codes");
const fileUploader_1 = require("../../helpers/fileUploader");
const ApiError_1 = __importDefault(require("../../error/ApiError"));
/**
 * Create a new review
 */
const createReview = (req) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.userId;
    const files = req.files;
    // Get the review data from the request body
    const _a = req.body, { categoryId, title, description, rating, purchaseSource, isPremium, premiumPrice } = _a, reviewData = __rest(_a, ["categoryId", "title", "description", "rating", "purchaseSource", "isPremium", "premiumPrice"]);
    // Check if premium price is provided for premium reviews
    if (isPremium && !premiumPrice) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Premium price is required for premium reviews");
    }
    // Upload images to Cloudinary if provided
    let imageUrls = [];
    if (files && files.length > 0) {
        const uploadedImages = yield fileUploader_1.fileUploader.uploadMultipleToCloudinary(files);
        imageUrls = uploadedImages.map(image => image.secure_url);
    }
    // Admin can directly publish, users create draft reviews
    const initialStatus = req.user.role === client_1.UserRole.ADMIN ?
        client_1.ReviewStatus.PUBLISHED :
        client_1.ReviewStatus.DRAFT;
    // Create review
    const review = yield models_1.default.review.create({
        data: {
            title,
            description,
            rating: Number(rating),
            purchaseSource,
            images: imageUrls,
            isPremium: Boolean(isPremium),
            premiumPrice: isPremium ? Number(premiumPrice) : null,
            status: initialStatus,
            categoryId,
            userId
        },
        include: {
            category: true,
            user: {
                select: {
                    name: true,
                    email: true,
                    role: true
                }
            }
        }
    });
    return review;
});
/**
 * Get all reviews with pagination and filtering
 */
const getAllReviews = (filters, paginationOptions) => __awaiter(void 0, void 0, void 0, function* () {
    const { status = client_1.ReviewStatus.PUBLISHED, categoryId, isPremium, title, rating, userId } = filters;
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = paginationOptions;
    const skip = (page - 1) * limit;
    const take = Number(limit);
    // Construct where conditions based on filters
    const whereConditions = {
        status
    };
    if (categoryId) {
        whereConditions.categoryId = categoryId;
    }
    if (isPremium !== undefined) {
        whereConditions.isPremium = isPremium;
    }
    if (title) {
        whereConditions.title = {
            contains: title,
            mode: 'insensitive'
        };
    }
    if (rating) {
        whereConditions.rating = Number(rating);
    }
    if (userId) {
        whereConditions.userId = userId;
    }
    // Get reviews
    const reviews = yield models_1.default.review.findMany({
        where: whereConditions,
        include: {
            category: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    role: true
                }
            },
            _count: {
                select: {
                    votes: {
                        where: {
                            type: client_1.VoteType.UPVOTE
                        }
                    },
                    comments: true
                }
            }
        },
        orderBy: {
            [sortBy]: sortOrder
        },
        skip,
        take
    });
    // Get total count
    const total = yield models_1.default.review.count({
        where: whereConditions
    });
    // Format reviews for response
    const formattedReviews = reviews.map(review => {
        // For premium reviews, truncate description for non-subscribers
        let truncatedDescription = review.description;
        if (review.isPremium) {
            truncatedDescription = review.description.substring(0, 100) + '...';
        }
        return {
            id: review.id,
            title: review.title,
            description: truncatedDescription,
            isPremium: review.isPremium,
            premiumPrice: review.premiumPrice,
            rating: review.rating,
            purchaseSource: review.purchaseSource,
            images: review.images,
            status: review.status,
            category: review.category.name,
            author: review.user.name,
            authorId: review.user.id,
            authorRole: review.user.role,
            createdAt: review.createdAt,
            updatedAt: review.updatedAt,
            upvotes: review._count.votes,
            comments: review._count.comments
        };
    });
    return {
        meta: {
            page: Number(page),
            limit: Number(limit),
            total
        },
        data: formattedReviews
    };
});
/**
 * Get a single review by ID
 */
const getReviewById = (id, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const review = yield models_1.default.review.findUnique({
        where: {
            id,
            status: client_1.ReviewStatus.PUBLISHED
        },
        include: {
            category: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    role: true
                }
            },
            votes: {
                select: {
                    id: true,
                    type: true,
                    userId: true
                }
            },
            comments: {
                where: {
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
                }
            },
            payments: {
                where: {
                    userId: userId || ''
                }
            }
        }
    });
    if (!review) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Review not found');
    }
    // Check if this is a premium review and if user has paid for it
    const hasPaid = review.payments.length > 0;
    // If premium review and user hasn't paid, truncate description
    let reviewDescription = review.description;
    if (review.isPremium && !hasPaid && userId !== review.userId) {
        reviewDescription = review.description.substring(0, 100) + '...';
    }
    // Count upvotes and downvotes
    const upvotes = review.votes.filter(vote => vote.type === client_1.VoteType.UPVOTE).length;
    const downvotes = review.votes.filter(vote => vote.type === client_1.VoteType.DOWNVOTE).length;
    // Format comments
    const formattedComments = review.comments.map(comment => ({
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
            createdAt: reply.createdAt,
            updatedAt: reply.updatedAt
        }))
    }));
    // Check if user has voted on this review
    let userVote = null;
    if (userId) {
        const vote = review.votes.find(vote => vote.userId === userId);
        if (vote) {
            userVote = vote.type;
        }
    }
    return {
        id: review.id,
        title: review.title,
        description: reviewDescription,
        rating: review.rating,
        purchaseSource: review.purchaseSource,
        images: review.images,
        isPremium: review.isPremium,
        premiumPrice: review.premiumPrice,
        status: review.status,
        category: review.category.name,
        categoryId: review.categoryId,
        author: review.user.name,
        authorId: review.user.id,
        authorRole: review.user.role,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        votes: {
            upvotes,
            downvotes,
            userVote
        },
        comments: formattedComments,
        hasPaid
    };
});
/**
 * Update a review
 */
const updateReview = (id, userId, updateData, files) => __awaiter(void 0, void 0, void 0, function* () {
    // Find the review
    const review = yield models_1.default.review.findUnique({
        where: {
            id
        }
    });
    if (!review) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Review not found');
    }
    // Check if user owns the review or is an admin
    const user = yield models_1.default.user.findUnique({
        where: {
            id: userId
        }
    });
    if (review.userId !== userId && (user === null || user === void 0 ? void 0 : user.role) !== client_1.UserRole.ADMIN) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'You are not authorized to update this review');
    }
    // Prepare update data
    const { title, description, rating, purchaseSource, categoryId, isPremium, premiumPrice } = updateData;
    const updatedData = {};
    if (title !== undefined)
        updatedData.title = title;
    if (description !== undefined)
        updatedData.description = description;
    if (rating !== undefined)
        updatedData.rating = Number(rating);
    if (purchaseSource !== undefined)
        updatedData.purchaseSource = purchaseSource;
    if (categoryId !== undefined)
        updatedData.categoryId = categoryId;
    // Admin can update premium status and price
    if ((user === null || user === void 0 ? void 0 : user.role) === client_1.UserRole.ADMIN) {
        if (isPremium !== undefined)
            updatedData.isPremium = Boolean(isPremium);
        if (premiumPrice !== undefined)
            updatedData.premiumPrice = Number(premiumPrice);
    }
    // If admin updates, keep status. If user updates, set back to DRAFT for review
    if ((user === null || user === void 0 ? void 0 : user.role) !== client_1.UserRole.ADMIN && review.status === client_1.ReviewStatus.PUBLISHED) {
        updatedData.status = client_1.ReviewStatus.DRAFT;
    }
    // Upload new images if provided
    if (files && files.length > 0) {
        const uploadedImages = yield fileUploader_1.fileUploader.uploadMultipleToCloudinary(files);
        const newImageUrls = uploadedImages.map(image => image.secure_url);
        // Combine with existing images
        updatedData.images = [...review.images, ...newImageUrls];
    }
    // Update the review
    const updatedReview = yield models_1.default.review.update({
        where: {
            id
        },
        data: updatedData,
        include: {
            category: true,
            user: {
                select: {
                    name: true,
                    email: true,
                    role: true
                }
            }
        }
    });
    return updatedReview;
});
/**
 * Delete a review
 */
const deleteReview = (id, userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Find the review
    const review = yield models_1.default.review.findUnique({
        where: {
            id
        }
    });
    if (!review) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Review not found');
    }
    // Check if user owns the review or is an admin
    const user = yield models_1.default.user.findUnique({
        where: {
            id: userId
        }
    });
    if (review.userId !== userId && (user === null || user === void 0 ? void 0 : user.role) !== client_1.UserRole.ADMIN) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'You are not authorized to delete this review');
    }
    // Delete associated comments
    yield models_1.default.comment.deleteMany({
        where: {
            reviewId: id
        }
    });
    // Delete associated votes
    yield models_1.default.vote.deleteMany({
        where: {
            reviewId: id
        }
    });
    // Delete the review
    yield models_1.default.review.delete({
        where: {
            id
        }
    });
    return {
        id,
        message: 'Review deleted successfully'
    };
});
/**
 * Get featured reviews for homepage
 */
const getFeaturedReviews = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (limit = 6) {
    // Get highest rated reviews
    const highestRated = yield models_1.default.review.findMany({
        where: {
            status: client_1.ReviewStatus.PUBLISHED
        },
        orderBy: {
            rating: 'desc'
        },
        take: limit / 2,
        include: {
            category: true,
            user: {
                select: {
                    name: true
                }
            },
            _count: {
                select: {
                    votes: {
                        where: {
                            type: client_1.VoteType.UPVOTE
                        }
                    }
                }
            }
        }
    });
    // Get most voted reviews
    const mostVoted = yield models_1.default.review.findMany({
        where: {
            status: client_1.ReviewStatus.PUBLISHED
        },
        orderBy: {
            votes: {
                _count: 'desc'
            }
        },
        take: limit / 2,
        include: {
            category: true,
            user: {
                select: {
                    name: true
                }
            },
            _count: {
                select: {
                    votes: {
                        where: {
                            type: client_1.VoteType.UPVOTE
                        }
                    }
                }
            }
        }
    });
    // Format reviews
    const formatReview = (review) => ({
        id: review.id,
        title: review.title,
        rating: review.rating,
        isPremium: review.isPremium,
        category: review.category.name,
        author: review.user.name,
        upvotes: review._count.votes,
        image: review.images.length > 0 ? review.images[0] : null,
        createdAt: review.createdAt
    });
    return {
        highestRated: highestRated.map(formatReview),
        mostVoted: mostVoted.map(formatReview)
    };
});
/**
 * Get related reviews
 */
const getRelatedReviews = (id_1, ...args_1) => __awaiter(void 0, [id_1, ...args_1], void 0, function* (id, limit = 4) {
    // Get the category of the current review
    const review = yield models_1.default.review.findUnique({
        where: {
            id
        },
        select: {
            categoryId: true
        }
    });
    if (!review) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Review not found');
    }
    // Get related reviews in the same category
    const relatedReviews = yield models_1.default.review.findMany({
        where: {
            categoryId: review.categoryId,
            id: {
                not: id
            },
            status: client_1.ReviewStatus.PUBLISHED
        },
        take: limit,
        include: {
            category: true,
            user: {
                select: {
                    name: true
                }
            },
            _count: {
                select: {
                    votes: {
                        where: {
                            type: client_1.VoteType.UPVOTE
                        }
                    }
                }
            }
        }
    });
    // Format reviews
    return relatedReviews.map(review => ({
        id: review.id,
        title: review.title,
        rating: review.rating,
        isPremium: review.isPremium,
        category: review.category.name,
        author: review.user.name,
        upvotes: review._count.votes,
        image: review.images.length > 0 ? review.images[0] : null,
        createdAt: review.createdAt
    }));
});
/**
 * Get reviews by user
 */
const getUserReviews = (userId, paginationOptions) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 10 } = paginationOptions;
    const skip = (page - 1) * limit;
    const take = Number(limit);
    // Get user's reviews
    const reviews = yield models_1.default.review.findMany({
        where: {
            userId
        },
        include: {
            category: true,
            _count: {
                select: {
                    votes: {
                        where: {
                            type: client_1.VoteType.UPVOTE
                        }
                    },
                    comments: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        },
        skip,
        take
    });
    // Get total count
    const total = yield models_1.default.review.count({
        where: {
            userId
        }
    });
    // Format reviews
    const formattedReviews = reviews.map(review => ({
        id: review.id,
        title: review.title,
        rating: review.rating,
        status: review.status,
        isPremium: review.isPremium,
        category: review.category.name,
        upvotes: review._count.votes,
        comments: review._count.comments,
        image: review.images.length > 0 ? review.images[0] : null,
        createdAt: review.createdAt
    }));
    return {
        meta: {
            page: Number(page),
            limit: Number(limit),
            total
        },
        data: formattedReviews
    };
});
/**
 * Remove image from review
 */
const removeImage = (reviewId, userId, imageUrl) => __awaiter(void 0, void 0, void 0, function* () {
    // Find the review
    const review = yield models_1.default.review.findUnique({
        where: {
            id: reviewId
        }
    });
    if (!review) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Review not found');
    }
    // Check if user owns the review or is an admin
    const user = yield models_1.default.user.findUnique({
        where: {
            id: userId
        }
    });
    if (review.userId !== userId && (user === null || user === void 0 ? void 0 : user.role) !== client_1.UserRole.ADMIN) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'You are not authorized to update this review');
    }
    // Remove the image from the array
    const updatedImages = review.images.filter(img => img !== imageUrl);
    // Update the review
    const updatedReview = yield models_1.default.review.update({
        where: {
            id: reviewId
        },
        data: {
            images: updatedImages
        }
    });
    return updatedReview;
});
exports.ReviewService = {
    createReview,
    getAllReviews,
    getReviewById,
    updateReview,
    deleteReview,
    getFeaturedReviews,
    getRelatedReviews,
    getUserReviews,
    removeImage
};
