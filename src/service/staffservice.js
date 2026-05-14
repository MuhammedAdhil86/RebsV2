import axiosInstance from "./axiosinstance";
import {
  getDepartment,
  getBranch,
  getDesignations,
  postShiftcreate,
  getShifts,
  getUserPayrollTemplateAllocations,
  postAllocatePayarollTemplate
} from "../api/api";

/* ================= STAFF ================= */

// All users (default)
export const getAllStaff = async () => {
  try {
    const res = await axiosInstance.get("staff/get-by/filter");
    return Array.isArray(res?.data?.data) ? res.data.data : [];
  } catch (error) {
    console.error("Error fetching all staff:", error);
    return [];
  }
};

// Filtered users
export const filterStaff = async (params) => {
  try {
    const res = await axiosInstance.get("staff/get-by/filter", { params });
    return Array.isArray(res?.data?.data) ? res.data.data : [];
  } catch (error) {
    console.error("Error filtering staff:", error);
    return [];
  }
};

/* ================= DROPDOWNS ================= */

export const getDepartmentData = async () => {
  const res = await axiosInstance.get(getDepartment);
  return res.data.data || [];
};

export const getBranchData = async () => {
  const res = await axiosInstance.get(getBranch);
  return res.data.data || [];
};

export const getDesignationData = async () => {
  const res = await axiosInstance.get(getDesignations);
  return res.data.data || [];
};

/* ================= SHIFT ================= */

export const createShift = async (shiftData) => {
  try {
    const res = await axiosInstance.post(postShiftcreate, shiftData);
    return res.data;
  } catch (error) {
    console.error("Error creating shift:", error);
    throw error;
  }
};

export const getShiftList = async () => {
  try {
    const res = await axiosInstance.get(getShifts);
    return res?.data?.data || [];
  } catch (error) {
    console.error("Error fetching shifts:", error);
    return [];
  }
};

/* ================= PAYROLL ================= */

export const fetchUserPayrollTemplates = async (userId) => {
  try {
    const res = await axiosInstance.get(getUserPayrollTemplateAllocations(userId));
    return res?.data?.data || [];
  } catch (error) {
    console.error(`Error fetching payroll templates for user ${userId}:`, error);
    return [];
  }
};

export const allocatePayrollTemplate = async (payload) => {
  try {
    const res = await axiosInstance.post(postAllocatePayarollTemplate, payload);
    return res?.data;
  } catch (error) {
    console.error("Error allocating payroll template:", error);
    throw error;
  }
};