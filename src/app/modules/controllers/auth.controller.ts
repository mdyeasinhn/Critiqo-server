import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { AuthService } from "../services/auth.service";
import { StatusCodes } from "http-status-codes";

/**
 * Login user
 */
const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.loginUser(req.body);

  // Set refresh token in HTTP-only cookie
  const { refreshToken, ...otherData } = result;
  res.cookie("refreshToken", refreshToken, {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    // sameSite: 'strict',
    // maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Logged in successfully!",
    data: otherData,
  });
});

/**
 * Refresh access token
 */
const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    throw new Error("Refresh token not found");
  }

  const result = await AuthService.refreshToken(refreshToken);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "New access token generated successfully!",
    data: result,
  });
});

/**
 * Logout user
 */
const logout = catchAsync(async (req: Request, res: Response) => {
  // Clear refresh token cookie
  res.clearCookie("refreshToken", {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "strict",
  });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Logged out successfully!",
    data: null,
  });
});

export const AuthController = {
  loginUser,
  refreshToken,
  logout,
};
