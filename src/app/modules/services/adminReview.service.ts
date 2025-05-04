import prisma from "../models";
import { IPaginationOptions, IGenericResponse } from "../../interface/file";
import { ReviewStatus } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../error/ApiError";

/**
 * Get all reviews for admin with filtering by status
 * @param filters Filter parameters
 * @param paginationOptions Pagination options
 * @returns Paginated list of reviews
 */
const getAllReviewsForAdmin = async (
    filters: {
        status?: ReviewStatus | 'ALL';
        categoryId?: string;
        userId?: string;
        searchTerm?: string;
    },
    paginationOptions: IPaginationOptions
): Promise<IGenericResponse<any>> => {
    const { 
        status = 'ALL', 
        categoryId, 
        userId,
        searchTerm
    } = filters;
    
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = paginationOptions;
    
    const skip = (page - 1) * limit;
    const take = Number(limit);
    
    // Build the where condition
    const whereConditions: any = {};
    
    // Filter by status if not 'ALL'
    if (status !== 'ALL') {
        whereConditions.status = status;
    }
    
    // Filter by category if provided
    if (categoryId) {
        whereConditions.categoryId = categoryId;
    }
    
    // Filter by user if provided
    if (userId) {
        whereConditions.userId = userId;
    }
    
    // Search by title or description
    if (searchTerm) {
        whereConditions.OR = [
            {
                title: {
                    contains: searchTerm,
                    mode: 'insensitive'
                }
            },
            {
                description: {
                    contains: searchTerm,
                    mode: 'insensitive'
                }
            }
        ];
    }
    
    try {
        // Get reviews
        const reviews = await prisma.review.findMany({
            where: whereConditions,
            include: {
                category: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true
                    }
                },
                _count: {
                    select: {
                        votes: true,
                        comments: true,
                        payments: true
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
        const total = await prisma.review.count({
            where: whereConditions
        });
        
        // Format the response
        const formattedReviews = reviews.map(review => ({
            id: review.id,
            title: review.title,
            description: review.description,
            rating: review.rating,
            purchaseSource: review.purchaseSource,
            images: review.images,
            isPremium: review.isPremium,
            premiumPrice: review.premiumPrice,
            status: review.status,
            moderationNote: review.moderationNote,
            categoryId: review.categoryId,
            categoryName: review.category.name,
            userId: review.userId,
            userName: review.user.name,
            userEmail: review.user.email,
            userRole: review.user.role,
            votes: review._count.votes,
            comments: review._count.comments,
            payments: review._count.payments,
            createdAt: review.createdAt,
            updatedAt: review.updatedAt
        }));
        
        return {
            meta: {
                page: Number(page),
                limit: Number(limit),
                total
            },
            data: formattedReviews
        };
    } catch (error) {
        console.error('Error fetching reviews for admin:', error);
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch reviews');
    }
};

/**
 * Get review statistics by status
 * @returns Statistics of reviews by status
 */
const getReviewStatsByStatus = async () => {
    // Get count of reviews by status
    const reviewStats = await prisma.review.groupBy({
        by: ['status'],
        _count: {
            id: true
        }
    });
    
    // Format the response
    const stats = {
        total: 0,
        published: 0,
        draft: 0,
        unpublished: 0
    };
    
    // Calculate total
    reviewStats.forEach(stat => {
        const count = stat._count.id;
        
        if (stat.status === ReviewStatus.PUBLISHED) {
            stats.published = count;
        } else if (stat.status === ReviewStatus.DRAFT) {
            stats.draft = count;
        } else if (stat.status === ReviewStatus.UNPUBLISHED) {
            stats.unpublished = count;
        }
        
        stats.total += count;
    });
    
    return stats;
};

/**
 * Change review status (publish or unpublish)
 * @param reviewId Review ID
 * @param status New status
 * @param moderationNote Optional moderation note
 * @returns Updated review
 */
const changeReviewStatus = async (
    reviewId: string,
    status: ReviewStatus,
    moderationNote?: string
) => {
    try {
        // Find the review
        const review = await prisma.review.findUnique({
            where: {
                id: reviewId
            }
        });
        
        if (!review) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Review not found");
        }
        
        // Update the review status
        const updatedReview = await prisma.review.update({
            where: {
                id: reviewId
            },
            data: {
                status,
                moderationNote: moderationNote || null
            },
            include: {
                category: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true
                    }
                }
            }
        });
        
        return {
            id: updatedReview.id,
            title: updatedReview.title,
            status: updatedReview.status,
            moderationNote: updatedReview.moderationNote,
            categoryName: updatedReview.category.name,
            userName: updatedReview.user.name,
            userEmail: updatedReview.user.email,
            updatedAt: updatedReview.updatedAt
        };
    } catch (error) {
        console.error(`Error changing review status to ${status}:`, error);
        throw error instanceof ApiError 
            ? error 
            : new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, `Failed to change review status to ${status}`);
    }
};

/**
 * Publish a review
 * @param reviewId Review ID
 * @param moderationNote Optional moderation note
 * @returns Published review
 */
const publishReview = async (reviewId: string, moderationNote?: string) => {
    return changeReviewStatus(reviewId, ReviewStatus.PUBLISHED, moderationNote);
};

/**
 * Unpublish a review
 * @param reviewId Review ID
 * @param moderationNote Optional moderation note
 * @returns Unpublished review
 */
const unpublishReview = async (reviewId: string, moderationNote?: string) => {
    return changeReviewStatus(reviewId, ReviewStatus.UNPUBLISHED, moderationNote);
};

export const AdminReviewService = {
    getAllReviewsForAdmin,
    getReviewStatsByStatus,
    publishReview,
    unpublishReview
};