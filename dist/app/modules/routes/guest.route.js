"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuestRoutes = void 0;
const express_1 = __importDefault(require("express"));
const guest_controller_1 = require("../controllers/guest.controller");
const router = express_1.default.Router();
router.get("/", guest_controller_1.GuestController.getAllFromDB);
router.get("/:id", guest_controller_1.GuestController.getByIdFromDB);
exports.GuestRoutes = router;
