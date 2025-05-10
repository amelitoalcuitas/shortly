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
    // This could be configured from environment variables in a real app
    return `shortly.io/${shortCode}`;
  }
}

// Create and export a singleton instance
const urlService = new UrlService();
export default urlService;
