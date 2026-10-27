import axiosInstance from "./axiosinstance";
import {
  getKpiCriteria,
  postKpiCriteria,
  deleteKpiCriteria,
  getKpiSettings,
  putKpiSettings,
  getKpiCompanyDashboard,
  getKpiTeamDashboard,
  getKpiEmployeeDashboard,
} from "../api/api";

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const isBlank = (value) => !value || !String(value).trim();

/** Empty / undefined / "" -> null (applies to all departments), else a number. */
const normalizeDepartmentId = (value) =>
  value === null || value === undefined || value === "" ? null : Number(value);

/** Date object -> "YYYY-MM-DD"; strings are passed through unchanged. */
const toDateString = (date) =>
  date instanceof Date ? date.toISOString().split("T")[0] : date;

const logApiError = (context, error) =>
  console.error(`${context}:`, error.response?.data || error.message);

/**
 * Builds an Error whose message is the backend's own text (`message`, plus
 * `data` when it is a string or list of strings). Falls back to the axios
 * error text when the backend sent no body.
 */
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

/* -------------------------------------------------------------------------- */
/*                               KPI Criteria                                 */
/* -------------------------------------------------------------------------- */

/**
 * Fetches KPI criteria, optionally filtered by department.
 * @param {number|string} [departmentId] - Optional department id.
 * @returns {Promise<Array>} Normalized list of criteria.
 */
export const fetchKpiCriteria = async (departmentId) => {
  try {
    const response = await axiosInstance.get(getKpiCriteria, {
      params: departmentId
        ? { department_id: normalizeDepartmentId(departmentId) }
        : {},
    });

    const records = response.data?.data ?? [];

    return (Array.isArray(records) ? records : []).map((item) => ({
      id: item.id,
      company_id: item.company_id,
      department_name: item.department_name || "N/A",
      name: item.name || "N/A",
      is_default: Boolean(item.is_default),
      created_at: item.created_at,
      updated_at: item.updated_at,
      original: item,
    }));
  } catch (error) {
    logApiError("Error fetching KPI criteria", error);
    throw error;
  }
};

/**
 * Creates a KPI criteria.
 * @param {Object} params
 * @param {string} params.name - Criteria name.
 * @param {number|string|null} [params.department_id] - Department id, or null for all departments.
 * @returns {Promise<Object>} Saved criteria record.
 */
export const createKpiCriteria = async ({ name, department_id } = {}) => {
  try {
    if (isBlank(name)) throw new Error("Criteria name is required.");

    const response = await axiosInstance.post(postKpiCriteria, {
      name: name.trim(),
      department_id: normalizeDepartmentId(department_id),
    });

    return response.data?.data ?? response.data;
  } catch (error) {
    logApiError("Error creating KPI criteria", error);
    throw error;
  }
};

/**
 * Updates an existing KPI criteria.
 * @param {Object} params
 * @param {number|string} params.id - Criteria id.
 * @param {string} params.name - Criteria name.
 * @param {number|string|null} [params.department_id] - Department id, or null for all departments.
 * @returns {Promise<Object>} Saved criteria record.
 */
export const updateKpiCriteria = async ({ id, name, department_id } = {}) => {
  try {
    if (!id) throw new Error("Criteria id is required.");
    if (isBlank(name)) throw new Error("Criteria name is required.");

    const response = await axiosInstance.post(postKpiCriteria, {
      id: Number(id),
      name: name.trim(),
      department_id: normalizeDepartmentId(department_id),
    });

    return response.data?.data ?? response.data;
  } catch (error) {
    logApiError("Error updating KPI criteria", error);
    throw error;
  }
};

/**
 * Deletes a KPI criteria. Calls DELETE /kpi/criteria/:id
 * @param {number|string} id - Criteria id.
 * @returns {Promise<Object>} API response data.
 */
export const removeKpiCriteria = async (id) => {
  try {
    if (!id) throw new Error("Criteria id is required.");

    const response = await axiosInstance.delete(
      `${deleteKpiCriteria}/${Number(id)}`,
    );

    return response.data?.data ?? response.data;
  } catch (error) {
    logApiError("Error deleting KPI criteria", error);
    throw error;
  }
};

/* -------------------------------------------------------------------------- */
/*                               KPI Settings                                 */
/* -------------------------------------------------------------------------- */

/**
 * Fetches KPI settings.
 * @returns {Promise<{company_id: number, tracking_start: string, updated_at: string|null}>}
 */
export const fetchKpiSettings = async () => {
  try {
    const response = await axiosInstance.get(getKpiSettings);
    const data = response.data?.data ?? {};

    return {
      company_id: data.company_id,
      tracking_start: data.tracking_start || "",
      updated_at: data.updated_at || null,
    };
  } catch (error) {
    logApiError("Error fetching KPI settings", error);
    throw error;
  }
};

/**
 * Saves KPI settings.
 * @param {Object} params
 * @param {string|Date} params.tracking_start - Tracking start date (YYYY-MM-DD or Date).
 * @returns {Promise<Object>} Saved settings record.
 */
export const saveKpiSettings = async ({ tracking_start } = {}) => {
  try {
    if (!tracking_start) throw new Error("Tracking start date is required.");

    const response = await axiosInstance.put(putKpiSettings, {
      tracking_start: toDateString(tracking_start),
    });

    return response.data?.data ?? response.data;
  } catch (error) {
    logApiError("Error saving KPI settings", error);
    throw error;
  }
};

/* -------------------------------------------------------------------------- */
/*                              KPI Dashboards                                */
/* -------------------------------------------------------------------------- */

/**
 * Company dashboard. Calls GET /kpi/dashboard/company?month=&year=&department_id=
 * @param {number} month - 1-12.
 * @param {number} year - e.g. 2026.
 * @param {number|string} [departmentId] - Optional; empty means all departments.
 * @returns {Promise<Object|null>} Dashboard data.
 */
export const fetchCompanyKpi = async (month, year, departmentId) => {
  try {
    const response = await axiosInstance.get(getKpiCompanyDashboard, {
      params: {
        month,
        year,
        ...(departmentId ? { department_id: departmentId } : {}),
      },
    });

    return response.data?.data ?? null;
  } catch (error) {
    logApiError("Error fetching company KPI dashboard", error);
    throw backendError(error);
  }
};

/**
 * Team dashboard. Calls GET /kpi/dashboard/team?month=&year=
 * @param {number} month - 1-12.
 * @param {number} year - e.g. 2026.
 * @returns {Promise<Object|null>} Dashboard data.
 */
export const fetchTeamKpi = async (month, year) => {
  try {
    const response = await axiosInstance.get(getKpiTeamDashboard, {
      params: { month, year },
    });

    return response.data?.data ?? null;
  } catch (error) {
    logApiError("Error fetching team KPI dashboard", error);
    throw backendError(error);
  }
};

/**
 * Individual dashboard. Calls GET /dashboard/employee/:user_id?month=&year=
 * @param {number|string} userId - Employee id.
 * @param {number} month - 1-12.
 * @param {number} year - e.g. 2026.
 * @returns {Promise<Object|null>} Dashboard data.
 */
export const fetchEmployeeKpi = async (userId, month, year) => {
  try {
    if (!userId) throw new Error("Employee id is required.");

    const response = await axiosInstance.get(getKpiEmployeeDashboard(userId), {
      params: { month, year },
    });

    return response.data?.data ?? null;
  } catch (error) {
    logApiError("Error fetching employee KPI dashboard", error);
    throw backendError(error);
  }
};
