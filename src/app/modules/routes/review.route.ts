import express, { NextFunction, Request, Response } from "express";
import { ReviewController } from "../controllers/review.controller";
import { UserRole } from "@prisma/client";
import { reviewValidation } from "../validation/review.validation";
import auth from "../../../middleware/auth";
import validateRequest from "../../../middleware/validateRequest";

const router = express.Router();

// Public routes
// Get all published reviews
router.get("/", ReviewController.getAllReviews);

// Get featured reviews for homepage
router.get("/featured", ReviewController.getFeaturedReviews);

// Get a single review by ID
router.get("/:id", ReviewController.getReviewById);

// Get related reviews
router.get("/:id/related", ReviewController.getRelatedReviews);

// Get reviews by user
router.get("/user/:userId", ReviewController.getUserReviews);

// Protected routes - require authentication
// Create a new review
router.post(
  "/",
  auth(UserRole.ADMIN, UserRole.GUEST),
  validateRequest(reviewValidation.createReview),
  ReviewController.createReview,
);

// Update a review
router.patch(
  "/:id",
  auth(UserRole.ADMIN, UserRole.GUEST),
  validateRequest(reviewValidation.updateReview),

  ReviewController.updateReview,
);

// Delete a review
router.delete(
  "/:id",
  auth(UserRole.ADMIN, UserRole.GUEST),
  ReviewController.deleteReview,
);

// Remove image from review
router.post(
  "/:id/remove-image",
  auth(UserRole.ADMIN, UserRole.GUEST),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = reviewValidation.removeImage.parse(req.body);
      return next();
    } catch (error) {
      next(error);
    }
  },
  ReviewController.removeImage,
);

export const ReviewRoutes = router;
