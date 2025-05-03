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
exports.AdminController = void 0;
const catchAsync_1 = __importDefault(require("../../shared/catchAsync"));
const admin_service_1 = require("../services/admin.service");
const sendResponse_1 = __importDefault(require("../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const pick_1 = __importDefault(require("../../shared/pick"));
const pagination_1 = require("../../../constants/pagination");
const models_1 = __importDefault(require("../models"));
const getDashboardStats = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield admin_service_1.AdminService.getDashboardStats();
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Dashboard statistics retrieved successfully!",
            data: result
        });
    }
    catch (error) {
        next(error);
    }
}));
const getPendingReviews = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const paginationOptions = (0, pick_1.default)(req.query, pagination_1.paginationFields);
        const result = yield admin_service_1.AdminService.getPendingReviews(paginationOptions);
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Pending reviews retrieved successfully!",
            meta: result.meta,
            data: result.data
        });
    }
    catch (error) {
        next(error);
    }
}));
const moderateReview = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { action, moderationNote } = req.body;
        const result = yield admin_service_1.AdminService.moderateReview(id, action, moderationNote);
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: `Review ${action === 'publish' ? 'published' : 'unpublished'} successfully!`,
            data: result
        });
    }
    catch (error) {
        next(error);
    }
}));
const getAdminProfile = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const authReq = req;
        // Log the user object to debug
        console.log('User in getAdminProfile:', authReq.user);
        // Try to find a valid user ID
        const userId = ((_a = authReq.user) === null || _a === void 0 ? void 0 : _a.userId) || ((_b = authReq.user) === null || _b === void 0 ? void 0 : _b.id);
        // Make sure userId exists
        if (!userId) {
            // Try to find user by email if we have it
            if ((_c = authReq.user) === null || _c === void 0 ? void 0 : _c.email) {
                try {
                    const user = yield models_1.default.user.findUnique({
                        where: { email: authReq.user.email }
                    });
                    if (user) {
                        const result = yield admin_service_1.AdminService.getAdminProfile(user.id);
                        return (0, sendResponse_1.default)(res, {
                            statusCode: http_status_codes_1.StatusCodes.OK,
                            success: true,
                            message: "Admin profile retrieved successfully!",
                            data: result
                        });
                    }
                }
                catch (error) {
                    console.error('Error finding user by email:', error);
                    return next(error);
                }
            }
            return (0, sendResponse_1.default)(res, {
                statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                success: false,
                message: "User ID is missing from authentication token",
                data: null
            });
        }
        const result = yield admin_service_1.AdminService.getAdminProfile(userId);
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Admin profile retrieved successfully!",
            data: result
        });
    }
    catch (error) {
        next(error);
    }
}));
const updateAdminProfile = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const authReq = req;
        const userId = ((_a = authReq.user) === null || _a === void 0 ? void 0 : _a.userId) || ((_b = authReq.user) === null || _b === void 0 ? void 0 : _b.id);
        if (!userId) {
            if ((_c = authReq.user) === null || _c === void 0 ? void 0 : _c.email) {
                try {
                    const user = yield models_1.default.user.findUnique({
                        where: { email: authReq.user.email }
                    });
                    if (user) {
                        const result = yield admin_service_1.AdminService.updateAdminProfile(user.id, req.body, req.file);
                        return (0, sendResponse_1.default)(res, {
                            statusCode: http_status_codes_1.StatusCodes.OK,
                            success: true,
                            message: "Admin profile updated successfully!",
                            data: result
                        });
                    }
                }
                catch (error) {
                    console.error('Error finding user by email:', error);
                    return next(error);
                }
            }
            return (0, sendResponse_1.default)(res, {
                statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                success: false,
                message: "User ID is missing from authentication token",
                data: null
            });
        }
        const updateData = req.body;
        const file = req.file;
        const result = yield admin_service_1.AdminService.updateAdminProfile(userId, updateData, file);
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Admin profile updated successfully!",
            data: result
        });
    }
    catch (error) {
        next(error);
    }
}));
const getPaymentAnalytics = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const paginationOptions = (0, pick_1.default)(req.query, pagination_1.paginationFields);
        const result = yield admin_service_1.AdminService.getPaymentAnalytics(paginationOptions);
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Payment analytics retrieved successfully!",
            meta: result.meta,
            data: result
        });
    }
    catch (error) {
        next(error);
    }
}));
const removeInappropriateComment = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield admin_service_1.AdminService.removeInappropriateComment(id);
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: "Comment removed successfully!",
            data: result
        });
    }
    catch (error) {
        next(error);
    }
}));
exports.AdminController = {
    getDashboardStats,
    getPendingReviews,
    moderateReview,
    getAdminProfile,
    updateAdminProfile,
    getPaymentAnalytics,
    removeInappropriateComment
};
