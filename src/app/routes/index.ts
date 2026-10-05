import express from "express";
import { UserRoutes } from "../modules/routes/user.route";
import { AuthRoutes } from "../modules/routes/auth.route";
import { AdminRoutes } from "../modules/routes/admin.routes";
import { PaymentRoute } from "../modules/routes/payment.route";
import { ReviewRoutes } from "../modules/routes/review.route";
import { CategoryRoutes } from "../modules/routes/category.route";
import { VoteRoutes } from "../modules/routes/vote.routes";
import { CommentRoutes } from "../modules/routes/comment.routes";
import { GuestRoutes } from "../modules/routes/guest.route";
import { AdminReviewRoutes } from "../modules/routes/adminReview.routes";
import SeoRoutes from "../modules/routes/seo.routes";
import PublicSeoRoutes from "../modules/routes/publicSeo.routes";
import SiteSettingsRoutes from "../modules/routes/siteSettings.routes";
import {
  AdminContentRoutes,
  PublicContentRoutes,
} from "../modules/routes/content.routes";
import { ImageRoutes } from "../modules/routes/image.routes";
import { SchemaRoutes } from "../modules/routes/schema.routes";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/user",
    route: UserRoutes,
  },
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/admin",
    route: AdminRoutes,
  },
  {
    path: "/admin",
    route: AdminReviewRoutes,
  },
  {
    path: "/admin/seo",
    route: SeoRoutes,
  },
  {
    path: "/admin/schema",
    route: SchemaRoutes,
  },
  {
    path: "/admin/site-settings",
    route: SiteSettingsRoutes,
  },
  {
    path: "/admin/content",
    route: AdminContentRoutes,
  },
  {
    path: "/admin/images",
    route: ImageRoutes,
  },
  {
    path: "/content",
    route: PublicContentRoutes,
  },
  {
    path: "/seo",
    route: PublicSeoRoutes,
  },
  {
    path: "/guest",
    route: GuestRoutes,
  },
  {
    path: "/reviews",
    route: ReviewRoutes,
  },
  {
    path: "/categories",
    route: CategoryRoutes,
  },
  {
    path: "/votes",
    route: VoteRoutes,
  },
  {
    path: "/comments",
    route: CommentRoutes,
  },
  {
    path: "/payment",
    route: PaymentRoute,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
