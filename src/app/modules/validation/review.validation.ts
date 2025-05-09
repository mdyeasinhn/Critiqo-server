import { z } from "zod";

// Validation schema for creating a review
const createReview = z.object({
  title: z.string({
    required_error: "Title is required",
  }),
  description: z.string({
    required_error: "Description is required",
  }),
  rating: z
    .number({
      required_error: "Rating is required",
    })
    .min(1)
    .max(5),
  categoryId: z.string({
    required_error: "Category ID is required",
  }),
  purchaseSource: z.string().optional(),
  isPremium: z.boolean().optional().default(false),
  premiumPrice: z.number().optional(),
});

// Validation schema for updating a review
const updateReview = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  categoryId: z.string().optional(),
  purchaseSource: z.string().optional(),
  isPremium: z.boolean().optional(),
  premiumPrice: z.number().optional(),
});

// Validation schema for removing an image
const removeImage = z.object({
  imageUrl: z.string({
    required_error: "Image URL is required",
  }),
});

export const reviewValidation = {
  createReview,
  updateReview,
  removeImage,
};
