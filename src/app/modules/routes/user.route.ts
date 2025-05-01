import express, { NextFunction, Request, Response } from 'express';
import { UserController } from '../controllers/user.controller';
import { fileUploader } from '../../helpers/fileUploader';
import { userValidation } from '../validation/user.validation';


const router = express.Router();

// In user.route.ts
router.post("/create-admin",
    fileUploader.upload.single("file"),
    (req: Request, res: Response, next: NextFunction) => {
        console.log('File:', req.file);
        console.log('Body:', req.body);
        
        try {
            req.body = userValidation.createAdmin.parse(JSON.parse(req.body.data));
            return UserController.createAdmin(req, res, next);
        } catch (error) {
            console.error('Parsing error:', error);
            next(error);
        }
    }
);
router.post("/create-guest",
    fileUploader.upload.single("file"),
    (req: Request, res: Response, next: NextFunction) => {
        req.body = userValidation.createGuest.parse(JSON.parse(req.body.data))
        return UserController.createGuest(req, res, next)
    }
);


export const UserRoutes = router
