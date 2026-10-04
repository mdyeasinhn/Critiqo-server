import { Router } from "express";
import requireAdmin from "../../../middleware/requireAdmin";
import { SeoController } from "../controllers/seo.controller";

const router = Router();

router.use(requireAdmin);
router.get("/", SeoController.list);
router.get("/:type/:id", SeoController.get);
router.put("/:type/:id", SeoController.update);

export default router;
