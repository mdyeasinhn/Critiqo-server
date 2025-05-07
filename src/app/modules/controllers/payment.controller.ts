import { NextFunction, Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { PaymentService } from "../services/payment.service";



//-------------Payment  ------------------
const payment = catchAsync(async (req: Request, res: Response) => {
    const user = req?.user;
    const payment = await PaymentService.payment(user, req.body, req.ip!);
    sendResponse(res, {
        success :true,
        statusCode: StatusCodes.CREATED,
        message: "Order placed successfully",
        data: payment,
      });
  
});


export const PaymentController = {
    payment
}
