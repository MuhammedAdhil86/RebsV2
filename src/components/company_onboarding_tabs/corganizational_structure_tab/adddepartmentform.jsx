import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify"; // uses the global <ToastContainer /> from App.jsx
import {
  addDepartment,
  getDepartmentData,
} from "../../../service/companyService";
import GlowButton from "../../helpers/glowbutton";
import CancelButton from "../../helpers/cancelbutton";

const EMPTY_FORM = {
  departmentName: "",
  departmentCode: "",
  email: "",
  description: "",
  hasParent: false,
  parentBranch: "",
};

/* ---------- shared styles (same tokens as the KPI / Team pages) ---------- */

const inputClass = (hasError) =>
  `w-full border rounded-lg px-3 py-2.5 text-sm text-black placeholder:text-black/30 outline-none transition-colors ${
    hasError ? "border-red-400" : "border-black/10 focus:border-black"
  }`;

const Field = ({ label, required, error, children }) => (
  <div>
    <label className="block text-xs text-black/60 mb-1.5">
      {label}
      {required && <span className="text-red-500"> *</span>}
    </label>
    {children}
    {error && <p className="text-red-600 text-[11px] mt-1">{error}</p>}
  </div>
);

const AddDepartmentForm = () => {
  const [parentDepartments, setParentDepartments] = useState([]);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState(EMPTY_FORM);

  /* ---------------- Fetch Parent Departments ---------------- */
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const data = await getDepartmentData();
        setParentDepartments(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch departments", error);
      }
    };
    fetchDepartments();
  }, []);

  /* ---------------- Handle Change ---------------- */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      // Unchecking "Has Parent" clears the selected parent
      ...(name === "hasParent" && !checked ? { parentBranch: "" } : {}),
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  /* ---------------- Validation ---------------- */
  const validateForm = () => {
    const newErrors = {};

    const name = formData.departmentName.trim();
    const code = formData.departmentCode.trim();
    const email = formData.email.trim();
    const description = formData.description.trim();

    // Department Name
    if (!name) {
      newErrors.departmentName = "Department name is required";
    } else if (name.length < 2) {
      newErrors.departmentName =
        "Department name is too short. Enter at least 2 characters";
    } else if (name.length > 100) {
      newErrors.departmentName =
        "Department name is too long. Enter 100 characters or fewer";
    }

    // Department Code
    if (!code) {
      newErrors.departmentCode = "Department code is required";
    } else if (!/^[A-Za-z0-9_-]{2,20}$/.test(code)) {
      newErrors.departmentCode =
        "Department code must be 2 to 20 characters and can only contain letters, numbers, hyphen (-) or underscore (_)";
    }

    // Email (optional, but must be valid if entered)
    if (email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.email =
          "Please enter a valid email address, for example name@company.com";
      } else if (email.length > 254) {
        newErrors.email = "Email is too long. Enter 254 characters or fewer";
      }
    }

    // Description
    if (!description) {
      newErrors.description = "Description is required";
    } else if (description.length < 5) {
      newErrors.description =
        "Description is too short. Enter at least 5 characters";
    } else if (description.length > 500) {
      newErrors.description =
        "Description is too long. Enter 500 characters or fewer";
    }

    // Parent Department is optional: no validation needed

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ---------------- Reset ---------------- */
  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setErrors({});
  };

  /* ---------------- Submit ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please correct the highlighted fields and try again");
      return;
    }

    // Parent is optional: only a child department when one is actually chosen
    const hasParent = formData.hasParent && !!formData.parentBranch;

    const payload = {
      name: formData.departmentName.trim(),
      code: formData.departmentCode.trim(),
      email: formData.email.trim(),
      desc: formData.description.trim(),
      has_parent: hasParent ? "true" : "false",
      parent: hasParent ? formData.parentBranch : "0",
      lead: 0,
    };

    try {
      await addDepartment(payload);
      toast.success("Department added successfully");
      resetForm();
    } catch (error) {
      toast.error("Could not add the department. Please try again");
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Field label="Department Name" required error={errors.departmentName}>
          <input
            type="text"
            name="departmentName"
            value={formData.departmentName}
            onChange={handleChange}
            placeholder="Enter name"
            className={inputClass(errors.departmentName)}
          />
        </Field>

        <Field label="Department Code" required error={errors.departmentCode}>
          <input
            type="text"
            name="departmentCode"
            value={formData.departmentCode}
            onChange={handleChange}
            placeholder="Enter code"
            className={inputClass(errors.departmentCode)}
          />
        </Field>

        <Field label="Email" error={errors.email}>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter email"
            className={inputClass(errors.email)}
          />
        </Field>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Field label="Description" required error={errors.description}>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter description"
            className={`${inputClass(errors.description)} h-[120px] resize-none`}
          />
        </Field>

        <div className="flex items-start md:mt-6">
          <label className="flex items-center gap-2 text-sm text-black cursor-pointer select-none">
            <input
              type="checkbox"
              name="hasParent"
              checked={formData.hasParent}
              onChange={handleChange}
              className="w-4 h-4 accent-black"
            />
            Has Parent Department
          </label>
        </div>

        <Field label="Parent Department (optional)">
          <div className="relative">
            <select
              name="parentBranch"
              value={formData.parentBranch}
              onChange={handleChange}
              disabled={!formData.hasParent}
              className={`${inputClass(false)} appearance-none bg-white pr-9 disabled:bg-zinc-50 disabled:text-black/30 disabled:cursor-not-allowed`}
            >
              <option value="">Select</option>
              {parentDepartments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
            <Icon
              icon="mdi:chevron-down"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black/40 pointer-events-none"
            />
          </div>
        </Field>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-4 pt-5 border-t border-black/10">
        <CancelButton onClick={resetForm}>Cancel</CancelButton>
        <GlowButton type="submit">Save</GlowButton>
      </div>
    </form>
  );
};

export default AddDepartmentForm;
