import { db } from "../db/knex";
import { randomBytes } from "crypto";

export interface ShortenedUrl {
  id: string;
  original_url: string;
  short_code: string;
  user_id?: string | null;
  expires_at?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UrlClick {
  id: string;
  shortened_url_id: string;
  clicked_at: Date;
  user_agent?: string | null;
  ip_address?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateShortenedUrlInput {
  original_url: string;
  user_id?: string;
  custom_code?: string;
  expires_in_days?: number;
}

const TABLE_NAME = "shortened_urls";

/**
 * Generate a random short code for URLs
 * @param length Length of the short code
 * @returns Random alphanumeric string
 */
export function generateShortCode(length: number = 8): string {
  return randomBytes(Math.ceil((length * 3) / 4))
    .toString("base64")
    .replace(/[+/]/g, "")
    .slice(0, length);
}

/**
 * Create a new shortened URL
 */
export async function createShortenedUrl(
  input: CreateShortenedUrlInput
): Promise<ShortenedUrl> {
  const short_code = input.custom_code || generateShortCode();

  // Check if the short code already exists
  const existingUrl = await db(TABLE_NAME).where({ short_code }).first();

  if (existingUrl) {
    if (input.custom_code) {
      // If custom code was provided and it already exists, throw an error
      throw new Error(
        `Custom code "${input.custom_code}" already exists. Please choose a different code.`
      );
    } else {
      // If generated code already exists, generate a new one recursively
      return createShortenedUrl(input);
    }
  }

  // Calculate expiration date if expires_in_days is provided
  let expires_at = null;
  if (input.expires_in_days && input.expires_in_days > 0) {
    expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + input.expires_in_days);
  }

  const [shortenedUrl] = await db(TABLE_NAME)
    .insert({
      original_url: input.original_url,
      short_code,
      user_id: input.user_id || null,
      expires_at,
    })
    .returning("*");

  return shortenedUrl;
}

/**
 * Check if a URL has expired
 * @param url The shortened URL to check
 * @returns True if the URL has expired, false otherwise
 */
export function isUrlExpired(url: ShortenedUrl): boolean {
  if (!url.expires_at) {
    return false; // No expiration date means it never expires
  }

  const expiryDate = new Date(url.expires_at);
  const now = new Date();

  return now > expiryDate;
}

/**
 * Get a shortened URL by its short code
 */
export async function getShortenedUrlByCode(
  short_code: string
): Promise<ShortenedUrl | null> {
  return db(TABLE_NAME).where({ short_code }).first();
}

/**
 * Get all shortened URLs
 */
export async function getAllShortenedUrls(): Promise<ShortenedUrl[]> {
  return db(TABLE_NAME).select("*").orderBy("createdAt", "desc");
}

/**
 * Get shortened URLs by user ID
 */
export async function getShortenedUrlsByUser(
  user_id: string
): Promise<ShortenedUrl[]> {
  return db(TABLE_NAME).where({ user_id }).orderBy("createdAt", "desc");
}

/**
 * Log a click for a shortened URL
 */
export async function logUrlClick(
  shortened_url_id: string,
  user_agent?: string,
  ip_address?: string
): Promise<void> {
  await db("url_clicks").insert({
    shortened_url_id,
    user_agent,
    ip_address,
  });
}

/**
 * Get the click count for a shortened URL
 */
export async function getUrlClickCount(
  shortened_url_id: string
): Promise<number> {
  const result = await db("url_clicks")
    .count("id as count")
    .where({ shortened_url_id })
    .first();

  return parseInt(result?.count as string) || 0;
}

/**
 * Get the click count for a shortened URL by short code
 */
export async function getUrlClickCountByCode(
  short_code: string
): Promise<number> {
  const url = await getShortenedUrlByCode(short_code);
  if (!url) {
    return 0;
  }

  return getUrlClickCount(url.id);
}

/**
 * Get recent clicks for a shortened URL
 */
export async function getRecentUrlClicks(
  shortened_url_id: string,
  limit: number = 10
): Promise<UrlClick[]> {
  return db("url_clicks")
    .where({ shortened_url_id })
    .orderBy("clicked_at", "desc")
    .limit(limit);
}

/**
 * Delete a shortened URL by its ID
 */
export async function deleteShortenedUrl(id: string): Promise<boolean> {
  const deleted = await db(TABLE_NAME).where({ id }).delete();

  return deleted > 0;
}

/**
 * Get all shortened URLs with pagination
 */
export async function getAllShortenedUrlsPaginated(
  page: number = 1,
  pageSize: number = 20
): Promise<{ data: ShortenedUrl[]; total: number }> {
  const offset = (page - 1) * pageSize;

  const [countResult] = await db(TABLE_NAME).count("id as count");
  const total = parseInt(countResult.count as string);

  const data = await db(TABLE_NAME)
    .select("*")
    .orderBy("createdAt", "desc")
    .limit(pageSize)
    .offset(offset);

  return { data, total };
}
