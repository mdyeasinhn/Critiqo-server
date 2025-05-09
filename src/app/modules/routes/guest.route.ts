import express from "express";
import { GuestController } from "../controllers/guest.controller";

const router = express.Router();

router.get("/", GuestController.getAllFromDB);

router.get("/:id", GuestController.getByIdFromDB);

export const GuestRoutes = router;
