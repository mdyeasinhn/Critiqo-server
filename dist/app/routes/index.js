"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_route_1 = require("../modules/routes/user.route");
const auth_route_1 = require("../modules/routes/auth.route");
const admin_routes_1 = require("../modules/routes/admin.routes");
const payment_route_1 = require("../modules/routes/payment.route");
const review_route_1 = require("../modules/routes/review.route");
const category_route_1 = require("../modules/routes/category.route");
const vote_routes_1 = require("../modules/routes/vote.routes");
const comment_routes_1 = require("../modules/routes/comment.routes");
const guest_route_1 = require("../modules/routes/guest.route");
const router = express_1.default.Router();
const moduleRoutes = [
    {
        path: '/user',
        route: user_route_1.UserRoutes
    },
    {
        path: '/auth',
        route: auth_route_1.AuthRoutes
    },
    {
        path: '/admin',
        route: admin_routes_1.AdminRoutes
    },
    {
        path: '/guest',
        route: guest_route_1.GuestRoutes
    },
    {
        path: '/reviews',
        route: review_route_1.ReviewRoutes
    },
    {
        path: '/categories',
        route: category_route_1.CategoryRoutes
    },
    {
        path: '/votes',
        route: vote_routes_1.VoteRoutes
    },
    {
        path: '/comments',
        route: comment_routes_1.CommentRoutes
    },
    {
        path: '/payment',
        route: payment_route_1.PaymentRoute,
    },
];
moduleRoutes.forEach(route => router.use(route.path, route.route));
exports.default = router;
