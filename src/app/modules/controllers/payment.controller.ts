import { NextFunction, Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { PaymentService } from "../services/payment.service";



//-------------Payment Intent ------------------
const paymentIntent = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const price: number = req.body.price;
    const result = await PaymentService.createPaymentIntent(price);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Payment intent created successfully!",
        data: result
    })
});


export const PaymentController = {
    paymentIntent
}
