import express from "express";
import {
  signup,
  login,
  logout,
  requestPasswordReset,
  resetPasswordWithToken,
} from "../controllers/auth-controller";
import { authenticate } from "../middleware/auth-middleware";

const router = express.Router();

// Register a new user
router.post("/signup", (req, res) => {
  signup(req, res);
});

// Login a user
router.post("/login", (req, res) => {
  login(req, res);
});

// Logout a user
router.post("/logout", (req, res) => {
  logout(req, res);
});

// Request password reset
router.post("/forgot-password", (req, res) => {
  requestPasswordReset(req, res);
});

// Reset password with token
router.post("/reset-password", (req, res) => {
  resetPasswordWithToken(req, res);
});

// Get current user (protected route)
router.get("/me", authenticate, (req, res) => {
  res.json({
    user: {
      id: req.user?.id,
      email: req.user?.email,
    },
  });
});

export default router;
