import { ErrorRequestHandler, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { StatusCodes } from "http-status-codes";

import config from "../app/config";
import ApiError from "../app/error/ApiError";

// Simplified error message structure
type ErrorMessage = {
  field?: string;
  message: string;
};

// Format ZodError into a user-friendly structure
const handleZodError = (error: ZodError) => {
  const errors = error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message
  }));

  return {
    statusCode: StatusCodes.BAD_REQUEST,
    message: "Validation Error",
    errors
  };
};

// Improved Prisma validation error handling with clearer messages
const handlePrismaValidationError = (error: Prisma.PrismaClientValidationError) => {
  // Extract the relevant parts from the error message for easier understanding
  let errorMessage = error.message;
  
  // Simplify common validation error messages
  if (errorMessage.includes("Argument")) {
    errorMessage = errorMessage
      .replace(/Argument\s+/, "Field ")
      .replace(/provided[\s\S]+?[.]/i, "is invalid.");
  }

  return {
    statusCode: StatusCodes.BAD_REQUEST,
    message: "Database Validation Error",
    errors: [{ message: errorMessage }]
  };
};

// Handle Prisma database errors with specific status codes and messages
const handlePrismaKnownError = (error: Prisma.PrismaClientKnownRequestError) => {
  let statusCode = StatusCodes.BAD_REQUEST;
  let message = "Database Error";

  // Map common Prisma error codes to meaningful messages
  switch (error.code) {
    case "P2002":
      statusCode = StatusCodes.CONFLICT;
      message = "A record with this value already exists";
      break;
    case "P2025":
      statusCode = StatusCodes.NOT_FOUND;
      message = "Record not found";
      break;
    case "P2003":
      message = "Foreign key constraint failed";
      break;
  }

  const field = Array.isArray(error.meta?.target) 
    ? (error.meta.target as string[]).join('.')
    : undefined;

  return {
    statusCode,
    message,
    errors: [{ field, message }]
  };
};

// Global error handler
const globalErrorHandler: ErrorRequestHandler = (error, req: Request, res: Response) => {
  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  let message = "Something went wrong";
  let errors: ErrorMessage[] = [];

  // Handle different error types
  if (error instanceof ZodError) {
    const result = handleZodError(error);
    statusCode = result.statusCode;
    message = result.message;
    errors = result.errors;
  } 
  else if (error instanceof Prisma.PrismaClientValidationError) {
    const result = handlePrismaValidationError(error);
    statusCode = result.statusCode;
    message = result.message;
    errors = result.errors;
  } 
  else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const result = handlePrismaKnownError(error);
    statusCode = result.statusCode; 
    message = result.message;
    errors = result.errors;
  } 
  else if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
    errors = [{ message: error.message }];
  } 
  else if (error instanceof Error) {
    message = error.message;
    errors = [{ message: error.message }];
  }

  // Send the error response
  res.status(statusCode).json({
    success: false,
    message,
    errors,
    ...(config.env === "development" && { stack: error.stack })
  });
};

export default globalErrorHandler;