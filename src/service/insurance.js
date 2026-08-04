import axiosInstance from "./axiosInstance"; 
import { cancelInsurance } from "../api/api";
/**
 * Sends insurance payload and associated binary documents using your existing axiosInstance.
 * Forcefully neutralizes global JSON transformation rules for this specific call context.
 * 
 * @param {Object} payload - Sanity-cleaned JSON configurations object
 * @param {Array<File>} rawFiles - Array of native browser File objects
 */
export const saveEmployeeInsuranceUpdate = async (payload, rawFiles = []) => {
  const formData = new FormData();

  // 1. Map data to the single form field key expected by the backend architecture
  formData.append("payload", JSON.stringify(payload));

  // 2. Append all raw binary files to the 'documents' field array key
  if (Array.isArray(rawFiles) && rawFiles.length > 0) {
    rawFiles.forEach((file) => {
      formData.append("documents", file);
    });
  }

  // 3. Dispatch using axiosInstance while blocking global JSON transformations
  const response = await axiosInstance.post(
    "/admin/insurance/upsert/employee-settings", 
    formData, 
    {
      headers: {
        // Explicitly forces Axios to clear any default content-type headers 
        // inherited from the instance creation configurations.
        "Content-Type": undefined, 
      },
      // 🛡️ CRITICAL BYPASS: This directly overrides global instance transformations,
      // forcing Axios to stream the raw FormData straight to the browser.
      transformRequest: [
        (data) => {
          return data; // Returns the raw FormData object untouched
        }
      ],
      timeout: 45000, 
    }
  );

  return response.data;
};

/**
 * Cancels an active employee insurance record by its ID.
 * Replaces the `{insurance_id}` path parameter with the provided ID.
 * 
 * @param {string|number} insuranceId - The ID of the insurance policy to cancel
 * @param {Object} [reasonPayload] - Optional payload (e.g., reason for cancellation)
 */
// Example API function using FormData (or standard JSON depending on your backend endpoint)
export const cancelEmployeeInsurance = async (insuranceId) => {
  try {
    const formData = new FormData();
    formData.append("insurance_id", insuranceId);
    formData.append("status", "Cancelled");

    // Make your existing API call here (e.g., via fetch or axios)
    const response = await fetch(`/api/employee-insurance/${insuranceId}/cancel/`, {
      method: "POST",
      body: formData, // Bypassing standard axios transform as per your existing FormData strategy
    });

    return await response.json();
  } catch (error) {
    console.error("Failed to cancel insurance policy:", error);
    return { success: false };
  }
};