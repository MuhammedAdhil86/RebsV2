import axios from "axios"; // ✅ FIXED: Added this import
import axiosInstance from "./axiosinstance";
import { 
  postResetPassword, 
  sendResetPasswordEmail, 
  forgotPassword, 
  confirmForgotPassword 
} from "../api/api";

// --- Base URL Configuration ---
// It's best to define this once so you don't have to change it everywhere
const BASE_URL = "http://localhost:5173/api_v1"; 

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
 * FIXED: Now correctly uses the raw axios import and bypasses interceptors
 */
export const finalizeForgotPassword = async (payload) => {
  try {
    const resetToken = localStorage.getItem("resetToken");
    
    // We use raw 'axios' here because axiosInstance might be attaching 
    // a null/invalid login token that overwrites our resetToken.
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