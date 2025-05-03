"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoteRoutes = void 0;
const express_1 = __importDefault(require("express"));
const vote_controller_1 = require("../controllers/vote.controller");
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../../middleware/auth"));
const vote_validation_1 = require("../validation/vote.validation");
const router = express_1.default.Router();
// Public route - get votes for a review
router.get('/:reviewId', vote_controller_1.VoteController.getVotes);
// Protected routes - require authentication
// Add/update/remove a vote
router.post('/', (0, auth_1.default)(client_1.UserRole.ADMIN, client_1.UserRole.USER, client_1.UserRole.GUEST), (req, res, next) => {
    try {
        req.body = vote_validation_1.voteValidation.addVote.parse(req.body);
        return next();
    }
    catch (error) {
        next(error);
    }
}, vote_controller_1.VoteController.addVote);
// Get user's vote on a review
router.get('/user/:reviewId', (0, auth_1.default)(client_1.UserRole.ADMIN, client_1.UserRole.USER, client_1.UserRole.GUEST), vote_controller_1.VoteController.getUserVote);
exports.VoteRoutes = router;
