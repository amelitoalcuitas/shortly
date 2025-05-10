import apiClient from "./api";

/**
 * Auth Service - Handles all API calls related to authentication
 */
class AuthService {
  private readonly baseUrl = "/auth";

  /**
   * Get the current authenticated user
   * @returns Promise with user data
   */
  async getCurrentUser() {
    try {
      const response = await apiClient.get(`${this.baseUrl}/me`);
      return response.data;
    } catch (error) {
      console.error("Error getting current user:", error);
      throw error;
    }
  }

  /**
   * Logout the current user
   * @returns Promise with success message
   */
  async logout() {
    try {
      const response = await apiClient.post(`${this.baseUrl}/logout`);
      return response.data;
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  }

  /**
   * Login a user
   * @param email User email
   * @param password User password
   * @returns Promise with user data and token
   */
  async login(email: string, password: string) {
    try {
      const response = await apiClient.post(`${this.baseUrl}/login`, {
        email,
        password,
      });
      return response.data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  /**
   * Register a new user
   * @param email User email
   * @param password User password
   * @param name Optional user name
   * @returns Promise with user data and token
   */
  async signup(email: string, password: string, name?: string) {
    try {
      const response = await apiClient.post(`${this.baseUrl}/signup`, {
        email,
        password,
        name,
      });
      return response.data;
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  }

  /**
   * Request a password reset
   * @param email User email
   * @returns Promise with success message
   */
  async forgotPassword(email: string) {
    try {
      const response = await apiClient.post(`${this.baseUrl}/forgot-password`, {
        email,
      });
      return response.data;
    } catch (error) {
      console.error("Forgot password error:", error);
      throw error;
    }
  }

  /**
   * Reset password with token
   * @param email User email
   * @param token Reset token
   * @param newPassword New password
   * @returns Promise with success message
   */
  async resetPassword(email: string, token: string, newPassword: string) {
    try {
      const response = await apiClient.post(`${this.baseUrl}/reset-password`, {
        email,
        token,
        newPassword,
      });
      return response.data;
    } catch (error) {
      console.error("Reset password error:", error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const authService = new AuthService();
export default authService;
