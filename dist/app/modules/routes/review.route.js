"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewRoutes = void 0;
const express_1 = __importDefault(require("express"));
const review_controller_1 = require("../controllers/review.controller");
const client_1 = require("@prisma/client");
const review_validation_1 = require("../validation/review.validation");
const fileUploader_1 = require("../../helpers/fileUploader");
const auth_1 = __importDefault(require("../../../middleware/auth"));
const router = express_1.default.Router();
// Public routes
// Get all published reviews
router.get('/', review_controller_1.ReviewController.getAllReviews);
// Get featured reviews for homepage
router.get('/featured', review_controller_1.ReviewController.getFeaturedReviews);
// Get a single review by ID
router.get('/:id', review_controller_1.ReviewController.getReviewById);
// Get related reviews
router.get('/:id/related', review_controller_1.ReviewController.getRelatedReviews);
// Get reviews by user
router.get('/user/:userId', review_controller_1.ReviewController.getUserReviews);
// Protected routes - require authentication
// Create a new review
router.post('/', (0, auth_1.default)(client_1.UserRole.ADMIN, client_1.UserRole.GUEST), fileUploader_1.fileUploader.upload.array('images', 5), // Allow up to 5 images
(req, res, next) => {
    try {
        if (req.body.data) {
            req.body = review_validation_1.reviewValidation.createReview.parse(JSON.parse(req.body.data));
        }
        else {
            req.body = review_validation_1.reviewValidation.createReview.parse(req.body);
        }
        return next();
    }
    catch (error) {
        next(error);
    }
}, review_controller_1.ReviewController.createReview);
// Update a review
router.patch('/:id', (0, auth_1.default)(client_1.UserRole.ADMIN, client_1.UserRole.GUEST), fileUploader_1.fileUploader.upload.array('images', 5), (req, res, next) => {
    try {
        if (req.body.data) {
            req.body = review_validation_1.reviewValidation.updateReview.parse(JSON.parse(req.body.data));
        }
        else {
            req.body = review_validation_1.reviewValidation.updateReview.parse(req.body);
        }
        return next();
    }
    catch (error) {
        next(error);
    }
}, review_controller_1.ReviewController.updateReview);
// Delete a review
router.delete('/:id', (0, auth_1.default)(client_1.UserRole.ADMIN, client_1.UserRole.GUEST), review_controller_1.ReviewController.deleteReview);
// Remove image from review
router.post('/:id/remove-image', (0, auth_1.default)(client_1.UserRole.ADMIN, client_1.UserRole.GUEST), (req, res, next) => {
    try {
        req.body = review_validation_1.reviewValidation.removeImage.parse(req.body);
        return next();
    }
    catch (error) {
        next(error);
    }
}, review_controller_1.ReviewController.removeImage);
exports.ReviewRoutes = router;
