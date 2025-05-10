import prisma from "../models";
import {
  IFile,
  IPaginationOptions,
  IGenericResponse,
} from "../../interface/file";
import {
  ReviewStatus,
  UserRole,
  UserStatus,
  VoteType,
  PaymentStatus,
} from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { fileUploader } from "../../helpers/fileUploader";
import ApiError from "../../error/ApiError";

/**
 * Fetch comprehensive dashboard statistics for admin
 * @returns Dashboard statistics including users, reviews, payments, etc.
 */
const getDashboardStats = async () => {
  // Get total users count by role
  const userCounts = await prisma.user.groupBy({
    by: ["role"],
    _count: {
      id: true,
    },
  });

  // Get total reviews count by status
  const reviewCounts = await prisma.review.groupBy({
    by: ["status"],
    _count: {
      id: true,
    },
  });

  // Get total categories count
  const categoryCount = await prisma.category.count();

  // Get total premium reviews
  const premiumReviewCount = await prisma.review.count({
    where: {
      isPremium: true,
    },
  });

  // Get total completed payments and revenue
  const totalPayments = await prisma.payment.aggregate({
    _sum: {
      amount: true,
    },
    _count: {
      id: true,
    },
    where: {
      status: PaymentStatus.COMPLETEED, // Note: Typo in the enum
    },
  });

  // Get recent reviews (last 5)
  const recentReviews = await prisma.review.findMany({
    take: 5,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          name: true,
        },
      },
      category: true,
    },
  });

  // Get most popular reviews (highest vote count)
  const popularReviews = await prisma.review.findMany({
    take: 5,
    where: {
      status: ReviewStatus.PUBLISHED,
    },
    include: {
      user: {
        select: {
          name: true,
        },
      },
      category: true,
      _count: {
        select: {
          votes: true,
        },
      },
    },
    orderBy: {
      votes: {
        _count: "desc",
      },
    },
  });

  // Format user counts
  const formattedUserCounts = {
    admin: 0,
    user: 0,
    guest: 0,
  };

  userCounts.forEach((count) => {
    const role = count.role.toLowerCase();
    if (role === "admin") formattedUserCounts.admin = count._count.id;
    if (role === "user") formattedUserCounts.user = count._count.id;
    if (role === "guest") formattedUserCounts.guest = count._count.id;
  });

  // Format review counts
  const formattedReviewCounts = {
    draft: 0,
    published: 0,
    unpublished: 0,
  };

  reviewCounts.forEach((count) => {
    const status = count.status.toLowerCase();
    if (status === "draft") formattedReviewCounts.draft = count._count.id;
    if (status === "published")
      formattedReviewCounts.published = count._count.id;
    if (status === "unpublished")
      formattedReviewCounts.unpublished = count._count.id;
  });

  // Get votes statistics
  const voteStats = await prisma.vote.groupBy({
    by: ["type"],
    _count: {
      id: true,
    },
  });

  const formattedVoteStats = {
    upvotes: 0,
    downvotes: 0,
  };

  voteStats.forEach((stat) => {
    if (stat.type === VoteType.UPVOTE)
      formattedVoteStats.upvotes = stat._count.id;
    if (stat.type === VoteType.DOWNVOTE)
      formattedVoteStats.downvotes = stat._count.id;
  });

  return {
    users: formattedUserCounts,
    reviews: formattedReviewCounts,
    categories: categoryCount,
    premiumReviews: premiumReviewCount,
    payments: {
      count: totalPayments._count.id || 0,
      revenue: totalPayments._sum.amount || 0,
    },
    votes: formattedVoteStats,
    recentReviews: recentReviews.map((review) => ({
      id: review.id,
      title: review.title,
      author: review.user.name,
      category: review.category.name,
      status: review.status,
      createdAt: review.createdAt,
    })),
    popularReviews: popularReviews.map((review) => ({
      id: review.id,
      title: review.title,
      author: review.user.name,
      category: review.category.name,
      voteCount: review._count.votes,
      createdAt: review.createdAt,
    })),
  };
};

/**
 * Get pending reviews for admin moderation
 * @param paginationOptions Pagination parameters
 * @returns Paginated list of pending reviews
 */
const getPendingReviews = async (
  paginationOptions: IPaginationOptions,
): Promise<IGenericResponse<any>> => {
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = paginationOptions;

  const skip = (page - 1) * limit;
  const take = Number(limit);

  // Get reviews with DRAFT status
  const reviews = await prisma.review.findMany({
    where: {
      status: ReviewStatus.DRAFT,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      category: true,
    },
    orderBy: {
      [sortBy]: sortOrder,
    },
    skip,
    take,
  });

  const total = await prisma.review.count({
    where: {
      status: ReviewStatus.DRAFT,
    },
  });

  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
    },
    data: reviews,
  };
};

/**
 * Moderate a review (approve, unpublish)
 * @param reviewId Review ID
 * @param action Moderation action (publish/unpublish)
 * @param moderationNote Optional note explaining the moderation decision
 * @returns Updated review
 */
const moderateReview = async (
  reviewId: string,
  action: "publish" | "unpublish",
  moderationNote?: string,
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

  // Update review status based on action
  const newStatus =
    action === "publish" ? ReviewStatus.PUBLISHED : ReviewStatus.UNPUBLISHED;

  const updatedReview = await prisma.review.update({
    where: {
      id: reviewId,
    },
    data: {
      status: newStatus,
      moderationNote: moderationNote || null,
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      category: true,
    },
  });

  return updatedReview;
};

/**
 * Get admin profile
 * @param userId Admin user ID
 * @returns Admin profile data
 */
const getAdminProfile = async (userId: string) => {
  if (!userId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User ID is required");
  }

  // Get user with admin role
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
    include: {
      admin: true,
    },
  });

  if (!user || !user.admin) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Admin profile not found");
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    profilePhoto: user.admin.profilePhoto,
    contactNumber: user.admin.contactNumber,
    createdAt: user.createdAt,
  };
};

/**
 * Update admin profile
 * @param userId Admin user ID
 * @param updateData Profile update data
 * @param file Optional profile photo
 * @returns Updated admin profile
 */
const updateAdminProfile = async (
  userId: string,
  updateData: {
    name?: string;
    contactNumber?: string;
  },
  file?: Express.Multer.File,
) => {
  if (!userId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User ID is required");
  }

  // Get user with admin role
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
    include: {
      admin: true,
    },
  });

  if (!user || !user.admin) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Admin profile not found");
  }

  let profilePhotoUrl: string | undefined;

  // Upload profile photo if provided
  if (file) {
    const uploadToCloudinary = await fileUploader.uploadToCloudinary(
      file as unknown as IFile,
    );
    profilePhotoUrl = uploadToCloudinary?.secure_url;
  }

  // Update admin profile
  const updatedAdmin = await prisma.$transaction(async (transactionClient) => {
    // Update user name if provided
    if (updateData.name) {
      await transactionClient.user.update({
        where: {
          id: userId,
        },
        data: {
          name: updateData.name,
        },
      });
    }

    // Update admin profile
    const adminUpdateData: any = {};

    if (updateData.name) {
      adminUpdateData.name = updateData.name;
    }

    if (updateData.contactNumber) {
      adminUpdateData.contactNumber = updateData.contactNumber;
    }

    if (profilePhotoUrl) {
      adminUpdateData.profilePhoto = profilePhotoUrl;
    }

    const updatedAdminProfile = await transactionClient.admin.update({
      where: {
        email: user.email,
      },
      data: adminUpdateData,
    });

    return updatedAdminProfile;
  });

  return {
    id: user.id,
    name: updateData.name || user.name,
    email: user.email,
    role: user.role,
    profilePhoto: profilePhotoUrl || user.admin.profilePhoto,
    contactNumber: updateData.contactNumber || user.admin.contactNumber,
    createdAt: user.createdAt,
  };
};

/**
 * Remove inappropriate comments
 * @param commentId Comment ID to remove
 * @returns Removed comment
 */
const removeInappropriateComment = async (commentId: string) => {
  const comment = await prisma.comment.findUnique({
    where: {
      id: commentId,
    },
    include: {
      user: {
        select: {
          name: true,
        },
      },
      review: {
        select: {
          title: true,
        },
      },
    },
  });

  if (!comment) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Comment not found");
  }

  // Delete the comment
  await prisma.comment.delete({
    where: {
      id: commentId,
    },
  });

  return {
    id: comment.id,
    content: comment.content,
    user: comment.user.name,
    review: comment.review.title,
    deletedAt: new Date(),
  };
};

export const AdminService = {
  getDashboardStats,
  getPendingReviews,
  moderateReview,
  getAdminProfile,
  updateAdminProfile,
  removeInappropriateComment,
};
