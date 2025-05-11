import apiClient from "./api";
import {
  CreateUrlRequest,
  ShortenedUrl,
  UrlResponse,
  UrlsResponse,
} from "../types";

/**
 * URL Service - Handles all API calls related to URL shortening
 */
class UrlService {
  private readonly baseUrl = "/urls";

  /**
   * Create a new shortened URL
   * @param data URL data to create
   * @returns Promise with the created URL
   */
  async createUrl(data: CreateUrlRequest): Promise<ShortenedUrl> {
    try {
      const response = await apiClient.post<UrlResponse>(this.baseUrl, data);
      return response.data.url;
    } catch (error) {
      console.error("Error creating shortened URL:", error);
      throw error;
    }
  }

  /**
   * Get a shortened URL by its short code
   * @param code Short code to look up
   * @returns Promise with the URL data
   */
  async getUrlByCode(code: string): Promise<ShortenedUrl> {
    try {
      const response = await apiClient.get<UrlResponse>(
        `${this.baseUrl}/code/${code}`
      );
      return response.data.url;
    } catch (error) {
      console.error("Error getting shortened URL:", error);
      throw error;
    }
  }

  /**
   * Get all URLs for a specific user
   * @param userId User ID to look up
   * @returns Promise with array of URLs
   */
  async getUrlsByUser(userId: string): Promise<ShortenedUrl[]> {
    try {
      const response = await apiClient.get<UrlsResponse>(
        `${this.baseUrl}/user/${userId}`
      );
      return response.data.urls;
    } catch (error) {
      console.error("Error getting user URLs:", error);
      throw error;
    }
  }

  /**
   * Get all URLs (admin function)
   * @returns Promise with array of all URLs
   */
  async getAllUrls(): Promise<ShortenedUrl[]> {
    try {
      const response = await apiClient.get<UrlsResponse>(this.baseUrl);
      return response.data.urls;
    } catch (error) {
      console.error("Error getting all URLs:", error);
      throw error;
    }
  }

  /**
   * Delete a URL by ID
   * @param id URL ID to delete
   * @returns Promise with success status
   */
  async deleteUrl(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`${this.baseUrl}/${id}`);
      return true;
    } catch (error) {
      console.error("Error deleting URL:", error);
      throw error;
    }
  }

  /**
   * Get the full shortened URL with domain
   * @param shortCode The short code
   * @returns Full URL string
   */
  getFullShortenedUrl(shortCode: string): string {
    // Uses the base URL from environment variables
    return `${this.getBaseUrl()}/${shortCode}`;
  }

  /**
   * Get the base URL for the shortened URLs
   * @returns Base URL string from environment variables
   */
  getBaseUrl(): string {
    return import.meta.env.VITE_BASE_URL || "http://localhost:3000";
  }

  /**
   * Get the redirect URL for a short code
   * @param shortCode The short code
   * @returns The redirect URL
   */
  getRedirectUrl(shortCode: string): string {
    return `${this.getBaseUrl()}/${shortCode}`;
  }

  /**
   * Get the click count for a shortened URL without incrementing it
   * @param code The short code to get click count for
   * @returns Promise with click count
   */
  async getUrlClickCount(code: string): Promise<number> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/clicks/${code}`);
      return response.data.clickCount || 0;
    } catch (error) {
      console.error("Error getting URL click count:", error);
      return 0;
    }
  }

  /**
   * Get all URLs for a user with their click counts
   * @param userId User ID to look up
   * @returns Promise with array of URLs including click counts
   */
  async getUrlsWithClickCounts(
    userId: string
  ): Promise<Array<ShortenedUrl & { clickCount: number }>> {
    try {
      // Use the optimized endpoint that returns URLs with click counts in a single query
      const response = await apiClient.get<{
        urls: Array<ShortenedUrl & { clickCount: number }>;
      }>(`${this.baseUrl}/user/${userId}/with-clicks`);
      return response.data.urls;
    } catch (error) {
      console.error("Error fetching URLs with click counts:", error);
      throw error;
    }
  }

  /**
   * Get analytics data for a shortened URL
   * @param urlId The ID of the shortened URL
   * @param days Number of days to look back (default: 7)
   * @returns Promise with analytics data
   */
  async getUrlAnalytics(
    urlId: string,
    days: number = 7
  ): Promise<{ dailyClicks: Array<{ date: string; count: number }> }> {
    try {
      const response = await apiClient.get(
        `${this.baseUrl}/analytics/${urlId}?days=${days}`
      );
      return response.data.analytics;
    } catch (error) {
      console.error("Error fetching URL analytics:", error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const urlService = new UrlService();
export default urlService;
