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
exports.VoteController = void 0;
const catchAsync_1 = __importDefault(require("../../shared/catchAsync"));
const vote_service_1 = require("../services/vote.service");
const sendResponse_1 = __importDefault(require("../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const client_1 = require("@prisma/client");
const addVote = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { reviewId, voteType } = req.body;
    const { userId } = req.user;
    const result = yield vote_service_1.VoteService.addVote(reviewId, userId, voteType === 'upvote' ? client_1.VoteType.UPVOTE : client_1.VoteType.DOWNVOTE);
    const actionMessage = {
        'created': 'Vote added successfully!',
        'updated': 'Vote updated successfully!',
        'removed': 'Vote removed successfully!'
    };
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: actionMessage[result.action],
        data: result
    });
}));
const getVotes = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { reviewId } = req.params;
    const result = yield vote_service_1.VoteService.getVotes(reviewId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Votes retrieved successfully!",
        data: result
    });
}));
const getUserVote = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { reviewId } = req.params;
    const { userId } = req.user;
    const result = yield vote_service_1.VoteService.getUserVote(reviewId, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "User vote retrieved successfully!",
        data: result
    });
}));
exports.VoteController = {
    addVote,
    getVotes,
    getUserVote
};
