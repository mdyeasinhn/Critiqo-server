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
exports.AuthService = void 0;
const client_1 = require("@prisma/client");
const models_1 = __importDefault(require("../models"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jwtHelpers_1 = require("../../helpers/jwtHelpers");
const config_1 = __importDefault(require("../../config"));
const ApiError_1 = __importDefault(require("../../error/ApiError"));
const http_status_codes_1 = require("http-status-codes");
/**
 * Login user with email and password
 */
const loginUser = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    // Find user by email
    const userData = yield models_1.default.user.findUnique({
        where: {
            email: payload.email,
            status: client_1.UserStatus.ACTIVE
        }
    });
    if (!userData) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Invalid credentials");
    }
    // Verify password
    const isCorrectPassword = yield bcrypt_1.default.compare(payload.password, userData.password);
    if (!isCorrectPassword) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Invalid credentials");
    }
    // Create token payload with all necessary fields
    const tokenPayload = {
        userId: userData.id, // Must include userId explicitly
        id: userData.id, // Include id as a backup
        email: userData.email,
        role: userData.role
    };
    console.log("Token payload:", tokenPayload);
    // Generate access token
    const accessToken = jwtHelpers_1.jwtHelpars.generateToken(tokenPayload, config_1.default.jwt.secret, config_1.default.jwt.expires_in);
    // Generate refresh token
    const refreshToken = jwtHelpers_1.jwtHelpars.generateToken(tokenPayload, config_1.default.jwt.refresh_secret, config_1.default.jwt.refresh_expires_in);
    return {
        accessToken,
        refreshToken,
        needPasswordChange: userData.needPasswordChange,
        user: {
            id: userData.id,
            email: userData.email,
            role: userData.role,
            name: userData.name
        }
    };
});
/**
 * Refresh access token using refresh token
 */
const refreshToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    let decodedData;
    try {
        // Verify refresh token
        decodedData = jwtHelpers_1.jwtHelpars.verifyToken(token, config_1.default.jwt.refresh_secret);
        console.log('Decoded refresh token:', decodedData);
    }
    catch (error) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Invalid refresh token");
    }
    // Check if necessary data is present
    if (!decodedData.email) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Invalid token payload");
    }
    // Find user by email
    const userData = yield models_1.default.user.findUnique({
        where: {
            email: decodedData.email,
            status: client_1.UserStatus.ACTIVE
        }
    });
    if (!userData) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    // Create token payload with all necessary fields
    const tokenPayload = {
        userId: userData.id, // Must include userId explicitly
        id: userData.id, // Include id as a backup
        email: userData.email,
        role: userData.role
    };
    // Generate new access token
    const accessToken = jwtHelpers_1.jwtHelpars.generateToken(tokenPayload, config_1.default.jwt.secret, config_1.default.jwt.expires_in);
    return {
        accessToken,
        needPasswordChange: userData.needPasswordChange
    };
});
exports.AuthService = {
    loginUser,
    refreshToken
};
