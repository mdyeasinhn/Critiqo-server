import express, { NextFunction, Request, Response } from 'express';
import { UserController } from '../controllers/user.controller';
import { fileUploader } from '../../helpers/fileUploader';
import { userValidation } from '../validation/user.validation';


const router = express.Router();
router.post("/create-admin",

    fileUploader.upload.single("file"),
    (req: Request, res: Response, next: NextFunction) => {
        req.body = userValidation.createAdmin.parse(JSON.parse(req.body.data))
        return UserController.createAdmin(req, res, next)
    }
);


export const UserRoutes = router
