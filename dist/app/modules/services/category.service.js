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
exports.CategoryService = void 0;
const models_1 = __importDefault(require("../models"));
const client_1 = require("@prisma/client");
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../error/ApiError"));
/**
 * Create a new category
 */
const createCategory = (name) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if category already exists
    const existingCategory = yield models_1.default.category.findFirst({
        where: {
            name: {
                equals: name,
                mode: 'insensitive'
            }
        }
    });
    if (existingCategory) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.CONFLICT, 'Category with this name already exists');
    }
    // Create new category
    const category = yield models_1.default.category.create({
        data: {
            name
        }
    });
    return category;
});
/**
 * Get all categories with optional pagination and stats
 */
const getAllCategories = (paginationOptions_1, ...args_1) => __awaiter(void 0, [paginationOptions_1, ...args_1], void 0, function* (paginationOptions, includeStats = false) {
    const { page = 1, limit = 20, sortBy = 'name', sortOrder = 'asc' } = paginationOptions;
    const skip = (page - 1) * limit;
    const take = Number(limit);
    // Get categories
    const categories = yield models_1.default.category.findMany({
        orderBy: {
            [sortBy]: sortOrder
        },
        skip: paginationOptions.page ? skip : undefined,
        take: paginationOptions.limit ? take : undefined
    });
    let formattedCategories = categories;
    // If stats are requested, include review counts
    if (includeStats) {
        // Get review counts for each category
        const categoryStats = yield Promise.all(categories.map((category) => __awaiter(void 0, void 0, void 0, function* () {
            const totalReviews = yield models_1.default.review.count({
                where: {
                    categoryId: category.id
                }
            });
            const publishedReviews = yield models_1.default.review.count({
                where: {
                    categoryId: category.id,
                    status: client_1.ReviewStatus.PUBLISHED
                }
            });
            const premiumReviews = yield models_1.default.review.count({
                where: {
                    categoryId: category.id,
                    isPremium: true,
                    status: client_1.ReviewStatus.PUBLISHED
                }
            });
            return Object.assign(Object.assign({}, category), { stats: {
                    totalReviews,
                    publishedReviews,
                    premiumReviews
                } });
        })));
        formattedCategories = categoryStats;
    }
    // Get total count
    const total = yield models_1.default.category.count();
    return {
        meta: {
            page: Number(page),
            limit: Number(limit),
            total
        },
        data: formattedCategories
    };
});
/**
 * Get a single category by ID with stats
 */
const getCategoryById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    // Get category
    const category = yield models_1.default.category.findUnique({
        where: {
            id
        }
    });
    if (!category) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Category not found');
    }
    // Get stats
    const totalReviews = yield models_1.default.review.count({
        where: {
            categoryId: id
        }
    });
    const publishedReviews = yield models_1.default.review.count({
        where: {
            categoryId: id,
            status: client_1.ReviewStatus.PUBLISHED
        }
    });
    const premiumReviews = yield models_1.default.review.count({
        where: {
            categoryId: id,
            isPremium: true,
            status: client_1.ReviewStatus.PUBLISHED
        }
    });
    // Get recent reviews in this category
    const recentReviews = yield models_1.default.review.findMany({
        where: {
            categoryId: id,
            status: client_1.ReviewStatus.PUBLISHED
        },
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
            _count: {
                select: {
                    votes: true
                }
            }
        }
    });
    const formattedReviews = recentReviews.map(review => ({
        id: review.id,
        title: review.title,
        rating: review.rating,
        isPremium: review.isPremium,
        author: review.user.name,
        votes: review._count.votes,
        createdAt: review.createdAt
    }));
    return Object.assign(Object.assign({}, category), { stats: {
            totalReviews,
            publishedReviews,
            premiumReviews
        }, recentReviews: formattedReviews });
});
/**
 * Update a category
 */
const updateCategory = (id, name) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if category exists
    const category = yield models_1.default.category.findUnique({
        where: {
            id
        }
    });
    if (!category) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Category not found');
    }
    // Check if name is already taken by another category
    const existingCategory = yield models_1.default.category.findFirst({
        where: {
            name: {
                equals: name,
                mode: 'insensitive'
            },
            id: {
                not: id
            }
        }
    });
    if (existingCategory) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.CONFLICT, 'Category with this name already exists');
    }
    // Update category
    const updatedCategory = yield models_1.default.category.update({
        where: {
            id
        },
        data: {
            name
        }
    });
    return updatedCategory;
});
/**
 * Delete a category
 */
const deleteCategory = (id) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if category exists
    const category = yield models_1.default.category.findUnique({
        where: {
            id
        }
    });
    if (!category) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Category not found');
    }
    // Check if category has any reviews
    const reviewCount = yield models_1.default.review.count({
        where: {
            categoryId: id
        }
    });
    if (reviewCount > 0) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `Cannot delete category with ${reviewCount} reviews. Reassign reviews first.`);
    }
    // Delete category
    yield models_1.default.category.delete({
        where: {
            id
        }
    });
    return {
        id,
        message: 'Category deleted successfully'
    };
});
exports.CategoryService = {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
};
