import { Router } from "express";
import requireAdmin from "../../../middleware/requireAdmin";
import seoAnalysisRateLimit from "../../../middleware/seoAnalysisRateLimit";
import { SeoController } from "../controllers/seo.controller";

const router = Router();

router.use(requireAdmin);
router.post("/analyze", seoAnalysisRateLimit, SeoController.analyze);
router.get("/", SeoController.list);
router.get("/:type/:id", SeoController.get);
router.put("/:type/:id", SeoController.update);

export default router;
