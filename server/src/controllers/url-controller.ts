import { Request, Response } from "express";
import {
  createShortenedUrl,
  getShortenedUrlByCode,
  getAllShortenedUrls,
  getShortenedUrlsByUser,
  incrementClickCount,
  deleteShortenedUrl,
} from "../models/shortened-url";

/**
 * Create a new shortened URL
 */
export async function createUrl(req: Request, res: Response) {
  try {
    const { original_url, user_id, custom_code } = req.body;

    if (!original_url) {
      return res.status(400).json({
        error: "Original URL is required",
      });
    }

    // Validate URL format
    try {
      new URL(original_url);
    } catch (error) {
      return res.status(400).json({
        error: "Invalid URL format",
      });
    }

    // Create the shortened URL
    const shortenedUrl = await createShortenedUrl({
      original_url,
      user_id,
      custom_code,
    });

    return res.status(201).json({ url: shortenedUrl });
  } catch (error) {
    console.error("Error creating shortened URL:", error);

    // Check if this is a custom code already exists error
    if (error instanceof Error && error.message.includes("already exists")) {
      return res.status(409).json({
        error: error.message,
      });
    }

    return res.status(500).json({
      error: "Failed to create shortened URL",
    });
  }
}

/**
 * Get a shortened URL by its short code
 */
export async function getUrlByCode(req: Request, res: Response) {
  try {
    const { code } = req.params;
    const url = await getShortenedUrlByCode(code);

    if (!url) {
      return res.status(404).json({
        error: "Shortened URL not found",
      });
    }

    return res.json({ url });
  } catch (error) {
    console.error("Error fetching shortened URL:", error);
    return res.status(500).json({
      error: "Failed to fetch shortened URL",
    });
  }
}

/**
 * Redirect to the original URL and increment click count
 */
export async function redirectToUrl(req: Request, res: Response) {
  try {
    const { code } = req.params;
    const url = await getShortenedUrlByCode(code);

    if (!url) {
      return res.status(404).json({
        error: "Shortened URL not found",
      });
    }

    // Increment the click count
    await incrementClickCount(code);

    // Redirect to the original URL
    return res.redirect(url.original_url);
  } catch (error) {
    console.error("Error redirecting to URL:", error);
    return res.status(500).json({
      error: "Failed to redirect to URL",
    });
  }
}

/**
 * Get all shortened URLs
 */
export async function getAllUrls(req: Request, res: Response) {
  try {
    const urls = await getAllShortenedUrls();
    return res.json({ urls });
  } catch (error) {
    console.error("Error fetching all shortened URLs:", error);
    return res.status(500).json({
      error: "Failed to fetch shortened URLs",
    });
  }
}

/**
 * Get shortened URLs by user ID
 */
export async function getUrlsByUser(req: Request, res: Response) {
  try {
    const { user_id } = req.params;
    const urls = await getShortenedUrlsByUser(user_id);
    return res.json({ urls });
  } catch (error) {
    console.error("Error fetching shortened URLs by user:", error);
    return res.status(500).json({
      error: "Failed to fetch shortened URLs by user",
    });
  }
}

/**
 * Delete a shortened URL
 */
export async function deleteUrl(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const deleted = await deleteShortenedUrl(id);

    if (!deleted) {
      return res.status(404).json({
        error: "Shortened URL not found",
      });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("Error deleting shortened URL:", error);
    return res.status(500).json({
      error: "Failed to delete shortened URL",
    });
  }
}
