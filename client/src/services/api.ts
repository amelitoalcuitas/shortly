import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

// Get the API URL from environment variables or use default
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Create a configured axios instance for API requests
 */
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
      "Content-Type": "application/json",
    },
    withCredentials: true, // Include cookies in requests
  });

  // Request interceptor
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // No need to manually add auth token as it's in the HttpOnly cookie
      // and will be sent automatically with withCredentials: true
      return config;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    (error: AxiosError) => {
      // Handle common errors here
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("API Error Response:", error.response.data);
      } else if (error.request) {
        // The request was made but no response was received
        console.error("API Error Request:", error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("API Error:", error.message);
      }
      return Promise.reject(error);
    }
  );

  return client;
};

// Create and export the API client
const apiClient = createApiClient();
export default apiClient;
