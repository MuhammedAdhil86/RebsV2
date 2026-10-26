import axiosInstance from "./axiosinstance";
import {
  postAddHoliday,
  postAddCSV,
  updateHoliday,
  deleteHoliday,
  getHolidayByMonthYear,
  getHolidayByBranch,
  getFetchAllHolidays,
} from "../api/api";

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

export const fetchAllHolidays = async (year) => {
  try {
    const response = await axiosInstance.get(getFetchAllHolidays, {
      params: year ? { year } : {},
    });
    return response.data?.data ?? [];
  } catch (error) {
    throw backendError(error);
  }
};
export const addHoliday = async (holidayData) => {
  try {
    const response = await axiosInstance.post(postAddHoliday, holidayData, {
      headers: { "Content-Type": undefined },
    });
    return response.data; // { status_code, message, data }
  } catch (error) {
    throw backendError(error);
  }
};

export const uploadHolidayCSV = async (formData) => {
  try {
    const response = await axiosInstance.post(postAddCSV, formData, {
      headers: { "Content-Type": undefined },
    });
    return response.data; // { status_code, message, data }
  } catch (error) {
    throw backendError(error);
  }
};

export const modifyHoliday = async (id, updatedData) => {
  try {
    const url = updateHoliday(id);
    const response = await axiosInstance.put(url, updatedData, {
      headers: { "Content-Type": undefined },
    });
    return response.data; // { status_code, message, data }
  } catch (error) {
    throw backendError(error);
  }
};

export const removeHoliday = async (id) => {
  try {
    const url = deleteHoliday(id);
    const response = await axiosInstance.delete(url);
    return response.data; // { status_code, message, data }
  } catch (error) {
    throw backendError(error);
  }
};

export const fetchHolidaysByDate = async (month, year) => {
  try {
    const url = getHolidayByMonthYear(month, year);
    const response = await axiosInstance.get(url);
    const rawData = response.data?.data || [];

    return rawData.map((item) => ({
      id: item.id,
      title: item.Reason || "Holiday",
      date: item.date ? item.date.split("T")[0] : "",
      image: item.image || null,
      branch: item.branch,
      is_branch: item.is_branch,
      original: item,
    }));
  } catch (error) {
    throw backendError(error);
  }
};

export const fetchHolidaysByBranch = async (branchId) => {
  try {
    const url = getHolidayByBranch(branchId);
    const response = await axiosInstance.get(url);
    return response.data?.data ?? [];
  } catch (error) {
    throw backendError(error);
  }
};
