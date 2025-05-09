import { z } from "zod";

// Validation schema for adding a vote
const addVote = z.object({
  reviewId: z.string({
    required_error: "Review ID is required",
  }),
  voteType: z.enum(["upvote", "downvote"], {
    required_error: "Vote type must be either 'upvote' or 'downvote'",
  }),
});

export const voteValidation = {
  addVote,
};
