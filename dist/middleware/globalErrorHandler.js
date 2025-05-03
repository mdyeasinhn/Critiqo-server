"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const http_status_codes_1 = require("http-status-codes");
const config_1 = __importDefault(require("../app/config"));
const ApiError_1 = __importDefault(require("../app/error/ApiError"));
// Format ZodError into a user-friendly structure
const handleZodError = (error) => {
    const errors = error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message
    }));
    return {
        statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
        message: "Validation Error",
        errors
    };
};
// Improved Prisma validation error handling with clearer messages
const handlePrismaValidationError = (error) => {
    // Extract the relevant parts from the error message for easier understanding
    let errorMessage = error.message;
    // Simplify common validation error messages
    if (errorMessage.includes("Argument")) {
        errorMessage = errorMessage
            .replace(/Argument\s+/, "Field ")
            .replace(/provided[\s\S]+?[.]/i, "is invalid.");
    }
    return {
        statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
        message: "Database Validation Error",
        errors: [{ message: errorMessage }]
    };
};
// Handle Prisma database errors with specific status codes and messages
const handlePrismaKnownError = (error) => {
    var _a;
    let statusCode = http_status_codes_1.StatusCodes.BAD_REQUEST;
    let message = "Database Error";
    // Map common Prisma error codes to meaningful messages
    switch (error.code) {
        case "P2002":
            statusCode = http_status_codes_1.StatusCodes.CONFLICT;
            message = "A record with this value already exists";
            break;
        case "P2025":
            statusCode = http_status_codes_1.StatusCodes.NOT_FOUND;
            message = "Record not found";
            break;
        case "P2003":
            message = "Foreign key constraint failed";
            break;
    }
    const field = Array.isArray((_a = error.meta) === null || _a === void 0 ? void 0 : _a.target)
        ? error.meta.target.join('.')
        : undefined;
    return {
        statusCode,
        message,
        errors: [{ field, message }]
    };
};
// Global error handler
const globalErrorHandler = (error, req, res) => {
    let statusCode = http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR;
    let message = "Something went wrong";
    let errors = [];
    // Handle different error types
    if (error instanceof zod_1.ZodError) {
        const result = handleZodError(error);
        statusCode = result.statusCode;
        message = result.message;
        errors = result.errors;
    }
    else if (error instanceof client_1.Prisma.PrismaClientValidationError) {
        const result = handlePrismaValidationError(error);
        statusCode = result.statusCode;
        message = result.message;
        errors = result.errors;
    }
    else if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        const result = handlePrismaKnownError(error);
        statusCode = result.statusCode;
        message = result.message;
        errors = result.errors;
    }
    else if (error instanceof ApiError_1.default) {
        statusCode = error.statusCode;
        message = error.message;
        errors = [{ message: error.message }];
    }
    else if (error instanceof Error) {
        message = error.message;
        errors = [{ message: error.message }];
    }
    // Send the error response
    res.status(statusCode).json(Object.assign({ success: false, message,
        errors }, (config_1.default.env === "development" && { stack: error.stack })));
};
exports.default = globalErrorHandler;
