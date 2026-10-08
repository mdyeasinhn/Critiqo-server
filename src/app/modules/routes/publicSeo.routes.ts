import { Router } from "express";
import { PublicSeoController } from "../controllers/publicSeo.controller";

const router = Router();

router.get("/sitemap", PublicSeoController.getSitemap);
router.get("/robots", PublicSeoController.getRobots);
router.get("/site-settings", PublicSeoController.getSiteSettings);
router.get("/:type/:slug", PublicSeoController.getSeo);

export default router;
