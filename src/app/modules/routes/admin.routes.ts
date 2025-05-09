import express, { NextFunction, Request, Response } from "express";
import { AdminController } from "../controllers/admin.controller";
import { UserRole } from "@prisma/client";
import { adminValidation } from "../validation/admin.validation";
import { fileUploader } from "../../helpers/fileUploader";
import auth from "../../../middleware/auth";

const router = express.Router();

// All routes under admin are protected with admin authentication
router.use(auth(UserRole.ADMIN));

// Get dashboard statistics
router.get("/dashboard", AdminController.getDashboardStats);

// Get pending reviews that need moderation
router.get("/reviews/pending", AdminController.getPendingReviews);

// Moderate a review (approve or unpublish)
router.patch(
  "/reviews/:id/moderate",
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      req.body = adminValidation.moderateReview.parse(
        JSON.parse(req.body.data),
      );
    } else {
      req.body = adminValidation.moderateReview.parse(req.body);
    }
    return next();
  },
  AdminController.moderateReview,
);

// Get payment analytics

// Remove inappropriate comment
router.delete("/comments/:id", AdminController.removeInappropriateComment);

// Get admin profile
router.get("/profile", AdminController.getAdminProfile);

// Update admin profile
router.patch(
  "/profile",
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      req.body = adminValidation.updateProfile.parse(JSON.parse(req.body.data));
    } else {
      req.body = adminValidation.updateProfile.parse(req.body);
    }
    return next();
  },
  AdminController.updateAdminProfile,
);

export const AdminRoutes = router;
