import axiosInstance from "./axiosinstance";
import {
  getEmployeeInsuranceDetails,
  getInsuranceProviders,
  updateInsuranceClaimDecision,
  getInsuranceTypes,
  getinsuranceClaimList,
  getCoverageTypes,
  updateEmployeeInsurance,
  upsertInsuranceProvider,
  upsertInsuranceType,
  upsertCoverageType,
  deleteInsuranceProvider,
  deleteInsuranceType,
  deleteCoverageType,

  // ❌ remove this line: fetchInsuranceCoverageTypes,
} from "../api/api";
// Always returns an array, whatever shape the API sends back
const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.data)) return value.data;
  return [];
};

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
    return toArray(response.data?.data ?? response.data);
  } catch (error) {
    console.error("❌ Error fetching insurance providers:", error);
    throw error;
  }
};

export const fetchInsuranceTypes = async () => {
  try {
    const response = await axiosInstance.get(getInsuranceTypes);
    return toArray(response.data?.data ?? response.data);
  } catch (error) {
    console.error("❌ Error fetching insurance types:", error);
    throw error;
  }
};

export const fetchInsuranceCoverageTypes = async () => {
  try {
    const response = await axiosInstance.get(getCoverageTypes);
    return toArray(response.data?.data ?? response.data);
  } catch (error) {
    console.error("❌ Error fetching insurance coverage types:", error);
    throw error;
  }
};

// =========================================================================
// UPDATE & UPSERT ACTIONS
// =========================================================================

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
 * Upsert an insurance provider profile (id: 0 = create, id > 0 = update)
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

// =========================================================================
// DELETE ACTIONS
// =========================================================================

export const removeInsuranceProvider = async (id) => {
  try {
    const response = await axiosInstance.delete(deleteInsuranceProvider(id));
    return response.data?.data || response.data;
  } catch (error) {
    console.error(`❌ Error deleting insurance provider ${id}:`, error);
    throw error;
  }
};

export const removeInsuranceType = async (id) => {
  try {
    const response = await axiosInstance.delete(deleteInsuranceType(id));
    return response.data?.data || response.data;
  } catch (error) {
    console.error(`❌ Error deleting insurance type ${id}:`, error);
    throw error;
  }
};

export const removeCoverageType = async (id) => {
  try {
    const response = await axiosInstance.delete(deleteCoverageType(id));
    return response.data?.data || response.data;
  } catch (error) {
    console.error(`❌ Error deleting coverage type ${id}:`, error);
    throw error;
  }
};

// =========================================================================
// CLAIMS
// =========================================================================

export const fetchInsuranceClaimList = async () => {
  try {
    const response = await axiosInstance.get(getinsuranceClaimList);
    return (
      response.data?.data?.claims || response.data?.claims || response.data
    );
  } catch (error) {
    console.error("❌ Error fetching insurance claim list:", error);
    throw error;
  }
};

export const patchInsuranceClaimDecision = async (claimId, payload) => {
  try {
    const endpoint = updateInsuranceClaimDecision(claimId);
    const response = await axiosInstance.patch(endpoint, payload);
    return response.data?.data || response.data;
  } catch (error) {
    console.error(`❌ Error patching claim decision for ID ${claimId}:`, error);
    throw error;
  }
};
