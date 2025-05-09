import express, { NextFunction, Request, Response } from "express";
import auth from "../../../middleware/auth";
import { UserRole } from "@prisma/client";
import { PaymentController } from "../controllers/payment.controller";

const router = express.Router();

router.get("/history", auth(UserRole.GUEST), PaymentController.paymentHistory);

router.get("/total-earning", auth(UserRole.ADMIN), PaymentController.getTotalEraning);

router.post(
  "/",
  auth(UserRole.GUEST, UserRole.ADMIN),
  PaymentController.payment,
);

export const PaymentRoute = router;
