import { NextFunction, Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { UserService } from "../services/user.service";
import sendResponse from "../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";


//-------------Create Admin ------------------
const createAdmin = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const result = await UserService.createAdmin(req);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Admin Created successfull!",
        data: result
    })
});

//-------------Create GUEST ------------------
const createGuest = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const result = await UserService.createGuest(req);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "User Created successfull!",
        data: result
    })
});

export const UserController ={
    createAdmin,
    createGuest,
}