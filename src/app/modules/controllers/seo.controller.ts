import { RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../shared/catchAsync";
import {
  getSeoContent,
  listSeoContent,
  updateSeoContent,
} from "../services/seo.service";
import {
  analyzeContent,
  calculateSeoScore,
} from "../../../lib/seo-analysis/contentChecks";
import {
  seoAnalysisSchema,
  seoParamsSchema,
  seoUpdateSchema,
} from "../validation/seo.validation";

const list = catchAsync(async (_req, res) => {
  const data = await listSeoContent();
  res.status(StatusCodes.OK).json({
    success: true,
    message: "SEO content retrieved successfully",
    data,
  });
});

const get = catchAsync(async (req, res) => {
  const { type, id } = seoParamsSchema.parse(req.params);
  const data = await getSeoContent(type, id);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "SEO content retrieved successfully",
    data,
  });
});

const update = catchAsync(async (req, res) => {
  const { type, id } = seoParamsSchema.parse(req.params);
  const input = seoUpdateSchema.parse(req.body);
  const data = await updateSeoContent(type, id, input);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "SEO content updated successfully",
    data,
  });
});

const analyze = catchAsync(async (req, res) => {
  const input = seoAnalysisSchema.parse(req.body);
  const checks = analyzeContent({
    html: input.html,
    title: input.seoTitle,
    description: input.metaDescription,
    slug: input.slug,
    keyword: input.focusKeyword,
  });
  res.status(StatusCodes.OK).json({
    success: true,
    message: "SEO content analysis completed",
    data: { score: calculateSeoScore(checks), checks },
  });
});

export const SeoController: {
  list: RequestHandler;
  get: RequestHandler;
  update: RequestHandler;
  analyze: RequestHandler;
} = { list, get, update, analyze };
