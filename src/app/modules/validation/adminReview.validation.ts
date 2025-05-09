import { z } from "zod";
import { ReviewStatus } from "@prisma/client";

// Unified validation schema for managing reviews
const manageReview = z
  .object({
    status: z.nativeEnum(ReviewStatus, {
      required_error: "Status is required",
      invalid_type_error: "Status must be valid",
    }),
    moderationNote: z.string().optional(),
    isPremium: z.boolean().optional(),
    premiumPrice: z
      .number()
      .positive("Premium price must be greater than 0")
      .optional(),
  })
  .refine(
    (data) => {
      // If isPremium is true, premiumPrice must be provided and positive
      if (
        data.isPremium === true &&
        (!data.premiumPrice || data.premiumPrice <= 0)
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        "Premium price is required and must be greater than 0 for premium reviews",
      path: ["premiumPrice"],
    },
  );

export const adminReviewValidation = {
  manageReview,
};
