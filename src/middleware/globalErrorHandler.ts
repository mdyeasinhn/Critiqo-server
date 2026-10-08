import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { TErrorSources } from "../app/interface/error";
import { ZodError } from "zod";
import handleZodError from "../app/error/handleZodError";
import ApiError from "../app/error/ApiError";
import jwt from "jsonwebtoken";

const globalErrorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  let statusCode = 500;
  let message = "Something went wrong!";
  let errorSources: TErrorSources = [
    {
      path: "",
      message: "Something went wrong!",
    },
  ];

  if (err instanceof ZodError) {
    const simplifiedError = handleZodError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources;
  } else if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errorSources = [{ path: "", message }];
  } else if (err instanceof jwt.JsonWebTokenError) {
    statusCode = StatusCodes.UNAUTHORIZED;
    message = "Invalid or expired authentication token";
    errorSources = [{ path: "", message }];
  } else if (err instanceof Error) {
    message = err.message;
    errorSources = [{ path: "", message }];
  }

  if (statusCode >= StatusCodes.INTERNAL_SERVER_ERROR) {
    console.error(err);
  }
  res.status(statusCode).json({
    success: false,
    message,
    error: errorSources,
  });
};

export default globalErrorHandler;
