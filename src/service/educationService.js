/**
 * Education service.
 * Suggested location: src/service/educationService.js
 * (or paste these functions into your existing employeeService.js)
 *
 * ⚠️ Change the import path below to wherever your API constants file lives
 * (the file that exports postBasicInformation, getAllDetailsStaff, etc.).
 */
import axiosInstance from "./axiosinstance";
import {
  getEmployeeByIdApi, //        (employeeId) => "/staff/get/:employeeId"
  updateEducationalDetails, // "/staff/addeducation"                    (ADD a record)
  editEducationalDetails, //   "/staff/updateeducation/:educationId"    (UPDATE a record)
} from "../api/api";

/* ---------- HELPERS ---------- */

// Keep only the fields the API expects, trimmed.
// date_of_completion must be "YYYY-MM-DD" (what <input type="date"> gives you).
const buildEducationPayload = (data = {}) => ({
  institution_name: (data.institution_name || "").trim(),
  specialisation: (data.specialisation || "").trim(),
  degree: (data.degree || "").trim(),
  date_of_completion: data.date_of_completion || "",
});

// Throw the backend's response body when there is one (so components can read
// err.message / err.error / err.detail), otherwise the original error.
const handleError = (error, label) => {
  console.error(`${label}:`, error);
  throw error?.response?.data || error;
};

const isMissing = (value) =>
  value === undefined || value === null || value === "";

/* ---------- GET EMPLOYEE (profile + education_details) ---------- */
// GET /staff/get/:employeeId
export const getEmployeeById = async (employeeId) => {
  try {
    const response = await axiosInstance.get(getEmployeeByIdApi(employeeId));
    return response.data?.data || response.data || null;
  } catch (error) {
    return handleError(error, "Error fetching employee");
  }
};

/* ---------- ADD A NEW EDUCATION RECORD ---------- */
// POST /staff/addeducation/:employeeId
// ⚠️ Confirm this matches what your existing addEducationalDetails() calls.
export const addEducationDetails = async (employeeId, data) => {
  if (isMissing(employeeId)) {
    throw { message: "Employee id is required" };
  }

  try {
    const response = await axiosInstance.post(
      `${updateEducationalDetails}/${employeeId}`,
      buildEducationPayload(data),
    );
    return response.data;
  } catch (error) {
    return handleError(error, "Error adding education");
  }
};

/* ---------- UPDATE ONE EDUCATION RECORD ---------- */
// PUT /staff/updateeducation/:educationId
export const updateEducationDetails = async (educationId, data) => {
  if (isMissing(educationId)) {
    throw { message: "Education id is required" };
  }

  try {
    const response = await axiosInstance.put(
      editEducationalDetails.replace(":educationId", educationId),
      buildEducationPayload(data),
    );
    return response.data;
  } catch (error) {
    return handleError(error, "Error updating education");
  }
};

/* ---------- SAVE (ADD OR UPDATE, DECIDED BY THE SERVER DATA) ---------- */
// Fetches the employee's current education_details:
//   []        -> no education yet  -> ADD API
//   [ {...} ] -> education exists  -> UPDATE API (first record)
export const saveEducationDetails = async (employeeId, data) => {
  const employee = await getEmployeeById(employeeId);
  const existing = employee?.education_details || [];

  if (existing.length === 0) {
    return addEducationDetails(employeeId, data);
  }
  return updateEducationDetails(existing[0].id, data);
};

/* ---------- UPDATE SEVERAL EDUCATION RECORDS ---------- */
// entries: [{ id, institution_name, degree, specialisation, date_of_completion }]
export const updateMultipleEducationDetails = async (entries = []) => {
  const results = await Promise.all(
    entries.map(({ id, ...data }) => updateEducationDetails(id, data)),
  );
  return results;
};