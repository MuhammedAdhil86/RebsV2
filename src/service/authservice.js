import axios from "axios";
import axiosInstance from "../service/axiosinstance";
import {
  postResetPassword,
  sendResetPasswordEmail,
  forgotPassword,
  confirmForgotPassword,
  staffLogout, // NEW: add `export const staffLogout = "/staff/logout";` in ../api/api
} from "../api/api";

// Same prefix as axiosInstance (proxied by vite.config.js)
const BASE_URL = "/api_v1";

/**
 * 1. Reset Password (Authenticated)
 */
export const resetUserPassword = async (payload) => {
  try {
    const response = await axiosInstance.post(postResetPassword, payload);
    console.log("✅ Reset Password Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Reset Password Error:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * 2. Send Reset Password Email (Forgot Password Step 1)
 */
export const requestPasswordResetEmail = async (payload) => {
  try {
    const response = await axiosInstance.post(sendResetPasswordEmail, payload);
    console.log("✅ Send OTP Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Send OTP Error:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * 3. Verify Forgot Password OTP (Forgot Password Step 2)
 */
export const verifyForgotPasswordOTP = async (payload) => {
  try {
    const response = await axiosInstance.post(forgotPassword, payload);
    console.log("✅ Verify OTP Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Verify OTP Error:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * 4. Confirm Forgot Password (Forgot Password Step 3)
 * Uses raw axios so axiosInstance can't overwrite the resetToken header.
 */
export const finalizeForgotPassword = async (payload) => {
  try {
    const resetToken = localStorage.getItem("resetToken");

    const response = await axios.post(`${BASE_URL}${confirmForgotPassword}`, payload, {
      headers: {
        Authorization: `Bearer ${resetToken}`,
      },
    });

    console.log("✅ Final Reset Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Final Reset Error:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * 5. Staff Logout  ->  POST /api_v1/staff/logout
 * The Bearer token is added automatically by the axiosInstance interceptor.
 * Local session is always cleared, even if the request fails
 * (expired token, network error), so the user is never stuck logged in.
 */
export const logoutStaff = async () => {
  try {
    const response = await axiosInstance.post(staffLogout);
    console.log("✅ Logout Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Logout Error:", error.response?.data || error.message);
    throw error;
  } finally {
    localStorage.removeItem("authToken");
    localStorage.removeItem("token");
  }
};