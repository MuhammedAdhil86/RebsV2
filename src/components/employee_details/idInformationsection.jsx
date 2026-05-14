import React, { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import useEmployeeStore from "../../store/employeeStore";
import axiosInstance from "../../service/axiosinstance";
import toast, { Toaster } from "react-hot-toast";

export default function IdInformationSection() {
  const { selectedEmployee, setSelectedEmployee } = useEmployeeStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(null);

  // Initialize form data
  useEffect(() => {
    if (selectedEmployee) {
      setFormData({
        uan: selectedEmployee.uan || "",
        pan: selectedEmployee.pan || "",
        aadhar: selectedEmployee.aadhar || "",
      });
    }
  }, [selectedEmployee]);

  // Handle input changes
  const handleChange = useCallback((key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Save handler (PUT request)
  const handleSave = useCallback(async () => {
    if (!formData || !selectedEmployee?.id) return;

    const payload = {
      uan: formData.uan || "",
      pan: formData.pan || "",
      aadhar: formData.aadhar || "",
    };

    try {
      setLoading(true);
      await axiosInstance.put(
        `/staff/updateidinfo/${selectedEmployee.id}`,
        payload
      );

      // Update local store
      setSelectedEmployee({ ...selectedEmployee, ...payload });

      toast.success("ID information updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("❌ Error updating ID info:", error);
      toast.error("Failed to update ID information.");
    } finally {
      setLoading(false);
    }
  }, [formData, selectedEmployee, setSelectedEmployee]);

  if (!formData)
    return <p className="p-4 text-gray-500">Loading ID information...</p>;

  // Field configuration
  const idFields = [
    { label: "UAN", key: "uan" },
    { label: "PAN", key: "pan" },
    { label: "Aadhar Number", key: "aadhar" },
  ];

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-800 text-[14px]">ID Information</h3>
        <div className="flex items-center gap-2">
          {isEditing && (
            <button
              onClick={handleSave}
              disabled={loading}
              className={`text-sm text-blue-600 font-medium hover:underline ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Saving..." : "Save"}
            </button>
          )}
          <Icon
            icon="basil:edit-outline"
            className="w-5 h-5 text-gray-400 cursor-pointer"
            onClick={() => setIsEditing((prev) => !prev)}
            title={isEditing ? "Cancel edit" : "Edit"}
          />
        </div>
      </div>

      {/* Field Rows */}
      <div className="space-y-2">
        {idFields.map((field) => {
          const value = formData[field.key];
          const displayValue =
            value === null || value === undefined || value.trim() === ""
              ? "N/A"
              : value;

          return (
            <div
              key={field.key}
              className="flex justify-between items-center border-b border-gray-100 py-2"
            >
              {/* Label */}
              <span className="text-gray-500 text-[12px]">{field.label}</span>

              {/* Value or input */}
              {isEditing ? (
                <input
                  type="text"
                  value={formData[field.key] || ""}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-gray-800 text-[13px] flex-1 min-w-0 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              ) : (
                <span className="text-gray-800 text-[13px] break-words flex-1 min-w-0 text-right">
                  {displayValue}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <Toaster />
    </div>
  );
}
