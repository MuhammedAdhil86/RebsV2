import axiosInstance from "./axiosinstance";

import { getpolicyLookup,
  updatePolicyStatus,
  getDifaultleavePolicy,
  postCloneLeavePolicy,
  updateSalaryPayrollComponent,
  updatePayrollSalaryTemplate,
getPayrollcomponents, 
deletePayrollComponent,
deleteTemplateAllocation,
getPayrollDataAnalyticsList,
 getReimbursementList,
 updateReimbursementStatus,
 postLeaveBulkAllocation,
deletePayrollTemplate,
postBulkAllocatePayroll,
deleteLeavePolicy,
updatePayrollAnalytics,} from "../api/api";

const payrollService = {
  // ---------------- POLICY LOOKUPS ----------------
  /**
   * Fetches dropdown data for Leave Policy Applicability
   * @param {string} filterType - e.g., 'department_id', 'branch_id', 'designation_id', or 'gender'
   * @param {string} value - defaults to 'lookup'
   */
  getPolicyLookupData: async (filterType, value = "lookup") => {
    try {
      // Constructs: /staff/get-by/single-filter?department_id=lookup
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
      const res = await axiosInstance.get("api/payroll/templates");
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
      // Adjusting based on common API patterns: returning res.data.data or res.data
      return res.data?.data || res.data || [];
    } catch (err) {
      console.error("Error in getPayrollComponents:", err.response || err);
      throw err;
    }
  },

  // ---------------- EPF ----------------
  getEPF: async () => {
    try {
      const res = await axiosInstance.get("api/payroll/statutory/epf");
      return res.data?.data || {};
    } catch (err) {
      console.error("Error in getEPF:", err.response || err);
      throw err;
    }
  },

  enableEPF: async () => {
    try {
      const res = await axiosInstance.post("api/payroll/statutory/epf/enable", { enabled: true });
      return res.data;
    } catch (err) {
      console.error("Error in enableEPF:", err.response || err);
      throw err;
    }
  },

  disableEPF: async () => {
    try {
      const res = await axiosInstance.post("api/payroll/statutory/epf/disable");
      return res.data;
    } catch (err) {
      console.error("Error in disableEPF:", err.response || err);
      throw err;
    }
  },

  // ---------------- ESI ----------------
  getESI: async () => {
    try {
      const res = await axiosInstance.get("api/payroll/statutory/esi");
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
      const res = await axiosInstance.post("api/payroll/statutory/esi/enable", { enabled: true });
      return res.data;
    } catch (err) {
      console.error("Error in enableESI:", err.response || err);
      throw err;
    }
  },

  disableESI: async () => {
    try {
      const res = await axiosInstance.post("api/payroll/statutory/esi/disable");
      return res.data;
    } catch (err) {
      console.error("Error in disableESI:", err.response || err);
      throw err;
    }
  },

  // ---------------- PROFESSIONAL TAX ----------------
  getPT: async () => {
    try {
      const res = await axiosInstance.get("api/payroll/statutory/professional-tax");
      return res.data?.data || {};
    } catch (err) {
      console.error("Error in getPT:", err.response || err);
      throw err;
    }
  },

  // ---------------- LABOUR WELFARE FUND ----------------
  getLWF: async () => {
    try {
      const res = await axiosInstance.get("api/payroll/statutory/lwf");
      return res.data?.data || {};
    } catch (err) {
      console.error("Error in getLWF:", err.response || err);
      throw err;
    }
  },

  enableLWF: async ({ state, deduction_cycle }) => {
    if (!state) throw new Error("State is required to enable LWF");
    if (!deduction_cycle) throw new Error("Deduction cycle is required");

    const res = await axiosInstance.post("api/payroll/statutory/lwf/enable", {
      enabled: true,
      state,
      deduction_cycle,
    });
    return res.data;
  },

  disableLWF: async () => {
    try {
      const res = await axiosInstance.post("api/payroll/statutory/lwf/disable");
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

      const res = await axiosInstance.put("api/payroll/statutory/lwf/upsert", {
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

  // ---------------- SALARY COMPONENTS ----------------
  createSalaryComponent: async (payload) => {
    try {
      const res = await axiosInstance.post("api/payroll/components", payload);
      console.log("Create Salary Component Response:", res);
      console.log("Create Salary Component Data:", res.data);
      return res.data;
    } catch (err) {
      console.error("Error in createSalaryComponent:", err.response || err);
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
      const res = await axiosInstance.patch(
        `${updatePolicyStatus}/${id}`
      );

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
      // Adjust the return path based on your API structure (e.g., res.data?.data)
      return res.data?.data || res.data || [];
    } catch (err) {
      console.error("Error in getDefaultLeavePolicies:", err.response || err);
      throw err;
    }
  },
cloneLeavePolicy: async (ids) => {
    try {
      // The API expects: { "leave_policy_ids": [1, 2, 5] }
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
      // 2. Use the exact API constant here
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
      const url = updatePayrollSalaryTemplate(id); // Generates /api/payroll/templates/58
      
      const { data, status } = await axiosInstance.put(url, payload);

      return {
        success: status >= 200 && status < 300,
        message: data?.message || "Template updated successfully.",
        data: data?.data || data,
      };
    } catch (err) {
      // Extract the actual error message from the backend response
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
      // If deleteLeavePolicy is a function: deleteLeavePolicy(id)
      // If it's a string: `${deleteLeavePolicy}/${id}`
      const url = typeof deleteLeavePolicy === 'function' 
                  ? deleteLeavePolicy(id) 
                  : `${deleteLeavePolicy}/${id}`;

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
      
      // Postman showed the array is in res.data.data
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
      // payload expects { id: "2", status: "approved" }
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
      console.log("LOG: Destination URL:", postLeaveBulkAllocation);
      console.log("LOG: Request Payload:", payload);

      const res = await axiosInstance.post(postLeaveBulkAllocation, payload);
      
      console.log("LOG: Bulk Allocation Success Response:", res.data);
      return res.data;
    } catch (err) {
      console.error("LOG ERROR: bulkAllocateLeave failed:", err.response || err);
      // We throw the error so the component's catch block can handle the toast message
      throw err;
    }
  },
bulkAllocatePayroll: async (payload) => {
  // 1. Clean the URL (remove accidental quotes from your api file)
  const endpoint = postBulkAllocatePayroll.replace(/"/g, ""); 

  try {
    const { data } = await axiosInstance.post(endpoint, payload);
    return data;
  } catch (err) {
    // 2. Extract the absolute best error info available
    const errorData = err.response?.data;
    
    // Create a custom error object that carries the backend's specific logic
    const customError = new Error();
    customError.message = errorData?.message || errorData?.error || "Allocation failed";
    customError.details = errorData?.errors || null; // For field-specific validation arrays
    customError.status = err.response?.status;
    
    throw customError; 
  }
},
getPayrollAnalyticsRuns: async (month, year, status) => {
    try {
      // 1. Generate the dynamic URL
      const url = getPayrollDataAnalyticsList(month, year, status);
      
      // DEBUG: Log the parameters and the final generated URL
      console.log(`🚀 Fetching Payroll Analytics for: ${month}/${year} (Status: ${status})`);
      console.log(`🔗 API URL: ${url}`);

      // 2. Execute the GET request
      const res = await axiosInstance.get(url); 
      
      // DEBUG: Log the response to see the structure of the "runs" array
      console.log("✅ Payroll Analytics Response:", res.data);
      
      // 3. Return the data
      return res.data;
    } catch (err) {
      // DEBUG: Detailed error logging
      console.error("❌ Error in getPayrollAnalyticsRuns:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      });
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
      // Throw the backend error message if available
      const errorMsg = err.response?.data?.message || "Failed to update payroll analytics";
      throw new Error(errorMsg);
    }
  },
};

export default payrollService;