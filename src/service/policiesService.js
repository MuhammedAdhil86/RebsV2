import axiosInstance from "./axiosinstance";

// Named imports must match the exact names exported in your api.js file
import {
  getEmployeeLeavePolicy,
  fetchShiftsUrl,
  userShiftDetailsUrl,
  userLocationDeviceUrl,
  allocateShiftUrl,
  allocateEmployeePolicy,
  fetchEffectiveAllocations,
  companyShiftSwapLogsUrl,
  ShiftSwapStatusChangeUrl,
  postSwapShift,
} from "../api/api";

/**
 * 1. Fetch Employee Policy
 * Fetches the specific policy assigned to a staff member.
 * Handles the { data: { policies: [...] } } structure.
 */
export const fetchEmployeePolicy = async (uuid) => {
  try {
    const response = await axiosInstance.get(getEmployeeLeavePolicy(uuid));
    const data = response.data?.data; // Contains { count, policies }
    const policies = Array.isArray(data?.policies) ? data.policies : [];

    return {
      count: data?.count || 0,
      // Full array so the component can show all names for the hover effect
      policies,
      // First item, kept for existing UI logic
      policy: policies.length > 0 ? policies[0] : null,
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
 * Shift swap service (object-style API)
 */
export const shiftSwapService = {
  // Shift swap requests of the company.
  //   no departmentId -> whole company
  //   departmentId    -> only that department (?department_id=104)
  fetchCompanyShiftSwaps: async (departmentId) => {
    try {
      const response = await axiosInstance.get(companyShiftSwapLogsUrl, {
        params: departmentId ? { department_id: departmentId } : undefined,
      });

      // Handles both shapes:
      //  - plain axios response  -> response.data = { data: [...] }
      //  - unwrapping interceptor -> response     = { data: [...] }
      const body = response?.data;
      const list = Array.isArray(body)
        ? body
        : Array.isArray(body?.data)
          ? body.data
          : Array.isArray(response)
            ? response
            : [];

      console.log("[shift swaps] parsed rows:", list.length, list);
      return list;
    } catch (error) {
      console.error(
        "Error fetching shift swap requests:",
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  // 7. Respond to Swap Request (approve / reject)
  // POST /shifts/employee/shift-swap-requests/respond
  // Body: { request_id, status: "approved" | "rejected", rejection_reason? }
  // rejection_reason is required when status is "rejected".
  respondToSwapRequest: async ({ requestId, status, rejectionReason }) => {
    try {
      const normalized = String(status).toLowerCase();
      const payload = {
        request_id: Number(requestId),
        status: normalized,
      };
      if (normalized === "rejected") {
        payload.rejection_reason = (rejectionReason || "").trim();
      }

      const response = await axiosInstance.post(
        ShiftSwapStatusChangeUrl,
        payload,
      );
      return response.data;
    } catch (error) {
      console.error(
        "Error responding to shift swap request:",
        error.response?.data || error.message,
      );
      throw error;
    }
  },
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

/**
 * 7. Allocate Leave Policy
 */
export const allocateLeavePolicy = async (payload) => {
  try {
    const response = await axiosInstance.post(allocateEmployeePolicy, payload);
    return response.data;
  } catch (error) {
    console.error("Error allocating leave policy:", error);
    throw error;
  }
};

/**
 * 8. Create Shift
 * TIP: move "/shifts/add" into api.js as createShiftUrl for consistency.
 */
export const createShift = async (payload) => {
  try {
    const response = await axiosInstance.post("/shifts/add", payload);
    return response.data;
  } catch (error) {
    console.error("Error in createShift service:", error);
    // Rethrow so the component's catch block can show toast messages
    throw error;
  }
};

/**
 * 9. Fetch shift allocations for swap (optionally filtered by user)
 */
export const fetchShiftAllocationsforSwap = async (uuid = null) => {
  try {
    const cleanedUuid = typeof uuid === "string" ? uuid.trim() : uuid;

    const response = await axiosInstance.get(fetchEffectiveAllocations, {
      // Empty string / null -> no query string appended
      params: cleanedUuid ? { user_id: cleanedUuid } : {},
    });

    return response.data;
  } catch (error) {
    console.error("Failed to fetch shift allocations inside service:", error);
    throw error;
  }
};

/**
 * 10. Execute Shift Swap
 * NOTE: unlike most functions here, this does NOT throw.
 * It returns { success, message, data } for both success and failure.
 */
export const executeShiftSwap = async (payload) => {
  try {
    const response = await axiosInstance.post(postSwapShift, payload);

    return {
      success: true,
      message: response.data?.message || "Shifts swapped successfully.",
      data: response.data?.data || null,
    };
  } catch (error) {
    console.error("Error inside executeShiftSwap service:", error);

    // Safely extract the response body whether it is parsed or raw text
    let serverData = error.response?.data;
    if (typeof serverData === "string") {
      try {
        serverData = JSON.parse(serverData);
      } catch (e) {
        // Leave as string if it isn't JSON
      }
    }

    const serverMessage = serverData?.message || "shift swap failed";
    const detailedReason =
      serverData?.data || "Failed to process shift swap request.";

    return {
      success: false,
      message: serverMessage, // e.g. "shift swap failed"
      data: detailedReason, // e.g. "both employees already have the same shift on..."
    };
  }
};

/**
 * 11. Get effective allocations (month / department / user filters)
 */
export const getEffectiveAllocations = async ({
  month,
  departmentId,
  userId,
} = {}) => {
  const params = {};
  if (month) params.month = month;
  if (departmentId) params.department = departmentId;
  if (userId) params.user_id = userId;

  const res = await axiosInstance.get(fetchEffectiveAllocations, { params });
  return res.data;
};

export default shiftSwapService;
