"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryValidation = void 0;
const zod_1 = require("zod");
// Validation schema for creating a category
const createCategory = zod_1.z.object({
    name: zod_1.z.string({
        required_error: "Category name is required"
    }).min(2, "Category name must be at least 2 characters long")
});
// Validation schema for updating a category
const updateCategory = zod_1.z.object({
    name: zod_1.z.string({
        required_error: "Category name is required"
    }).min(2, "Category name must be at least 2 characters long")
});
exports.categoryValidation = {
    createCategory,
    updateCategory
};
