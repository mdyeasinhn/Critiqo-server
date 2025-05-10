import { z } from "zod";

// Validation schema for adding a comment
const addComment = z.object({
  reviewId: z.string({
    required_error: "Review ID is required",
  }),
  content: z
    .string({
      required_error: "Comment content is required",
    })
    .min(1, "Comment cannot be empty"),
  parentId: z.string().optional(), // Optional for replies
});

// Validation schema for updating a comment
const updateComment = z.object({
  content: z
    .string({
      required_error: "Comment content is required",
    })
    .min(1, "Comment cannot be empty"),
});

export const commentValidation = {
  addComment,
  updateComment,
};
