import axios from "axios";

/**
 * Global API / Axios Initializer
 *
 * Configures the backend API base URL and defaults so all requests throughout
 * the application target the deployed backend API (https://clientportalapi.hawkntechnologies.com)
 * instead of the frontend hosting domain (https://clientportal.hawkntechnologies.com).
 */

export const initApi = () => {
  const rawApiUrl =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    "https://clientportalapi.hawkntechnologies.com";

  // Strip trailing slash and trailing /api if provided, so endpoint paths like "/api/..." are not doubled
  const baseOrigin = rawApiUrl
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api\/?$/, "");

  if (baseOrigin) {
    axios.defaults.baseURL = baseOrigin;
  }

  // Ensure credentials (cookies) are sent with every cross-origin and same-origin request
  axios.defaults.withCredentials = true;

  // Interceptor to normalize URL paths and ensure all API calls route correctly to /api/...
  axios.interceptors.request.use(
    (config) => {
      if (config.url && !/^https?:\/\//i.test(config.url)) {
        const trimmedUrl = config.url.startsWith("/")
          ? config.url
          : `/${config.url}`;

        // If endpoint doesn't start with /api, prepend /api
        if (!trimmedUrl.startsWith("/api")) {
          config.url = `/api${trimmedUrl}`;
        }
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  return baseOrigin;
};

// Initialize immediately on module load
export const API_BASE_URL = initApi();

export default axios;
