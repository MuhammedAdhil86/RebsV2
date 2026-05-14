import axios from "axios";

const axiosNgrok = axios.create({
  baseURL: "https://agnostically-bonniest-patrice.ngrok-free.dev/", // ngrok base URL
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Attach token to requests
axiosNgrok.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) config.headers["Authorization"] = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 errors + token updates
axiosNgrok.interceptors.response.use(
  (response) => {
    const newToken = response.data?.token;
    if (newToken) localStorage.setItem("authToken", newToken);
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      window.location.href = "/"; // redirect to login
    }
    return Promise.reject(error);
  }
);

export default axiosNgrok;
