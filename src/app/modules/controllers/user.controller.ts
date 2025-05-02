import { NextFunction, Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { UserService } from "../services/user.service";
import sendResponse from "../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import pick from "../../shared/pick";
import { userFilterAbleFiled } from "../../constants/user.constant";


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

//-------------Get all User---------------------
const getAllUserFromDB = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, userFilterAbleFiled);
    const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);

    const result = await UserService.getAllUserFromDB(filters, options);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Retrieving all user data from the database",
        meta: result.meta,
        data: result?.data,
    });
});


export const UserController ={
    createAdmin,
    createGuest,
    getAllUserFromDB
}