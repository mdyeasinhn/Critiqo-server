import { z } from "zod";

// Validation schema for creating a category
const createCategory = z.object({
  name: z
    .string({
      required_error: "Category name is required",
    })
    .min(2, "Category name must be at least 2 characters long"),
});

// Validation schema for updating a category
const updateCategory = z.object({
  name: z
    .string({
      required_error: "Category name is required",
    })
    .min(2, "Category name must be at least 2 characters long"),
});

export const categoryValidation = {
  createCategory,
  updateCategory,
};
