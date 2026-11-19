import axios from "axios";

// -------------------- Constants --------------------
const API_BASE_URL = "/api_v1"; // Proxy prefix from vite.config.js
const REQUEST_TIMEOUT_MS = 15000;
const LOGIN_PATH = "/";

const STORAGE_KEYS = {
  AUTH_TOKEN: "authToken",
  RESET_TOKEN: "resetToken",
};

// Login / password-reset endpoints: never auto-logout or redirect on these.
// These words must appear in the URLs used in service/authservice.js.
const PUBLIC_URL_PARTS = ["login", "forgot", "otp", "reset"];

// -------------------- Helpers --------------------
const isPublicUrl = (url = "") => {
  const lowerUrl = url.toLowerCase();
  return PUBLIC_URL_PARTS.some((part) => lowerUrl.includes(part));
};

/**
 * File uploads (FormData): the instance below defaults to
 * "Content-Type: application/json". If that header is left on a FormData
 * request, axios converts the form to JSON (files become `{}`) and the backend
 * rejects it. Removing the header lets the browser set
 * "multipart/form-data; boundary=..." itself.
 */
const stripJsonContentTypeForFormData = (config) => {
  const isFormData =
    typeof FormData !== "undefined" && config.data instanceof FormData;

  if (!isFormData) return config;

  if (typeof config.headers?.delete === "function") {
    config.headers.delete("Content-Type"); // axios >= 1.x (AxiosHeaders)
  } else if (config.headers) {
    delete config.headers["Content-Type"]; // older axios
  }

  return config;
};

/**
 * Picks the token for a request.
 * Public (login / reset) URLs prefer the temporary reset token.
 */
const resolveToken = (url) => {
  const authToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  const resetToken = localStorage.getItem(STORAGE_KEYS.RESET_TOKEN);

  return isPublicUrl(url) ? resetToken || authToken : authToken;
};

// -------------------- Axios Instance --------------------
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: REQUEST_TIMEOUT_MS,
});

// -------------------- Request Interceptor --------------------
axiosInstance.interceptors.request.use(
  (config) => {
    const token = resolveToken(config.url);

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    // Make file uploads (FormData) work
    return stripJsonContentTypeForFormData(config);
  },
  (error) => Promise.reject(error),
);

// -------------------- Response Interceptor --------------------
axiosInstance.interceptors.response.use(
  (response) => {
    // Auto-update token if backend sends a refreshed one,
    // but never let a reset-flow token overwrite the real login token
    const newToken = response.data?.token;

    if (newToken && !isPublicUrl(response.config?.url)) {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, newToken);
    }

    return response;
  },
  (error) => {
    const requestUrl = error.config?.url || "";
    const hadSession = !!localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

    // 401 handling: only for a logged-in user on a private endpoint
    const isUnauthorized =
      error.response?.status === 401 && hadSession && !isPublicUrl(requestUrl);

    if (isUnauthorized) {
      console.error(
        "Unauthorized request. Redirecting to login...",
        requestUrl,
      );
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);

      // Only redirect if we aren't already on the login page to avoid loops
      if (window.location.pathname !== LOGIN_PATH) {
        window.location.href = LOGIN_PATH;
      }
    }

    // Always let the component's catch block show the toast
    return Promise.reject(error);
  },
);

export default axiosInstance;
