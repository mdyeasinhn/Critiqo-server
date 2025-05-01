import { Request } from "express";
import prisma from "../models";
import { Review, ReviewStatus, Prisma } from "@prisma/client";  // Added Prisma import
import { IFile, IPaginationOptions } from "../../interface/file";
import { fileUploader } from "../../helpers/fileUploader";
import ApiError from "../../shared/ApiError";
import { StatusCodes } from "http-status-codes";


type ReviewWithCounts = Review & {
    _count: {
      votes: number;
      comments: number;
    };
  };

const createReview = async (req: Request): Promise<Review> => {
    const { userId } = req.user;
    const files = req.files as IFile[];
    let imageUrls: string[] = [];

    // Upload images to cloudinary if provided
    if (files && files.length > 0) {
        const uploadedImages = await fileUploader.uploadMultipleToCloudinary(files);
        imageUrls = uploadedImages.map(image => image.secure_url);
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
        where: {
            id: req.body.categoryId
        }
    });

    if (!category) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Category not found');
    }

    // Create review
    const result = await prisma.review.create({
        data: {
            title: req.body.title,
            description: req.body.description,
            rating: req.body.rating,
            purchaseSource: req.body.purchaseSource,
            images: imageUrls,
            isPremium: req.body.isPremium || false,
            premiumPrice: req.body.isPremium ? req.body.premiumPrice : null,
            status: ReviewStatus.DRAFT,
            categoryId: req.body.categoryId,
            userId
        }
    });

    return result;
};

const getAllReviews = async (
    filters: {
        searchTerm?: string;
        categoryId?: string;
        userId?: string;
        status?: ReviewStatus;
        rating?: number;
        isPremium?: boolean;
    },
    paginationOptions: IPaginationOptions
) => {
    const { searchTerm, ...filterData } = filters;
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = paginationOptions;

    const skip = (page - 1) * limit;
    const take = limit;

    // Create search condition when search term is provided
    const searchCondition = searchTerm ? {
        OR: [
            {
                title: {
                    contains: searchTerm,
                    mode: Prisma.QueryMode.insensitive  // Fixed: Using QueryMode enum
                }
            },
            {
                description: {
                    contains: searchTerm,
                    mode: Prisma.QueryMode.insensitive  // Fixed: Using QueryMode enum
                }
            }
        ]
    } : {};

    // Create filter condition
    const whereConditions = {
        ...searchCondition,
        ...filterData
    };

    // Get reviews with pagination
    const reviews = await prisma.review.findMany({
        where: whereConditions,
        include: {
            category: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            },
            _count: {
                select: {
                    comments: true,
                    votes: {
                        where: {
                            type: 'UPVOTE'
                        }
                    }
                }
            }
        },
        skip,
        take,
        orderBy: {
            [sortBy]: sortOrder
        }
    });

    // Process reviews to add upvote and downvote counts
    const processedReviews = await Promise.all(reviews.map(async (review) => {
        const downvotes = await prisma.vote.count({
            where: {
                reviewId: review.id,
                type: 'DOWNVOTE'
            }
        });

        // Mask description for premium reviews
        let processedDescription = review.description;
        if (review.isPremium) {
            // Show only first 100 characters for premium reviews
            processedDescription = `${review.description.substring(0, 100)}... [Premium Content]`;
        }

       
        return {
            ...review,
            description: processedDescription,
            upvotes: review._count.votes,
            downvotes,
            commentCount: review._count.comments,
            _count: undefined,
        };
    }));

    // Count total reviews that match the filter criteria
    const total = await prisma.review.count({
        where: whereConditions
    });

    return {
        meta: {
            page,
            limit,
            total
        },
        data: processedReviews
    };
};

const getPublishedReviews = async (
    filters: {
        searchTerm?: string;
        categoryId?: string;
        rating?: number;
        isPremium?: boolean;
    },
    paginationOptions: IPaginationOptions
) => {
    // Add status filter to show only published reviews
    return getAllReviews(
        {
            ...filters,
            status: ReviewStatus.PUBLISHED
        },
        paginationOptions
    );
};

const getReviewById = async (id: string, userId?: string) => {
    const review = await prisma.review.findUnique({
        where: {
            id
        },
        include: {
            category: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true
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
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            },
            _count: {
                select: {
                    votes: {
                        where: {
                            type: 'UPVOTE'
                        }
                    }
                }
            }
        }
    });

    if (!review) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Review not found');
    }

    // Get downvotes count
    const downvotes = await prisma.vote.count({
        where: {
            reviewId: review.id,
            type: 'DOWNVOTE'
        }
    });

    // Check if user has purchased this premium review
    let hasPurchased = false;
    if (userId && review.isPremium) {
        const payment = await prisma.payment.findFirst({
            where: {
                reviewId: review.id,
                userId,
                status: 'COMPLETEED' // Note: There's a typo in your enum, should be 'COMPLETED'
            }
        });
        hasPurchased = !!payment;
    }

    // Mask description for premium reviews if not purchased
    let processedDescription = review.description;
    if (review.isPremium && !hasPurchased && review.userId !== userId) {
        // Show only first 100 characters for premium reviews
        processedDescription = `${review.description.substring(0, 100)}... [Premium Content]`;
    }

    // Check if current user has voted on this review
    let userVote = null;
    if (userId) {
        userVote = await prisma.vote.findUnique({
            where: {
                reviewId_userId: {
                    reviewId: review.id,
                    userId
                }
            }
        });
    }

    return {
        ...review,
        description: processedDescription,
        upvotes: review._count.votes,
        downvotes,
        userVote: userVote ? userVote.type : null,
        hasPurchased,
        _count: undefined
    };
};

const updateReview = async (id: string, req: Request): Promise<Review> => {
    const { userId } = req.user;
    const files = req.files as IFile[];
    let imageUrls: string[] = [];

    // Check if review exists and belongs to user
    const existingReview = await prisma.review.findUnique({
        where: {
            id
        }
    });

    if (!existingReview) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Review not found');
    }

    // Only allow owner or admin to update
    if (existingReview.userId !== userId && req.user.role !== 'ADMIN') {
        throw new ApiError(StatusCodes.FORBIDDEN, 'You do not have permission to update this review');
    }

    // Only allow updates to draft or user's own published reviews
    if (existingReview.status === ReviewStatus.PUBLISHED && existingReview.userId !== userId) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Cannot update a published review that belongs to another user');
    }

    // Upload new images if provided
    if (files && files.length > 0) {
        const uploadedImages = await fileUploader.uploadMultipleToCloudinary(files);
        imageUrls = uploadedImages.map(image => image.secure_url);
    }

    // Prepare update data
    const updateData: any = {};
    
    if (req.body.title) updateData.title = req.body.title;
    if (req.body.description) updateData.description = req.body.description;
    if (req.body.rating) updateData.rating = parseInt(req.body.rating);
    if (req.body.purchaseSource) updateData.purchaseSource = req.body.purchaseSource;
    if (req.body.categoryId) updateData.categoryId = req.body.categoryId;
    
    // Handle premium status and price (only admins can set premium)
    if (req.user.role === 'ADMIN') {
        if (req.body.isPremium !== undefined) updateData.isPremium = req.body.isPremium === 'true';
        if (updateData.isPremium && req.body.premiumPrice) {
            updateData.premiumPrice = parseFloat(req.body.premiumPrice);
        }
    }
    
    // Add new images to existing ones
    if (imageUrls.length > 0) {
        updateData.images = [...existingReview.images, ...imageUrls];
    }

    // If review was previously published and being edited by owner, set back to draft
    if (existingReview.status === ReviewStatus.PUBLISHED && existingReview.userId === userId) {
        updateData.status = ReviewStatus.DRAFT;
    }

    // Update review
    const updatedReview = await prisma.review.update({
        where: {
            id
        },
        data: updateData
    });

    return updatedReview;
};

const deleteReview = async (id: string, userId: string, role: string): Promise<Review> => {
    // Check if review exists
    const review = await prisma.review.findUnique({
        where: {
            id
        }
    });

    if (!review) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Review not found');
    }

    // Only allow owner or admin to delete
    if (review.userId !== userId && role !== 'ADMIN') {
        throw new ApiError(StatusCodes.FORBIDDEN, 'You do not have permission to delete this review');
    }

    // Delete associated votes
    await prisma.vote.deleteMany({
        where: {
            reviewId: id
        }
    });

    // Delete associated comments
    await prisma.comment.deleteMany({
        where: {
            reviewId: id
        }
    });

    // Delete associated payments (if premium)
    await prisma.payment.deleteMany({
        where: {
            reviewId: id
        }
    });

    // Delete review
    const deletedReview = await prisma.review.delete({
        where: {
            id
        }
    });

    return deletedReview;
};

const updateReviewStatus = async (
    id: string, 
    { status, moderationNote }: { status: ReviewStatus; moderationNote?: string }
): Promise<Review> => {
    // Check if review exists
    const review = await prisma.review.findUnique({
        where: {
            id
        }
    });

    if (!review) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Review not found');
    }

    // Update review status
    const updatedReview = await prisma.review.update({
        where: {
            id
        },
        data: {
            status,
            moderationNote: moderationNote || null
        }
    });

    return updatedReview;
};

const removeReviewImage = async (id: string, imageUrl: string, userId: string, role: string): Promise<Review> => {
    // Check if review exists
    const review = await prisma.review.findUnique({
        where: {
            id
        }
    });

    if (!review) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Review not found');
    }

    // Only allow owner or admin to remove images
    if (review.userId !== userId && role !== 'ADMIN') {
        throw new ApiError(StatusCodes.FORBIDDEN, 'You do not have permission to modify this review');
    }

    // Remove image from array
    const updatedImages = review.images.filter(url => url !== imageUrl);

    // Update review
    const updatedReview = await prisma.review.update({
        where: {
            id
        },
        data: {
            images: updatedImages
        }
    });

    return updatedReview;
};

export const ReviewService = {
    createReview,
    getAllReviews,
    getPublishedReviews,
    getReviewById,
    updateReview,
    deleteReview,
    updateReviewStatus,
    removeReviewImage
};