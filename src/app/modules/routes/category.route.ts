import express, { NextFunction, Request, Response } from "express";
import { CategoryController } from "../controllers/category.controller";
import { UserRole } from "@prisma/client";
import auth from "../../../middleware/auth";
import { categoryValidation } from "../validation/category.validation";

const router = express.Router();

// Public routes
// Get all categories
router.get("/", CategoryController.getAllCategories);

// Get a single category by ID
router.get("/:id", CategoryController.getCategoryById);

// Admin only routes
router.use(auth(UserRole.ADMIN));

// Create a new category
router.post(
  "/",
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = categoryValidation.createCategory.parse(req.body);
      return next();
    } catch (error) {
      next(error);
    }
  },
  CategoryController.createCategory,
);

// Update a category
router.patch(
  "/:id",
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = categoryValidation.updateCategory.parse(req.body);
      return next();
    } catch (error) {
      next(error);
    }
  },
  CategoryController.updateCategory,
);

// Delete a category
router.delete("/:id", CategoryController.deleteCategory);

export const CategoryRoutes = router;
