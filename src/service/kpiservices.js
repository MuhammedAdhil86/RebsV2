import axiosInstance from "./axiosinstance";
import { getKpiCompanyDashboard, getDepartments } from "../api/api";

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

// GET /kpi/dashboard/company?month=10&year=2026&department_id=2
// department_id is optional: leave it empty for all departments.
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
    throw backendError(error);
  }
};

// Departments for the KPI filter dropdown. Item shape: { id, name }
export const fetchDepartments = async () => {
  try {
    const response = await axiosInstance.get(getDepartments);
    return response.data?.data ?? [];
  } catch (error) {
    throw backendError(error);
  }
};
