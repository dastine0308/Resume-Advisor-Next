import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/useAuthStore";

/**
 * Axios instance with automatic token injection and error handling
 * Base configuration for all API requests
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: "/api/v1",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request interceptor to inject authentication token
 */
apiClient.interceptors.request.use(
  (config) => {
    // Get token from cookie via auth store
    const token = useAuthStore.getState().getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

/**
 * Response interceptor for unified error handling
 */
apiClient.interceptors.response.use(
  (response) => {
    // Extract data from the backend response structure
    if (response.data?.success && response.data?.data) {
      return { ...response, data: response.data.data };
    }
    return response;
  },
  (error) => {
    // Handle different error scenarios
    if (error.response) {
      // Handle 401 Unauthorized - token expired or invalid
      // Skip redirect if we're already on the login page (e.g., invalid credentials)
      if (error.response.status === 401) {
        const isLoginPage =
          typeof window !== "undefined" &&
          window.location.pathname === "/login";

        if (!isLoginPage) {
          console.warn("Token expired or invalid, logging out...");
          useAuthStore.getState().logout();
          // Redirect to login page
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        }
      }

      // Server responded with error status
      const message =
        error.response.data?.message ||
        error.response.data?.error ||
        "Request failed";
      console.error("API Error:", message);
      return Promise.reject(new Error(message));
    } else if (error.request) {
      // Request made but no response
      console.error("Network Error:", error.message);
      return Promise.reject(
        new Error("Network error - please check your connection"),
      );
    } else {
      // Something else happened
      console.error("Request Error:", error.message);
      return Promise.reject(error);
    }
  },
);

export default apiClient;

/**
 * Generic API request wrapper with TypeScript support
 */
export async function apiRequest<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.request<T>(config);
  return response.data;
}

/**
 * Convenience methods for common HTTP operations
 */
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    apiRequest<T>({ ...config, method: "GET", url }),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiRequest<T>({ ...config, method: "POST", url, data }),

  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiRequest<T>({ ...config, method: "PUT", url, data }),

  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    apiRequest<T>({ ...config, method: "DELETE", url }),
};
