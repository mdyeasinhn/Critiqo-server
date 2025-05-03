"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewController = void 0;
const catchAsync_1 = __importDefault(require("../../shared/catchAsync"));
const review_service_1 = require("../services/review.service");
const sendResponse_1 = __importDefault(require("../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const pick_1 = __importDefault(require("../../shared/pick"));
const pagination_1 = require("../../../constants/pagination");
const ApiError_1 = __importDefault(require("../../error/ApiError"));
function isAuthUser(user) {
    return (user !== null &&
        typeof user === 'object' &&
        'userId' in user &&
        typeof user.userId === 'string' &&
        'role' in user &&
        'email' in user &&
        typeof user.email === 'string');
}
const createReview = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        return next(new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Authentication required'));
    }
    if (!isAuthUser(req.user)) {
        return next(new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Invalid user credentials'));
    }
    try {
        const result = yield review_service_1.ReviewService.createReview(req);
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.CREATED,
            success: true,
            message: "Review created successfully!",
            data: result
        });
    }
    catch (error) {
        if (error.name === 'ValidationError') {
            return next(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, error.message));
        }
        if (error.code === 'P2002') {
            return next(new ApiError_1.default(http_status_codes_1.StatusCodes.CONFLICT, 'A review with similar unique constraints already exists'));
        }
        next(error);
    }
}));
const getAllReviews = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const filters = (0, pick_1.default)(req.query, ['status', 'categoryId', 'isPremium', 'title', 'rating', 'userId']);
        const paginationOptions = (0, pick_1.default)(req.query, pagination_1.paginationFields);
        // Validate query parameters
        if (req.query.limit && isNaN(Number(req.query.limit))) {
            return next(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Limit must be a number'));
        }
        if (req.query.page && isNaN(Number(req.query.page))) {
            return next(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Page must be a number'));
        }
        const result = yield review_service_1.ReviewService.getAllReviews(filters, paginationOptions);
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Reviews retrieved successfully!",
            meta: result.meta,
            data: result.data
        });
    }
    catch (error) {
        if (error.name === 'PrismaClientKnownRequestError') {
            return next(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid query parameters'));
        }
        next(error);
    }
}));
const getReviewById = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id) {
            return next(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Review ID is required'));
        }
        const userId = req.user && isAuthUser(req.user) ? req.user.userId : undefined;
        const result = yield review_service_1.ReviewService.getReviewById(id, userId);
        if (!result) {
            return next(new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, `Review with ID ${id} not found`));
        }
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Review retrieved successfully!",
            data: result
        });
    }
    catch (error) {
        if (error.name === 'PrismaClientKnownRequestError' && error.code === 'P2023') {
            return next(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid review ID format'));
        }
        next(error);
    }
}));
const updateReview = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id) {
            return next(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Review ID is required'));
        }
        if (!req.user) {
            return next(new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Authentication required'));
        }
        if (!isAuthUser(req.user)) {
            return next(new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Invalid user credentials'));
        }
        const userId = req.user.userId;
        const updateData = req.body;
        const files = req.files;
        let normalizedFiles;
        if (Array.isArray(files)) {
            normalizedFiles = files;
        }
        else if (files && typeof files === 'object') {
            normalizedFiles = Object.values(files).flat();
        }
        else {
            normalizedFiles = undefined;
        }
        const result = yield review_service_1.ReviewService.updateReview(id, userId, updateData, normalizedFiles);
        if (!result) {
            return next(new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, `Review with ID ${id} not found or not owned by the user`));
        }
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Review updated successfully!",
            data: result
        });
    }
    catch (error) {
        if (error.name === 'ValidationError') {
            return next(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, error.message));
        }
        if (error.name === 'PrismaClientKnownRequestError') {
            if (error.code === 'P2025') {
                return next(new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Review not found'));
            }
            if (error.code === 'P2023') {
                return next(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid review ID format'));
            }
        }
        if (error.message.includes('Unauthorized')) {
            return next(new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'You are not authorized to update this review'));
        }
        next(error);
    }
}));
const deleteReview = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id) {
            return next(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Review ID is required'));
        }
        // Check if user data exists and is valid
        if (!req.user) {
            return next(new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Authentication required'));
        }
        if (typeof req.user !== 'object' || !('userId' in req.user)) {
            return next(new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Invalid user credentials'));
        }
        const userId = req.user.userId;
        const result = yield review_service_1.ReviewService.deleteReview(id, userId);
        if (!result) {
            return next(new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, `Review with ID ${id} not found or not owned by the user`));
        }
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Review deleted successfully!",
            data: result
        });
    }
    catch (error) {
        if (error.name === 'PrismaClientKnownRequestError') {
            if (error.code === 'P2025') {
                return next(new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Review not found'));
            }
            if (error.code === 'P2023') {
                return next(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid review ID format'));
            }
        }
        if (error.message.includes('Unauthorized')) {
            return next(new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'You are not authorized to delete this review'));
        }
        next(error);
    }
}));
const getFeaturedReviews = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const limitParam = req.query.limit;
        let limit = 6; // Default limit
        if (limitParam) {
            const parsedLimit = parseInt(limitParam);
            if (isNaN(parsedLimit)) {
                return next(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Limit must be a number'));
            }
            limit = parsedLimit;
        }
        const result = yield review_service_1.ReviewService.getFeaturedReviews(limit);
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Featured reviews retrieved successfully!",
            data: result
        });
    }
    catch (error) {
        if (error.name === 'ValidationError') {
            return next(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, error.message));
        }
        next(error);
    }
}));
const getRelatedReviews = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id) {
            return next(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Review ID is required'));
        }
        const limitParam = req.query.limit;
        let limit = 4; // Default limit
        if (limitParam) {
            const parsedLimit = parseInt(limitParam);
            if (isNaN(parsedLimit)) {
                return next(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Limit must be a number'));
            }
            limit = parsedLimit;
        }
        const result = yield review_service_1.ReviewService.getRelatedReviews(id, limit);
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Related reviews retrieved successfully!",
            data: result
        });
    }
    catch (error) {
        if (error.name === 'PrismaClientKnownRequestError' && error.code === 'P2023') {
            return next(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid review ID format'));
        }
        next(error);
    }
}));
const getUserReviews = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        if (!userId) {
            return next(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'User ID is required'));
        }
        const paginationOptions = (0, pick_1.default)(req.query, pagination_1.paginationFields);
        // Validate pagination parameters
        if (req.query.limit && isNaN(Number(req.query.limit))) {
            return next(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Limit must be a number'));
        }
        if (req.query.page && isNaN(Number(req.query.page))) {
            return next(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Page must be a number'));
        }
        const result = yield review_service_1.ReviewService.getUserReviews(userId, paginationOptions);
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "User reviews retrieved successfully!",
            meta: result.meta,
            data: result.data
        });
    }
    catch (error) {
        if (error.name === 'PrismaClientKnownRequestError') {
            if (error.code === 'P2023') {
                return next(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid user ID format'));
            }
        }
        next(error);
    }
}));
const removeImage = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id) {
            return next(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Review ID is required'));
        }
        // Check if user data exists and is valid
        if (!req.user) {
            return next(new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Authentication required'));
        }
        if (typeof req.user !== 'object' || !('userId' in req.user)) {
            return next(new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Invalid user credentials'));
        }
        const userId = req.user.userId;
        const { imageUrl } = req.body;
        if (!imageUrl) {
            return next(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Image URL is required'));
        }
        const result = yield review_service_1.ReviewService.removeImage(id, userId, imageUrl);
        if (!result) {
            return next(new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Review not found or image could not be removed'));
        }
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Image removed successfully!",
            data: result
        });
    }
    catch (error) {
        if (error.name === 'PrismaClientKnownRequestError') {
            if (error.code === 'P2025') {
                return next(new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Review not found'));
            }
            if (error.code === 'P2023') {
                return next(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid review ID format'));
            }
        }
        if (error.message.includes('Unauthorized') || error.message.includes('Permission denied')) {
            return next(new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'You are not authorized to remove images from this review'));
        }
        next(error);
    }
}));
exports.ReviewController = {
    createReview,
    getAllReviews,
    getReviewById,
    updateReview,
    deleteReview,
    getFeaturedReviews,
    getRelatedReviews,
    getUserReviews,
    removeImage
};
