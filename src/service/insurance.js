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
 * Cancel an active employee insurance policy.
 * Exact endpoint matching your Postman test: PATCH /admin/insurance/settings/{insurance_id}/cancel
 *
 * @param {number|string} insuranceId - ID of the insurance policy to terminate.
 */
export const cancelEmployeeInsurance = async (insuranceId) => {
  if (!insuranceId) {
    throw new Error("Insurance Policy ID is required for cancellation.");
  }

  const response = await axiosInstance.patch(
    `/admin/insurance/settings/${insuranceId}/cancel`
  );

  return response.data;
};