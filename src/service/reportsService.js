import axiosInstance from "./axiosinstance";
import { 
  postPayrollAttendance, 
  getEmployeeBankInfo, 
  getPayrollAnalyticsRun,
  getLeaveReport,
  attendanceFullReport
} from "../api/api";

/**
 * Fetch Leave Reports with dynamic filtering
 */
export const fetchLeaveReport = async ({ user_id, from, to, status, manager_approval }) => {
  try {
    const params = {
      ...(user_id && { user_id }),
      ...(from && { from }),
      ...(to && { to }),
      ...(status && { status }),
      ...(manager_approval && { manager_approval }),
    };

    // 1. Log the parameters being sent
    console.log("Fetching Leave Report with params:", params);

    const response = await axiosInstance.get(getLeaveReport, { params });

    // 2. Log the full data received from the backend
    console.log("Leave Report API Response:", response.data);

    return response.data?.data?.records ?? [];
  } catch (error) {
    console.error("Error fetching leave report:", error.response?.data || error.message);
    throw error;
  }
};
export const fetchPayrollAttendance = async (month, year, leaveType, accrualMethod) => {
  try {
    if (!month || !year) {
      throw new Error("Month and year are required.");
    }

    const payload = {
      month: Number(month),
      year: Number(year),
      ...(leaveType && { leave_type: leaveType.toLowerCase() }),
      ...(accrualMethod && { accrual_method: accrualMethod.toLowerCase() }),
    };

    const response = await axiosInstance.post(postPayrollAttendance, payload);
    return response.data?.data?.employees ?? [];
  } catch (error) {
    console.error("Error fetching payroll attendance:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Fetch employee bank info from API
 */
export const fetchEmployeeBankInfo = async (userUuid) => {
  try {
    const response = await axiosInstance.get(getEmployeeBankInfo, {
      params: userUuid ? { user_uuid: userUuid } : {},
    });

    return response.data?.data ?? [];
  } catch (error) {
    console.error("Error fetching employee bank info:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Fetch payroll analytics
 */
export const fetchPayrollAnalytics = async (month, year) => {
  try {
    if (!month || !year) {
      throw new Error("Month and year are required.");
    }

    const response = await axiosInstance.get(getPayrollAnalyticsRun, {
      params: {
        month: Number(month),
        year: Number(year),
      },
    });

    return response.data?.data ?? [];
  } catch (error) {
    console.error("Error fetching payroll analytics:", error.response?.data || error.message);
    throw error;
  }
};


export const fetchFullAttendanceReport = async (month, year) => {
  try {
    // Call the route function to get the string
    const url = attendanceFullReport(month, year);
    const response = await axiosInstance.get(url);

    const rawData = response.data?.data || [];

    // Map the data here to match your UI columns
    return rawData.map((item) => ({
      user_id: item.user_id || "N/A",
      name: item.name || "N/A",
      designation: item.designation || "N/A",
      department: item.department || "N/A",
      working_days: Number(item.total_working_days || 0),
      present_days: Number(item.present || 0),
      absent_days: Number(item.absent || 0),
      net_salary: Number(item.net_salary || 0),
      lop: Number(item.absent_cut || 0),
      // Keep original raw data if needed
      original: item, 
    }));
  } catch (error) {
    console.error("Error fetching full report:", error.response?.data || error.message);
    throw error;
  }
};