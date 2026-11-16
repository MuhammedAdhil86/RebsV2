import axiosInstance from "./axiosinstance";
import {
  getLeaveRequestConfig,
  putLeaveRequestConfig,
  deleteLeaveRequestConfig,
  getEmploymentTypeLeaveConfig,
  putEmploymentTypeLeaveConfig,
  deleteEmploymentTypeLeaveConfig, // NEW: add this to ../api/api
} from "../api/api";
import { getBranchData, fetchAllLeavePolicy } from "./companyService";

// Builds the error text ONLY from what the backend sent:
// `message`, plus `data` when it is a string or a list of strings.
// Falls back to the axios error text only when there is no backend body.
const backendError = (error) => {
  const body = error.response?.data;

  const parts = [
    body?.message,
    typeof body?.data === "string" ? body.data : null,
    Array.isArray(body?.data)
      ? body.data.filter((d) => typeof d === "string").join(", ")
      : null,
  ].filter(Boolean);

  const unique = [...new Set(parts)];
  return new Error(unique.length ? unique.join(": ") : error.message);
};

/* ============================================================
   SCOPE DROPDOWNS (leave policies + branches)
============================================================ */

/* Leave policies -> [{ id, name, ... }]  (same call as the Leave Policy page) */
export const fetchLeavePolicies = async () => {
  try {
    const response = await fetchAllLeavePolicy();
    const list = response?.data ?? response;
    return Array.isArray(list) ? list : [];
  } catch (error) {
    throw backendError(error);
  }
};

/* Branches -> [{ id, name, ... }]  (same call as the View Branch page) */
export const fetchBranchOptions = async () => {
  try {
    const data = await getBranchData();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    throw backendError(error);
  }
};

/* ============================================================
   LEAVE REQUEST CONFIG
============================================================ */

/* GET -> array of settings rows */
export const fetchLeaveRequestConfigs = async () => {
  try {
    const response = await axiosInstance.get(getLeaveRequestConfig);
    return response.data?.data ?? [];
  } catch (error) {
    throw backendError(error);
  }
};

/* PUT
   payload: {
     leave_policy_id, branch_id, is_enabled,
     long_leave_advance_days, short_leave_advance_days,
     long_leave_max_days, short_leave_max_days,
     max_requests_per_period, request_limit_period,
     allow_half_day, document_required, document_required_after_days,
     event_based, event_apply_window_days
   } */
export const saveLeaveRequestConfig = async (payload) => {
  try {
    const response = await axiosInstance.put(putLeaveRequestConfig, payload);
    return response.data; // { status_code, message, data }
  } catch (error) {
    throw backendError(error);
  }
};

/* DELETE -> settingsId is data[].id from the GET response */
export const removeLeaveRequestConfig = async (settingsId) => {
  try {
    const response = await axiosInstance.delete(
      `${deleteLeaveRequestConfig}/${settingsId}`,
    );
    return response.data; // { status_code, message, data }
  } catch (error) {
    throw backendError(error);
  }
};

/* ============================================================
   EMPLOYMENT TYPE CONFIG
============================================================ */

/* GET -> array of settings rows */
export const fetchEmploymentTypeLeaveConfigs = async () => {
  try {
    const response = await axiosInstance.get(getEmploymentTypeLeaveConfig);
    return response.data?.data ?? [];
  } catch (error) {
    throw backendError(error);
  }
};

/* PUT
   payload: { employment_type_id, leave_policy_id, branch_id, can_apply_leave } */
export const saveEmploymentTypeLeaveConfig = async (payload) => {
  try {
    const response = await axiosInstance.put(
      putEmploymentTypeLeaveConfig,
      payload,
    );
    return response.data; // { status_code, message, data }
  } catch (error) {
    throw backendError(error);
  }
};

/* DELETE -> settingsId is data[].id from the GET response */
export const removeEmploymentTypeLeaveConfig = async (settingsId) => {
  try {
    const response = await axiosInstance.delete(
      `${deleteEmploymentTypeLeaveConfig}/${settingsId}`,
    );
    return response.data; // { status_code, message, data }
  } catch (error) {
    throw backendError(error);
  }
};
