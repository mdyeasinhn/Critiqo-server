import express, { NextFunction, Request, Response } from "express";
import { CommentController } from "../controllers/comment.controller";
import { UserRole } from "@prisma/client";
import auth from "../../../middleware/auth";
import { commentValidation } from "../validation/comment.validation";

const router = express.Router();

// Public routes
// Get comments for a review
router.get("/review/:reviewId", CommentController.getReviewComments);

// Get replies to a comment
router.get("/replies/:commentId", CommentController.getCommentReplies);

// Protected routes - require authentication
// Add a comment or reply
router.post(
  "/",
  auth(UserRole.ADMIN, UserRole.USER, UserRole.GUEST),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = commentValidation.addComment.parse(req.body);
      return next();
    } catch (error) {
      next(error);
    }
  },
  CommentController.addComment,
);

// Update a comment
router.patch(
  "/:id",
  auth(UserRole.ADMIN, UserRole.USER, UserRole.GUEST),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = commentValidation.updateComment.parse(req.body);
      return next();
    } catch (error) {
      next(error);
    }
  },
  CommentController.updateComment,
);

// Delete a comment
router.delete(
  "/:id",
  auth(UserRole.ADMIN, UserRole.USER, UserRole.GUEST),
  CommentController.deleteComment,
);

export const CommentRoutes = router;
