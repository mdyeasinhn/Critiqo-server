import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { CategoryService } from "../services/category.service";
import sendResponse from "../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import pick from "../../shared/pick";
import { paginationFields } from "../../../constants/pagination";

const createCategory = catchAsync(async (req: Request, res: Response) => {
    const result = await CategoryService.createCategory(req.body);

    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: "Category created successfully!",
        data: result
    });
});

const getAllCategories = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, ['searchTerm']);
    const paginationOptions = pick(req.query, paginationFields);

    const result = await CategoryService.getAllCategories(filters, paginationOptions);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Categories retrieved successfully!",
        meta: result.meta,
        data: result.data
    });
});

const getCategoryById = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const result = await CategoryService.getCategoryById(id);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Category retrieved successfully!",
        data: result
    });
});

const updateCategory = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const result = await CategoryService.updateCategory(id, req.body);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Category updated successfully!",
        data: result
    });
});

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const result = await CategoryService.deleteCategory(id);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Category deleted successfully!",
        data: result
    });
});

export const CategoryController = {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
};