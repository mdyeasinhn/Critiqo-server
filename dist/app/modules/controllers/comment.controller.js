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
exports.CommentController = void 0;
const catchAsync_1 = __importDefault(require("../../shared/catchAsync"));
const comment_service_1 = require("../services/comment.service");
const sendResponse_1 = __importDefault(require("../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const pick_1 = __importDefault(require("../../shared/pick"));
const pagination_1 = require("../../../constants/pagination");
const client_1 = require("@prisma/client");
const addComment = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { reviewId, content, parentId } = req.body;
    const { userId } = req.user;
    const result = yield comment_service_1.CommentService.addComment(reviewId, userId, content, parentId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: parentId ? "Reply added successfully!" : "Comment added successfully!",
        data: result
    });
}));
const getReviewComments = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { reviewId } = req.params;
    const paginationOptions = (0, pick_1.default)(req.query, pagination_1.paginationFields);
    const result = yield comment_service_1.CommentService.getReviewComments(reviewId, paginationOptions);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Comments retrieved successfully!",
        meta: result.meta,
        data: result.data
    });
}));
const updateComment = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { content } = req.body;
    const { userId } = req.user;
    const result = yield comment_service_1.CommentService.updateComment(id, userId, content);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Comment updated successfully!",
        data: result
    });
}));
const deleteComment = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { userId, role } = req.user;
    const isAdmin = role === client_1.UserRole.ADMIN;
    const result = yield comment_service_1.CommentService.deleteComment(id, userId, isAdmin);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: result.message,
        data: result
    });
}));
const getCommentReplies = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { commentId } = req.params;
    const paginationOptions = (0, pick_1.default)(req.query, pagination_1.paginationFields);
    const result = yield comment_service_1.CommentService.getCommentReplies(commentId, paginationOptions);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Comment replies retrieved successfully!",
        meta: result.meta,
        data: result.data
    });
}));
exports.CommentController = {
    addComment,
    getReviewComments,
    updateComment,
    deleteComment,
    getCommentReplies
};
