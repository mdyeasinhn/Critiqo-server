import express, { NextFunction, Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import auth from '../../../middleware/auth';
import { AdminReviewController } from '../controllers/adminReview.controller';

const router = express.Router();

// All routes are protected for admin access only
router.use(auth(UserRole.ADMIN));

// Get all reviews with filtering
router.get(
    '/reviews',
    AdminReviewController.getAllReviews
);

// Get review statistics
router.get(
    '/reviews/stats',
    AdminReviewController.getReviewStats
);

// Publish a review
router.patch(
    '/reviews/:id/publish',
    (req: Request, res: Response, next: NextFunction) => {
        // Validation could be added here if needed
        return next();
    },
    AdminReviewController.publishReview
);

// Unpublish a review
router.patch(
    '/reviews/:id/unpublish',
    (req: Request, res: Response, next: NextFunction) => {
        // Validation could be added here if needed
        return next();
    },
    AdminReviewController.unpublishReview
);

export const AdminReviewRoutes = router;