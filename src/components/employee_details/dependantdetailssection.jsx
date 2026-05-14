import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import toast, { Toaster } from "react-hot-toast";
import axiosInstance from "../../service/axiosinstance";

const DependantDetailsSection = ({ employee, setEmployee }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    dependant_name: "",
    dependant_relation: "",
    dependant_date_of_birth: "",
  });

  // Initialize formData when employee changes
  useEffect(() => {
    if (employee) {
      setFormData({
        dependant_name: employee.dependant_name || "",
        dependant_relation: employee.dependant_relation || "",
        dependant_date_of_birth: employee.dependant_date_of_birth
          ? employee.dependant_date_of_birth.split("T")[0]
          : "",
      });
    }
  }, [employee]);

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!employee) return;

    // Validate date
    if (!formData.dependant_date_of_birth) {
      toast.error("Please enter a valid date of birth.");
      return;
    }
    const date = new Date(formData.dependant_date_of_birth);
    if (isNaN(date)) {
      toast.error("Invalid date format.");
      return;
    }

    const payload = {
      dependant_name: formData.dependant_name.trim() || "",
      dependant_relation: formData.dependant_relation.trim() || "",
      dependant_date_of_birth: date.toISOString(),
    };

    try {
      setLoading(true);
      await axiosInstance.put(`/staff/updatedependantinfo/${employee.id}`, payload);
      toast.success("Dependant details updated successfully!");

      // Update local employee state
      if (setEmployee) {
        setEmployee({ ...employee, ...payload });
      }

      setIsEditing(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update dependant details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-gray-800">Dependant Details</h3>
        <div className="flex items-center gap-2">
          {isEditing && (
            <button
              className={`text-sm text-blue-600 hover:underline ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </button>
          )}
          <Icon
            icon="basil:edit-outline"
            className="w-5 h-5 text-gray-400 cursor-pointer"
            title={isEditing ? "Cancel edit" : "Edit"}
            onClick={() => setIsEditing((prev) => !prev)}
          />
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between border-b border-gray-100 py-1">
          <span className="text-gray-500">Name</span>
          {isEditing ? (
            <input
              type="text"
              value={formData.dependant_name}
              onChange={(e) => handleChange("dependant_name", e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 w-full max-w-[180px]"
            />
          ) : (
            <span className="text-gray-800 font-medium">{formData.dependant_name || "Not specified"}</span>
          )}
        </div>

        <div className="flex justify-between border-b border-gray-100 py-1">
          <span className="text-gray-500">Relation</span>
          {isEditing ? (
            <input
              type="text"
              value={formData.dependant_relation}
              onChange={(e) => handleChange("dependant_relation", e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 w-full max-w-[180px]"
            />
          ) : (
            <span className="text-gray-800 font-medium">{formData.dependant_relation || "Not specified"}</span>
          )}
        </div>

        <div className="flex justify-between border-b border-gray-100 py-1">
          <span className="text-gray-500">Date of Birth</span>
          {isEditing ? (
            <input
              type="date"
              value={formData.dependant_date_of_birth}
              onChange={(e) => handleChange("dependant_date_of_birth", e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 w-full max-w-[180px]"
            />
          ) : (
            <span className="text-gray-800 font-medium">
              {formData.dependant_date_of_birth || "Not specified"}
            </span>
          )}
        </div>
      </div>

      <Toaster />
    </div>
  );
};

export default DependantDetailsSection;
