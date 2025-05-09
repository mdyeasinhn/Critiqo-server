import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { CategoryService } from "../services/category.service";
import sendResponse from "../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import pick from "../../shared/pick";
import { paginationFields } from "../../../constants/pagination";

/**
 * Create a new category
 */
const createCategory = catchAsync(async (req: Request, res: Response) => {
  const { name } = req.body;

  const result = await CategoryService.createCategory(name);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Category created successfully!",
    data: result,
  });
});

/**
 * Get all categories
 */
const getAllCategories = catchAsync(async (req: Request, res: Response) => {
  const paginationOptions = pick(req.query, paginationFields);
  const includeStats = req.query.stats === "true";

  const result = await CategoryService.getAllCategories(
    paginationOptions,
    includeStats,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Categories retrieved successfully!",
    meta: result.meta,
    data: result.data,
  });
});

/**
 * Get a single category by ID
 */
const getCategoryById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await CategoryService.getCategoryById(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Category retrieved successfully!",
    data: result,
  });
});

/**
 * Update a category
 */
const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;

  const result = await CategoryService.updateCategory(id, name);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Category updated successfully!",
    data: result,
  });
});

/**
 * Delete a category
 */
const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await CategoryService.deleteCategory(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

export const CategoryController = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
