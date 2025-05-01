import { NextFunction, Request, Response } from 'express';
import { Secret } from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import { jwtHelpars } from '../app/helpers/jwtHelpers';
import config from '../app/config';
import ApiError from '../app/error/ApiError';


const auth = (...roles: string[]) => {
    return async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
        try {
            const token = req.headers.authorization;

            if (!token) {
                throw new ApiError(StatusCodes.UNAUTHORIZED, "You are not authorized!")
            }

            const verifiedUser = jwtHelpars.verifyToken(token, config.jwt.secret as Secret);

            req.user = verifiedUser

            if (roles.length && !roles.includes(verifiedUser.role)) {
                throw new ApiError(StatusCodes.FORBIDDEN, "Forbidden!")
            }
            next()
        } catch (err) {
            next(err)
        }
    }
}

export default auth;