import express, { NextFunction, Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import auth from '../../../middleware/auth';
import { AdminReviewController } from '../controllers/adminReview.controller';
import { adminReviewValidation } from '../validation/adminReview.validation';

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

// Publish a review (with optional premium settings)
router.patch(
    '/reviews/:id/publish',
    (req: Request, res: Response, next: NextFunction) => {
        try {
            if (adminReviewValidation && adminReviewValidation.publishReview) {
                req.body = adminReviewValidation.publishReview.parse(req.body);
            }
            return next();
        } catch (error) {
            next(error);
        }
    },
    AdminReviewController.publishReview
);

// Unpublish a review
router.patch(
    '/reviews/:id/unpublish',
    (req: Request, res: Response, next: NextFunction) => {
        try {
            if (adminReviewValidation && adminReviewValidation.unpublishReview) {
                req.body = adminReviewValidation.unpublishReview.parse(req.body);
            }
            return next();
        } catch (error) {
            next(error);
        }
    },
    AdminReviewController.unpublishReview
);

export const AdminReviewRoutes = router;