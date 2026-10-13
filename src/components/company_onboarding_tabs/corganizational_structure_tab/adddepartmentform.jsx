import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import toast, { Toaster } from "react-hot-toast";
import {
  addDepartment,
  getDepartmentData,
} from "../../../service/companyService";
import GlowButton from "../../helpers/glowbutton";
import CancelButton from "../../helpers/cancelbutton";

const AddDepartmentForm = () => {
  const [parentDepartments, setParentDepartments] = useState([]);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    departmentName: "",
    departmentCode: "",
    email: "",
    description: "",
    hasParent: false,
    parentBranch: "",
  });

  /* ---------------- Fetch Parent Departments ---------------- */
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const data = await getDepartmentData();
        setParentDepartments(data);
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
      ...(name === "hasParent" && !checked ? { parentBranch: "" } : {}),
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    // Unchecking "Has Parent" also clears any parent department error
    if (name === "hasParent" && !checked && errors.parentBranch) {
      setErrors((prev) => ({ ...prev, parentBranch: "" }));
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
        "Department name must be at least 2 characters";
    } else if (name.length > 100) {
      newErrors.departmentName =
        "Department name must be 100 characters or less";
    }

    // Department Code
    if (!code) {
      newErrors.departmentCode = "Department code is required";
    } else if (!/^[A-Za-z0-9_-]{2,20}$/.test(code)) {
      newErrors.departmentCode =
        "2-20 characters: letters, numbers, - or _ only";
    }

    // Email (optional, but must be valid if entered)
    if (email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.email = "Invalid email format";
      } else if (email.length > 254) {
        newErrors.email = "Email must be 254 characters or less";
      }
    }

    // Description
    if (!description) {
      newErrors.description = "Description is required";
    } else if (description.length < 5) {
      newErrors.description = "Description must be at least 5 characters";
    } else if (description.length > 500) {
      newErrors.description = "Description must be 500 characters or less";
    }

    // Parent Department (required only when "Has Parent" is checked)
    if (formData.hasParent && !formData.parentBranch) {
      newErrors.parentBranch = "Please select a parent department";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ---------------- Submit ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please correct the highlighted errors");
      return;
    }

    const payload = {
      name: formData.departmentName,
      code: formData.departmentCode,
      email: formData.email,
      desc: formData.description,
      has_parent: formData.hasParent ? "true" : "false",
      parent:
        formData.hasParent && formData.parentBranch
          ? formData.parentBranch
          : "0",
      lead: 0,
    };

    try {
      await addDepartment(payload);

      toast.success("Department Added Successfully");

      setFormData({
        departmentName: "",
        departmentCode: "",
        email: "",
        description: "",
        hasParent: false,
        parentBranch: "",
      });

      setErrors({});
    } catch (error) {
      toast.error("Error Adding Department. Please Try Again!!");
      console.error(error);
    }
  };

  return (
    <>
      <Toaster position="top-right" />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Row 1 */}
        <div className="grid grid-cols-3 gap-6">
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Department Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="departmentName"
              value={formData.departmentName}
              onChange={handleChange}
              placeholder="Enter name"
              className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none ${
                errors.departmentName ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.departmentName && (
              <p className="text-red-500 text-xs mt-1">
                {errors.departmentName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Department Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="departmentCode"
              value={formData.departmentCode}
              onChange={handleChange}
              placeholder="Enter code"
              className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none ${
                errors.departmentCode ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.departmentCode && (
              <p className="text-red-500 text-xs mt-1">
                {errors.departmentCode}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email"
              className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-3 gap-6">
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter description"
              className={`w-full h-[120px] border rounded-md px-3 py-2 text-sm resize-none focus:outline-none ${
                errors.description ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description}</p>
            )}
          </div>

          <div className="flex items-start mt-6">
            <label className="flex items-center gap-2 text-sm text-gray-700">
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

          <div className="mt-6">
            <label className="block text-sm text-gray-700 mb-1">
              Parent Department
            </label>
            <div className="relative">
              <select
                name="parentBranch"
                value={formData.parentBranch}
                onChange={handleChange}
                disabled={!formData.hasParent}
                className={`w-full appearance-none border rounded-md px-3 py-2 text-sm bg-white focus:outline-none ${
                  errors.parentBranch ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select</option>
                {parentDepartments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              <Icon
                icon="material-symbols:arrow-left-rounded"
                className="absolute right-3 top-3 text-gray-500 rotate-[-90deg] text-lg pointer-events-none"
              />
            </div>
            {errors.parentBranch && (
              <p className="text-red-500 text-xs mt-1">{errors.parentBranch}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-4 pt-6">
          <CancelButton
            onClick={() => {
              setFormData({
                departmentName: "",
                departmentCode: "",
                email: "",
                description: "",
                hasParent: false,
                parentBranch: "",
              });
              setErrors({});
            }}
          >
            Cancel
          </CancelButton>

          <GlowButton type="submit">Save</GlowButton>
        </div>
      </form>
    </>
  );
};

export default AddDepartmentForm;
