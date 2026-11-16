import axios from "axios";
import axiosInstance from "../service/axiosinstance";
import {
  postResetPassword,
  sendResetPasswordEmail,
  forgotPassword,
  confirmForgotPassword,
  staffLogout, // add `export const staffLogout = "/staff/logout";` in ../api/api
} from "../api/api";

// Same prefix as axiosInstance (proxied by vite.config.js)
const BASE_URL = "/api_v1";

/**
 * 1. Reset Password (Authenticated)
 */
export const resetUserPassword = async (payload) => {
  try {
    const response = await axiosInstance.post(postResetPassword, payload);
    return response.data;
  } catch (error) {
    console.error(
      "❌ Reset Password Error:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

/**
 * 2. Send Reset Password Email (Forgot Password Step 1)
 * Clears any stale reset token from a previous attempt.
 */
export const requestPasswordResetEmail = async (payload) => {
  try {
    localStorage.removeItem("resetToken");
    const response = await axiosInstance.post(sendResetPasswordEmail, payload);
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
    return response.data;
  } catch (error) {
    console.error(
      "❌ Verify OTP Error:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

/**
 * 4. Confirm Forgot Password (Forgot Password Step 3)
 * Uses raw axios so axiosInstance can't overwrite the resetToken header.
 */
export const finalizeForgotPassword = async (payload) => {
  const resetToken = (localStorage.getItem("resetToken") || "").trim();

  // No token saved: fail clearly instead of sending "Bearer null"
  if (!resetToken) {
    const err = new Error("Reset session not found. Please verify OTP again.");
    err.response = { status: 401, data: { message: err.message } };
    throw err;
  }

  try {
    const response = await axios.post(
      `${BASE_URL}${confirmForgotPassword}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${resetToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    return response.data; // OtpUi checks response.status_code
  } catch (error) {
    console.error(
      "❌ Finalize Reset Error:",
      error.response?.status,
      error.response?.data || error.message,
    );
    throw error; // OtpUi's catch shows the toast
  }
};

/**
 * 5. Staff Logout -> POST /api_v1/staff/logout
 * Local session is always cleared, even if the request fails.
 */
export const logoutStaff = async () => {
  try {
    const response = await axiosInstance.post(staffLogout);
    return response.data;
  } catch (error) {
    console.error("❌ Logout Error:", error.response?.data || error.message);
    throw error;
  } finally {
    localStorage.removeItem("authToken");
    localStorage.removeItem("token");
  }
};
