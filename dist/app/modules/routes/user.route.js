"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoutes = void 0;
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../controllers/user.controller");
const fileUploader_1 = require("../../helpers/fileUploader");
const user_validation_1 = require("../validation/user.validation");
const auth_1 = __importDefault(require("../../../middleware/auth"));
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
router.get('/me', (0, auth_1.default)(client_1.UserRole.ADMIN, client_1.UserRole.GUEST), user_controller_1.UserController.getMyProfile);
router.get('/', (0, auth_1.default)(client_1.UserRole.ADMIN, client_1.UserRole.GUEST), user_controller_1.UserController.getAllUserFromDB);
// In user.route.ts
router.post("/create-admin", 
// auth(UserRole.ADMIN),
fileUploader_1.fileUploader.upload.single("file"), (req, res, next) => {
    console.log('File:', req.file);
    console.log('Body:', req.body);
    try {
        req.body = user_validation_1.userValidation.createAdmin.parse(JSON.parse(req.body.data));
        return user_controller_1.UserController.createAdmin(req, res, next);
    }
    catch (error) {
        console.error('Parsing error:', error);
        next(error);
    }
});
router.post("/create-guest", fileUploader_1.fileUploader.upload.single("file"), (req, res, next) => {
    req.body = user_validation_1.userValidation.createGuest.parse(JSON.parse(req.body.data));
    return user_controller_1.UserController.createGuest(req, res, next);
});
router.patch("/update-my-profile", (0, auth_1.default)(client_1.UserRole.ADMIN, client_1.UserRole.GUEST), fileUploader_1.fileUploader.upload.single("file"), (req, res, next) => {
    req.body = JSON.parse(req.body.data);
    return user_controller_1.UserController.updateMyProfile(req, res, next);
});
exports.UserRoutes = router;
