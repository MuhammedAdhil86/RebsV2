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

export default axiosInstance;