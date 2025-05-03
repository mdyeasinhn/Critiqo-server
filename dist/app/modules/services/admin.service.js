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
exports.AdminService = void 0;
const models_1 = __importDefault(require("../models"));
const client_1 = require("@prisma/client");
const http_status_codes_1 = require("http-status-codes");
const fileUploader_1 = require("../../helpers/fileUploader");
const ApiError_1 = __importDefault(require("../../error/ApiError"));
/**
 * Fetch comprehensive dashboard statistics for admin
 * @returns Dashboard statistics including users, reviews, payments, etc.
 */
const getDashboardStats = () => __awaiter(void 0, void 0, void 0, function* () {
    // Get total users count by role
    const userCounts = yield models_1.default.user.groupBy({
        by: ['role'],
        _count: {
            id: true
        }
    });
    // Get total reviews count by status
    const reviewCounts = yield models_1.default.review.groupBy({
        by: ['status'],
        _count: {
            id: true
        }
    });
    // Get total categories count
    const categoryCount = yield models_1.default.category.count();
    // Get total premium reviews
    const premiumReviewCount = yield models_1.default.review.count({
        where: {
            isPremium: true
        }
    });
    // Get total completed payments and revenue
    const totalPayments = yield models_1.default.payment.aggregate({
        _sum: {
            amount: true
        },
        _count: {
            id: true
        },
        where: {
            status: client_1.PaymentStatus.COMPLETEED // Note: Typo in the enum
        }
    });
    // Get recent reviews (last 5)
    const recentReviews = yield models_1.default.review.findMany({
        take: 5,
        orderBy: {
            createdAt: 'desc'
        },
        include: {
            user: {
                select: {
                    name: true
                }
            },
            category: true
        }
    });
    // Get most popular reviews (highest vote count)
    const popularReviews = yield models_1.default.review.findMany({
        take: 5,
        where: {
            status: client_1.ReviewStatus.PUBLISHED
        },
        include: {
            user: {
                select: {
                    name: true
                }
            },
            category: true,
            _count: {
                select: {
                    votes: true
                }
            }
        },
        orderBy: {
            votes: {
                _count: 'desc'
            }
        }
    });
    // Format user counts
    const formattedUserCounts = {
        admin: 0,
        user: 0,
        guest: 0
    };
    userCounts.forEach(count => {
        const role = count.role.toLowerCase();
        if (role === 'admin')
            formattedUserCounts.admin = count._count.id;
        if (role === 'user')
            formattedUserCounts.user = count._count.id;
        if (role === 'guest')
            formattedUserCounts.guest = count._count.id;
    });
    // Format review counts
    const formattedReviewCounts = {
        draft: 0,
        published: 0,
        unpublished: 0
    };
    reviewCounts.forEach(count => {
        const status = count.status.toLowerCase();
        if (status === 'draft')
            formattedReviewCounts.draft = count._count.id;
        if (status === 'published')
            formattedReviewCounts.published = count._count.id;
        if (status === 'unpublished')
            formattedReviewCounts.unpublished = count._count.id;
    });
    // Get votes statistics
    const voteStats = yield models_1.default.vote.groupBy({
        by: ['type'],
        _count: {
            id: true
        }
    });
    const formattedVoteStats = {
        upvotes: 0,
        downvotes: 0
    };
    voteStats.forEach(stat => {
        if (stat.type === client_1.VoteType.UPVOTE)
            formattedVoteStats.upvotes = stat._count.id;
        if (stat.type === client_1.VoteType.DOWNVOTE)
            formattedVoteStats.downvotes = stat._count.id;
    });
    return {
        users: formattedUserCounts,
        reviews: formattedReviewCounts,
        categories: categoryCount,
        premiumReviews: premiumReviewCount,
        payments: {
            count: totalPayments._count.id || 0,
            revenue: totalPayments._sum.amount || 0
        },
        votes: formattedVoteStats,
        recentReviews: recentReviews.map(review => ({
            id: review.id,
            title: review.title,
            author: review.user.name,
            category: review.category.name,
            status: review.status,
            createdAt: review.createdAt
        })),
        popularReviews: popularReviews.map(review => ({
            id: review.id,
            title: review.title,
            author: review.user.name,
            category: review.category.name,
            voteCount: review._count.votes,
            createdAt: review.createdAt
        }))
    };
});
/**
 * Get pending reviews for admin moderation
 * @param paginationOptions Pagination parameters
 * @returns Paginated list of pending reviews
 */
const getPendingReviews = (paginationOptions) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = paginationOptions;
    const skip = (page - 1) * limit;
    const take = Number(limit);
    // Get reviews with DRAFT status
    const reviews = yield models_1.default.review.findMany({
        where: {
            status: client_1.ReviewStatus.DRAFT
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            },
            category: true
        },
        orderBy: {
            [sortBy]: sortOrder
        },
        skip,
        take
    });
    const total = yield models_1.default.review.count({
        where: {
            status: client_1.ReviewStatus.DRAFT
        }
    });
    return {
        meta: {
            page: Number(page),
            limit: Number(limit),
            total
        },
        data: reviews
    };
});
/**
 * Moderate a review (approve, unpublish)
 * @param reviewId Review ID
 * @param action Moderation action (publish/unpublish)
 * @param moderationNote Optional note explaining the moderation decision
 * @returns Updated review
 */
const moderateReview = (reviewId, action, moderationNote) => __awaiter(void 0, void 0, void 0, function* () {
    // Find the review
    const review = yield models_1.default.review.findUnique({
        where: {
            id: reviewId
        }
    });
    if (!review) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Review not found');
    }
    // Update review status based on action
    const newStatus = action === 'publish' ? client_1.ReviewStatus.PUBLISHED : client_1.ReviewStatus.UNPUBLISHED;
    const updatedReview = yield models_1.default.review.update({
        where: {
            id: reviewId
        },
        data: {
            status: newStatus,
            moderationNote: moderationNote || null
        },
        include: {
            user: {
                select: {
                    name: true,
                    email: true
                }
            },
            category: true
        }
    });
    return updatedReview;
});
/**
 * Get admin profile
 * @param userId Admin user ID
 * @returns Admin profile data
 */
const getAdminProfile = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userId) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'User ID is required');
    }
    // Get user with admin role
    const user = yield models_1.default.user.findFirst({
        where: {
            id: userId,
            role: client_1.UserRole.ADMIN,
            status: client_1.UserStatus.ACTIVE
        },
        include: {
            admin: true
        }
    });
    if (!user || !user.admin) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Admin profile not found');
    }
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePhoto: user.admin.profilePhoto,
        contactNumber: user.admin.contactNumber,
        createdAt: user.createdAt
    };
});
/**
 * Update admin profile
 * @param userId Admin user ID
 * @param updateData Profile update data
 * @param file Optional profile photo
 * @returns Updated admin profile
 */
const updateAdminProfile = (userId, updateData, file) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userId) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'User ID is required');
    }
    // Get user with admin role
    const user = yield models_1.default.user.findFirst({
        where: {
            id: userId,
            role: client_1.UserRole.ADMIN,
            status: client_1.UserStatus.ACTIVE
        },
        include: {
            admin: true
        }
    });
    if (!user || !user.admin) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Admin profile not found');
    }
    let profilePhotoUrl;
    // Upload profile photo if provided
    if (file) {
        const uploadToCloudinary = yield fileUploader_1.fileUploader.uploadToCloudinary(file);
        profilePhotoUrl = uploadToCloudinary === null || uploadToCloudinary === void 0 ? void 0 : uploadToCloudinary.secure_url;
    }
    // Update admin profile
    const updatedAdmin = yield models_1.default.$transaction((transactionClient) => __awaiter(void 0, void 0, void 0, function* () {
        // Update user name if provided
        if (updateData.name) {
            yield transactionClient.user.update({
                where: {
                    id: userId
                },
                data: {
                    name: updateData.name
                }
            });
        }
        // Update admin profile
        const adminUpdateData = {};
        if (updateData.name) {
            adminUpdateData.name = updateData.name;
        }
        if (updateData.contactNumber) {
            adminUpdateData.contactNumber = updateData.contactNumber;
        }
        if (profilePhotoUrl) {
            adminUpdateData.profilePhoto = profilePhotoUrl;
        }
        const updatedAdminProfile = yield transactionClient.admin.update({
            where: {
                email: user.email
            },
            data: adminUpdateData
        });
        return updatedAdminProfile;
    }));
    return {
        id: user.id,
        name: updateData.name || user.name,
        email: user.email,
        role: user.role,
        profilePhoto: profilePhotoUrl || user.admin.profilePhoto,
        contactNumber: updateData.contactNumber || user.admin.contactNumber,
        createdAt: user.createdAt
    };
});
/**
 * Get payment analytics
 * @param paginationOptions Pagination parameters
 * @returns Payment analytics data
 */
const getPaymentAnalytics = (paginationOptions) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 10 } = paginationOptions;
    const skip = (page - 1) * limit;
    const take = Number(limit);
    // Get total revenue
    const totalRevenue = yield models_1.default.payment.aggregate({
        _sum: {
            amount: true
        },
        where: {
            status: client_1.PaymentStatus.COMPLETEED
        }
    });
    // Get most profitable reviews
    const profitableReviews = yield models_1.default.review.findMany({
        where: {
            isPremium: true
        },
        take,
        skip,
        include: {
            payments: {
                where: {
                    status: client_1.PaymentStatus.COMPLETEED
                }
            },
            user: {
                select: {
                    name: true
                }
            }
        },
        orderBy: {
            payments: {
                _count: 'desc'
            }
        }
    });
    // Get total payments
    const totalPayments = yield models_1.default.payment.count({
        where: {
            status: client_1.PaymentStatus.COMPLETEED
        }
    });
    // Format data to compute revenue per review
    const reviewAnalytics = profitableReviews.map(review => {
        const totalRevenueForReview = review.payments.reduce((sum, payment) => sum + payment.amount, 0);
        const purchaseCount = review.payments.length;
        return {
            id: review.id,
            title: review.title,
            author: review.user.name,
            price: review.premiumPrice,
            purchaseCount,
            totalRevenue: totalRevenueForReview,
            createdAt: review.createdAt
        };
    });
    return {
        meta: {
            page: Number(page),
            limit: Number(limit),
            total: totalPayments
        },
        summary: {
            totalRevenue: totalRevenue._sum.amount || 0,
            totalPayments: totalPayments,
            premiumReviewCount: yield models_1.default.review.count({ where: { isPremium: true } })
        },
        topReviews: reviewAnalytics
    };
});
/**
 * Remove inappropriate comments
 * @param commentId Comment ID to remove
 * @returns Removed comment
 */
const removeInappropriateComment = (commentId) => __awaiter(void 0, void 0, void 0, function* () {
    const comment = yield models_1.default.comment.findUnique({
        where: {
            id: commentId
        },
        include: {
            user: {
                select: {
                    name: true
                }
            },
            review: {
                select: {
                    title: true
                }
            }
        }
    });
    if (!comment) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Comment not found');
    }
    // Delete the comment
    yield models_1.default.comment.delete({
        where: {
            id: commentId
        }
    });
    return {
        id: comment.id,
        content: comment.content,
        user: comment.user.name,
        review: comment.review.title,
        deletedAt: new Date()
    };
});
exports.AdminService = {
    getDashboardStats,
    getPendingReviews,
    moderateReview,
    getAdminProfile,
    updateAdminProfile,
    getPaymentAnalytics,
    removeInappropriateComment
};
