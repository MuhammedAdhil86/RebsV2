import axios from "axios";

// Dev: Vite proxy (/api_v1 -> backend, prefix removed).
// Live: there is no proxy, so call the backend directly.
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
const baseURL = import.meta.env.DEV ? "/api_v1" : API_BASE;

if (!import.meta.env.DEV && !API_BASE) {
  console.warn("[axios] VITE_API_BASE_URL is missing in this build");
}

const axiosInstance = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Routes where the backend returns a token that should replace the stored one
const TOKEN_ROUTES = ["login", "refresh"];

// -------------------- Request Interceptor --------------------
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// -------------------- Response Interceptor --------------------
axiosInstance.interceptors.response.use(
  (response) => {
    // Only overwrite the stored token on login/refresh responses
    const url = response.config?.url || "";
    const newToken = response.data?.token;
    if (newToken && TOKEN_ROUTES.some((r) => url.includes(r))) {
      localStorage.setItem("authToken", newToken);
    }
    return response;
  },
  (error) => {
    const requestUrl = error.config?.url || "";

    if (error.response?.status === 401) {
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

    return Promise.reject(error);
  },
);

// =============================================================
// 🧪 Independent Testing Instance (Cloudflare Tunnel)
// =============================================================
// Dev uses the /cf_tunnel proxy. Live has no proxy, so set
// VITE_TESTING_BASE_URL in .env.production, or this instance won't work live.
const TESTING_BASE = (import.meta.env.VITE_TESTING_BASE_URL || "").replace(
  /\/+$/,
  "",
);

export const testingInstance = axios.create({
  baseURL: import.meta.env.DEV ? "/cf_tunnel" : TESTING_BASE,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "ngrok-skip-browser-warning": "true",
    "bypass-tunnel-reminder": "true",
  },
  timeout: 15000,
});

testingInstance.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("authToken") || localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token.trim()}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

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
