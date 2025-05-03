"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminRoutes = void 0;
const express_1 = __importDefault(require("express"));
const admin_controller_1 = require("../controllers/admin.controller");
const client_1 = require("@prisma/client");
const admin_validation_1 = require("../validation/admin.validation");
const fileUploader_1 = require("../../helpers/fileUploader");
const auth_1 = __importDefault(require("../../../middleware/auth"));
const router = express_1.default.Router();
// All routes under admin are protected with admin authentication
router.use((0, auth_1.default)(client_1.UserRole.ADMIN));
// Get dashboard statistics
router.get('/dashboard', admin_controller_1.AdminController.getDashboardStats);
// Get pending reviews that need moderation
router.get('/reviews/pending', admin_controller_1.AdminController.getPendingReviews);
// Moderate a review (approve or unpublish)
router.patch('/reviews/:id/moderate', (req, res, next) => {
    if (req.body.data) {
        req.body = admin_validation_1.adminValidation.moderateReview.parse(JSON.parse(req.body.data));
    }
    else {
        req.body = admin_validation_1.adminValidation.moderateReview.parse(req.body);
    }
    return next();
}, admin_controller_1.AdminController.moderateReview);
// Get payment analytics
router.get('/payments/analytics', admin_controller_1.AdminController.getPaymentAnalytics);
// Remove inappropriate comment
router.delete('/comments/:id', admin_controller_1.AdminController.removeInappropriateComment);
// Get admin profile
router.get('/profile', admin_controller_1.AdminController.getAdminProfile);
// Update admin profile
router.patch('/profile', fileUploader_1.fileUploader.upload.single('file'), (req, res, next) => {
    if (req.body.data) {
        req.body = admin_validation_1.adminValidation.updateProfile.parse(JSON.parse(req.body.data));
    }
    else {
        req.body = admin_validation_1.adminValidation.updateProfile.parse(req.body);
    }
    return next();
}, admin_controller_1.AdminController.updateAdminProfile);
exports.AdminRoutes = router;
