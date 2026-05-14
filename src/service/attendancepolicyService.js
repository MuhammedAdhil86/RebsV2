import axiosInstance from "./axiosinstance";
import {
  postAttendancePolicyAdd,
  getShiftAttendanceUserType,
  putToggleUserActivate,
  updateAttendancePolicy,
  deleteStaffUser,
  updateLeavePolicy,
} from "../api/api";

/**
 * Service to handle attendance policy & user preference API calls
 */
const attendancePolicyService = {
  /**
   * Create a new attendance policy
   * @param {Object} policyData - The policy object from the form
   * @returns {Promise}
   */
  createPolicy: async (policyData) => {
    try {
      const response = await axiosInstance.post(
        postAttendancePolicyAdd,
        policyData
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get shift attendance user type by uuid
   * @param {string} uuid
   * @returns {Promise}
   */
  getShiftAttendanceUserType: async (uuid) => {
    try {
      const response = await axiosInstance.get(
        getShiftAttendanceUserType(uuid)
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Toggle user active / inactive
   * @param {string} uuid
   * @param {boolean} activate
   * @returns {Promise}
   */
  toggleUserActivate: async (uuid, activate) => {
    try {
      const response = await axiosInstance.put(
        putToggleUserActivate(uuid, activate)
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete user with reason
   * @param {string} uuid
   * @param {string} reason
   * @returns {Promise}
   */
  deleteUser: async (uuid, reason) => {
    try {
      const response = await axiosInstance.delete(
        deleteStaffUser(uuid),
        {
          data: { reason },
          headers: { "Content-Type": "application/json" },
        }
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  updatePolicy: async (id, policyData) => {
    try {
      // We call the updateAttendancePolicy(id) function to generate the dynamic URL
      const response = await axiosInstance.put(
        updateAttendancePolicy(id),
        policyData
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  updateLeavePolicy: async (id, policyData) => {
    try {
      // 2. We use the updateLeavePolicy(id) function to get the /leave-policy/update/${id} URL
      const response = await axiosInstance.put(
        updateLeavePolicy(id),
        policyData
      );
      return response;
    } catch (error) {
      console.error("Leave Policy Update Error:", error);
      throw error;
    }
  },
};

export default attendancePolicyService;
