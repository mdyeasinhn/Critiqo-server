import { NextFunction, Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { PaymentService } from "../services/payment.service";


//-------------Payment  ------------------
const payment = catchAsync(async (req: Request, res: Response) => {
    const user  = req?.user;
    // console.log("user",user)
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

  const result = await PaymentService.paymentHistory(user);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'My payment history is getting successfully',
    data: result
  });
});


export const PaymentController = {
    payment,
    paymentHistory
}
