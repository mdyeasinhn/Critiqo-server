"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentRoutes = void 0;
const express_1 = __importDefault(require("express"));
const comment_controller_1 = require("../controllers/comment.controller");
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../../middleware/auth"));
const comment_validation_1 = require("../validation/comment.validation");
const router = express_1.default.Router();
// Public routes
// Get comments for a review
router.get('/review/:reviewId', comment_controller_1.CommentController.getReviewComments);
// Get replies to a comment
router.get('/replies/:commentId', comment_controller_1.CommentController.getCommentReplies);
// Protected routes - require authentication
// Add a comment or reply
router.post('/', (0, auth_1.default)(client_1.UserRole.ADMIN, client_1.UserRole.USER, client_1.UserRole.GUEST), (req, res, next) => {
    try {
        req.body = comment_validation_1.commentValidation.addComment.parse(req.body);
        return next();
    }
    catch (error) {
        next(error);
    }
}, comment_controller_1.CommentController.addComment);
// Update a comment
router.patch('/:id', (0, auth_1.default)(client_1.UserRole.ADMIN, client_1.UserRole.USER, client_1.UserRole.GUEST), (req, res, next) => {
    try {
        req.body = comment_validation_1.commentValidation.updateComment.parse(req.body);
        return next();
    }
    catch (error) {
        next(error);
    }
}, comment_controller_1.CommentController.updateComment);
// Delete a comment
router.delete('/:id', (0, auth_1.default)(client_1.UserRole.ADMIN, client_1.UserRole.USER, client_1.UserRole.GUEST), comment_controller_1.CommentController.deleteComment);
exports.CommentRoutes = router;
