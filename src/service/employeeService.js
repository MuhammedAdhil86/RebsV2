// employeeService.js

import { 
  getEmployeeDetails, 
  employeeDelete, 
  updateBasicInfo ,
  getEmployeeStatus,
  getEmployeeType,
  getGender,
  postBasicInformation,
  postAddBankInformation,
updateWorkInformation,
updateIDInfo,
updateWorkExperience,
getDailyAttendance,
getConsolidatedData,
updateHierarchyInfo,
updateEducationalDetails,
postBulkUpload,
updateDependantDetails,
updateAdditionalInformation,
updateContactInfo,
updatePersonalInfo,
getStaff,
getEmployeeCalendar,
getEmployeeShifts,
getEmployeePolicy,

  getMaritalStatus// make sure you export this from your api.js
} from "../api/api";
import axiosInstance from "../service/axiosinstance";

// Fetch all staff details
export const getStaffDetails = async () => {
  try {
    const response = await axiosInstance.get(getEmployeeDetails);
    console.log("Staff details response:", response);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching staff details:", error);
    throw error;
  }
};

// Fetch bar attendance
export const fetchBarAttendance = async () => {
  try {
    const response = await axiosInstance.get("/admin/staff/getattendancestatus");

    return response.data;
  } catch (error) {
    console.error("Error fetching bar attendance:", error);
    throw error;
  }
};

// Fetch employee calendar / muster roll
export const fetchMusterRoll = async (month, year, user_id) => {
  try {
    const response = await axiosInstance.get(
      `/admin/staff/workhours/${month}/${year}`
    );
    console.log("Muster roll response:", response.data);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching Employee Calendar:", error.message);
    throw error;
  }
};

// Delete an employee
export const deleteEmployee = async (id, reason) => {
  try {
    const url = employeeDelete.replace(":id", id);
    console.log("Deleting employee id:", id, "reason:", reason);

    const response = await axiosInstance.delete(url, {
      data: { reason },
    });
    console.log("Deleted employee response:", response);
    return response.data;
  } catch (error) {
    console.error("Error deleting employee:", error);
    throw error;
  }
};

// Update employee basic info
export const updateEmployeeBasicInfo = async (employeeId, updatedData) => {
  try {
    const response = await axiosInstance.put(updateBasicInfo(employeeId), updatedData);
    console.log("Updated employee basic info response:", response);
    return response.data;
  } catch (error) {
    console.error("Error updating employee basic info:", error);
    throw error;
  }
};

// Add a new employee
export const addEmployee = async (employeeData) => {
  try {
    const response = await axiosInstance.post("/staff/add", employeeData);
    console.log("Added new employee response:", response);
    return response.data;
  } catch (error) {
    console.error("Error adding new employee:", error);
    throw error;
  }
};

// Fetch single employee details by ID
export const getEmployeeById = async (employeeId) => {
  try {
    const response = await axiosInstance.get(`${getEmployeeDetails}/${employeeId}`);
    console.log("Single employee details response:", response);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching employee by ID:", error);
    throw error;
  }
};


export const fetchEmployeeStatus = async () => {
  try {
    const response = await axiosInstance.get(getEmployeeStatus);

    return response.data.data;
  } catch (error) {
    console.error("Error fetching employee status:", error);
    throw error;
  }
};

export const addBulkUpload = async (formData) => {
  try {
    const response = await axiosInstance.post(postBulkUpload, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error uploading bulk CSV:", error);
    throw error;
  }
};


export const fetchEmployeeType = async () => {
  try {
    const response = await axiosInstance.get(getEmployeeType);

    return response.data.data;
  } catch (error) {
    console.error("Error fetching employee type:", error);
    throw error;
  }
};

export const genderData = async () => {
  try {
    const response = await axiosInstance.get(getGender);
    console.log("gender details response:", response);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching gender details:", error);
    throw error;
  }
};

export const maritalStatusData = async () => {
  try {
    const response = await axiosInstance.get(getMaritalStatus);
    console.log("marital status details response:", response);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching marital status details:", error);
    throw error;
  }
};
export const addBasicInformation = async (basicData) => {
  try {
    const response = await axiosInstance.post(postBasicInformation, basicData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error submitting basic information:", error);
    throw error;
  }
};

export const updateBankInformation = async (bankData) => {
  try {
    const employeeId = localStorage.getItem("employeeId");
    const response = await axiosInstance.post(
      `${postAddBankInformation}/${employeeId}`,
      bankData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating bank information:", error);
    throw error;
  }
};
export const addWorkInformation = async (workData) => {
  try {
    const employeeId = localStorage.getItem("employeeId");

    // 🔁 Convert to FormData
    const formData = new FormData();
    for (const key in workData) {
      formData.append(key, workData[key]);
    }

    const response = await axiosInstance.put(
      `/staff/updateworkinfo/${employeeId}`,
      formData // send formdata instead of JSON
    );

    return response.data;
  } catch (error) {
    console.error("Error updating work information:", error);
    throw error;
  }
};
export const getReportingStaff = async () => {
  try {
    const response = await axiosInstance.get(getStaff);
    console.log("new details", response);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching employee details:", error);
    throw error;
  }
};
export const addHierarchyInfo = async (hierarchyData) => {
  try {
    const employeeId = localStorage.getItem("employeeId");
    const response = await axiosInstance.put(
      `${updateHierarchyInfo}/${employeeId}`,
      hierarchyData
    );
    return response.data;
  } catch (error) {
    console.error("Error updating hierarchy information:", error);
    throw error;
  }
};


export const addPersonalInfo = async (personalData) => {
  try {
    const employeeId = localStorage.getItem("employeeId");
    const response = await axiosInstance.put(
      `${updatePersonalInfo}/${employeeId}`,
      personalData
    );
    return response.data;
  } catch (error) {
    console.error("Error updating personal information:", error);
    throw error;
  }
};

export const addIDInfo = async (IDData) => {
  try {
    const employeeId = localStorage.getItem("employeeId");
    const response = await axiosInstance.put(
      `${updateIDInfo}/${employeeId}`,
      IDData
    );
    return response.data;
  } catch (error) {
    console.error("Error updating ID information:", error);
    throw error;
  }
};

export const addContactInfo = async (contactData) => {
  try {
    const employeeId = localStorage.getItem("employeeId");
    const response = await axiosInstance.put(
      `${updateContactInfo}/${employeeId}`,
      contactData
    );
    return response.data;
  } catch (error) {
    console.error("Error updating Contact information:", error);
    throw error;
  }
};

export const addWorkExperience = async (experienceData) => {
  try {
    const employeeId = localStorage.getItem("employeeId");
    const response = await axiosInstance.post(
      `${updateWorkExperience}/${employeeId}`,
      experienceData
    );
    return response.data;
  } catch (error) {
    console.error("Error updating Work Experience:", error);
    throw error;
  }
};
export const addEducationalDetails = async (educationData) => {
  try {
    const employeeId = localStorage.getItem("employeeId");
    const response = await axiosInstance.post(
      `${updateEducationalDetails}/${employeeId}`,
      educationData
    );
    return response.data;
  } catch (error) {
    console.error("Error updating Educational Details:", error);
    throw error;
  }
};


export const addDependantDetails = async (dependantData) => {
  try {
    const employeeId = localStorage.getItem("employeeId");
    const response = await axiosInstance.put(
      `${updateDependantDetails}/${employeeId}`,
      dependantData
    );
    return response.data;
  } catch (error) {
    console.error("Error updating Dependant Details:", error);
    throw error;
  }
};



export const addAdditionalInfo = async (additionalData) => {
  try {
    const employeeId = localStorage.getItem("employeeId");
    const response = await axiosInstance.post(
      `${updateAdditionalInformation}/${employeeId}`,
      additionalData
    );
    return response.data;
  } catch (error) {
    console.error("Error updating Additional Information:", error);
    throw error;
  }
};

// ✅ Fetch Consolidated Data
export const fetchConsolidatedData = async (month, year) => {
  try {
    const response = await axiosInstance.get(
      `${getConsolidatedData}/${month}/${year}`
    );
    console.log("✅ Consolidated data response:", response.data);
    return response.data.data;
  } catch (error) {
    if (error.response) {
      console.error(
        "❌ Server returned:",
        error.response.status,
        error.response.data
      );
    } else {
      console.error("❌ Network/other error:", error.message);
    }
    throw error;
  }
};


export const fetchDailyAttendance = async (date) => {
  try {
    const response = await axiosInstance.get(
      `${getDailyAttendance}?date=${date}`
    );

 
    return response.data.data;
  } catch (error) {
    if (error.response) {
      console.error(
        "❌ Server returned:",
        error.response.status,
        error.response.data
      );
    } else {
      console.error("❌ Network error:", error.message);
    }
    throw error;
  }
};
// Fetch employee attendance by month/year
export const fetchEmployeeCalendar = async (month, year) => {
  try {
    // Replace placeholder with month
    const url = getEmployeeCalendar.replace("{month}", month) + `/${year}`;
    const response = await axiosInstance.get(url);

    // ✅ Log the data to see the employee array and attendance structure
    console.log("Fetched Employee Calendar Data:", response.data.data);

    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching employee calendar:", error);
    return [];
  }
};
export const fetchEmployeeWorkHours = async (user_id, dateRange) => {
  try {
    const response = await axiosInstance.post(
      `/admin/staff/daterange/workhours/${user_id}`,
      dateRange
    );
    return response.data.data;
  } catch (error) {
    console.error("Error fetching Employee Work Hour:", error.message);
    throw error;
  }
};


export const editWorkHours = async (user_id, date, data) => {
  try {
    const response = await axiosInstance.put(
      `/admin/staff/attendance/regularize/${user_id}/${date}`,
      data
    );
    return response.data;
  } catch (error) {
    console.error("Error updating regularisation:", error);
    throw error;
  }
};
export const getStaffData = async () => {
  try {
    const response = await axiosInstance.get(getStaff);
    console.log("new details employee gree", response);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching employee details:", error);
    throw error;
  }
};
export const fetchRegularizationRequests = async () => {
  const response = await axiosInstance.get(
    "admin/attendance/regularize/requests"
  );

  console.log("Regularization Requests API Response 👉", response.data);

  return response.data;
};


export const fetchShiftAllocation = async (staffId) => {
  try {
    const response = await axiosInstance.get(
      `shifts/allocation/${staffId}`
    );
    return response.data; // expected: {status_code, message, data:{shift_name,...}}
  } catch (err) {
    console.error("Failed to fetch shift allocation: ", err);
    throw err;
  }
};

export const fetchEmployeeShifts = async (from, to, user_uuid) => {
  try {
    const response = await axiosInstance.get(getEmployeeShifts, {
      params: {
        from,
        to,
        user_uuid,
      },
    });
    // Return the array of shifts directly
    return response.data; 
  } catch (error) {
    console.error("❌ Error fetching employee shifts:", error);
    throw error;
  }
};