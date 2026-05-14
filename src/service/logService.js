import axiosInstance from "./axiosinstance";

// Endpoint for logs
export const getLog = "/admin/stafflog/list";




/**
 * Fetch logs for today (or any given date)
 */
export const getLogEntriesForDate = async (date = new Date()) => {
  try {
    const formattedDate = formatDate(date);
    const response = await axiosInstance.post(getLog, {
      from: formattedDate,
      to: formattedDate,
    });

    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching log entries:", error);
    throw error;
  }
};
export const formatDate = (date) => {
  return date.toISOString().split("T")[0];
};