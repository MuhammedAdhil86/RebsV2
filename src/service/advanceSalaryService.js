import axiosInstance from "./axiosinstance"; // <- change to your axios instance path
import {
  getAdvanceSalary,
  postAdvanceSalary,
  putAdvanceSalaryStatus,
  deleteAdvanceSalary,
} from "../api/api"; // <- change to the file where you keep the endpoints

const ADVANCE_STATUSES = ["Approved", "Rejected"];

// Always returns the backend body: { status_code, message, data }
// - interceptor returns response.data  -> res already has message/status_code
// - plain axios                        -> body is res.data
const getBody = (res) =>
  res && (res.message !== undefined || res.status_code !== undefined)
    ? res
    : res?.data ?? res;

// Puts the backend message into error.message so the UI can show it directly.
// Works whether axios throws the full error or an interceptor throws the body.
const normalizeError = (error, fallback) => {
  if (error?.code === "ERR_CANCELED") return error;

  const data = error?.response?.data ?? error;
  const message =
    (typeof data === "string" ? data : data?.error || data?.message) ||
    error?.message ||
    fallback;

  if (error && typeof error === "object") {
    error.message = message;
    return error;
  }
  return new Error(message);
};

// "/advance-salary/delete/:id" + 5 -> "/advance-salary/delete/5"
const withId = (url, id) => url.replace(":id", encodeURIComponent(id));

// "2026-10-20" -> "2026-10-20T00:00:00Z" (already-ISO values are left as is)
const toIsoDate = (value) => {
  if (!value) return value;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00Z` : value;
};

// POST /advance-salary/add
// payload: { staff_id, amount, reason, date }
export const addAdvanceSalary = async (payload, { signal } = {}) => {
  try {
    const body = {
      staff_id: payload.staff_id,
      amount: Number(payload.amount).toFixed(2), // "15000.00"
      reason: payload.reason,
      date: toIsoDate(payload.date),
    };
    const res = await axiosInstance.post(postAdvanceSalary, body, { signal });
    return getBody(res);
  } catch (error) {
    throw normalizeError(error, "Failed to add advance salary");
  }
};

// GET /advance-salary/get
export const fetchAdvanceSalaries = async ({ params, signal } = {}) => {
  try {
    const res = await axiosInstance.get(getAdvanceSalary, { params, signal });
    return getBody(res);
  } catch (error) {
    throw normalizeError(error, "Failed to load advance salaries");
  }
};

// PUT /advance-salary/change-status/{id}
// status: "Approved" | "Rejected"
export const updateAdvanceSalaryStatus = async (id, status, { signal } = {}) => {
  if (!ADVANCE_STATUSES.includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }
  try {
    const res = await axiosInstance.put(
      withId(putAdvanceSalaryStatus, id),
      { status },
      { signal },
    );
    return getBody(res);
  } catch (error) {
    throw normalizeError(error, "Failed to update status");
  }
};

// DELETE /advance-salary/delete/{id}
export const removeAdvanceSalary = async (id, { signal } = {}) => {
  try {
    const res = await axiosInstance.delete(withId(deleteAdvanceSalary, id), {
      signal,
    });
    return getBody(res);
  } catch (error) {
    throw normalizeError(error, "Failed to delete advance salary");
  }
};
