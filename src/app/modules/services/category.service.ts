import prisma from "../models";
import { IPaginationOptions } from "../../interface/file";
import { ReviewStatus } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../error/ApiError";

/**
 * Create a new category
 */
const createCategory = async (name: string) => {
  // Check if category already exists
  const existingCategory = await prisma.category.findFirst({
    where: {
      name: {
        equals: name,
        mode: "insensitive",
      },
    },
  });

  if (existingCategory) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      "Category with this name already exists",
    );
  }

  // Create new category
  const category = await prisma.category.create({
    data: {
      name,
    },
  });

  return category;
};

/**
 * Get all categories with optional pagination and stats
 */
const getAllCategories = async (
  paginationOptions: IPaginationOptions,
  includeStats: boolean = false,
) => {
  const {
    page = 1,
    limit = 20,
    sortBy = "name",
    sortOrder = "asc",
  } = paginationOptions;

  const skip = (page - 1) * limit;
  const take = Number(limit);

  // Get categories
  const categories = await prisma.category.findMany({
    orderBy: {
      [sortBy]: sortOrder,
    },
    skip: paginationOptions.page ? skip : undefined,
    take: paginationOptions.limit ? take : undefined,
  });

  let formattedCategories = categories;

  // If stats are requested, include review counts
  if (includeStats) {
    // Get review counts for each category
    const categoryStats = await Promise.all(
      categories.map(async (category) => {
        const totalReviews = await prisma.review.count({
          where: {
            categoryId: category.id,
          },
        });

        const publishedReviews = await prisma.review.count({
          where: {
            categoryId: category.id,
            status: ReviewStatus.PUBLISHED,
          },
        });

        const premiumReviews = await prisma.review.count({
          where: {
            categoryId: category.id,
            isPremium: true,
            status: ReviewStatus.PUBLISHED,
          },
        });

        return {
          ...category,
          stats: {
            totalReviews,
            publishedReviews,
            premiumReviews,
          },
        };
      }),
    );

    formattedCategories = categoryStats;
  }

  // Get total count
  const total = await prisma.category.count();

  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
    },
    data: formattedCategories,
  };
};

/**
 * Get a single category by ID with stats
 */
const getCategoryById = async (id: string) => {
  // Get category
  const category = await prisma.category.findUnique({
    where: {
      id,
    },
  });

  if (!category) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Category not found");
  }

  // Get stats
  const totalReviews = await prisma.review.count({
    where: {
      categoryId: id,
    },
  });

  const publishedReviews = await prisma.review.count({
    where: {
      categoryId: id,
      status: ReviewStatus.PUBLISHED,
    },
  });

  const premiumReviews = await prisma.review.count({
    where: {
      categoryId: id,
      isPremium: true,
      status: ReviewStatus.PUBLISHED,
    },
  });

  // Get recent reviews in this category
  const recentReviews = await prisma.review.findMany({
    where: {
      categoryId: id,
      status: ReviewStatus.PUBLISHED,
    },
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
      _count: {
        select: {
          votes: true,
        },
      },
    },
  });

  const formattedReviews = recentReviews.map((review) => ({
    id: review.id,
    title: review.title,
    rating: review.rating,
    isPremium: review.isPremium,
    author: review.user.name,
    votes: review._count.votes,
    createdAt: review.createdAt,
  }));

  return {
    ...category,
    stats: {
      totalReviews,
      publishedReviews,
      premiumReviews,
    },
    recentReviews: formattedReviews,
  };
};

/**
 * Update a category
 */
const updateCategory = async (id: string, name: string) => {
  // Check if category exists
  const category = await prisma.category.findUnique({
    where: {
      id,
    },
  });

  if (!category) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Category not found");
  }

  // Check if name is already taken by another category
  const existingCategory = await prisma.category.findFirst({
    where: {
      name: {
        equals: name,
        mode: "insensitive",
      },
      id: {
        not: id,
      },
    },
  });

  if (existingCategory) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      "Category with this name already exists",
    );
  }

  // Update category
  const updatedCategory = await prisma.category.update({
    where: {
      id,
    },
    data: {
      name,
    },
  });

  return updatedCategory;
};

/**
 * Delete a category
 */
const deleteCategory = async (id: string) => {
  // Check if category exists
  const category = await prisma.category.findUnique({
    where: {
      id,
    },
  });

  if (!category) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Category not found");
  }

  // Check if category has any reviews
  const reviewCount = await prisma.review.count({
    where: {
      categoryId: id,
    },
  });

  if (reviewCount > 0) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Cannot delete category with ${reviewCount} reviews. Reassign reviews first.`,
    );
  }

  // Delete category
  await prisma.category.delete({
    where: {
      id,
    },
  });

  return {
    id,
    message: "Category deleted successfully",
  };
};

export const CategoryService = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
