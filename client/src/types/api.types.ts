/**
 * Interface for shortened URL data
 */
export interface ShortenedUrl {
  id: string;
  original_url: string;
  short_code: string;
  user_id?: string | null;
  expires_at?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface for URL click data
 */
export interface UrlClick {
  id: string;
  shortened_url_id: string;
  clicked_at: string;
  user_agent?: string | null;
  ip_address?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface for creating a new shortened URL
 */
export interface CreateUrlRequest {
  original_url: string;
  user_id?: string;
  custom_code?: string;
  expires_in_days?: number;
}

/**
 * Generic API response interface
 */
export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

/**
 * URL service response for a single URL
 */
export interface UrlResponse {
  url: ShortenedUrl;
}

/**
 * URL service response for multiple URLs
 */
export interface UrlsResponse {
  urls: ShortenedUrl[];
}

/**
 * Error response from the API
 */
export interface ApiErrorResponse {
  error: string;
  status?: number;
  message?: string;
}
