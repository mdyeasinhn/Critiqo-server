import express from 'express';
import { GuestController } from '../controllers/guest.controller';


const router = express.Router();

router.get("/", GuestController.getAllFromDB);





export const GuestRoutes = router;