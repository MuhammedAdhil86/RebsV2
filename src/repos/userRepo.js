import axiosInstance from "../service/axiosinstance"; // your axios instance
import { Login } from "../api/api"; // backend login endpoint

// User loginform
export const UserLogin = async (requestData) => {
  try {
    console.log("Logging in with:", requestData);

    const response = await axiosInstance.post(Login, requestData, {
      headers: { "Content-Type": "application/json" },
    });

    const token = response.data.token;
    const userData = response.data.user || response.data;

    // Save token and user data
    localStorage.setItem("authToken", token);
    localStorage.setItem("user", JSON.stringify(userData));

    return response.data;
  } catch (error) {
    console.error("Login failed:", error.response?.data || error.message);
    throw error;
  }
};
