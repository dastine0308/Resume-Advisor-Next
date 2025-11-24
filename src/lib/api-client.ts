import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import { getSession } from "next-auth/react";
import type { ExtendedSession } from "@/lib/auth";

/**
 * Axios instance with automatic token injection and error handling
 * Base configuration for all API requests
 */
const apiClient: AxiosInstance = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request interceptor to inject authentication token
 */
apiClient.interceptors.request.use(
  async (config) => {
    // Get session from NextAuth
    const session = (await getSession()) as ExtendedSession | null;

    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
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
