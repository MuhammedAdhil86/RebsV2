import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify"; // <ToastContainer /> lives in App.jsx
import { Icon } from "@iconify/react";
import CommonUploadActions from "../../ui/commonupload";
import CustomSelect from "../../ui/customselect"; // adjust to where you save CustomSelect
import {
  fetchEmployeeStatus,
  fetchEmployeeType,
  fetchEmployeeRoles,
  addWorkInformation,
} from "../../service/employeeService";
import {
  getDepartmentData,
  getDesignationData,
  getBranchData,
  getOrganisationDetails,
} from "../../service/companyService";

/* ---------- Backend messages -> React-Toastify (no custom texts) ---------- */

// backend `data` (string | array | object) -> list of text lines
const dataToLines = (data) => {
  if (data == null || data === "") return [];
  if (typeof data === "string") return [data];
  if (Array.isArray(data)) return data.flatMap(dataToLines);
  if (typeof data === "object") {
    return Object.entries(data).flatMap(([key, value]) =>
      dataToLines(value).map((line) =>
        /^\d+$/.test(key) ? line : `${key}: ${line}`,
      ),
    );
  }
  return [String(data)];
};

// find the backend's { message, data } in whatever the service returned/threw
const findBody = (input) => {
  const candidates = [
    input?.response?.data, // axios error
    input?.responseText, // XHR-style error
    input?.response,
    input,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;

    let body = candidate;
    if (typeof candidate === "string") {
      try {
        body = JSON.parse(candidate);
      } catch {
        continue;
      }
    }

    if (body && typeof body === "object" && (body.message || body.data)) {
      return body;
    }
  }
  return null;
};

// success: show the backend's message
const showBackendSuccess = (response) => {
  const message = response?.message ?? response?.data?.message;
  if (typeof message === "string" && message) toast.success(message);
};

// error: show the backend's message + the error's data
const showBackendError = (error) => {
  const body = findBody(error);
  const message =
    (typeof body?.message === "string" && body.message) || error?.message || "";
  const lines = body ? dataToLines(body.data) : [];

  toast.error(
    <div>
      {message && <div style={{ fontWeight: 600 }}>{message}</div>}
      {lines.map((line, i) => (
        <div key={i} style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>
          {line}
        </div>
      ))}
    </div>,
  );
};

const WorkInformation = ({ goNextStep, goPrevStep, onStepComplete }) => {
  const [formData, setFormData] = useState({
    location: "",
    employment_status_id: "",
    employee_type_id: "",
    date_of_join: "",
    department: "",
    designation: "",
    role: "",
    total_experience: "",
    source_of_hiring: "",
  });

  const [dropdowns, setDropdowns] = useState({
    employeeStatus: [],
    employeeType: [],
    departments: [],
    designations: [],
    roles: [],
    organisations: [],
  });

  // Branch is resolved automatically (no UI field)
  const [branchId, setBranchId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** ✅ Load all dropdown data safely */
  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const storedUser = localStorage.getItem("userData");
        const userData = storedUser ? JSON.parse(storedUser) : null;
        const companyId = userData?.company?.id;

        const results = await Promise.allSettled([
          getBranchData(),
          companyId ? getOrganisationDetails() : Promise.resolve([]),
          fetchEmployeeType(),
          fetchEmployeeStatus(),
          getDepartmentData(),
          getDesignationData(),
          fetchEmployeeRoles(),
        ]);

        const [
          branchRes,
          orgRes,
          typeRes,
          statusRes,
          deptRes,
          desigRes,
          roleRes,
        ] = results;

        // Show the backend error of the first failed dropdown call (one toast)
        const failed = results.find((r) => r.status === "rejected");
        if (failed) showBackendError(failed.reason);

        const extractData = (result) => {
          if (result.status === "fulfilled" && result.value) {
            if (Array.isArray(result.value)) return result.value;
            if (Array.isArray(result.value.data)) return result.value.data;
          }
          return [];
        };

        const branches = extractData(branchRes);

        // Resolve branch: localStorage -> userData -> first branch in list
        const resolvedBranch =
          localStorage.getItem("branchId") ||
          userData?.branch?.id ||
          branches[0]?.id ||
          null;
        setBranchId(resolvedBranch);

        setDropdowns({
          organisations: extractData(orgRes),
          employeeType: extractData(typeRes),
          employeeStatus: extractData(statusRes),
          departments: extractData(deptRes),
          designations: extractData(desigRes),
          roles: extractData(roleRes),
        });

        if (!companyId) {
          console.warn("Company ID missing: Organisation details skipped.");
        }
      } catch (err) {
        console.error("Initialization error:", err);
        showBackendError(err);
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

  /** ✅ Handle form submission
   *  (missing employee / branch / role are validated by the backend,
   *   its message and error data are shown via toast) */
  const handleSubmit = async () => {
    if (isSubmitting) return;

    // Exactly the body that works in Postman: every value is a string and
    // there is no employee_id (the id is already in the URL)
    const payload = {
      location: formData.location,
      employment_status_id: String(formData.employment_status_id),
      employee_type_id: String(formData.employee_type_id),
      date_of_join: formData.date_of_join,
      total_experience: formData.total_experience,
      source_of_hiring: formData.source_of_hiring,
      branch_id: String(branchId ?? ""),
      department_id: String(formData.department),
      designation_id: String(formData.designation),
      user_type: String(formData.role),
    };

    // Date formatting to ISO string
    if (payload.date_of_join && !payload.date_of_join.includes("T")) {
      try {
        payload.date_of_join = new Date(
          payload.date_of_join + "T12:00:00Z",
        ).toISOString();
      } catch (e) {
        console.error("Invalid Date format");
      }
    }

    try {
      setIsSubmitting(true);
      const response = await addWorkInformation(payload);

      // ✅ Backend success message
      showBackendSuccess(response);
      localStorage.setItem("workInfoCompleted", "true");

      if (onStepComplete) onStepComplete();
      else if (goNextStep) goNextStep();
    } catch (error) {
      showBackendError(error); // backend message + error data
    } finally {
      setIsSubmitting(false);
    }
  };

  const { employeeStatus, employeeType, departments, designations, roles } =
    dropdowns;

  return (
    <div className="flex-1 p-4 bg-gray-50">
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

            <SelectField
              label="Role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              options={roles}
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

const InputField = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
}) => {
  const inputRef = useRef(null);
  const isDate = type === "date";

  const openCalendar = () => {
    const el = inputRef.current;
    if (!el) return;
    if (typeof el.showPicker === "function") {
      el.showPicker();
    } else {
      el.focus();
      el.click();
    }
  };

  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          ref={inputRef}
          type={type}
          name={name}
          value={value || ""}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full rounded-md border border-gray-300 bg-white p-2 text-sm text-gray-700 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 focus:outline-none transition-all ${
            isDate ? "pr-10 [&::-webkit-calendar-picker-indicator]:hidden" : ""
          }`}
        />
        {isDate && (
          <button
            type="button"
            onClick={openCalendar}
            aria-label="Open calendar"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-700 hover:text-black"
          >
            <Icon icon="solar:calendar-outline" className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

const SelectField = ({
  label,
  name,
  value,
  onChange,
  options,
  valueKey = "id",
}) => {
  // CustomSelect takes { value, label } items and onChange(value),
  // so map the API options and keep the parent's handleChange(e) working
  const items = [
    { value: "", label: `Select ${label}` },
    ...(options || []).map((opt) => ({
      value: String(opt[valueKey] || opt.id),
      label: opt.name || opt.title || "Unnamed Option",
    })),
  ];

  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
      <CustomSelect
        value={value || ""}
        options={items}
        fullWidth
        selectClassName="w-full rounded-md border border-gray-300 bg-white p-2 pr-9 text-sm text-gray-700 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 focus:outline-none transition-all"
        onChange={(v) => onChange({ target: { name, value: v } })}
      />
    </div>
  );
};

export default WorkInformation;
