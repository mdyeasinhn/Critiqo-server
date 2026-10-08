import { Router } from "express";
import requireAdmin from "../../../middleware/requireAdmin";
import { ContentController } from "../controllers/content.controller";

const adminRouter = Router();
adminRouter.use(requireAdmin);
adminRouter.post("/:type", ContentController.create);
adminRouter.put("/:type/:id", ContentController.update);

const publicRouter = Router();
publicRouter.get("/:type/:slug", ContentController.getPublic);

export const AdminContentRoutes = adminRouter;
export const PublicContentRoutes = publicRouter;
