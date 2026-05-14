import axiosInstance from "../service/axiosinstance";
import { getWorkInformations, updateWorkInformations,getBranch,getDepartment,getDesignations } from "../api/api";

// Fetch employee work information by ID
export const fetchEmployeeWorkInfo = async (employeeId) => {
  try {
    const response = await axiosInstance.get(getWorkInformations(employeeId));
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching work info for employee ${employeeId}:`, error);
    throw error;
  }
};

// Update employee work information by ID
export const updateEmployeeWorkInfo = async (employeeId, updatedData) => {
  try {
    const response = await axiosInstance.put(updateWorkInformations(employeeId), updatedData);
    return response.data;
  } catch (error) {
    console.error(`Error updating work info for employee ${employeeId}:`, error);
    throw error;
  }
};

export const getBranchData = async () => {
  try {
    const response = await axiosInstance.get(getBranch);
    console.log("branch details response:", response);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching branch details:", error);
    throw error;
  }
};
export const getDepartmentData = async () => {
  try {
    const response = await axiosInstance.get(getDepartment);
    console.log("department details response:", response);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching department details:", error);
    throw error;
  }
};

export const getDesignationData = async () => {
  try {
    const response = await axiosInstance.get(getDesignations);
    console.log("designations details response:", response);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching designations details:", error);
    throw error;
  }
};