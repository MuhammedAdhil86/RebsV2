import axiosInstance from "./axiosinstance";

// Named imports must match the exact names exported in your api.js file
import { 
  getEmployeeLeavePolicy, 
  fetchShiftsUrl, 
  userShiftDetailsUrl, 
  userLocationDeviceUrl, 
  allocateShiftUrl,
  allocateEmployeePolicy, 
} from "../api/api"; 

/**
 * 1. Fetch Employee Policy
 * Fetches the specific policy assigned to a staff member.
 * Handles the { data: { policies: [...] } } structure.
 */
export const fetchEmployeePolicy = async (uuid) => {
  try {
    const response = await axiosInstance.get(getEmployeeLeavePolicy(uuid));
    const data = response.data?.data; // This contains { count, policies }

    return {
      count: data?.count || 0,
      // Return the full array so the component can see all names for the hover effect
      policies: Array.isArray(data?.policies) ? data.policies : [],
      // Keep 'policy' as the first item for your existing UI logic
      policy: Array.isArray(data?.policies) && data.policies.length > 0 ? data.policies[0] : null
    };
  } catch (error) {
    console.error("Error in fetchEmployeePolicy:", error);
    return { count: 0, policies: [], policy: null };
  }
};

/**
 * 2. Fetch list of all shifts
 * Used for populating shift dropdowns.
 */
export const fetchShifts = async () => {
  try {
    const response = await axiosInstance.get(fetchShiftsUrl);
    return response.data?.data || [];
  } catch (error) {
    console.error("Error in fetchShifts:", error);
    throw error;
  }
};

/**
 * 3. Fetch specific user shift details
 */
export const fetchUserShiftDetails = async (uuid) => {
  try {
    const response = await axiosInstance.get(userShiftDetailsUrl(uuid));
    return response.data?.data || {};
  } catch (error) {
    console.error("Error in fetchUserShiftDetails:", error);
    throw error;
  }
};

/**
 * 4. Fetch user device and location
 */
export const fetchUserLocationDevice = async (uuid) => {
  try {
    const response = await axiosInstance.get(userLocationDeviceUrl(uuid));
    return response.data?.data;
  } catch (error) {
    console.error("Error in fetchUserLocationDevice:", error);
    throw error;
  }
};

/**
 * 5. Allocate/Update Shift
 * Sends payload: { shift_id, staff_id, from_date, to_date }
 */
export const allocateShift = async (payload) => {
  try {
    const response = await axiosInstance.post(allocateShiftUrl, payload);
    return response.data;
  } catch (error) {
    console.error("Error in allocateShift:", error);
    throw error;
  }
};

/**
 * 6. Fetch Leave Policy by Employee
 * (Alias for fetchEmployeePolicy to support existing imports in other files)
 */
export const fetchLeavePolicyByEmployee = async (uuid) => {
  return await fetchEmployeePolicy(uuid);
};

export const allocateLeavePolicy = async (payload) => {
  try {
    const response = await axiosInstance.post(allocateEmployeePolicy, payload);
    return response.data;
  } catch (error) {
    console.error("Error allocating leave policy:", error);
    throw error;
  }
};


export const createShift = async (payload) => {
  try {
    // If you haven't defined createShiftUrl in api.js yet, 
    // you can use "/shifts/add" directly, but consistency is better.
    const response = await axiosInstance.post("/shifts/add", payload);
    return response.data;
  } catch (error) {
    console.error("Error in createShift service:", error);
    // We throw the error so the Component's catch block can handle the toast messages
    throw error;
  }
};