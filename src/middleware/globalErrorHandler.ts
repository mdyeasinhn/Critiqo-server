import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { TErrorSources } from "../app/interface/error";
import { ZodError } from "zod";
import handleZodError from "../app/error/handleZodError";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import handlePrismaError from "../app/error/handlePrismaError";

const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
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
    statusCode = simplifiedError?.statusCode;
    message = simplifiedError?.message;
    errorSources = simplifiedError?.errorSources;
  }

  console.log(err);
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: err.message || "Something went wrong!",
    error: err,
  });
};

export default globalErrorHandler;
