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
  };

  /* ---------------- Validation ---------------- */
  const validateForm = () => {
    const newErrors = {};

    if (!formData.departmentName.trim()) {
      newErrors.departmentName = "Department name is required";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
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
              Department Code
            </label>
            <input
              type="text"
              name="departmentCode"
              value={formData.departmentCode}
              onChange={handleChange}
              placeholder="Enter code"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none"
            />
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
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter description"
              className="w-full h-[120px] border border-gray-300 rounded-md px-3 py-2 text-sm resize-none focus:outline-none"
            />
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
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-4 pt-6">
          <CancelButton
            onClick={() =>
              setFormData({
                departmentName: "",
                departmentCode: "",
                email: "",
                description: "",
                hasParent: false,
                parentBranch: "",
              })
            }
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
