import axiosInstance from "./axiosinstance";
import { getEmployeeInsuranceDetails,getInsuranceProviders,getInsuranceTypes,getCoverageTypes} from "../api/api";

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
export const fetchInsuranceProviders = async () => {
  try {
    const response = await axiosInstance.get(getInsuranceProviders);
    return response.data?.data || response.data;
  } catch (error) {
    console.error("❌ Error fetching insurance providers:", error);
    throw error;
  }
};
export const fetchInsuranceTypes = async () => {
  try {
    const response = await axiosInstance.get(getInsuranceTypes);
    return response.data?.data || response.data;
  } catch (error) {
    console.error("❌ Error fetching insurance types:", error);
    throw error;
  }
};

export const fetchInsuranceCoverageTypes = async () => {
  try {
    const response = await axiosInstance.get(getCoverageTypes);
    return response.data?.data || response.data;
  } catch (error) {
    console.error("❌ Error fetching insurance coverage types:", error);
    throw error;
  }
};