import { RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../shared/catchAsync";
import {
  getSiteSettings,
  updateSiteSettings,
} from "../services/siteSettings.service";
import { siteSettingsUpdateSchema } from "../validation/siteSettings.validation";

const get = catchAsync(async (_req, res) => {
  const data = await getSiteSettings();
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Site settings retrieved successfully",
    data,
  });
});

const update = catchAsync(async (req, res) => {
  const input = siteSettingsUpdateSchema.parse(req.body);
  const data = await updateSiteSettings(input);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Site settings updated successfully",
    data,
  });
});

export const SiteSettingsController: {
  get: RequestHandler;
  update: RequestHandler;
} = { get, update };
