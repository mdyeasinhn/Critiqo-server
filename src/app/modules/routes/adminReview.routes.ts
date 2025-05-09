import express, { NextFunction, Request, Response } from "express";
import { UserRole } from "@prisma/client";
import auth from "../../../middleware/auth";
import { AdminReviewController } from "../controllers/adminReview.controller";

const router = express.Router();

// All routes are protected for admin access only
router.use(auth(UserRole.ADMIN));

// Get all reviews with filtering
router.get("/reviews", AdminReviewController.getAllReviews);

// Get review statistics
router.get("/reviews/stats", AdminReviewController.getReviewStats);

// Single unified route for managing review status (publish, unpublish, premium settings)
router.patch("/reviews/:id", AdminReviewController.updateReview);

export const AdminReviewRoutes = router;
