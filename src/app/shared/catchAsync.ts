// shared/catchAsync.ts
import { Request, Response, NextFunction, RequestHandler } from "express";

const catchAsync =
  <T extends Request = Request>(
    fn: (req: T, res: Response, next: NextFunction) => Promise<void>,
  ): RequestHandler =>
  (req, res, next) => {
    fn(req as T, res, next).catch(next);
  };

export default catchAsync;
