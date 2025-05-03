"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewValidation = void 0;
const zod_1 = require("zod");
// Validation schema for creating a review
const createReview = zod_1.z.object({
    title: zod_1.z.string({
        required_error: "Title is required"
    }),
    description: zod_1.z.string({
        required_error: "Description is required"
    }),
    rating: zod_1.z.number({
        required_error: "Rating is required"
    }).min(1).max(5),
    categoryId: zod_1.z.string({
        required_error: "Category ID is required"
    }),
    purchaseSource: zod_1.z.string().optional(),
    isPremium: zod_1.z.boolean().optional().default(false),
    premiumPrice: zod_1.z.number().optional()
});
// Validation schema for updating a review
const updateReview = zod_1.z.object({
    title: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    rating: zod_1.z.number().min(1).max(5).optional(),
    categoryId: zod_1.z.string().optional(),
    purchaseSource: zod_1.z.string().optional(),
    isPremium: zod_1.z.boolean().optional(),
    premiumPrice: zod_1.z.number().optional()
});
// Validation schema for removing an image
const removeImage = zod_1.z.object({
    imageUrl: zod_1.z.string({
        required_error: "Image URL is required"
    })
});
exports.reviewValidation = {
    createReview,
    updateReview,
    removeImage
};
