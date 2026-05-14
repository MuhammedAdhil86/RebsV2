import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import CommonUploadActions from "../../ui/commonupload";
import {
  fetchEmployeeStatus,
  fetchEmployeeType,
  addWorkInformation,
} from "../../service/employeeService";
import {
  getDepartmentData,
  getDesignationData,
  getBranchData,
  getOrganisationDetails,
} from "../../service/companyService";

const WorkInformation = ({ goNextStep, goPrevStep, onStepComplete }) => {
  const [formData, setFormData] = useState({
    company: "",
    location: "",
    employment_status_id: "",
    branch: "",
    employee_type_id: "",
    date_of_join: "",
    department: "",
    designation: "",
    total_experience: "",
    source_of_hiring: "",
  });

  const [dropdowns, setDropdowns] = useState({
    employeeStatus: [],
    employeeType: [],
    departments: [],
    designations: [],
    branches: [],
    organisations: [],
  });

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** ✅ Load all dropdown data safely */
  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        // 1. Pre-check localStorage to prevent the service from throwing an error
        const storedUser = localStorage.getItem("userData");
        const userData = storedUser ? JSON.parse(storedUser) : null;
        const companyId = userData?.company?.id;

        // 2. Fire all requests. If companyId is missing, we pass a resolved null for that specific call.
        const [branchRes, orgRes, typeRes, statusRes, deptRes, desigRes] =
          await Promise.allSettled([
            getBranchData(),
            companyId ? getOrganisationDetails() : Promise.resolve([]),
            fetchEmployeeType(),
            fetchEmployeeStatus(),
            getDepartmentData(),
            getDesignationData(),
          ]);

        /** * Helper to safely extract arrays from the Settled Promises
         */
        const extractData = (result) => {
          if (result.status === "fulfilled" && result.value) {
            // Our service returns response.data.data directly now
            return Array.isArray(result.value) ? result.value : [];
          }
          return [];
        };

        setDropdowns({
          branches: extractData(branchRes),
          organisations: extractData(orgRes),
          employeeType: extractData(typeRes),
          employeeStatus: extractData(statusRes),
          departments: extractData(deptRes),
          designations: extractData(desigRes),
        });

        // Optional: Alert the user if the company ID was specifically missing
        if (!companyId) {
          console.warn("Company ID missing: Organisation details skipped.");
        }
      } catch (err) {
        console.error("Initialization error:", err);
        toast.error("Failed to load some dropdown options.");
      } finally {
        setLoading(false);
      }
    };

    loadDropdowns();
  }, []);

  /** ✅ Handle input changes */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /** ✅ Handle form submission */
  const handleSubmit = async () => {
    const employeeId = localStorage.getItem("employeeId");
    const branchId = localStorage.getItem("branchId") || formData.branch || "1";

    if (!employeeId) {
      toast.error("Employee ID missing. Please restart onboarding.");
      return;
    }

    // Prepare Payload
    const payload = {
      ...formData,
      branch_id: Number(branchId),
      employee_id: Number(employeeId),
      employment_status_id: Number(formData.employment_status_id),
      employee_type_id: Number(formData.employee_type_id),
      department_id: Number(formData.department),
      designation_id: Number(formData.designation),
    };

    // Date formatting to ISO string
    if (payload.date_of_join && !payload.date_of_join.includes("T")) {
      try {
        const isoDate = new Date(
          payload.date_of_join + "T12:00:00Z",
        ).toISOString();
        payload.date_of_join = isoDate;
      } catch (e) {
        console.error("Invalid Date format");
      }
    }

    // Clean up temporary UI keys
    delete payload.branch;
    delete payload.department;
    delete payload.designation;

    try {
      setIsSubmitting(true);
      await addWorkInformation(payload);

      toast.success("Work information saved successfully!");
      localStorage.setItem("workInfoCompleted", "true");

      if (onStepComplete) onStepComplete();
      else if (goNextStep) goNextStep();
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Error updating work information.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const { employeeStatus, employeeType, departments, designations } = dropdowns;

  return (
    <div className="flex-1 p-4 bg-gray-50">
      <Toaster />

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-base font-medium text-gray-900">
            Work Information
          </h2>
          <p className="text-sm text-gray-500">Step 03</p>
        </div>
        <CommonUploadActions />
      </div>

      {/* Main Form Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        {loading ? (
          <div className="flex items-center space-x-2 py-10 justify-center">
            <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-500 text-sm">
              Loading dropdown data...
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <InputField
              label="Location"
              name="location"
              value={formData.location}
              onChange={handleChange}
            />

            <SelectField
              label="Employment Status"
              name="employment_status_id"
              value={formData.employment_status_id}
              onChange={handleChange}
              options={employeeStatus}
            />

            <SelectField
              label="Employment Type"
              name="employee_type_id"
              value={formData.employee_type_id}
              onChange={handleChange}
              options={employeeType}
            />

            <InputField
              label="Date of Joining"
              type="date"
              name="date_of_join"
              value={formData.date_of_join}
              onChange={handleChange}
            />

            <SelectField
              label="Department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              options={departments}
            />

            <SelectField
              label="Designation"
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              options={designations}
            />

            <InputField
              label="Total Experience"
              name="total_experience"
              value={formData.total_experience}
              onChange={handleChange}
              placeholder="e.g. 3 years"
            />

            <InputField
              label="Source of Hiring"
              name="source_of_hiring"
              value={formData.source_of_hiring}
              onChange={handleChange}
              placeholder="e.g. LinkedIn"
            />
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={goPrevStep}
          type="button"
          className="border border-gray-300 text-gray-700 text-sm px-6 py-2 rounded-lg hover:bg-gray-100 transition-all"
        >
          Previous
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || loading}
          type="button"
          className="bg-gray-900 hover:bg-black text-white text-sm px-6 py-2 rounded-lg shadow disabled:opacity-50 transition-all"
        >
          {isSubmitting ? "Saving..." : "Save & Complete"}
        </button>
      </div>
    </div>
  );
};

/** 🔹 Atomic Input Component */
const InputField = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
}) => (
  <div className="flex flex-col">
    <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type={type}
      name={name}
      value={value || ""}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm text-gray-700 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 focus:outline-none transition-all"
    />
  </div>
);

/** 🔹 Atomic Select Component */
const SelectField = ({ label, name, value, onChange, options }) => (
  <div className="flex flex-col">
    <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select
      name={name}
      value={value || ""}
      onChange={onChange}
      className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm text-gray-700 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 focus:outline-none transition-all"
    >
      <option value="">Select {label}</option>
      {options?.map((opt) => (
        <option key={opt.id} value={opt.id}>
          {opt.name || opt.title || "Unnamed Option"}
        </option>
      ))}
    </select>
  </div>
);

export default WorkInformation;
