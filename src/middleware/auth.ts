import { NextFunction, Request, Response } from 'express';
import { Secret } from 'jsonwebtoken';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import { UserRole } from '@prisma/client';
import { IJwtPayload } from '../app/interface/file';
import config from '../app/config';
import ApiError from '../app/shared/ApiError';

declare global {
  namespace Express {
    interface Request {
      user: IJwtPayload;
    }
  }
}

const verifyToken = async (token: string): Promise<JwtPayload> => {
  try {
    return jwt.verify(token, config.jwt.secret as Secret) as JwtPayload;
  } catch (error) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid token');
  }
};

const auth = (...requiredRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get authorization token
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'You are not authorized');
      }

      // Verify token
      const verifiedUser = await verifyToken(token);

      // Set user info in request object
      req.user = verifiedUser as IJwtPayload;

      // Check if user role is in required roles
      if (requiredRoles.length && !requiredRoles.includes(req.user.role)) {
        throw new ApiError(
          StatusCodes.FORBIDDEN,
          'You do not have permission to access this resource'
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default auth;