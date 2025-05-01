import { Category, Prisma } from "@prisma/client"; 
import prisma from "../models";
import { StatusCodes } from "http-status-codes";
import { IPaginationOptions } from "../../interface/file";
import ApiError from "../../error/ApiError";

const createCategory = async (data: { name: string }): Promise<Category> => {
    // Check if category with the same name already exists
    const existingCategory = await prisma.category.findUnique({
        where: {
            name: data.name
        }
    });

    if (existingCategory) {
        throw new ApiError(StatusCodes.CONFLICT, 'Category with this name already exists');
    }

    // Create new category
    const result = await prisma.category.create({
        data
    });

    return result;
};

const getAllCategories = async (filters: { searchTerm?: string }, paginationOptions: IPaginationOptions) => {
    const { searchTerm } = filters;
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = paginationOptions;

    const skip = (page - 1) * limit;
    const take = limit;

    // Create search condition when search term is provided
    const whereCondition = searchTerm ? {
        name: {
            contains: searchTerm,
            mode: Prisma.QueryMode.insensitive  
        }
    } : {};

    // Get categories with pagination
    const categories = await prisma.category.findMany({
        where: whereCondition,
        skip,
        take,
        orderBy: {
            [sortBy]: sortOrder
        }
    });

    // Count total categories that match the filter criteria
    const total = await prisma.category.count({
        where: whereCondition
    });

    return {
        meta: {
            page,
            limit,
            total
        },
        data: categories
    };
};

const getCategoryById = async (id: string): Promise<Category> => {
    const category = await prisma.category.findUnique({
        where: {
            id
        }
    });

    if (!category) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Category not found');
    }

    return category;
};

const updateCategory = async (id: string, data: { name: string }): Promise<Category> => {
    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
        where: {
            id
        }
    });

    if (!existingCategory) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Category not found');
    }

    // Check if name is being changed and if new name already exists
    if (data.name !== existingCategory.name) {
        const categoryWithSameName = await prisma.category.findUnique({
            where: {
                name: data.name
            }
        });

        if (categoryWithSameName) {
            throw new ApiError(StatusCodes.CONFLICT, 'Category with this name already exists');
        }
    }

    // Update category
    const updatedCategory = await prisma.category.update({
        where: {
            id
        },
        data
    });

    return updatedCategory;
};

const deleteCategory = async (id: string): Promise<Category> => {
    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
        where: {
            id
        },
        include: {
            reviews: true,
            posts: true
        }
    });

    if (!existingCategory) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Category not found');
    }

    // Check if category has associated reviews or posts
    if (existingCategory.reviews.length > 0 || existingCategory.posts.length > 0) {
        throw new ApiError(
            StatusCodes.BAD_REQUEST,
            'Cannot delete category that has associated reviews or posts'
        );
    }

    // Delete category
    const deletedCategory = await prisma.category.delete({
        where: {
            id
        }
    });

    return deletedCategory;
};

export const CategoryService = {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
};