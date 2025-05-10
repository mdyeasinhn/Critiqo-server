import { UserStatus } from "@prisma/client";
import prisma from "../models";
import bcrypt from "bcrypt";
import { jwtHelpars } from "../../helpers/jwtHelpers";
import config from "../../config";
import { Secret } from "jsonwebtoken";
import ApiError from "../../error/ApiError";
import { StatusCodes } from "http-status-codes";

/**
 * Login user with email and password
 */
const loginUser = async (payload: { email: string; password: string }) => {
  // Find user by email
  const userData = await prisma.user.findUnique({
    where: {
      email: payload.email,
      status: UserStatus.ACTIVE,
    },
  });

  if (!userData) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid credentials");
  }

  // Verify password
  const isCorrectPassword: boolean = await bcrypt.compare(
    payload.password,
    userData.password,
  );

  if (!isCorrectPassword) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid credentials");
  }

  // Create token payload with all necessary fields
  const tokenPayload = {
    userId: userData.id, // Must include userId explicitly
    id: userData.id, // Include id as a backup
    email: userData.email,
    role: userData.role,
  };

  // Generate access token
  const accessToken = jwtHelpars.generateToken(
    tokenPayload,
    config.jwt.secret as Secret,
    config.jwt.expires_in as string,
  );

  // Generate refresh token
  const refreshToken = jwtHelpars.generateToken(
    tokenPayload,
    config.jwt.refresh_secret as Secret,
    config.jwt.refresh_expires_in as string,
  );

  return {
    accessToken,
    refreshToken,
    needPasswordChange: userData.needPasswordChange,
  };
};

/**
 * Refresh access token using refresh token
 */
const refreshToken = async (token: string) => {
  let decodedData;
  try {
    // Verify refresh token
    decodedData = jwtHelpars.verifyToken(
      token,
      config.jwt.refresh_secret as Secret,
    );
    console.log("Decoded refresh token:", decodedData);
  } catch (error) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid refresh token");
  }

  // Check if necessary data is present
  if (!decodedData.email) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid token payload");
  }

  // Find user by email
  const userData = await prisma.user.findUnique({
    where: {
      email: decodedData.email,
      status: UserStatus.ACTIVE,
    },
  });

  if (!userData) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  // Create token payload with all necessary fields
  const tokenPayload = {
    userId: userData.id, // Must include userId explicitly
    id: userData.id, // Include id as a backup
    email: userData.email,
    role: userData.role,
  };

  // Generate new access token
  const accessToken = jwtHelpars.generateToken(
    tokenPayload,
    config.jwt.secret as Secret,
    config.jwt.expires_in as string,
  );

  return {
    accessToken,
    needPasswordChange: userData.needPasswordChange,
  };
};

export const AuthService = {
  loginUser,
  refreshToken,
};
