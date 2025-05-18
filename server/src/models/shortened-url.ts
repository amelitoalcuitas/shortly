import { db } from "../db/knex"
import { randomBytes } from "crypto"
import redisService from "../services/redis.service"

export interface ShortenedUrl {
  id: string
  original_url: string
  short_code: string
  user_id?: string | null
  expires_at?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface UrlClick {
  id: string
  shortened_url_id: string
  clicked_at: Date
  user_agent?: string | null
  ip_address?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateShortenedUrlInput {
  original_url: string
  user_id?: string
  custom_code?: string
  expires_in_days?: number
}

const TABLE_NAME = "shortened_urls"

/**
 * Generate a random short code for URLs
 * @param length Length of the short code
 * @returns Random alphanumeric string
 */
export function generateShortCode(length: number = 8): string {
  return randomBytes(Math.ceil((length * 3) / 4))
    .toString("base64")
    .replace(/[+/]/g, "")
    .slice(0, length)
}

/**
 * Create a new shortened URL
 */
export async function createShortenedUrl(
  input: CreateShortenedUrlInput
): Promise<ShortenedUrl> {
  const short_code = input.custom_code || generateShortCode()

  // Check if a NON-EXPIRED URL with the short code already exists
  const existingNonExpiredUrl = await db(TABLE_NAME)
    .where({ short_code })
    .andWhere(function () {
      this.whereNull("expires_at").orWhere("expires_at", ">", new Date())
    })
    .first()

  if (existingNonExpiredUrl) {
    if (input.custom_code) {
      // If custom code was provided and a non-expired URL with this code exists, throw an error
      throw new Error(
        `Custom code "${input.custom_code}" already exists and is still active. Please choose a different code.`
      )
    } else {
      // If generated code already exists and is non-expired, generate a new one recursively
      console.warn(
        `Generated short code "${short_code}" already exists and is active. Regenerating.`
      )
      return createShortenedUrl(input) // Recursive call with the same input, will generate a new code
    }
  }

  // If we reach here, either no URL exists with this code, or only expired URLs exist.
  // We can proceed to create or update a URL with this short_code.

  // Check if an EXPIRED URL exists with this short code
  const existingExpiredUrl = await db(TABLE_NAME)
    .where({ short_code })
    .andWhere("expires_at", "<=", new Date()) // Check for expired URLs
    .first()

  let shortenedUrl

  if (existingExpiredUrl) {
    // If an expired URL exists with this code, update it with the new details
    ;[shortenedUrl] = await db(TABLE_NAME)
      .where({ id: existingExpiredUrl.id })
      .update({
        original_url: input.original_url,
        user_id: input.user_id || null,
        expires_at:
          input.expires_in_days && input.expires_in_days > 0
            ? new Date(Date.now() + input.expires_in_days * 24 * 60 * 60 * 1000) // Calculate new expiration date
            : null,
        updatedAt: new Date(), // Update the timestamp
      })
      .returning("*")

    console.log(`Updated expired URL with short code "${short_code}"`)

    // Invalidate the old cache entry for this short code
    try {
      const cacheKey = `url:${short_code}`
      await redisService.del(cacheKey)
    } catch (error) {
      console.error(`Redis error invalidating cache for updated URL: ${error}`)
    }
  } else {
    // No non-expired or expired URL exists with this code, insert a new one

    // Calculate expiration date if expires_in_days is provided
    let expires_at = null
    if (input.expires_in_days && input.expires_in_days > 0) {
      expires_at = new Date()
      expires_at.setDate(expires_at.getDate() + input.expires_in_days)
    }

    ;[shortenedUrl] = await db(TABLE_NAME)
      .insert({
        original_url: input.original_url,
        short_code,
        user_id: input.user_id || null,
        expires_at,
      })
      .returning("*")

    console.log(`Created new URL with short code "${short_code}"`)
  }

  // Cache the newly created/updated URL
  try {
    const cacheKey = `url:${short_code}`
    await redisService.set(cacheKey, shortenedUrl)
  } catch (error) {
    // If Redis caching fails, just log the error and continue
    console.error(`Redis error caching new/updated URL: ${error}`)
  }

  return shortenedUrl
}

/**
 * Check if a URL has expired
 * @param url The shortened URL to check
 * @returns True if the URL has expired, false otherwise
 */
export function isUrlExpired(url: ShortenedUrl): boolean {
  if (!url.expires_at) {
    return false // No expiration date means it never expires
  }

  const expiryDate = new Date(url.expires_at)
  const now = new Date()

  return now > expiryDate
}

/**
 * Get a shortened URL by its short code
 * Uses Redis cache for improved performance
 */
export async function getShortenedUrlByCode(
  short_code: string
): Promise<ShortenedUrl | null> {
  // Generate a cache key for this short code
  const cacheKey = `url:${short_code}`

  try {
    // Try to get the URL from Redis cache first
    const cachedUrl = await redisService.get<ShortenedUrl>(cacheKey)

    if (cachedUrl) {
      // URL found in cache, return it
      return cachedUrl
    }

    // URL not in cache, get it from the database
    const url = await db(TABLE_NAME).where({ short_code }).first()

    if (url) {
      // Store the URL in Redis cache for future requests
      // Cache for 1 hour by default (configured in REDIS_TTL env var)
      await redisService.set(cacheKey, url)
    }

    return url
  } catch (error) {
    // If there's an error with Redis, fall back to database
    console.error(`Redis error in getShortenedUrlByCode: ${error}`)
    return db(TABLE_NAME).where({ short_code }).first()
  }
}

/**
 * Get all shortened URLs
 */
export async function getAllShortenedUrls(): Promise<ShortenedUrl[]> {
  return db(TABLE_NAME).select("*").orderBy("createdAt", "desc")
}

/**
 * Get shortened URLs by user ID
 * @deprecated Use getShortenedUrlsByUserPaginated instead
 */
export async function getShortenedUrlsByUser(
  user_id: string
): Promise<ShortenedUrl[]> {
  return db(TABLE_NAME).where({ user_id }).orderBy("createdAt", "desc")
}

/**
 * Get shortened URLs by user ID with pagination and search
 * @param user_id User ID to look up
 * @param page Page number (1-based)
 * @param pageSize Number of items per page
 * @param search Optional search term to filter URLs
 * @returns Promise with paginated URLs and total count
 */
export async function getShortenedUrlsByUserPaginated(
  user_id: string,
  page: number = 1,
  pageSize: number = 10,
  search?: string
): Promise<{ data: ShortenedUrl[]; total: number }> {
  const offset = (page - 1) * pageSize

  // Build the base query
  let query = db(TABLE_NAME).where({ user_id })

  // Add search functionality if a search term is provided
  if (search && search.trim()) {
    const searchTerm = `%${search.trim()}%`
    query = query.andWhere(function () {
      this.where("original_url", "ILIKE", searchTerm).orWhere(
        "short_code",
        "ILIKE",
        searchTerm
      )
    })
  }

  // Get total count with the same filters
  const [countResult] = await query.clone().count("id as count")
  const total = parseInt(countResult.count as string)

  // Get the paginated data
  const data = await query
    .select("*")
    .orderBy("createdAt", "desc")
    .limit(pageSize)
    .offset(offset)

  return { data, total }
}

/**
 * Log a click for a shortened URL
 * Uses Redis for fast click counting and database for permanent storage
 */
export async function logUrlClick(
  shortened_url_id: string,
  user_agent?: string,
  ip_address?: string
): Promise<void> {
  // First, increment the click count in Redis for real-time stats
  try {
    const clickCountKey = `clicks:${shortened_url_id}`
    await redisService.increment(clickCountKey)

    // Set expiry on the counter if it's new (default TTL from env)
    const exists = await redisService.exists(clickCountKey)
    if (!exists) {
      await redisService.set(clickCountKey, 1)
    }
  } catch (error) {
    console.error(`Redis error in logUrlClick: ${error}`)
    // Continue with database logging even if Redis fails
  }

  // Then, log the click in the database for permanent storage
  await db("url_clicks").insert({
    shortened_url_id,
    user_agent,
    ip_address,
  })
}

/**
 * Get the click count for a shortened URL
 * Uses Redis cache for faster retrieval when available
 */
export async function getUrlClickCount(
  shortened_url_id: string
): Promise<number> {
  try {
    // Try to get the click count from Redis first
    const clickCountKey = `clicks:${shortened_url_id}`
    const cachedCount = await redisService.get<number>(clickCountKey)

    if (cachedCount !== null) {
      // Return the cached count if available
      return cachedCount
    }

    // If not in cache, get from database
    const result = await db("url_clicks")
      .count("id as count")
      .where({ shortened_url_id })
      .first()

    const count = parseInt(result?.count as string) || 0

    // Cache the count for future requests
    await redisService.set(clickCountKey, count)

    return count
  } catch (error) {
    console.error(`Redis error in getUrlClickCount: ${error}`)

    // Fall back to database if Redis fails
    const result = await db("url_clicks")
      .count("id as count")
      .where({ shortened_url_id })
      .first()

    return parseInt(result?.count as string) || 0
  }
}

/**
 * Get the click count for a shortened URL by short code
 */
export async function getUrlClickCountByCode(
  short_code: string
): Promise<number> {
  const url = await getShortenedUrlByCode(short_code)
  if (!url) {
    return 0
  }

  return getUrlClickCount(url.id)
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
    .limit(limit)
}

/**
 * Delete a shortened URL by its ID
 */
export async function deleteShortenedUrl(id: string): Promise<boolean> {
  // First, get the URL to find its short code for cache invalidation
  const url = await db(TABLE_NAME).where({ id }).first()

  if (!url) {
    return false
  }

  // Delete the URL from the database
  const deleted = await db(TABLE_NAME).where({ id }).delete()

  if (deleted > 0) {
    // If deletion was successful, also remove from cache
    try {
      const cacheKey = `url:${url.short_code}`
      await redisService.del(cacheKey)
    } catch (error) {
      // If Redis operation fails, just log the error
      console.error(`Redis error in deleteShortenedUrl: ${error}`)
    }
    return true
  }

  return false
}

/**
 * Get all shortened URLs with pagination
 */
export async function getAllShortenedUrlsPaginated(
  page: number = 1,
  pageSize: number = 20
): Promise<{ data: ShortenedUrl[]; total: number }> {
  const offset = (page - 1) * pageSize

  const [countResult] = await db(TABLE_NAME).count("id as count")
  const total = parseInt(countResult.count as string)

  const data = await db(TABLE_NAME)
    .select("*")
    .orderBy("createdAt", "desc")
    .limit(pageSize)
    .offset(offset)

  return { data, total }
}

/**
 * Get shortened URLs by user ID with click counts in a single query
 * @deprecated Use getShortenedUrlsWithClickCountsPaginated instead
 * @param user_id User ID to look up
 * @returns Promise with array of URLs including click counts
 */
export async function getShortenedUrlsWithClickCounts(
  user_id: string
): Promise<Array<ShortenedUrl & { clickCount: number }>> {
  // Use a left join to include URLs that have no clicks
  const results = await db(TABLE_NAME)
    .select([
      `${TABLE_NAME}.*`,
      db.raw('COALESCE(COUNT("url_clicks"."id"), 0) as "clickCount"'),
    ])
    .leftJoin("url_clicks", `${TABLE_NAME}.id`, "url_clicks.shortened_url_id")
    .where({ [`${TABLE_NAME}.user_id`]: user_id })
    .groupBy(`${TABLE_NAME}.id`)
    .orderBy(`${TABLE_NAME}.createdAt`, "desc")

  return results.map((result) => ({
    ...result,
    clickCount: parseInt(result.clickCount as string) || 0,
  }))
}

/**
 * Get shortened URLs by user ID with click counts in a single query, with pagination and search
 * @param user_id User ID to look up
 * @param page Page number (1-based)
 * @param pageSize Number of items per page
 * @param search Optional search term to filter URLs
 * @returns Promise with paginated URLs including click counts and total count
 */
export async function getShortenedUrlsWithClickCountsPaginated(
  user_id: string,
  page: number = 1,
  pageSize: number = 10,
  search?: string
): Promise<{
  data: Array<ShortenedUrl & { clickCount: number }>
  total: number
}> {
  const offset = (page - 1) * pageSize

  // Build the base query
  let baseQuery = db(TABLE_NAME).where({ [`${TABLE_NAME}.user_id`]: user_id })

  // Add search functionality if a search term is provided
  if (search && search.trim()) {
    const searchTerm = `%${search.trim()}%`
    baseQuery = baseQuery.andWhere(function () {
      this.where(`${TABLE_NAME}.original_url`, "ILIKE", searchTerm).orWhere(
        `${TABLE_NAME}.short_code`,
        "ILIKE",
        searchTerm
      )
    })
  }

  // Get total count with the same filters
  const countQuery = baseQuery.clone()
  const [countResult] = await countQuery.count(`${TABLE_NAME}.id as count`)
  const total = parseInt(countResult.count as string)

  // Get the paginated data with click counts
  const results = await baseQuery
    .select([
      `${TABLE_NAME}.*`,
      db.raw('COALESCE(COUNT("url_clicks"."id"), 0) as "clickCount"'),
    ])
    .leftJoin("url_clicks", `${TABLE_NAME}.id`, "url_clicks.shortened_url_id")
    .groupBy(`${TABLE_NAME}.id`)
    .orderBy(`${TABLE_NAME}.createdAt`, "desc")
    .limit(pageSize)
    .offset(offset)

  const data = results.map((result) => ({
    ...result,
    clickCount: parseInt(result.clickCount as string) || 0,
  }))

  return { data, total }
}

/**
 * Get daily click counts for a shortened URL over a specified period
 * @param shortened_url_id The ID of the shortened URL
 * @param days Number of days to look back (default: 7)
 * @returns Promise with array of daily click counts
 */
export async function getDailyClickCounts(
  shortened_url_id: string,
  days: number = 7
): Promise<Array<{ date: string; count: number }>> {
  // Calculate the start date (n days ago)
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days + 1) // +1 to include today
  startDate.setHours(0, 0, 0, 0) // Start of the day

  // Get all dates in the range, even those with zero clicks
  const results = await db.raw(
    `
    WITH date_series AS (
      SELECT generate_series(
        ?::timestamp,
        now()::date,
        '1 day'::interval
      )::date as date
    )
    SELECT
      date_series.date::text as date,
      COALESCE(COUNT(url_clicks.id), 0) as count
    FROM date_series
    LEFT JOIN url_clicks ON
      date_trunc('day', url_clicks.clicked_at) = date_series.date AND
      url_clicks.shortened_url_id = ?
    GROUP BY date_series.date
    ORDER BY date_series.date ASC
  `,
    [startDate.toISOString(), shortened_url_id]
  )

  return results.rows
}

/**
 * Get top URLs by click count
 * @param limit Number of top URLs to return (default: 5)
 * @param userId Optional user ID to filter URLs by user
 * @returns Promise with array of URLs including click counts
 */
export async function getTopUrlsByClicks(
  limit: number = 5,
  userId?: string
): Promise<Array<ShortenedUrl & { clickCount: number }>> {
  // Build the base query
  let query = db(TABLE_NAME)
    .select([
      `${TABLE_NAME}.*`,
      db.raw('COALESCE(COUNT("url_clicks"."id"), 0) as "clickCount"'),
    ])
    .leftJoin("url_clicks", `${TABLE_NAME}.id`, "url_clicks.shortened_url_id")
    .groupBy(`${TABLE_NAME}.id`)

  // Add user filter if userId is provided
  if (userId) {
    query = query.where({ [`${TABLE_NAME}.user_id`]: userId })
  }

  // Get the top URLs by click count
  const results = await query.orderBy("clickCount", "desc").limit(limit)

  return results.map((result) => ({
    ...result,
    clickCount: parseInt(result.clickCount as string) || 0,
  }))
}
