import express, { NextFunction, Request, Response } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { UserRole } from '@prisma/client';
import { adminValidation } from '../validation/admin.validation';
import { fileUploader } from '../../helpers/fileUploader';
import auth from '../../../middleware/auth';

const router = express.Router();

// Get dashboard statistics (admin only)
router.get(
    '/dashboard',
    auth(UserRole.ADMIN),
    AdminController.getDashboardStats
);

// Get pending reviews (admin only)
router.get(
    '/reviews/pending',
    auth(UserRole.ADMIN),
    AdminController.getPendingReviews
);

// Get admin profile
router.get(
    '/profile',
    auth(UserRole.ADMIN),
    AdminController.getAdminProfile
);

// Update admin profile
router.patch(
    '/profile',
    auth(UserRole.ADMIN),
    fileUploader.upload.single('file'),
    (req: Request, res: Response, next: NextFunction) => {
        if (req.body.data) {
            req.body = adminValidation.updateProfile.parse(JSON.parse(req.body.data));
        } else {
            req.body = adminValidation.updateProfile.parse(req.body);
        }
        return next();
    },
    AdminController.updateAdminProfile
);

export const AdminRoutes = router;