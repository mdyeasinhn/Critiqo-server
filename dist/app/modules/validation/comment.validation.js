"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentValidation = void 0;
const zod_1 = require("zod");
// Validation schema for adding a comment
const addComment = zod_1.z.object({
    reviewId: zod_1.z.string({
        required_error: "Review ID is required"
    }),
    content: zod_1.z.string({
        required_error: "Comment content is required"
    }).min(1, "Comment cannot be empty"),
    parentId: zod_1.z.string().optional() // Optional for replies
});
// Validation schema for updating a comment
const updateComment = zod_1.z.object({
    content: zod_1.z.string({
        required_error: "Comment content is required"
    }).min(1, "Comment cannot be empty")
});
exports.commentValidation = {
    addComment,
    updateComment
};
