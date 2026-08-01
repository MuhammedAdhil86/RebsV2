import axiosInstance from "./axiosinstance";
import { getEmployeeInsuranceDetails, getInsuranceProviders, getInsuranceTypes, getCoverageTypes } from "../api/api";

export const fetchEmployeeInsuranceDetails = async (uuid) => {
  try {
    const endpoint = getEmployeeInsuranceDetails(uuid);
    const response = await axiosInstance.get(endpoint);
    console.log("🔍 RAW AXIOS RESPONSE:", response);
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

// =========================================================================
// 🆕 NEW ADDITIONS: UPDATE & UPSERT ACTIONS (DO NOT TOUCH EXISTING CODE)
// =========================================================================

import { 
  updateEmployeeInsurance, 
  upsertInsuranceProvider, 
  upsertInsuranceType, 
  upsertCoverageType 
} from "../api/api";

/**
 * Update an employee's active insurance details settings
 */
export const saveEmployeeInsuranceUpdate = async (payload) => {
  try {
    const response = await axiosInstance.put(updateEmployeeInsurance, payload);
    return response.data?.data || response.data;
  } catch (error) {
    console.error("❌ Error updating employee insurance:", error);
    throw error;
  }
};

/**
 * Upsert an insurance provider profile
 */
export const submitUpsertInsuranceProvider = async (payload) => {
  try {
    const response = await axiosInstance.put(upsertInsuranceProvider, payload);
    return response.data?.data || response.data;
  } catch (error) {
    console.error("❌ Error upserting insurance provider:", error);
    throw error;
  }
};

/**
 * Upsert an insurance type option
 */
export const submitUpsertInsuranceType = async (payload) => {
  try {
    const response = await axiosInstance.put(upsertInsuranceType, payload);
    return response.data?.data || response.data;
  } catch (error) {
    console.error("❌ Error upserting insurance type:", error);
    throw error;
  }
};

/**
 * Upsert a health/life insurance coverage configuration pattern
 */
export const submitUpsertCoverageType = async (payload) => {
  try {
    const response = await axiosInstance.put(upsertCoverageType, payload);
    return response.data?.data || response.data;
  } catch (error) {
    console.error("❌ Error upserting insurance coverage type:", error);
    throw error;
  }
};