import { Router } from "express";
import requireAdmin from "../../../middleware/requireAdmin";
import { SchemaController } from "../controllers/schema.controller";

const router = Router();

router.use(requireAdmin);
router.get("/:type/:id/generate", SchemaController.generate);
router.put("/:type/:id", SchemaController.update);

export const SchemaRoutes = router;
