import axios from "axios";

/**
 * File uploads (FormData): the instances below default to
 * "Content-Type: application/json". If that header is left on a FormData
 * request, axios converts the form to JSON (files become `{}`) and the backend
 * rejects it. Removing the header lets the browser set
 * "multipart/form-data; boundary=..." itself.
 */
const stripJsonContentTypeForFormData = (config) => {
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    if (typeof config.headers?.delete === "function") {
      config.headers.delete("Content-Type"); // axios >= 1.x AxiosHeaders
    } else if (config.headers) {
      delete config.headers["Content-Type"]; // older axios
    }
  }
  return config;
};

// Login / password-reset endpoints: never auto-logout or redirect on these.
// These words must appear in the URLs used in service/authservice.js.
const PUBLIC_URL_PARTS = ["login", "forgot", "otp", "reset"];
const isPublicUrl = (url = "") =>
  PUBLIC_URL_PARTS.some((part) => url.toLowerCase().includes(part));

const axiosInstance = axios.create({
  // Using the proxy prefix from vite.config.js
  baseURL: "/api_v1",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// -------------------- Request Interceptor --------------------
axiosInstance.interceptors.request.use(
  (config) => {
    const authToken = localStorage.getItem("authToken");
    const resetToken = localStorage.getItem("resetToken");

    // During the reset flow, use the temporary reset token
    const token = isPublicUrl(config.url) ? resetToken || authToken : authToken;

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
      localStorage.setItem("authToken", newToken);
    }
    return response;
  },
  (error) => {
    const requestUrl = error.config?.url || "";
    const hadSession = !!localStorage.getItem("authToken");

    // 401 handling: only for a logged-in user on a private endpoint
    if (
      error.response?.status === 401 &&
      hadSession &&
      !isPublicUrl(requestUrl)
    ) {
      console.error(
        "Unauthorized request. Redirecting to login...",
        requestUrl,
      );
      localStorage.removeItem("authToken");

      // Only redirect if we aren't already on the login page to avoid loops
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }

    // Always let the component's catch block show the toast
    return Promise.reject(error);
  },
);

// =============================================================
// 🧪 Independent Testing Instance (Cloudflare Tunnel via Vite Proxy)
// =============================================================
export const testingInstance = axios.create({
  // Uses /cf_tunnel proxy to prevent browser CORS preflight blocks
  baseURL: "/cf_tunnel",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "ngrok-skip-browser-warning": "true",
    "bypass-tunnel-reminder": "true",
  },
  timeout: 15000,
});

// Attach Bearer token support
testingInstance.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("authToken") || localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token.trim()}`;
    }

    // Make file uploads (FormData) work
    return stripJsonContentTypeForFormData(config);
  },
  (error) => Promise.reject(error),
);

// Return response or normalized backend error
testingInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(
      "[Testing Instance Error]:",
      error?.response?.data || error?.message,
    );
    return Promise.reject(error?.response?.data || error);
  },
);

export default axiosInstance;
