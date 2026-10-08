import { RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../shared/catchAsync";
import {
  getPublicSeoBySlug,
  getRobots,
  getSitemap,
} from "../services/publicSeo.service";
import { getSiteSettings } from "../services/siteSettings.service";
import { publicSeoParamsSchema } from "../validation/seo.validation";

const getSeo = catchAsync(async (req, res) => {
  const { type, slug } = publicSeoParamsSchema.parse(req.params);
  const data = await getPublicSeoBySlug(type, slug);

  res.status(StatusCodes.OK).json({ success: true, data });
});

const getSitemapIndex = catchAsync(async (_req, res) => {
  const data = await getSitemap();
  res.status(StatusCodes.OK).json({ success: true, data });
});

const getRobotsRules = catchAsync(async (_req, res) => {
  const data = await getRobots();
  res.status(StatusCodes.OK).json({ success: true, data });
});

const getPublicSiteSettings = catchAsync(async (_req, res) => {
  const data = await getSiteSettings();
  res.status(StatusCodes.OK).json({ success: true, data });
});

export const PublicSeoController: {
  getSeo: RequestHandler;
  getSitemap: RequestHandler;
  getRobots: RequestHandler;
  getSiteSettings: RequestHandler;
} = {
  getSeo,
  getSitemap: getSitemapIndex,
  getRobots: getRobotsRules,
  getSiteSettings: getPublicSiteSettings,
};
