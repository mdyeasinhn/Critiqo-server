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
const http_status_codes_1 = require("http-status-codes");
const jwtHelpers_1 = require("../app/helpers/jwtHelpers");
const config_1 = __importDefault(require("../app/config"));
const ApiError_1 = __importDefault(require("../app/error/ApiError"));
const models_1 = __importDefault(require("../app/modules/models")); // Import Prisma client
/**
 * Authentication and authorization middleware
 * @param roles Authorized roles for the route
 * @returns Express middleware function
 */
const auth = (...roles) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Get token from authorization header
            const token = req.headers.authorization;
            if (!token) {
                throw new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "You are not authorized!");
            }
            // Verify token
            const verifiedUser = jwtHelpers_1.jwtHelpars.verifyToken(token, config_1.default.jwt.secret);
            // Log verification for debugging
            console.log('Verified user from token:', verifiedUser);
            // If there's no userId but there is an email, look up the user to get the ID
            if (!verifiedUser.userId && verifiedUser.email) {
                try {
                    // Find user by email
                    const user = yield models_1.default.user.findUnique({
                        where: { email: verifiedUser.email }
                    });
                    if (user) {
                        verifiedUser.userId = user.id;
                        console.log('Added userId from database lookup:', verifiedUser.userId);
                    }
                }
                catch (error) {
                    console.error('Error looking up user by email:', error);
                }
            }
            // Set user data in request object
            req.user = verifiedUser;
            // Check if user has required role
            if (roles.length && !roles.includes(verifiedUser.role)) {
                throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "You don't have permission to access this resource!");
            }
            next();
        }
        catch (err) {
            next(err);
        }
    });
};
exports.default = auth;
