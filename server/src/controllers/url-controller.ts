import { Request, Response } from "express";
import {
  createShortenedUrl,
  getShortenedUrlByCode,
  getAllShortenedUrls,
  getShortenedUrlsByUser,
  getShortenedUrlsByUserPaginated,
  logUrlClick,
  getUrlClickCount,
  getUrlClickCountByCode,
  deleteShortenedUrl,
  isUrlExpired,
  getShortenedUrlsWithClickCounts,
  getShortenedUrlsWithClickCountsPaginated,
  getDailyClickCounts,
} from "../models/shortened-url";
import redisService from "../services/redis.service";

/**
 * Create a new shortened URL
 */
export async function createUrl(req: Request, res: Response) {
  try {
    const { original_url, user_id, custom_code, expires_in_days } = req.body;

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

    // Validate expiration days if provided
    if (expires_in_days !== undefined) {
      const expiresInDays = Number(expires_in_days);

      if (isNaN(expiresInDays)) {
        return res.status(400).json({
          error: "Expiration days must be a number",
        });
      }

      if (expiresInDays < 0) {
        return res.status(400).json({
          error: "Expiration days cannot be negative",
        });
      }

      if (expiresInDays > 365) {
        return res.status(400).json({
          error: "Expiration days cannot exceed 365 days (1 year)",
        });
      }
    }

    // Create the shortened URL
    const shortenedUrl = await createShortenedUrl({
      original_url,
      user_id,
      custom_code,
      expires_in_days: expires_in_days ? Number(expires_in_days) : undefined,
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

    // Check if the URL has expired
    if (isUrlExpired(url)) {
      return res.status(410).json({
        error: "Shortened URL has expired",
        expired: true,
        url,
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
 *
 * Supports UTM parameters and other query parameters:
 * - Any query parameters in the request URL will be appended to the original URL
 * - If the original URL already has query parameters, the new ones will be added
 * - UTM parameters (utm_source, utm_medium, utm_campaign, etc.) are commonly used for tracking
 *
 * Uses Redis caching for improved performance:
 * - Caches URL lookups to reduce database load
 * - Uses Redis for fast click counting
 *
 * Example: /{code}?utm_source=newsletter&utm_medium=email&utm_campaign=summer_sale
 */
export async function redirectToUrl(req: Request, res: Response) {
  try {
    const { code } = req.params;
    const startTime = Date.now(); // For performance tracking

    // Skip redirection for API routes and other special paths
    if (code.startsWith("api") || code === "favicon.ico") {
      return res.status(404).json({
        error: "Not found",
      });
    }

    // Try to get the URL from Redis cache first (handled in getShortenedUrlByCode)
    const url = await getShortenedUrlByCode(code);

    // Log performance metrics
    const lookupTime = Date.now() - startTime;
    console.debug(`URL lookup for ${code} took ${lookupTime}ms`);

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

    // Check if the URL has expired
    if (isUrlExpired(url)) {
      return res.status(410).send(`
        <html>
          <head>
            <title>URL Expired</title>
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
              <h1>URL Expired</h1>
              <p>This shortened URL has expired and is no longer available.</p>
              <a href="/">Go to Homepage</a>
            </div>
          </body>
        </html>
      `);
    }

    // Log the URL click with user agent and IP address
    await logUrlClick(
      url.id,
      req.headers["user-agent"] || undefined,
      req.ip || undefined
    );

    // Get the original URL
    let targetUrl = url.original_url;

    // Check if there are query parameters in the request
    const queryParams = req.query;

    if (Object.keys(queryParams).length > 0) {
      try {
        // Parse the original URL
        const originalUrl = new URL(targetUrl);
        const originalSearchParams = new URLSearchParams(originalUrl.search);

        // Add all query parameters from the request to the original URL
        Object.entries(queryParams).forEach(([key, value]) => {
          if (typeof value === "string") {
            originalSearchParams.append(key, value);
          } else if (Array.isArray(value)) {
            value.forEach((v) => {
              if (typeof v === "string") {
                originalSearchParams.append(key, v);
              }
            });
          }
        });

        // Update the search part of the URL
        originalUrl.search = originalSearchParams.toString();

        // Get the final URL with parameters
        targetUrl = originalUrl.toString();
      } catch (error) {
        console.error("Error appending UTM parameters:", error);
        // If there's an error parsing the URL, fall back to the original URL
      }
    }

    // Redirect to the target URL with parameters
    return res.redirect(targetUrl);
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
 * Get shortened URLs by user ID with pagination and search
 */
export async function getUrlsByUser(req: Request, res: Response) {
  try {
    const { user_id } = req.params;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const pageSize = req.query.pageSize
      ? parseInt(req.query.pageSize as string)
      : 10;
    const search = req.query.search as string | undefined;

    // Validate pagination parameters
    if (isNaN(page) || page < 1) {
      return res.status(400).json({
        error: "Page must be a positive number",
      });
    }

    if (isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
      return res.status(400).json({
        error: "Page size must be between 1 and 100",
      });
    }

    const result = await getShortenedUrlsByUserPaginated(
      user_id,
      page,
      pageSize,
      search
    );

    return res.json({
      urls: result.data,
      pagination: {
        total: result.total,
        page,
        pageSize,
        totalPages: Math.ceil(result.total / pageSize),
      },
    });
  } catch (error) {
    console.error("Error fetching shortened URLs by user:", error);
    return res.status(500).json({
      error: "Failed to fetch shortened URLs by user",
    });
  }
}

/**
 * Log a click for a shortened URL
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

    // Log the URL click
    await logUrlClick(
      url.id,
      req.headers["user-agent"] || undefined,
      req.ip || undefined
    );

    // Get the updated click count
    const clickCount = await getUrlClickCount(url.id);

    return res.status(200).json({ success: true, clickCount });
  } catch (error) {
    console.error("Error logging URL click:", error);
    return res.status(500).json({
      error: "Failed to log URL click",
    });
  }
}

/**
 * Get click count for a shortened URL without incrementing it
 */
export async function getUrlClickCountEndpoint(req: Request, res: Response) {
  try {
    const { code } = req.params;

    // Check if the URL exists
    const url = await getShortenedUrlByCode(code);

    if (!url) {
      return res.status(404).json({
        error: "Shortened URL not found",
      });
    }

    // Get the click count without incrementing
    const clickCount = await getUrlClickCountByCode(code);

    return res.status(200).json({ success: true, clickCount });
  } catch (error) {
    console.error("Error getting URL click count:", error);
    return res.status(500).json({
      error: "Failed to get URL click count",
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

/**
 * Get shortened URLs by user ID with click counts in a single query, with pagination and search
 */
export async function getUrlsWithClickCounts(req: Request, res: Response) {
  try {
    const { user_id } = req.params;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const pageSize = req.query.pageSize
      ? parseInt(req.query.pageSize as string)
      : 10;
    const search = req.query.search as string | undefined;

    // Validate pagination parameters
    if (isNaN(page) || page < 1) {
      return res.status(400).json({
        error: "Page must be a positive number",
      });
    }

    if (isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
      return res.status(400).json({
        error: "Page size must be between 1 and 100",
      });
    }

    const result = await getShortenedUrlsWithClickCountsPaginated(
      user_id,
      page,
      pageSize,
      search
    );

    return res.json({
      urls: result.data,
      pagination: {
        total: result.total,
        page,
        pageSize,
        totalPages: Math.ceil(result.total / pageSize),
      },
    });
  } catch (error) {
    console.error("Error fetching shortened URLs with click counts:", error);
    return res.status(500).json({
      error: "Failed to fetch shortened URLs with click counts",
    });
  }
}

/**
 * Get daily click analytics for a shortened URL
 */
export async function getUrlAnalytics(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const days = req.query.days ? parseInt(req.query.days as string) : 7;

    // Validate days parameter
    if (isNaN(days) || days < 1 || days > 30) {
      return res.status(400).json({
        error: "Days parameter must be a number between 1 and 30",
      });
    }

    const dailyClicks = await getDailyClickCounts(id, days);

    return res.json({
      success: true,
      analytics: {
        dailyClicks,
        totalDays: days,
        urlId: id,
      },
    });
  } catch (error) {
    console.error("Error fetching URL analytics:", error);
    return res.status(500).json({
      error: "Failed to fetch URL analytics",
    });
  }
}
