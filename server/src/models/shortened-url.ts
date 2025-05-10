import { db } from "../db/knex";
import { randomBytes } from "crypto";

export interface ShortenedUrl {
  id: string;
  original_url: string;
  short_code: string;
  user_id?: string | null;
  click_count: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateShortenedUrlInput {
  original_url: string;
  user_id?: string;
  custom_code?: string;
}

const TABLE_NAME = "shortened_urls";

/**
 * Generate a random short code for URLs
 * @param length Length of the short code
 * @returns Random alphanumeric string
 */
export function generateShortCode(length: number = 6): string {
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

  const [shortenedUrl] = await db(TABLE_NAME)
    .insert({
      original_url: input.original_url,
      short_code,
      user_id: input.user_id || null,
      click_count: 0,
    })
    .returning("*");

  return shortenedUrl;
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
 * Increment the click count for a shortened URL
 */
export async function incrementClickCount(short_code: string): Promise<void> {
  await db(TABLE_NAME).where({ short_code }).increment("click_count", 1);
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
