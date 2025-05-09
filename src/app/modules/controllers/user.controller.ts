import { NextFunction, Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { UserService } from "../services/user.service";
import sendResponse from "../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import pick from "../../shared/pick";
import { userFilterAbleFiled } from "../../constants/user.constant";
import { IAuthUser } from "../../interface/common";

declare module "express-serve-static-core" {
  interface Request {
    user?: IAuthUser;
  }
}
//-------------Create Admin ------------------
const createAdmin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await UserService.createAdmin(req);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Admin Created successfull!",
      data: result,
    });
  },
);

//-------------Create GUEST ------------------
const createGuest = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await UserService.createGuest(req);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "User Created successfull!",
      data: result,
    });
  },
);

//-------------Get all User---------------------
const getAllUserFromDB = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, userFilterAbleFiled);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

  const result = await UserService.getAllUserFromDB(filters, options);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Retrieving all user data from the database",
    meta: result.meta,
    data: result?.data,
  });
});

//-------------Get my profile---------------------
const getMyProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    const result = await UserService.getMyProfile(user as IAuthUser);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Retrieving My Profile Data!",
      data: result,
    });
  },
);

//-------------Profile update---------------------

const updateMyProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    const result = await UserService.updateMyProfile(user as IAuthUser, req);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Updateing My Profile Data!",
      data: result,
    });
  },
);

// Soft delete User data by ID (mark as deleted without removing)
const softDeleteIntoDB = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const result = await UserService.softDeleteFromDB(id);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "User data deleted!",
      data: result,
    });
  },
);

export const UserController = {
  createAdmin,
  createGuest,
  getAllUserFromDB,
  getMyProfile,
  updateMyProfile,
  softDeleteIntoDB,
};
