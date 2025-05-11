import prisma from "../models";
import {
  IFile,
  IPaginationOptions,
  IGenericResponse,
} from "../../interface/file";
import { ReviewStatus, UserRole, VoteType } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { fileUploader } from "../../helpers/fileUploader";
import ApiError from "../../error/ApiError";
import { Request } from "express";
import { pagenationHelpars } from "../../helpers/pagenationHelper";

// Define the authentication interface
interface IAuthUser {
  userId: string;
  role: UserRole;
  email: string;
}

// Extend the Express Request type
interface AuthenticatedRequest extends Request {
  user: IAuthUser;
}

/**
 * Create a new review
 */
const createReview = async (req: AuthenticatedRequest) => {
  const userId = req.user.userId;
  const files = req.files as IFile[];

  // Get the review data from the request body
  const {
    categoryId,
    title,
    description,
    rating,
    purchaseSource,
    isPremium,
    premiumPrice,
    ...reviewData
  } = req.body;

  // Check if premium price is provided for premium reviews
  if (isPremium && !premiumPrice) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Premium price is required for premium reviews",
    );
  }

  // Upload images to Cloudinary if provided
  let imageUrls: string[] = [];
  if (files && files.length > 0) {
    const uploadedImages = await fileUploader.uploadMultipleToCloudinary(files);
    imageUrls = uploadedImages.map((image) => image.secure_url);
  }

  // Admin can directly publish, users create draft reviews
  const initialStatus =
    req.user.role === UserRole.ADMIN
      ? ReviewStatus.PUBLISHED
      : ReviewStatus.DRAFT;

  // Create review
  const review = await prisma.review.create({
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
      userId,
    },
    include: {
      category: true,
      user: {
        select: {
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  return review;
};

/**
 * Get all reviews with pagination and filtering
 */
const getAllReviews = async (
  filters: {
    status?: ReviewStatus;
    categoryId?: string;
    isPremium?: string;
    title?: string;
    sortOrder?: "asc" | "desc";
    rating?: number;
    userId?: string;
  },
  paginationOptions: IPaginationOptions,
): Promise<IGenericResponse<any>> => {
  const { status, categoryId, isPremium, title, rating, userId } = filters;
  console.log(isPremium);

  // const { page = 1, limit = 6, sortBy = 'createdAt', sortOrder = 'desc' } = paginationOptions;

  const { limit, page, skip, sortBy, sortOrder } =
    pagenationHelpars.calculatePagenation(paginationOptions);

  // const skip = Math.max((page - 1) * limit, 0);
  const take = Number(limit);

  // Construct where conditions based on filters
  const whereConditions: any = {
    status: status || undefined,
  };

  if (categoryId) {
    whereConditions.categoryId = categoryId;
  }

  if (isPremium !== undefined) {
    whereConditions.isPremium = isPremium || undefined;
  }
  if (typeof isPremium === "boolean") {
    filters.isPremium = whereConditions.isPremium;
  }
  if (isPremium === "true") {
    whereConditions.isPremium = true;
  } else if (isPremium === "false") {
    whereConditions.isPremium = false;
  }

  if (title) {
    whereConditions.title = {
      contains: title,
      mode: "insensitive",
    };
  }

  if (rating) {
    whereConditions.rating = Number(rating);
  }

  if (userId) {
    whereConditions.userId = userId;
  }

  // Get reviews
  const reviews = await prisma.review.findMany({
    where: whereConditions,
    include: {
      category: true,
      user: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
      _count: {
        select: {
          votes: {
            where: {
              type: VoteType.UPVOTE,
            },
          },
          comments: true,
        },
      },
    },
    orderBy: {
      [sortBy]: sortOrder || "asc",
    },
    skip,
    take,
  });

  // Get total count
  const total = await prisma.review.count({
    where: whereConditions,
  });

  // Format reviews for response
  const formattedReviews = reviews.map((review) => {
    // For premium reviews, truncate description for non-subscribers
    let truncatedDescription = review.description;
    if (review.isPremium) {
      truncatedDescription = review.description.substring(0, 100) + "...";
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
      comments: review._count.comments,
    };
  });

  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
    },
    data: formattedReviews,
  };
};

/**
 * Get a single review by ID
 */
const getReviewById = async (id: string, userId?: string) => {
  const review = await prisma.review.findUnique({
    where: {
      id,
      status: ReviewStatus.PUBLISHED,
    },
    include: {
      category: true,
      user: {
        select: {
          id: true,
          name: true,
          role: true,
          profilePhoto: true
        },
      },
      votes: {
        select: {
          id: true,
          type: true,
          userId: true,
        },
      },
      comments: {
        where: {
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
      },
    },
  });

  if (!review) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Review not found");
  }

  // Check if this is a premium review and if user has paid for it

  // If premium review and user hasn't paid, truncate description
  let reviewDescription = review.description;

  // Count upvotes and downvotes
  const upvotes = review.votes.filter(
    (vote) => vote.type === VoteType.UPVOTE,
  ).length;
  const downvotes = review.votes.filter(
    (vote) => vote.type === VoteType.DOWNVOTE,
  ).length;

  // Format comments
  const formattedComments = review.comments.map((comment) => ({
    id: comment.id,
    content: comment.content,
    reviewId: comment.reviewId,
    author: comment.user.name,
    authorId: comment.user.id,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    replyCount: comment._count.replies,
    replies: comment.replies.map((reply) => ({
      id: reply.id,
      content: reply.content,
      author: reply.user.name,
      authorId: reply.user.id,
      createdAt: reply.createdAt,
      updatedAt: reply.updatedAt,
    })),
  }));

  // Check if user has voted on this review
  let userVote = null;
  if (userId) {
    const vote = review.votes.find((vote) => vote.userId === userId);
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
    authorImage: review.user.profilePhoto,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    votes: {
      upvotes,
      downvotes,
      userVote,
    },
    comments: formattedComments,
  };
};

/**
 * Update a review
 */
const updateReview = async (
  id: string,
  userId: string,
  updateData: any,
  files?: IFile[],
) => {
  // Find the review
  const review = await prisma.review.findUnique({
    where: {
      id,
    },
  });

  if (!review) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Review not found");
  }

  // Check if user owns the review or is an admin
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (review.userId !== userId && user?.role !== UserRole.ADMIN) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "You are not authorized to update this review",
    );
  }

  // Prepare update data
  const {
    title,
    description,
    rating,
    purchaseSource,
    categoryId,
    isPremium,
    premiumPrice,
  } = updateData;

  const updatedData: any = {};

  if (title !== undefined) updatedData.title = title;
  if (description !== undefined) updatedData.description = description;
  if (rating !== undefined) updatedData.rating = Number(rating);
  if (purchaseSource !== undefined) updatedData.purchaseSource = purchaseSource;
  if (categoryId !== undefined) updatedData.categoryId = categoryId;

  // Admin can update premium status and price
  if (user?.role === UserRole.ADMIN) {
    if (isPremium !== undefined) updatedData.isPremium = Boolean(isPremium);
    if (premiumPrice !== undefined)
      updatedData.premiumPrice = Number(premiumPrice);
  }

  // If admin updates, keep status. If user updates, set back to DRAFT for review
  if (
    user?.role !== UserRole.ADMIN &&
    review.status === ReviewStatus.PUBLISHED
  ) {
    updatedData.status = ReviewStatus.DRAFT;
  }

  // Upload new images if provided
  if (files && files.length > 0) {
    const uploadedImages = await fileUploader.uploadMultipleToCloudinary(files);
    const newImageUrls = uploadedImages.map((image) => image.secure_url);

    // Combine with existing images
    updatedData.images = [...review.images, ...newImageUrls];
  }

  // Update the review
  const updatedReview = await prisma.review.update({
    where: {
      id,
    },
    data: updatedData,
    include: {
      category: true,
      user: {
        select: {
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  return updatedReview;
};

/**
 * Delete a review
 */
const deleteReview = async (id: string, userId: string) => {
  // Find the review
  const review = await prisma.review.findUnique({
    where: {
      id,
    },
  });

  if (!review) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Review not found");
  }

  // Check if user owns the review or is an admin
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (review.userId !== userId && user?.role !== UserRole.ADMIN) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "You are not authorized to delete this review",
    );
  }

  // Delete associated comments
  await prisma.comment.deleteMany({
    where: {
      reviewId: id,
    },
  });

  // Delete associated votes
  await prisma.vote.deleteMany({
    where: {
      reviewId: id,
    },
  });

  // Delete the review
  await prisma.review.delete({
    where: {
      id,
    },
  });

  return {
    id,
    message: "Review deleted successfully",
  };
};

/**
 * Get featured reviews for homepage
 */
const getFeaturedReviews = async (limit: number = 6) => {
  // Get highest rated reviews
  const highestRated = await prisma.review.findMany({
    where: {
      status: ReviewStatus.PUBLISHED,
    },
    orderBy: {
      rating: "desc",
    },
    take: limit / 2,
    include: {
      category: true,
      user: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          votes: {
            where: {
              type: VoteType.UPVOTE,
            },
          },
        },
      },
    },
  });

  // Get most voted reviews
  const mostVoted = await prisma.review.findMany({
    where: {
      status: ReviewStatus.PUBLISHED,
    },
    orderBy: {
      votes: {
        _count: "desc",
      },
    },
    take: limit / 2,
    include: {
      category: true,
      user: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          votes: {
            where: {
              type: VoteType.UPVOTE,
            },
          },
        },
      },
    },
  });

  // Format reviews
  const formatReview = (review: any) => ({
    id: review.id,
    title: review.title,
    rating: review.rating,
    isPremium: review.isPremium,
    category: review.category.name,
    author: review.user.name,
    upvotes: review._count.votes,
    image: review.images.length > 0 ? review.images[0] : null,
    createdAt: review.createdAt,
  });

  return {
    highestRated: highestRated.map(formatReview),
    mostVoted: mostVoted.map(formatReview),
  };
};

/**
 * Get related reviews
 */
const getRelatedReviews = async (id: string, limit: number = 4) => {
  // Get the category of the current review
  const review = await prisma.review.findUnique({
    where: {
      id,
    },
    select: {
      categoryId: true,
    },
  });

  if (!review) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Review not found");
  }

  // Get related reviews in the same category
  const relatedReviews = await prisma.review.findMany({
    where: {
      categoryId: review.categoryId,
      id: {
        not: id,
      },
      status: ReviewStatus.PUBLISHED,
    },
    take: limit,
    include: {
      category: true,
      user: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          votes: {
            where: {
              type: VoteType.UPVOTE,
            },
          },
        },
      },
    },
  });

  // Format reviews
  return relatedReviews.map((review) => ({
    id: review.id,
    title: review.title,
    rating: review.rating,
    isPremium: review.isPremium,
    category: review.category.name,
    author: review.user.name,
    upvotes: review._count.votes,
    image: review.images.length > 0 ? review.images[0] : null,
    createdAt: review.createdAt,
  }));
};

/**
 * Get reviews by user
 */
const getUserReviews = async (
  userId: string,
  paginationOptions: IPaginationOptions,
) => {
  const { page = 1, limit = 10 } = paginationOptions;
  const skip = (page - 1) * limit;
  const take = Number(limit);

  // Get user's reviews
  const reviews = await prisma.review.findMany({
    where: {
      userId,
    },
    include: {
      category: true,
      _count: {
        select: {
          votes: {
            where: {
              type: VoteType.UPVOTE,
            },
          },
          comments: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take,
  });

  // Get total count
  const total = await prisma.review.count({
    where: {
      userId,
    },
  });

  // Format reviews
  const formattedReviews = reviews.map((review) => ({
    id: review.id,
    title: review.title,
    desciption: review.description,
    rating: review.rating,
    status: review.status,
    isPremium: review.isPremium,
    moderationNote: review.moderationNote,
    category: review.category.name,
    upvotes: review._count.votes,
    comments: review._count.comments,
    image: review.images.length > 0 ? review.images[0] : null,
    createdAt: review.createdAt,
  }));

  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
    },
    data: formattedReviews,
  };
};

/**
 * Remove image from review
 */
const removeImage = async (
  reviewId: string,
  userId: string,
  imageUrl: string,
) => {
  // Find the review
  const review = await prisma.review.findUnique({
    where: {
      id: reviewId,
    },
  });

  if (!review) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Review not found");
  }

  // Check if user owns the review or is an admin
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (review.userId !== userId && user?.role !== UserRole.ADMIN) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "You are not authorized to update this review",
    );
  }

  // Remove the image from the array
  const updatedImages = review.images.filter((img) => img !== imageUrl);

  // Update the review
  const updatedReview = await prisma.review.update({
    where: {
      id: reviewId,
    },
    data: {
      images: updatedImages,
    },
  });

  return updatedReview;
};

export const ReviewService = {
  createReview,
  getAllReviews,
  getReviewById,
  updateReview,
  deleteReview,
  getFeaturedReviews,
  getRelatedReviews,
  getUserReviews,
  removeImage,
};
