import axiosInstance from "./axiosinstance";
import { 
  postAddHoliday, 
  postAddCSV, 
  updateHoliday, 
  deleteHoliday, 
  getAllHolidays, 
  getHolidayByMonthYear, 
  getHolidayByBranch, 
  getStaffHolidays ,
  getFetchAllHolidays
} from "../api/api";

/**
 * Fetch all holidays
 */
export const fetchAllHolidays = async () => {
  try {
    const response = await axiosInstance.get(getFetchAllHolidays);
    return response.data?.data ?? [];
  } catch (error) {
    console.error("Error fetching all holidays:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Add a new holiday (Supports Image Upload via FormData)
 */
export const addHoliday = async (holidayData) => {
  try {
    // Expecting holidayData to be a FormData object
    const response = await axiosInstance.post(postAddHoliday, holidayData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    console.error("Error adding holiday:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Upload Holidays via CSV
 */
export const uploadHolidayCSV = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axiosInstance.post(postAddCSV, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    console.error("Error uploading CSV:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Update holiday by ID
 */
export const modifyHoliday = async (id, updatedData) => {
  try {
    const url = updateHoliday(id);
    const response = await axiosInstance.put(url, updatedData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating holiday ${id}:`, error.response?.data || error.message);
    throw error;
  }
};

/**
 * Delete a holiday
 */
export const removeHoliday = async (id) => {
  try {
    const url = deleteHoliday(id);
    const response = await axiosInstance.delete(url);
    return response.data;
  } catch (error) {
    console.error(`Error deleting holiday ${id}:`, error.response?.data || error.message);
    throw error;
  }
};

/**
 * Fetch holidays for a specific month and year
 */
export const fetchHolidaysByDate = async (month, year) => {
  try {
    // Log the input parameters
    console.log(`🚀 Fetching holidays for: Month=${month}, Year=${year}`);

    const url = getHolidayByMonthYear(month, year);
    const response = await axiosInstance.get(url);

    // Log the raw API response
    console.log("📦 Raw API Response:", response.data);

    const rawData = response.data?.data || [];
    
    const mappedData = rawData.map(item => ({
      id: item.id,
      title: item.Reason || "Holiday", 
      date: item.date.split('T')[0], 
      image: item.image || null,
      branch: item.branch,
      is_branch: item.is_branch,
      original: item
    }));

    // Log the final data being sent to the UI
    console.log("✅ Mapped Data for Calendar:", mappedData);
    
    return mappedData;
  } catch (error) {
    console.error("❌ Error in fetchHolidaysByDate:", error.response?.data || error.message);
    throw error;
  }
};
/**
 * Fetch holidays filtered by Branch
 */
export const fetchHolidaysByBranch = async (branchId) => {
  try {
    const url = getHolidayByBranch(branchId);
    const response = await axiosInstance.get(url);
    return response.data?.data ?? [];
  } catch (error) {
    console.error("Error fetching branch holidays:", error.response?.data || error.message);
    throw error;
  }
};

