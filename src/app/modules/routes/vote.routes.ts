import express, { NextFunction, Request, Response } from "express";
import { VoteController } from "../controllers/vote.controller";
import { UserRole } from "@prisma/client";
import auth from "../../../middleware/auth";
import { voteValidation } from "../validation/vote.validation";

const router = express.Router();

// Public route - get votes for a review
router.get("/:reviewId", VoteController.getVotes);

// Protected routes - require authentication
// Add/update/remove a vote
router.post(
  "/",
  auth(UserRole.ADMIN, UserRole.USER, UserRole.GUEST),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = voteValidation.addVote.parse(req.body);
      return next();
    } catch (error) {
      next(error);
    }
  },
  VoteController.addVote,
);

// Get user's vote on a review
router.get(
  "/user/:reviewId",
  auth(UserRole.ADMIN, UserRole.USER, UserRole.GUEST),
  VoteController.getUserVote,
);

export const VoteRoutes = router;
