import { Router } from "express";
import requireAdmin from "../../../middleware/requireAdmin";
import { ImageController } from "../controllers/image.controller";

const router = Router();
router.use(requireAdmin);
router.get("/:type/:id", ImageController.list);
router.patch("/:imageId", ImageController.update);

export const ImageRoutes = router;
