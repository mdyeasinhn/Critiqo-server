"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminValidation = void 0;
const zod_1 = require("zod");
// Validation schema for updating admin profile
const updateProfile = zod_1.z.object({
    name: zod_1.z.string().optional(),
    contactNumber: zod_1.z.string().optional()
});
// Validation schema for moderating a review
const moderateReview = zod_1.z.object({
    action: zod_1.z.enum(['publish', 'unpublish'], {
        required_error: "Action must be either 'publish' or 'unpublish'"
    }),
    moderationNote: zod_1.z.string().optional()
});
exports.adminValidation = {
    updateProfile,
    moderateReview
};
