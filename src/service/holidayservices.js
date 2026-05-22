import axiosInstance from "./axiosinstance";
import { 
  postAddHoliday, 
  postAddCSV, 
  updateHoliday, 
  deleteHoliday, 
  getHolidayByMonthYear, 
  getHolidayByBranch, 
  getFetchAllHolidays
} from "../api/api";

export const fetchAllHolidays = async () => {
  try {
    const response = await axiosInstance.get(getFetchAllHolidays);
    return response.data?.data ?? [];
  } catch (error) {
    const backendMessage = error.response?.data?.data || error.response?.data?.message || error.message;
    throw new Error(String(backendMessage));
  }
};

export const addHoliday = async (holidayData) => {
  try {
    const response = await axiosInstance.post(postAddHoliday, holidayData, {
      headers: { "Content-Type": undefined },
    });
    return response.data;
  } catch (error) {
    // PRIORITIZE .data OVER .message TO CATCH THE ACTUAL VALIDATION WARNING
    const backendMessage = error.response?.data?.data || error.response?.data?.message || error.message;
    throw new Error(String(backendMessage));
  }
};

export const uploadHolidayCSV = async (formData) => {
  try {
    const response = await axiosInstance.post(postAddCSV, formData, {
      headers: { "Content-Type": undefined },
    });
    return response.data;
  } catch (error) {
    const backendMessage = error.response?.data?.data || error.response?.data?.message || error.message;
    throw new Error(String(backendMessage));
  }
};

export const modifyHoliday = async (id, updatedData) => {
  try {
    const url = updateHoliday(id);
    const response = await axiosInstance.put(url, updatedData, {
      headers: { "Content-Type": undefined },
    });
    return response.data;
  } catch (error) {
    const backendMessage = error.response?.data?.data || error.response?.data?.message || error.message;
    throw new Error(String(backendMessage));
  }
};

export const removeHoliday = async (id) => {
  try {
    const url = deleteHoliday(id);
    const response = await axiosInstance.delete(url);
    return response.data;
  } catch (error) {
    const backendMessage = error.response?.data?.data || error.response?.data?.message || error.message;
    throw new Error(String(backendMessage));
  }
};

export const fetchHolidaysByDate = async (month, year) => {
  try {
    const url = getHolidayByMonthYear(month, year);
    const response = await axiosInstance.get(url);
    const rawData = response.data?.data || [];
    
    return rawData.map(item => ({
      id: item.id,
      title: item.Reason || "Holiday", 
      date: item.date ? item.date.split('T')[0] : "", 
      image: item.image || null,
      branch: item.branch,
      is_branch: item.is_branch,
      original: item
    }));
  } catch (error) {
    const backendMessage = error.response?.data?.data || error.response?.data?.message || error.message;
    throw new Error(String(backendMessage));
  }
};

export const fetchHolidaysByBranch = async (branchId) => {
  try {
    const url = getHolidayByBranch(branchId);
    const response = await axiosInstance.get(url);
    return response.data?.data ?? [];
  } catch (error) {
    const backendMessage = error.response?.data?.data || error.response?.data?.message || error.message;
    throw new Error(String(backendMessage));
  }
};