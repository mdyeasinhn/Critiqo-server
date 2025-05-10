import { NextFunction, Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { PaymentService } from "../services/payment.service";
import { IUser } from "../../interface/file";
import { IAuthUser } from "../../interface/common";

declare module "express-serve-static-core" {
  interface Request {
    user?: IAuthUser;
  }
}

//-------------Payment  ------------------
const payment = catchAsync(async (req: Request, res: Response) => {
  const user = req?.user;
  console.log("user", user);
  //@ts-ignore
  const payment = await PaymentService.payment(user, req.body, req.ip!);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: "Order placed successfully",
    data: payment,
  });
});

const paymentHistory = catchAsync(async (req, res) => {
  const user = req.user;
  console.log("email", user); // should log the string now
  //@ts-ignore
  const result = await PaymentService.paymentHistory(user);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "My payment history is getting successfully",
    data: result,
  });
});
const getTotalEraning = catchAsync(async (req, res) => {

  const result = await PaymentService.getTotalEraning();

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Total Eraning get successfully",
    data: result,
  });
});

export const PaymentController = {
  payment,
  paymentHistory,
  getTotalEraning
};
