"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryRoutes = void 0;
const express_1 = __importDefault(require("express"));
const category_controller_1 = require("../controllers/category.controller");
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../../middleware/auth"));
const category_validation_1 = require("../validation/category.validation");
const router = express_1.default.Router();
// Public routes
// Get all categories
router.get('/', category_controller_1.CategoryController.getAllCategories);
// Get a single category by ID
router.get('/:id', category_controller_1.CategoryController.getCategoryById);
// Admin only routes
router.use((0, auth_1.default)(client_1.UserRole.ADMIN));
// Create a new category
router.post('/', (req, res, next) => {
    try {
        req.body = category_validation_1.categoryValidation.createCategory.parse(req.body);
        return next();
    }
    catch (error) {
        next(error);
    }
}, category_controller_1.CategoryController.createCategory);
// Update a category
router.patch('/:id', (req, res, next) => {
    try {
        req.body = category_validation_1.categoryValidation.updateCategory.parse(req.body);
        return next();
    }
    catch (error) {
        next(error);
    }
}, category_controller_1.CategoryController.updateCategory);
// Delete a category
router.delete('/:id', category_controller_1.CategoryController.deleteCategory);
exports.CategoryRoutes = router;
