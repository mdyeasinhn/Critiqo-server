import express, { NextFunction, Request, Response } from "express";
import { UserController } from "../controllers/user.controller";
import { fileUploader } from "../../helpers/fileUploader";
import { userValidation } from "../validation/user.validation";
import auth from "../../../middleware/auth";
import { UserRole } from "@prisma/client";

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
// In user.route.ts
router.post(
  "/create-admin",
  //  auth(UserRole.ADMIN),
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    console.log("File:", req.file);
    console.log("Body:", req.body);

    try {
      req.body = userValidation.createAdmin.parse(JSON.parse(req.body.data));
      return UserController.createAdmin(req, res, next);
    } catch (error) {
      console.error("Parsing error:", error);
      next(error);
    }
  },
);
router.post(
  "/create-guest",
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    req.body = userValidation.createGuest.parse(JSON.parse(req.body.data));
    return UserController.createGuest(req, res, next);
  },
);

router.patch(
  "/update-my-profile",
  auth(UserRole.ADMIN, UserRole.GUEST),
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    req.body = JSON.parse(req.body.data);
    return UserController.updateMyProfile(req, res, next);
  },
);

router.delete(
  "/soft/:id",
  // auth(UserRole.ADMIN),
  UserController.softDeleteIntoDB,
);

export const UserRoutes = router;
