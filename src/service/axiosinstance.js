import axios from "axios";

const axiosInstance = axios.create({
  // Using the proxy prefix from vite.config.js
  baseURL: "/api_v1", 
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// -------------------- Request Interceptor --------------------
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    // Automatically inject Bearer token if it exists
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// -------------------- Response Interceptor --------------------
axiosInstance.interceptors.response.use(
  (response) => {
    // Optional: Auto-update token if backend sends a refreshed one
    const newToken = response.data?.token;
    if (newToken) {
      localStorage.setItem("authToken", newToken);
    }
    return response;
  },
  (error) => {
    const requestUrl = error.config?.url || "";

    // 401 Unauthorized Handling
    if (error.response?.status === 401) {
      /* FIXED: Removed baseURL2 reference. 
         Logic: If we get a 401, clear storage and redirect to login.
      */
      console.error("Unauthorized request. Redirecting to login...", requestUrl);
      localStorage.removeItem("authToken");
      
      // Only redirect if we aren't already on the login page to avoid loops
      if (window.location.pathname !== "/") {
        window.location.href = "/"; 
      }
    }

    return Promise.reject(error);
  }
);

// =============================================================
// 🧪 Independent Testing Instance (Cloudflare Tunnel via Vite Proxy)
// =============================================================
export const testingInstance = axios.create({
  // Uses /cf_tunnel proxy to prevent browser CORS preflight blocks
  baseURL: "/cf_tunnel",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
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
    return config;
  },
  (error) => Promise.reject(error)
);

// Return response or normalized backend error
testingInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(
      "[Testing Instance Error]:",
      error?.response?.data || error?.message
    );
    return Promise.reject(error?.response?.data || error);
  }
);

export default axiosInstance;