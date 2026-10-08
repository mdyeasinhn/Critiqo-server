import { Router } from "express";
import requireAdmin from "../../../middleware/requireAdmin";
import { SiteSettingsController } from "../controllers/siteSettings.controller";

const router = Router();

router.use(requireAdmin);
router.get("/", SiteSettingsController.get);
router.put("/", SiteSettingsController.update);

export default router;
