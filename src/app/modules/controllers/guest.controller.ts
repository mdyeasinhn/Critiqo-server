import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import pick from "../../shared/pick";
import { guestSearchableFields } from "../../constants/doctor.constant";
import { GuestService } from "../services/guest.service";
import sendResponse from "../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";

const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, guestSearchableFields);

  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

  const result = await GuestService.getAllFromDB(filters, options);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Guests retrieval successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const getByIdFromDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await GuestService.getByIdFromDB(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Guest retrieval successfully!",
    data: result,
  });
});

export const GuestController = {
  getAllFromDB,
  getByIdFromDB,
};
