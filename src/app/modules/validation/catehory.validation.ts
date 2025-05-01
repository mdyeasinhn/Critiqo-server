import { z } from "zod";

const create = z.object({
    name: z.string({
        required_error: "Category name is required"
    }).min(2, "Category name must be at least 2 characters")
});

const update = z.object({
    name: z.string({
        required_error: "Category name is required"
    }).min(2, "Category name must be at least 2 characters")
});

export const categoryValidation = {
    create,
    update
};