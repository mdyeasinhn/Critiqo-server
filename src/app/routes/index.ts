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
