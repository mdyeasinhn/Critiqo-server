import { NextFunction, Request, Response } from "express";
import { Secret } from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { jwtHelpars } from "../app/helpers/jwtHelpers";
import config from "../app/config";
import ApiError from "../app/error/ApiError";
import prisma from "../app/modules/models"; // Import Prisma client

/**
 * Authentication and authorization middleware
 * @param roles Authorized roles for the route
 * @returns Express middleware function
 */
const auth = (...roles: string[]) => {
  return async (
    req: Request & { user?: any },
    res: Response,
    next: NextFunction,
  ) => {
    try {
      // Get token from authorization header
      const token = req.headers.authorization;

      if (!token) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "You are not authorized!");
      }

      // Verify token
      const verifiedUser = jwtHelpars.verifyToken(
        token,
        config.jwt.secret as Secret,
      );

      // Log verification for debugging
      console.log("Verified user from token:", verifiedUser);

      // If there's no userId but there is an email, look up the user to get the ID
      if (!verifiedUser.userId && verifiedUser.email) {
        try {
          // Find user by email
          const user = await prisma.user.findUnique({
            where: { email: verifiedUser.email },
          });

          if (user) {
            verifiedUser.userId = user.id;
            console.log(
              "Added userId from database lookup:",
              verifiedUser.userId,
            );
          }
        } catch (error) {
          console.error("Error looking up user by email:", error);
        }
      }

      // Set user data in request object
      req.user = verifiedUser;

      // Check if user has required role
      if (roles.length && !roles.includes(verifiedUser.role)) {
        throw new ApiError(
          StatusCodes.FORBIDDEN,
          "You don't have permission to access this resource!",
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

export default auth;
