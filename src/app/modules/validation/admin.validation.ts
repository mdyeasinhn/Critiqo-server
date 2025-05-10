import { z } from "zod";

// Validation schema for updating admin profile
const updateProfile = z.object({
  name: z.string().optional(),
  contactNumber: z.string().optional(),
});

// Validation schema for moderating a review
const moderateReview = z.object({
  action: z.enum(["publish", "unpublish"], {
    required_error: "Action must be either 'publish' or 'unpublish'",
  }),
  moderationNote: z.string().optional(),
});

export const adminValidation = {
  updateProfile,
  moderateReview,
};
