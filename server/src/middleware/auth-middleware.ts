import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getUserById } from "../models/user";

// JWT secret key - should be in environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || "shortly-secret-key";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token from cookie and attaches user to request object
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Get token from cookie
    const token = req.cookies.auth_token;
    if (!token) {
      res.status(401).json({
        error: "Authentication required",
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
    };

    // Check if user exists
    getUserById(decoded.id)
      .then((user) => {
        if (!user) {
          res.status(401).json({
            error: "User not found",
          });
          return;
        }

        // Attach user to request object
        req.user = {
          id: decoded.id,
          email: decoded.email,
        };

        next();
      })
      .catch((error) => {
        console.error("Error fetching user:", error);
        res.status(500).json({
          error: "Authentication error",
        });
      });
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({
      error: "Invalid or expired token",
    });
  }
}

/**
 * Optional authentication middleware
 * Verifies JWT token from cookie if present, but doesn't require it
 */
export function optionalAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Get token from cookie
    const token = req.cookies.auth_token;
    if (!token) {
      // No token, but that's okay - continue without authentication
      next();
      return;
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: string;
        email: string;
      };

      // Check if user exists
      getUserById(decoded.id)
        .then((user) => {
          if (user) {
            // Attach user to request object
            req.user = {
              id: decoded.id,
              email: decoded.email,
            };
          }
          next();
        })
        .catch(() => {
          // Error fetching user, but that's okay - continue without authentication
          next();
        });
    } catch (tokenError) {
      // Invalid token, but that's okay - continue without authentication
      next();
    }
  } catch (error) {
    // Any other error, continue without authentication
    next();
  }
}
