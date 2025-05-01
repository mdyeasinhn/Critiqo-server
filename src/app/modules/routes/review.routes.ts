import express, { NextFunction, Request, Response } from 'express';
import { ReviewController } from '../controllers/review.controller';
import { UserRole } from '@prisma/client';
import { reviewValidation } from '../validation/review.validation';
import { fileUploader } from '../../helpers/fileUploader';
import auth from '../../../middleware/auth';

const router = express.Router();

// Create a new review (auth required)
router.post(
    "/",
    auth(UserRole.USER, UserRole.ADMIN),
    fileUploader.upload.array("images", 5), // Allow up to 5 images
    (req: Request, res: Response, next: NextFunction) => {
        // Parse JSON data if it comes from a form
        if (req.body.data) {
            const parsedData = JSON.parse(req.body.data);
            // Convert rating to number
            if (parsedData.rating) {
                parsedData.rating = Number(parsedData.rating);
            }
            // Convert isPremium to boolean
            if (parsedData.isPremium) {
                parsedData.isPremium = parsedData.isPremium === 'true';
            }
            // Convert premiumPrice to number
            if (parsedData.premiumPrice) {
                parsedData.premiumPrice = Number(parsedData.premiumPrice);
            }
            req.body = reviewValidation.create.parse(parsedData);
        } else {
            req.body = reviewValidation.create.parse(req.body);
        }
        return next();
    },
    ReviewController.createReview
);

// Get all reviews (admin only)
router.get(
    "/all",
    auth(UserRole.ADMIN),
    ReviewController.getAllReviews
);

// Get all published reviews (public)
router.get(
    "/",
    ReviewController.getPublishedReviews
);

// Get review by ID (public for published, auth for draft)
router.get(
    "/:id",
    (req: Request, res: Response, next: NextFunction) => {
        // If user is not authenticated, add empty user object to request
        if (!req.user) {
            req.user = { userId: '', role: '', email: '' };
        }
        return next();
    },
    ReviewController.getReviewById
);

// Update a review (auth required)
router.patch(
    "/:id",
    auth(UserRole.USER, UserRole.ADMIN),
    fileUploader.upload.array("images", 5),
    (req: Request, res: Response, next: NextFunction) => {
        // Parse JSON data if it comes from a form
        if (req.body.data) {
            const parsedData = JSON.parse(req.body.data);
            // Convert rating to number if provided
            if (parsedData.rating) {
                parsedData.rating = Number(parsedData.rating);
            }
            // Convert isPremium to boolean if provided
            if (parsedData.isPremium !== undefined) {
                parsedData.isPremium = parsedData.isPremium === 'true';
            }
            // Convert premiumPrice to number if provided
            if (parsedData.premiumPrice) {
                parsedData.premiumPrice = Number(parsedData.premiumPrice);
            }
            req.body = reviewValidation.update.parse(parsedData);
        } else {
            req.body = reviewValidation.update.parse(req.body);
        }
        return next();
    },
    ReviewController.updateReview
);

// Delete a review (auth required)
router.delete(
    "/:id",
    auth(UserRole.USER, UserRole.ADMIN),
    ReviewController.deleteReview
);

// Update review status (admin only)
router.patch(
    "/:id/status",
    auth(UserRole.ADMIN),
    (req: Request, res: Response, next: NextFunction) => {
        req.body = reviewValidation.updateStatus.parse(req.body);
        return next();
    },
    ReviewController.updateReviewStatus
);

// Remove an image from a review (auth required)
router.delete(
    "/:id/image",
    auth(UserRole.USER, UserRole.ADMIN),
    (req: Request, res: Response, next: NextFunction) => {
        req.body = reviewValidation.removeImage.parse(req.body);
        return next();
    },
    ReviewController.removeReviewImage
);

export const ReviewRoutes = router;