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

    // Skip redirection for API routes and other special paths
    if (code.startsWith("api") || code === "favicon.ico") {
      return res.status(404).json({
        error: "Not found",
      });
    }

    const url = await getShortenedUrlByCode(code);

    if (!url) {
      // For development, we can show a more user-friendly error page
      return res.status(404).send(`
        <html>
          <head>
            <title>URL Not Found</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background-color: #f5f5f5;
              }
              .container {
                text-align: center;
                padding: 2rem;
                background-color: white;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                max-width: 500px;
              }
              h1 {
                color: #ff0054;
                margin-bottom: 1rem;
              }
              p {
                color: #333;
                margin-bottom: 1.5rem;
              }
              a {
                display: inline-block;
                background-color: #ff0054;
                color: white;
                padding: 0.5rem 1rem;
                text-decoration: none;
                border-radius: 4px;
                font-weight: bold;
              }
              a:hover {
                opacity: 0.9;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>URL Not Found</h1>
              <p>The shortened URL you're looking for doesn't exist or has been removed.</p>
              <a href="/">Go to Homepage</a>
            </div>
          </body>
        </html>
      `);
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
export async function getAllUrls(_req: Request, res: Response) {
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
 * Increment the click count for a shortened URL
 */
export async function incrementUrlClickCount(req: Request, res: Response) {
  try {
    const { code } = req.params;

    // Check if the URL exists
    const url = await getShortenedUrlByCode(code);

    if (!url) {
      return res.status(404).json({
        error: "Shortened URL not found",
      });
    }

    // Increment the click count
    await incrementClickCount(code);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error incrementing click count:", error);
    return res.status(500).json({
      error: "Failed to increment click count",
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
