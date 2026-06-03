import axiosInstance from "./axiosinstance";

import {
  getpolicyLookup,
  updatePolicyStatus,
  getDifaultleavePolicy, // Retained matching naming convention
  postCloneLeavePolicy,
  updateSalaryPayrollComponent,
  updatePayrollSalaryTemplate,
  getPayrollcomponents,
  deletePayrollComponent,
  deleteTemplateAllocation,
  getPayrollDataAnalyticsList,
  getptslabs,
  putUpsertPT,
  getReimbursementList,
  updateReimbursementStatus,
  postLeaveBulkAllocation,
  deletePayrollTemplate,
  postBulkAllocatePayroll,
  deleteLeavePolicy as deleteLeavePolicyUrl, // Resolved naming clash
  updatePayrollAnalytics,
  // Safe imports of newly centralized keys
  getSalaryTemplates,
  getEpfStatus,
  postEnableEpf,
  postDisableEpf,
  getEsiStatus,
  postEnableEsi,
  postDisableEsi,
  getPtStatus,
  getLwfStatus,
  getLwfRulesByState,
  postEnableLwf,
  postDisableLwf,
  putUpsertLwf,
  getLwfStateRules,
  postCreateSalaryComponent
} from "../api/api";

const payrollService = {
  // ---------------- POLICY LOOKUPS ----------------
  getPolicyLookupData: async (filterType, value = "lookup") => {
    try {
      const res = await axiosInstance.get(`${getpolicyLookup}?${filterType}=${value}`);
      return res.data || [];
    } catch (err) {
      console.error(`Error in getPolicyLookupData (${filterType}):`, err.response || err);
      throw err;
    }
  },

  // ---------------- SALARY TEMPLATES ----------------
  getSalaryTemplates: async () => {
    try {
      const res = await axiosInstance.get(getSalaryTemplates);
      console.log("Salary Templates API Response:", res);
      console.log("Salary Templates Items:", res.data?.data?.items);
      return res.data?.data?.items || [];
    } catch (err) {
      console.error("Error in getSalaryTemplates:", err.response || err);
      throw err;
    }
  },

  getPayrollComponents: async () => {
    try {
      const res = await axiosInstance.get(getPayrollcomponents);
      return res.data?.data || res.data || [];
    } catch (err) {
      console.error("Error in getPayrollComponents:", err.response || err);
      throw err;
    }
  },

  // ---------------- EPF ----------------
  getEPF: async () => {
    try {
      const res = await axiosInstance.get(getEpfStatus);
      return res.data?.data || {};
    } catch (err) {
      console.error("Error in getEPF:", err.response || err);
      throw err;
    }
  },

  enableEPF: async () => {
    try {
      const res = await axiosInstance.post(postEnableEpf, { enabled: true });
      return res.data;
    } catch (err) {
      console.error("Error in enableEPF:", err.response || err);
      throw err;
    }
  },

  disableEPF: async () => {
    try {
      const res = await axiosInstance.post(postDisableEpf);
      return res.data;
    } catch (err) {
      console.error("Error in disableEPF:", err.response || err);
      throw err;
    }
  },

  // ---------------- ESI ----------------
  getESI: async () => {
    try {
      const res = await axiosInstance.get(getEsiStatus);
      console.log("ESI FULL RESPONSE 👉", res.data);
      console.log("ESI DATA OBJECT 👉", res.data?.data);
      console.log("ESI ROW EXISTS 👉", res.data?.data?.row_exists);
      console.log("ESI ENABLED 👉", res.data?.data?.enabled);
      return res.data?.data || {};
    } catch (err) {
      console.error("Error in getESI:", err.response || err);
      throw err;
    }
  },

  enableESI: async () => {
    try {
      const res = await axiosInstance.post(postEnableEsi, { enabled: true });
      return res.data;
    } catch (err) {
      console.error("Error in enableESI:", err.response || err);
      throw err;
    }
  },

  disableESI: async () => {
    try {
      const res = await axiosInstance.post(postDisableEsi);
      return res.data;
    } catch (err) {
      console.error("Error in disableESI:", err.response || err);
      throw err;
    }
  },

  // ---------------- PROFESSIONAL TAX ----------------
  getPT: async () => {
    try {
      const res = await axiosInstance.get(getPtStatus);
      return res.data?.data || {};
    } catch (err) {
      console.error("Error in getPT:", err.response || err);
      throw err;
    }
  },

  // ---------------- LABOUR WELFARE FUND ----------------
  getLWF: async () => {
    try {
      const res = await axiosInstance.get(getLwfStatus);
      return res.data?.data || {};
    } catch (err) {
      console.error("Error in getLWF:", err.response || err);
      throw err;
    }
  },

  /**
  
     * @param {string} stateName - Name of the state (e.g., 'west bengal')
  
     */
  getLWFRulesByState: async (stateName) => {
    if (!stateName) throw new Error("State name is required to fetch LWF rules.");

    try {
      const sanitizedState = encodeURIComponent(stateName.trim().toLowerCase());
      const res = await axiosInstance.get(`${getLwfRulesByState}?state=${sanitizedState}`);

      // ✅ FIX: Check if data is an array, and extract the first object element directly
      if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        return res.data.data[0];
      }

      // Fallback in case the backend payload structure changes to an object in the future
      return res.data?.data || res.data || null;
    } catch (err) {
      console.error(`Error in getLWFRulesByState for ${stateName}:`, err.response || err);
      throw err;
    }
  },
  enableLWF: async ({ state, deduction_cycle }) => {
    if (!state) throw new Error("State is required to enable LWF");
    if (!deduction_cycle) throw new Error("Deduction cycle is required");

    const res = await axiosInstance.post(postEnableLwf, {
      enabled: true,
      state,
      deduction_cycle,
    });
    return res.data;
  },

  disableLWF: async () => {
    try {
      const res = await axiosInstance.post(postDisableLwf);
      return res.data;
    } catch (err) {
      console.error("Error in disableLWF:", err.response || err);
      throw err;
    }
  },

  // ---------------- LABOUR WELFARE FUND (UPSERT) ----------------
  upsertLWF: async ({ state, deduction_cycle, description }) => {
    try {
      if (!state) throw new Error("State is required");
      if (!deduction_cycle) throw new Error("Deduction cycle is required");

      const res = await axiosInstance.put(putUpsertLwf, {
        state,
        deduction_cycle,
        description,
      });
      return res.data;
    } catch (err) {
      console.error("Error in upsertLWF:", err.response || err);
      throw err;
    }
  },

  getLWFStateRules: async () => {
    try {
      const res = await axiosInstance.get(getLwfStateRules);
      // Returns res.data.data or falls back to res.data, otherwise returns an empty array
      return res.data?.data || res.data || [];
    } catch (err) {
      console.error("Error in getLWFStateRules:", err.response || err);
      throw err;
    }
  },
  getActivePTSlabs: async (stateName) => {
    if (!stateName) throw new Error("State name parameter is required for lookup.");

    try {
      // Normalizes naming spaces and converts characters to lowercase automatically
      const sanitizedState = encodeURIComponent(stateName.trim().toLowerCase());
      const res = await axiosInstance.get(`${getptslabs}?state=${sanitizedState}`);

      // Flexible unpacking structure to safely forward either nested array payloads or fallbacks
      return res.data?.data || res.data || [];
    } catch (err) {
      console.error(`Error in getActivePTSlabs request pipeline for ${stateName}:`, err.response || err);
      throw err;
    }
  },
  // ---------------- SALARY COMPONENTS ----------------
  createSalaryComponent: async (payload) => {
    try {
      const res = await axiosInstance.post(postCreateSalaryComponent, payload);
      console.log("Create Salary Component Response:", res);
      console.log("Create Salary Component Data:", res.data);
      return res.data;
    } catch (err) {
      console.error("Error in createSalaryComponent:", err.response || err);
      throw err;
    }
  },
  upsertPT: async (payload) => {
    try {
      const res = await axiosInstance.put(putUpsertPT, payload);
      return res.data;
    } catch (err) {
      console.error("Error inside upsertPT execution row:", err);
      throw err;
    }
  },

  // ---------------- LEAVE POLICY ----------------
  addLeavePolicy: async (payload) => {
    try {
      const res = await axiosInstance.post("/leave-policy/add", payload);
      console.log("Add Leave Policy Response:", res);
      console.log("Add Leave Policy Data:", res.data);
      return res.data;
    } catch (err) {
      console.error("Error in addLeavePolicy:", err.response || err);
      throw err;
    }
  },

  updatePolicyStatus: async (id) => {
    try {
      const res = await axiosInstance.patch(`${updatePolicyStatus}/${id}`);
      console.log("Status Update Response:", res.data);
      return res.data;
    } catch (err) {
      console.error("Error in updatePolicyStatus:", err.response || err);
      throw err;
    }
  },

  getDefaultLeavePolicies: async () => {
    try {
      const res = await axiosInstance.get(getDifaultleavePolicy);
      console.log("Default Leave Policy Response:", res.data);
      return res.data?.data || res.data || [];
    } catch (err) {
      console.error("Error in getDefaultLeavePolicies:", err.response || err);
      throw err;
    }
  },

  cloneLeavePolicy: async (ids) => {
    try {
      const res = await axiosInstance.post(postCloneLeavePolicy, {
        leave_policy_ids: ids
      });
      return res.data;
    } catch (err) {
      console.error("Error in cloneLeavePolicy:", err.response || err);
      throw err;
    }
  },

  updateSalaryComponent: async (id, payload) => {
    try {
      const url = updateSalaryPayrollComponent(id);
      const response = await axiosInstance.put(url, payload);

      return {
        ok: response.status === 200 || response.status === 204,
        message: response.data?.message || "Updated Successfully",
        data: response.data
      };
    } catch (error) {
      console.error("API Error in updateSalaryComponent:", error);
      throw error;
    }
  },

  updateSalaryTemplate: async (id, payload) => {
    if (!id) throw new Error("Template ID is missing.");

    try {
      const url = updatePayrollSalaryTemplate(id);
      const { data, status } = await axiosInstance.put(url, payload);

      return {
        success: status >= 200 && status < 300,
        message: data?.message || "Template updated successfully.",
        data: data?.data || data,
      };
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to update salary template.";
      console.error(`[PayrollService] Update Error for ID ${id}:`, err.response || err);
      throw new Error(errorMessage);
    }
  },

  deleteComponent: async (id) => {
    try {
      const response = await axiosInstance.delete(`${deletePayrollComponent}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting component ${id}:`, error);
      throw error;
    }
  },

  deleteTemplate: async (id) => {
    try {
      const response = await axiosInstance.delete(`${deletePayrollTemplate}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting template ${id}:`, error);
      throw error;
    }
  },

  deleteAllocation: async (id) => {
    try {
      const response = await axiosInstance.delete(`${deleteTemplateAllocation}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting allocation ${id}:`, error);
      throw error;
    }
  },

  deleteLeavePolicy: async (id) => {
    try {
      const url = typeof deleteLeavePolicyUrl === 'function'
        ? deleteLeavePolicyUrl(id)
        : `${deleteLeavePolicyUrl}/${id}`;

      const res = await axiosInstance.delete(url);
      console.log(`Delete Leave Policy ${id} Response:`, res.data);
      return res.data;
    } catch (err) {
      console.error(`Error in deleteLeavePolicy (${id}):`, err.response || err);
      throw err;
    }
  },

  getReimbursements: async (signal) => {
    try {
      const res = await axiosInstance.get(getReimbursementList, { signal });
      const actualData = res.data?.data;
      if (process.env.NODE_ENV === "development") {
        console.log("💸 Reimbursement API Response:", actualData);
      }
      return Array.isArray(actualData) ? actualData : [];
    } catch (err) {
      if (err.name === "CanceledError") return [];
      console.error("Reimbursement Fetch Error:", err.response || err);
      throw err;
    }
  },

  updateReimbursementStatus: async (payload) => {
    try {
      const res = await axiosInstance.patch(updateReimbursementStatus, payload);
      if (process.env.NODE_ENV === "development") {
        console.groupCollapsed("%c 📝 Reimbursement: Status Update", "color: #10b981; font-weight: bold;");
        console.log("Payload:", payload);
        console.log("Response:", res.data);
        console.groupEnd();
      }
      return res.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to update status";
      console.error("[Service Error] updateReimbursementStatus 👉", errorMsg);
      throw new Error(errorMsg);
    }
  },

  bulkAllocateLeave: async (payload) => {
    try {
      console.log("LOG: Initiating Bulk Allocation Request...");
      const res = await axiosInstance.post(postLeaveBulkAllocation, payload);
      return res.data;
    } catch (err) {
      console.error("LOG ERROR: bulkAllocateLeave failed:", err.response || err);
      throw err;
    }
  },

  bulkAllocatePayroll: async (payload) => {
    try {
      const { data } = await axiosInstance.post(postBulkAllocatePayroll, payload);
      return data;
    } catch (err) {
      const errorData = err.response?.data;
      const customError = new Error();
      customError.message = errorData?.message || errorData?.error || "Allocation failed";
      customError.details = errorData?.errors || null;
      customError.status = err.response?.status;
      throw customError;
    }
  },

  getPayrollAnalyticsRuns: async (month, year, status) => {
    try {
      const url = getPayrollDataAnalyticsList(month, year, status);
      console.log(`🚀 Fetching Payroll Analytics for: ${month}/${year} (Status: ${status})`);
      const res = await axiosInstance.get(url);
      return res.data;
    } catch (err) {
      console.error("❌ Error in getPayrollAnalyticsRuns:", err);
      throw err;
    }
  },

  updatePayrollAnalyticsRuns: async (payload) => {
    try {
      const res = await axiosInstance.put(updatePayrollAnalytics, payload);
      if (process.env.NODE_ENV === "development") {
        console.log("✅ Payroll Analytics Update Response:", res.data);
      }
      return res.data;
    } catch (err) {
      console.error("❌ Error in updatePayrollAnalyticsRuns:", err.response || err);
      const errorMsg = err.response?.data?.message || "Failed to update payroll analytics";
      throw new Error(errorMsg);
    }
  },
};

export default payrollService;