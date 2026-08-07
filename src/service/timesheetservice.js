import axiosInstance from "./axiosinstance";
import { getEmployeeTimesheets, upsertTimeSheet,getTimesheetStatuses } from "../api/api";
/**
 * Fetch employee timesheets based on filter parameters
 * @param {Object} params - Query filters (e.g., { view: 'month', month: 8, year: 2026 })
 */
export const fetchEmployeeTimesheets = async (params = {}) => {
  try {
    const endpoint = getEmployeeTimesheets(params);
    const response = await axiosInstance.get(endpoint);
    
    console.log("🔍 RAW TIMESHEET AXIOS RESPONSE:", response);
    return response.data?.data || response.data || response;
  } catch (error) {
    console.error("❌ Axios request failed for timesheet fetch:", error.message);
    throw error;
  }
};

// =========================================================================
// 🆕 NEW ADDITION: UPSERT TIMESHEET ENTRY (DO NOT TOUCH EXISTING CODE)
// =========================================================================

/**
 * Upsert (Create/Update) single or multiple timesheet entries
 * @param {Object} payload - { work_date: "YYYY-MM-DD", entries: [...] }
 */
export const postUpsertTimeSheet = async (payload) => {
  try {
    const response = await axiosInstance.post(upsertTimeSheet, payload);
    console.log("🔍 RAW TIMESHEET UPSERT AXIOS RESPONSE:", response);
    return response.data?.data || response.data || response;
  } catch (error) {
    console.error("❌ Axios request failed for timesheet upsert:", error.message);
    throw error;
  }
};

export const fetchTimesheetStatuses = async () => {
  try {
    const response = await axiosInstance.get(getTimesheetStatuses);
    console.log("🔍 RAW TIMESHEET STATUSES RESPONSE:", response);
    
    // Safely extract data payload regardless of backend wrapper structure
    const result = response?.data?.data || response?.data || response;
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("❌ Axios request failed for timesheet statuses fetch:", error.message);
    throw error;
  }
};