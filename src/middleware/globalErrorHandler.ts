import { ErrorRequestHandler, Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { StatusCodes } from "http-status-codes";
import ApiError from "../app/shared/ApiError";
import config from "../app/config";

// Define error types
type IGenericErrorMessage = {
  path: string | number;
  message: string;
};

type IGenericErrorResponse = {
  statusCode: number;
  message: string;
  errorMessages: IGenericErrorMessage[];
  stack?: string;
};

const handleZodError = (error: ZodError): IGenericErrorResponse => {
  const errorMessages: IGenericErrorMessage[] = error.issues.map((issue) => {
    return {
      path: issue.path[issue.path.length - 1],
      message: issue.message,
    };
  });

  return {
    statusCode: StatusCodes.BAD_REQUEST,
    message: "Validation Error",
    errorMessages,
  };
};

const handlePrismaClientValidationError = (
  error: Prisma.PrismaClientValidationError
): IGenericErrorResponse => {
  const errorMessages = [
    {
      path: "",
      message: error.message,
    },
  ];
  return {
    statusCode: StatusCodes.BAD_REQUEST,
    message: "Validation Error",
    errorMessages,
  };
};

const handlePrismaClientKnownRequestError = (
  error: Prisma.PrismaClientKnownRequestError
): IGenericErrorResponse => {
  let statusCode = StatusCodes.BAD_REQUEST;
  let message = error.message;

  // Handle specific Prisma error codes
  if (error.code === "P2002") {
    statusCode = StatusCodes.CONFLICT;
    message = "Duplicate entry found";
  } else if (error.code === "P2025") {
    statusCode = StatusCodes.NOT_FOUND;
    message = "Record not found";
  }

  const errorMessages: IGenericErrorMessage[] = [
    {
      path: (error.meta?.target as string[])?.join(".") || "",

      message: message,
    },
  ];

  return {
    statusCode,
    message: "Database Error",
    errorMessages,
  };
};

const globalErrorHandler: ErrorRequestHandler = (
  error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  let message = "Something went wrong";
  let errorMessages: IGenericErrorMessage[] = [];

  if (error instanceof ZodError) {
    const simplifiedError = handleZodError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorMessages = simplifiedError.errorMessages;
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    const simplifiedError = handlePrismaClientValidationError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorMessages = simplifiedError.errorMessages;
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const simplifiedError = handlePrismaClientKnownRequestError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorMessages = simplifiedError.errorMessages;
  } else if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
    errorMessages = [
      {
        path: "",
        message: error.message,
      },
    ];
  } else if (error instanceof Error) {
    message = error.message;
    errorMessages = [
      {
        path: "",
        message: error.message,
      },
    ];
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorMessages,
    stack: config.env === "development" ? error.stack : undefined,
  });
};

export default globalErrorHandler;
