import express, { NextFunction, Request, Response } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { UserRole } from '@prisma/client';
import { categoryValidation } from '../validation/catehory.validation';
import auth from '../../../middleware/auth';


const router = express.Router();

// Create category (admin only)
router.post(
    "/",
    auth(UserRole.ADMIN),
    (req: Request, res: Response, next: NextFunction) => {
        req.body = categoryValidation.create.parse(req.body);
        return next();
    },
    CategoryController.createCategory
);

// Get all categories (public)
router.get("/", CategoryController.getAllCategories);

// Get category by ID (public)
router.get("/:id", CategoryController.getCategoryById);

// Update category (admin only)
router.patch(
    "/:id",
    auth(UserRole.ADMIN),
    (req: Request, res: Response, next: NextFunction) => {
        req.body = categoryValidation.update.parse(req.body);
        return next();
    },
    CategoryController.updateCategory
);

// Delete category (admin only)
router.delete(
    "/:id",
    auth(UserRole.ADMIN),
    CategoryController.deleteCategory
);

export const CategoryRoutes = router;