import express, { NextFunction, Request, Response } from "express";
import { UserController } from "../controllers/user.controller";
import { userValidation } from "../validation/user.validation";
import auth from "../../../middleware/auth";
import { UserRole } from "@prisma/client";
import validateRequest from "../../../middleware/validateRequest";

const router = express.Router();

router.get(
  "/me",
  auth(UserRole.ADMIN, UserRole.GUEST),
  UserController.getMyProfile,
);

router.get(
  "/",
  auth(UserRole.ADMIN, UserRole.GUEST),
  UserController.getAllUserFromDB,
);

router.post(
  "/create-admin",
  validateRequest(userValidation.createAdmin),
  UserController.createAdmin
)
router.post(
  "/create-guest",
  validateRequest(userValidation.createGuest),
  UserController.createGuest
);



router.patch(
  "/update-my-profile",
  auth(UserRole.ADMIN, UserRole.GUEST),
  UserController.updateMyProfile
);

router.delete(
  "/soft/:id",
  // auth(UserRole.ADMIN),
  UserController.softDeleteIntoDB,
);

export const UserRoutes = router;
