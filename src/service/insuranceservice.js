import axiosInstance from "./axiosinstance";
import { getEmployeeInsuranceDetails } from "../api/api";

export const fetchEmployeeInsuranceDetails = async (uuid) => {
  try {
    const endpoint = getEmployeeInsuranceDetails(uuid);
    const response = await axiosInstance.get(endpoint);
    
    console.log("🔍 RAW AXIOS RESPONSE:", response); // 👈 Look at this in your console!
    
    // Adjust based on what the log above shows:
    return response.data?.data || response.data || response;
  } catch (error) {
    console.error(`❌ Axios request failed for user ${uuid}:`, error.message);
    throw error;
  }
};