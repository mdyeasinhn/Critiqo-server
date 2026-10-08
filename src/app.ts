import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import router from "./app/routes";
import cookieParser from "cookie-parser";
import { StatusCodes } from "http-status-codes";
import globalErrorHandler from "./middleware/globalErrorHandler";
import seoRoutes from "./app/modules/routes/seo.routes";
import publicSeoRoutes from "./app/modules/routes/publicSeo.routes";
import siteSettingsRoutes from "./app/modules/routes/siteSettings.routes";
import {
  AdminContentRoutes,
  PublicContentRoutes,
} from "./app/modules/routes/content.routes";
import { ImageRoutes } from "./app/modules/routes/image.routes";
import { SchemaRoutes } from "./app/modules/routes/schema.routes";

const app: Application = express();

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://revuloop-two.vercel.app",
      "https://critiqo-frontend-project.vercel.app",
    ],
    credentials: true,
  }),
);

app.use(cookieParser());

// parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req: Request, res: Response) => {
  res.send({
    message: "Critiqo server",
  });
});

app.get("/contactus", (_req: Request, res: Response) => {
  res.redirect(StatusCodes.MOVED_PERMANENTLY, "/contact");
});

app.get("/api/contactus", (_req: Request, res: Response) => {
  res.redirect(StatusCodes.MOVED_PERMANENTLY, "/contact");
});

// Application routes
app.use("/api/admin/seo", seoRoutes);
app.use("/api/admin/schema", SchemaRoutes);
app.use("/api/admin/site-settings", siteSettingsRoutes);
app.use("/api/admin/content", AdminContentRoutes);
app.use("/api/admin/images", ImageRoutes);
app.use("/api/content", PublicContentRoutes);
app.use("/api/seo", publicSeoRoutes);
app.use("/api/v1", router);

app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: "Route not found",
    error: {
      path: req.originalUrl,
      message: "Your requested method is not found",
    },
  });
});

// Global Error Handler
app.use(globalErrorHandler);
export default app;
