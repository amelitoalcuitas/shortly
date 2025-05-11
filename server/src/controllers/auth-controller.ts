import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import {
  createUser,
  getUserByEmail,
  validatePassword,
  generateResetToken,
  resetPassword,
} from "../models/user";
import emailService from "../services/email.service";

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Cookie configuration
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // Use secure cookies in production
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  path: "/",
};

// JWT secret key - should be in environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || "shortly-secret-key";
const JWT_EXPIRY = "7d"; // Token expires in 7 days

/**
 * Register a new user
 */
export async function signup(req: Request, res: Response) {
  try {
    const { email, password, name } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    // Validate email format
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({
        error: "Invalid email format",
      });
    }

    // Validate password strength (at least 8 characters)
    if (password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters long",
      });
    }

    // Create the user
    const user = await createUser({
      email,
      password,
      name,
    });

    // Generate JWT token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRY,
    });

    // Set the token in an HttpOnly cookie
    res.cookie("auth_token", token, COOKIE_OPTIONS);

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(user);
    } catch (emailError) {
      console.error("Error sending welcome email:", emailError);
      // Continue with the response even if email fails
    }

    // Return user info (excluding password)
    return res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: any) {
    console.error("Error creating user:", error);

    // Handle duplicate email error
    if (error.message && error.message.includes("already exists")) {
      return res.status(409).json({
        error: "Email already in use",
      });
    }

    return res.status(500).json({
      error: "Failed to create user",
    });
  }
}

/**
 * Login a user
 */
export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    // Find the user
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    // Validate password
    const isPasswordValid = await validatePassword(user, password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRY,
    });

    // Set the token in an HttpOnly cookie
    res.cookie("auth_token", token, COOKIE_OPTIONS);

    // Return user info (excluding password)
    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Error logging in:", error);
    return res.status(500).json({
      error: "Failed to log in",
    });
  }
}

/**
 * Request a password reset
 */
export async function requestPasswordReset(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Email is required",
      });
    }

    // Validate email format
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({
        error: "Invalid email format",
      });
    }

    // Generate reset token
    const resetToken = await generateResetToken(email);

    // Send password reset email if the email exists
    if (resetToken) {
      try {
        await emailService.sendPasswordResetEmail(email, resetToken);
      } catch (emailError) {
        console.error("Error sending password reset email:", emailError);
        // We still return success to prevent user enumeration
      }
    }

    // Always return success even if the email doesn't exist
    // This prevents user enumeration attacks
    const response: any = {
      message:
        "If an account with that email exists, a password reset link has been sent",
    };

    // For development purposes, include the token in the response
    if (process.env.NODE_ENV !== "production" && resetToken) {
      response.resetToken = resetToken;
      response.resetLink = `${
        process.env.CLIENT_URL || "http://localhost:3000"
      }/reset-password?email=${encodeURIComponent(email)}&token=${resetToken}`;
    }

    return res.json(response);
  } catch (error) {
    console.error("Error requesting password reset:", error);
    return res.status(500).json({
      error: "Failed to request password reset",
    });
  }
}

/**
 * Reset password with token
 */
export async function resetPasswordWithToken(req: Request, res: Response) {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res.status(400).json({
        error: "Email, token, and new password are required",
      });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters long",
      });
    }

    // Validate token and reset password
    const success = await resetPassword(email, token, newPassword);

    if (!success) {
      return res.status(400).json({
        error: "Invalid or expired reset token",
      });
    }

    return res.json({
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({
      error: "Failed to reset password",
    });
  }
}

/**
 * Logout a user by clearing the auth cookie
 */
export async function logout(_req: Request, res: Response) {
  try {
    // Clear the auth cookie
    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return res.json({
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Error logging out:", error);
    return res.status(500).json({
      error: "Failed to log out",
    });
  }
}
