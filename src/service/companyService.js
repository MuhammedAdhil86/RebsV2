import axiosInstance from "../service/axiosinstance";
import {
  getBranch,
  getDepartment,
  getDesignations,
  getCompanyDetails,
  allocateAttendancePolicy,
  getShifts,
  allocateLeavePolicy,
   regularizeAttendanceApproval,
  allocateAllowance,
  allocateCompliance,
  getRoles,
  allocateRoles,
  getPolicies,postLeaveBulkAllocation,
  getLeavePolicy,
  getAllowanceData,
  getCompliances,
  getCountry,
  RemainingRegularization,
  updateCompanyDet,
  postBranch,
  getOrgType,
  postDepartment,
  updatePresetAttendanceTemplate,
  postDivision,
  getPresetAttendanceTemplate,
  deleteAttendancePolicyUrl,
  postDesignation,
  getWeeklyOffDefault ,
  postShiftcreate,
  getWeeklyOffBranch,
  companyPreview,
  deleteShiftUrl,
  getAttendancepolicy,
  getAllLeavePolicy
} from "../api/api";

export const getBranchData = async () => {
  try {
    const response = await axiosInstance.get(getBranch);

    return response.data.data;
  } catch (error) {
    console.error("Error fetching branch details:", error);
    throw error;
  }
};

export const getDepartmentData = async () => {
  try {
    const response = await axiosInstance.get(getDepartment);

    console.log("Full API Response:", response);           // full axios response
    console.log("Department Data:", response.data);        // response.data
    console.log("Department List:", response.data.data);   // actual array you use

    return response.data.data;
  } catch (error) {
    console.error("Error fetching department details:", error);
    throw error;
  }
};

export const getDesignationData = async () => {
  try {
    const response = await axiosInstance.get(getDesignations);
 
    return response.data.data;
  } catch (error) {
    console.error("Error fetching designations details:", error);
    throw error;
  }
};

export const getOrganisationDetails = async () => {
  try {
    const userData = JSON.parse(localStorage.getItem("userData"));
    const companyId = userData?.company?.id;

    if (!companyId) throw new Error("Company ID not found in localStorage.");

    const response = await axiosInstance.get(getCompanyDetails(companyId));

    return response.data.data;
  } catch (error) {
    console.error("Error fetching company details:", error);
    throw error;
  }
};
export const allocateAttPolicy = async (uuid, attendanceData) => {
  try {
    const response = await axiosInstance.post(
      `${allocateAttendancePolicy}`,
      attendanceData
    );
    return response.data;
  } catch (error) {
    console.error("Error allocating attendance policy:", error);
    throw error;
  }
};

export const ShiftDataGet = async () => {
  try {
    const response = await axiosInstance.get(getShifts);
    console.log("shift details response:", response.data.data);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching shift details:", error);
    throw error;
  }
};


export const getShiftPolicyById = async (id) => {
  try {
    const response = await axiosInstance.get(`/shifts/staff/get/${id}`);
    
    // FIX: Access the first element [0] because the API returns an array
    if (response.data && response.data.data && response.data.data.length > 0) {
      return response.data.data[0]; 
    }
    return null;
  } catch (error) {
    console.error("Error fetching shift policy:", error);
    throw error;
  }
};


export const allocateLeaPolicy = async (uuid, policyData) => {
  try {
    const response = await axiosInstance.post(
      `${allocateLeavePolicy}/${uuid}`,
      policyData
    );
    return response.data;
  } catch (error) {
    console.error("Error allocating leave policy:", error);
    throw error;
  }
};


export const fetchPrivilegeLeavePolicy = async (employeeUuid) => {
  try {
    const response = await axiosInstance.get(
      `/leave-policy/allocated/get/${employeeUuid}`
    );
    return response.data.data;
  } catch (error) {
    console.error("Error fetching leave policy:", error);
    throw error;
  }
};

export const fetchPrivilegeAllowance = async (employeeUuid) => {
  try {
    const response = await axiosInstance.get(`/allowance/allocated/get/${employeeUuid}`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching allowance policy:", error);
    throw error;
  }
};


export const allocateAllowanceData = async (uuid, allowanceData) => {
  try {
    const response = await axiosInstance.post(
      `${allocateAllowance}/${uuid}`,
      allowanceData
    );
    return response.data;
  } catch (error) {
    console.error("Error allocating allowance policy:", error);
    throw error;
  }
};


export const fetchPrivilegeCompliance = async (employeeUuid) => {
  try {
    const response = await axiosInstance.get(`/compliance/allocated/get/${employeeUuid}`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching compliance policy:", error);
    throw error;
  }
};


export const allocateComplianceData = async (uuid, complianceData) => {
  try {
    const response = await axiosInstance.post(
      `${allocateCompliance}/${uuid}`,
      complianceData
    );
    return response.data;
  } catch (error) {
    console.error("Error allocating Compliance policy:", error);
    throw error;
  }
};

export const fetchRoles = async () => {
  try {
    const response = await axiosInstance.get(getRoles);
    console.log("role details response:", response);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching roles details:", error);
    throw error;
  }
};

export const allocateRolesData = async (uuid, rolesData) => {
  try {
    const response = await axiosInstance.put(
      `${allocateRoles}/${uuid}`,
      rolesData
    );
    return response.data;
  } catch (error) {
    console.error("Error allocating Compliance policy:", error);
    throw error;
  }
};

export const fetchPolicyData = async () => {
  try {
    const response = await axiosInstance.get(getPolicies);
    console.log("policy details response:", response);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching policy details:", error);
    throw error;
  }
};


export const fetchLeavePolicy = async () => {
  try {
    const response = await axiosInstance.get(getLeavePolicy);
    console.log("leave details response:", response);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching leave details:", error);
    throw error;
  }
};


export const AllowanceDataGet = async () => {
  try {
    const response = await axiosInstance.get(getAllowanceData);
    console.log("allowance details response:", response);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching allowance details:", error);
    throw error;
  }
};

export const ComplianceDataGet = async () => {
  try {
    const response = await axiosInstance.get(getCompliances);
    console.log("compliance details response:", response);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching compliace details:", error);
    throw error;
  }
};

export const changeAttendanceReq = async (uuid, attendanceStatus) => {
  try {
    const response = await axiosInstance.put(`/staff/attendance-require/${uuid}`, attendanceStatus);
    return response.data;
  } catch (error) {
    console.error("Error updating attendance required status:", error);
    throw error;
  }
};

export const fetchEmployeeShift = async (user_id,month,year) => {
  try {
    const response = await axiosInstance.get(`/shift-policy/get/${user_id}/${month}/${year}`);
    console.log("employee shift details:", response);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching employee shift:", error);
    throw error;
  }
};


export const addShift = async (shiftData, user_id, start_date, end_date) => {
  try {
    // Pass start_date and end_date directly in the URL path
    const response = await axiosInstance.post(
      `/shift-policy/allocate/${user_id}/${start_date}/${end_date}`, 
      shiftData
    );
    return response.data;
  } catch (error) {
    console.error("Error adding shift:", error);
    throw error;
  }
};


export const fetchTimeline = async (month, year, user_id) => {
  try {
    const response = await axiosInstance.get(`/admin/staff/activity/timeline/${month}/${year}/${user_id}`);
    console.log("timeline activity response:", response);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching timeline activity:", error);
    throw error;
  }
};


export const fetchPieChart = async (month, year, user_id) => {
  try {
    const response = await axiosInstance.get(`/admin/staff/evaluation/${month}/${year}/${user_id}`);

    return response.data.data;
  } catch (error) {
    console.error("Error fetching piechart activity:", error);
    throw error;
  }
};
export const getCountryName = async () => {
  try {
    const response = await axiosInstance.get(getCountry);
    return response.data.data;
  } catch (error) {
    console.error("Error creating asset:", error);
    throw error;
  }
};

export const updateCompanyDetails = async (companyData) => {
  try {
    const response = await axiosInstance.put(updateCompanyDet, companyData, {
      headers: {
        "Content-Type": "multipart/form-data", // Make sure this is necessary based on the API
      },
    });
    console.log("API Response:", response.data.status_code);
    return response.data;
  } catch (error) {
    console.error("Error updating company details:", error);
    throw error;
  }
};

export const OrganizationType = async () => {
  try {
    const response = await axiosInstance.get(getOrgType);
    return response.data.data;
  } catch (error) {
    console.error("Error creating asset:", error);
    throw error;
  }
};


export const addBranch = async (branchData) => {
  try {
    const response = await axiosInstance.post(postBranch, branchData);
    return response.data;
  } catch (error) {
    console.error("Error adding branch:", error);
    throw error;
  }
};

export const editBranch = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/branch/update/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Error updating branch:", error);
    throw error;
  }
};

export const addDepartment = async (DepartmentData) => {
  try {
    const response = await axiosInstance.post(postDepartment, DepartmentData);
    return response.data;
  } catch (error) {
    console.error("Error adding department:", error);
    throw error;
  }
};
export const addDivision = async (id, divisionData) => {
  try {
    const response = await axiosInstance.post(postDivision(id), divisionData, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error adding division:", error);
    throw error;
  }
};
export const addDesignation = async (DesignationData) => {
  try {
    const response = await axiosInstance.post(postDesignation, DesignationData);
    return response.data;
  } catch (error) {
    console.error("Error adding designation:", error);
    throw error;
  }
};

export const createShift = async (shiftData) => {
  try {
    const res = await axiosInstance.post(postShiftcreate, shiftData);
    console.log("Shift creation response:", res.data);
    return res.data;
  } catch (error) {
    console.error("Error creating shift:", error);
    throw error; // so the caller knows it failed
  }
};

export const getAttendancePolicyData = async () => {
  try {
    const res = await axiosInstance.get("attendance-policy/get"); // ✅ leading slash
    console.log("Policies:", res.data.data);
    return res.data.data;
  } catch (err) {
    console.error("Error fetching attendance policies:", err.response?.data || err.message);
    return [];
  }
};


export const allocateShiftBulkUpsert = async (payload) => {
  try {
    const response = await axiosInstance.post("/shifts/allocate/bulk", payload);
    return response.data;
  } catch (error) {
    console.error("Error allocating shift in bulk:", error);
    throw error;
  }
};

export const fetchAllLeavePolicy = async () => {
  try {
    const response = await axiosInstance.get(getAllLeavePolicy);
    console.log("all leave policy response:", response);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching all leave policies:", error);
    throw error;
  }
};

export const getCompanyPreview = async () => {
  try {
    const response = await axiosInstance.get(companyPreview);
    console.log("Company preview response:", response);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching company preview:", error);
    throw error;
  }
};
export const bulkAllocateLeave = async (data) => {
  try {
    const res = await axiosInstance.post(postLeaveBulkAllocation, data);
    return res.data;
  } catch (error) {
    console.error("Error in bulk leave allocation:", error);
    throw error; // Throwing error so the component's catch block can handle the toast
  }
};
export const fetchPresetAttendanceTemplates = async () => {
  try {
    // Now 'getPresetAttendanceTemplate' refers correctly to the imported string "/attendance-policy/defaults"
    const response = await axiosInstance.get(getPresetAttendanceTemplate);
    
    console.log("Preset Templates response:", response);
    
    // Correctly drilling down into the data
    return response.data.data;
  } catch (error) {
    console.error("Error fetching preset attendance templates:", error);
    throw error;
  }
};

export const updatePresetTemplate = async (id, payload) => {
  try {
    // This calls /attendance-policy/update/defaults/67
    const response = await axiosInstance.put(updatePresetAttendanceTemplate(id), payload);
    return response.data;
  } catch (error) {
    console.error("Error updating preset template:", error);
    throw error;
  }
};


export const deleteattendancepolicy = async (id) => {
  try {
    const response = await axiosInstance.delete(deleteAttendancePolicyUrl(id));
    return response.data;
  } catch (error) {
    throw error;
  }
};


export const deleteshift = async (id) => {
  if (!id) throw new Error("ID is required");

  try {
    // This now calls /api_v1/shifts/delete/${id}
    // Which proxies to https://...app/shifts/delete/${id}
    const response = await axiosInstance.delete(deleteShiftUrl(id));
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const approveRegularization = async (requestId, status, remarks = "") => {
  // 1. Basic Validation
  if (!requestId) throw new Error("Request ID is required");
  if (!status) throw new Error("Status is required (approved/rejected)");

  try {
    // 2. API Call
    const response = await axiosInstance.put(regularizeAttendanceApproval, {
      request_id: requestId,
      status,  // Shorthand for status: status
      remarks, // Shorthand for remarks: remarks
    });

    // 3. Return the data (usually contains a success message or updated object)
    return response.data;
  } catch (error) {
    // 4. Log the error for developers and re-throw for the UI toast
    console.error("Regularization Approval Error:", error.response?.data || error.message);
    throw error;
  }
};
/**
 * CORRECTED: Fetch Weekly Offs for a specific branch
 */
export const getWeeklyOffByYear = async (year) => {
  try {
    const url = getWeeklyOffDefault.replace(":year", year);
    const response = await axiosInstance.get(url);
    // FIX: Access the specific array from your log: response.data.data.weekly_offs
    const list = response.data?.data?.weekly_offs || [];
    return Array.isArray(list) ? list : [];
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
};

export const getWeeklyOffByBranch = async (year, branchId) => {
  try {
    const url = getWeeklyOffBranch.replace(":year", year).replace(":branchId", branchId);
    const response = await axiosInstance.get(url);
    // FIX: Same nesting here
    const list = response.data?.data?.weekly_offs || [];
    return Array.isArray(list) ? list : [];
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
};

export const fetchRemainingRegularization = async (uuid) => {
  try {
    // 💡 Simply execute the function directly instead of using .replace()
    const response = await axiosInstance.get(RemainingRegularization(uuid));
    
    const data = response.data?.data || response.data || {};
    return data;
  } catch (error) {
    console.error("Error fetching remaining regularizations:", error);
    return null; 
  }
};