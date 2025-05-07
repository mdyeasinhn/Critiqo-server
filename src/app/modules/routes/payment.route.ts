import express, { NextFunction, Request, Response } from 'express';
import auth from '../../../middleware/auth';
import { UserRole } from '@prisma/client';
import { PaymentController } from '../controllers/payment.controller';



const router = express.Router();

router.post("/",
    auth(UserRole.GUEST, UserRole.ADMIN),
    PaymentController.payment
);


export const PaymentRoute = router
