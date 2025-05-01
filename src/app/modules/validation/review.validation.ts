import { z } from "zod";
import { ReviewStatus } from "@prisma/client";

const create = z.object({
    title: z.string({
        required_error: "Title is required"
    }).min(3, "Title must be at least 3 characters"),
    
    description: z.string({
        required_error: "Description is required"
    }).min(10, "Description must be at least 10 characters"),
    
    rating: z.number({
        required_error: "Rating is required"
    }).min(1, "Rating must be at least 1").max(5, "Rating cannot be more than 5"),
    
    purchaseSource: z.string().optional(),
    
    categoryId: z.string({
        required_error: "Category is required"
    }),
    
    isPremium: z.boolean().optional().default(false),
    
    premiumPrice: z.number().optional().refine(val => {
        // Only validate if provided
        if (val !== undefined) {
            return val > 0;
        }
        return true;
    }, {
        message: "Premium price must be greater than 0"
    })
}).refine(data => {
    // If isPremium is true, premiumPrice must be provided
    if (data.isPremium && !data.premiumPrice) {
        return false;
    }
    return true;
}, {
    message: "Premium price is required when setting a review as premium",
    path: ["premiumPrice"]
});

const update = z.object({
    title: z.string().min(3, "Title must be at least 3 characters").optional(),
    description: z.string().min(10, "Description must be at least 10 characters").optional(),
    rating: z.number().min(1, "Rating must be at least 1").max(5, "Rating cannot be more than 5").optional(),
    purchaseSource: z.string().optional(),
    categoryId: z.string().optional(),
    isPremium: z.boolean().optional(),
    premiumPrice: z.number().optional().refine(val => {
        // Only validate if provided
        if (val !== undefined) {
            return val > 0;
        }
        return true;
    }, {
        message: "Premium price must be greater than 0"
    })
});

const updateStatus = z.object({
    status: z.enum([ReviewStatus.DRAFT, ReviewStatus.PUBLISHED, ReviewStatus.UNPUBLISHED], {
        required_error: "Status is required"
    }),
    moderationNote: z.string().optional()
}).refine(data => {
    // If status is UNPUBLISHED, moderationNote should be provided
    if (data.status === ReviewStatus.UNPUBLISHED && !data.moderationNote) {
        return false;
    }
    return true;
}, {
    message: "Moderation note is required when unpublishing a review",
    path: ["moderationNote"]
});

const removeImage = z.object({
    imageUrl: z.string({
        required_error: "Image URL is required"
    })
});

export const reviewValidation = {
    create,
    update,
    updateStatus,
    removeImage
};