"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.voteValidation = void 0;
const zod_1 = require("zod");
// Validation schema for adding a vote
const addVote = zod_1.z.object({
    reviewId: zod_1.z.string({
        required_error: "Review ID is required"
    }),
    voteType: zod_1.z.enum(['upvote', 'downvote'], {
        required_error: "Vote type must be either 'upvote' or 'downvote'"
    })
});
exports.voteValidation = {
    addVote
};
