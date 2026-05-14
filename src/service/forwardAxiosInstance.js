// forwardedAxiosInstance.js
import axios from "axios";

const forwardedAxiosInstance = axios.create({
  baseURL: "https://agnostically-bonniest-patrice.ngrok-free.dev/",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// ✅ Attach token from localStorage
forwardedAxiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) config.headers["Authorization"] = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Handle expired token (401)
forwardedAxiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default forwardedAxiosInstance;
