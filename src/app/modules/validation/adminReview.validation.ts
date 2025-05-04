import { z } from "zod";

// Validation schema for publishing a review
const publishReview = z.object({
    moderationNote: z.string().optional(),
    isPremium: z.boolean().optional(),
    premiumPrice: z.number().positive("Premium price must be greater than 0").optional()
}).refine(
    (data) => {
        // If isPremium is true, premiumPrice must be provided and positive
        if (data.isPremium === true && (!data.premiumPrice || data.premiumPrice <= 0)) {
            return false;
        }
        return true;
    },
    {
        message: "Premium price is required and must be greater than 0 for premium reviews",
        path: ["premiumPrice"]
    }
);

// Validation schema for unpublishing a review
const unpublishReview = z.object({
    moderationNote: z.string().optional()
});

export const adminReviewValidation = {
    publishReview,
    unpublishReview
};