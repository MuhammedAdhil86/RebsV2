import React, { useState } from "react";
import { Icon } from "@iconify/react";
import toast, { Toaster } from "react-hot-toast";
import { addDesignation } from "../../../service/companyService";

import GlowButton from "../../helpers/glowbutton";
import CancelButton from "../../helpers/cancelbutton";

const AddDesignationForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    email: "",
  });

  const [errors, setErrors] = useState({});

  /* ---------------- Handle Change ---------------- */
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  /* ---------------- Validation ---------------- */
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Designation name is required";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fix the errors");
      return false;
    }

    return true;
  };

  /* ---------------- Submit ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await addDesignation({
        name: formData.name,
        code: formData.code,
        email: formData.email,
      });

      toast.success("Designation added successfully");

      setFormData({
        name: "",
        code: "",
        email: "",
      });

      setErrors({});
    } catch (error) {
      console.error(error);
      toast.error("Failed to add designation");
    }
  };

  return (
    <>
      <Toaster position="top-right" />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {/* Designation Name */}
          <div className="flex flex-col relative">
            <label className="text-sm text-gray-600 mb-1">
              Designation Name <span className="text-red-500">*</span>
            </label>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter name"
              className={`border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                errors.name
                  ? "border-red-500 focus:ring-red-200"
                  : "border-gray-200 focus:ring-gray-200"
              }`}
            />

            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          {/* Designation Code */}
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">
              Designation Code
            </label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="Enter code"
              className="border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>

          {/* Designation Email */}
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">
              Designation Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email"
              className={`border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                errors.email
                  ? "border-red-500 focus:ring-red-200"
                  : "border-gray-200 focus:ring-gray-200"
              }`}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 pt-4">
          <CancelButton
            onClick={() =>
              setFormData({
                name: "",
                code: "",
                email: "",
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

export default AddDesignationForm;
