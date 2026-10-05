import { rateLimit } from "express-rate-limit";
import { StatusCodes } from "http-status-codes";

const seoAnalysisRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(StatusCodes.TOO_MANY_REQUESTS).json({
      success: false,
      message: "Too many SEO analysis requests. Try again in 15 minutes.",
    });
  },
});

export default seoAnalysisRateLimit;
