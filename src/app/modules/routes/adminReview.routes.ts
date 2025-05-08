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


router.patch(
    '/reviews/:id',
    (req: Request, res: Response, next: NextFunction) => {
        try {
            if (adminReviewValidation && adminReviewValidation.manageReview) {
                req.body = adminReviewValidation.manageReview.parse(req.body);
            }
            return next();
        } catch (error) {
            next(error);
        }
    },
    AdminReviewController.manageReview
);

export const AdminReviewRoutes = router;