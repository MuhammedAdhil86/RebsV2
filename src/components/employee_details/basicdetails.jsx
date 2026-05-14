import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import useEmployeeStore from "../../store/employeeStore";
import axiosInstance from "../../service/axiosinstance";
import toast, { Toaster } from "react-hot-toast";

export default function BasicInfoSection() {
  const { selectedEmployee, setSelectedEmployee } = useEmployeeStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(null);

  // Initialize formData from store
  useEffect(() => {
    if (selectedEmployee) {
      setFormData({ ...selectedEmployee });
    }
  }, [selectedEmployee]);

  const data = [
    { label: "First Name", key: "first_name" },
    { label: "Last Name", key: "last_name" },
    { label: "Email Address", key: "email" },
    { label: "Contact Number", key: "ph_no" },
    { label: "Salary", key: "basic_salary" },
    { label: "Employee ID", key: "uuid" },
  ];

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!formData || !formData.id) return;

    try {
      setLoading(true);

      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        ph_no: formData.ph_no,
        basic_salary: formData.basic_salary,
      };

      await axiosInstance.put(`/staff/updatebasicinfo/${formData.id}`, payload);

      setSelectedEmployee({ ...selectedEmployee, ...payload });

      toast.success("Employee information updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating employee:", error);
      toast.error("Failed to update employee information.");
    } finally {
      setLoading(false);
    }
  };

  if (!formData) return <p>Loading...</p>;

  return (
<div className="bg-white p-4 rounded-xl shadow-sm border w-full">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-800 text-[14px]">Basic Information</h3>
        <div className="flex items-center gap-2">
          {isEditing && (
            <button
              onClick={handleSave}
              className="text-sm text-blue-600 font-medium hover:underline"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </button>
          )}
          <Icon
            icon="basil:edit-outline"
            className="w-5 h-5 text-gray-400 cursor-pointer"
            onClick={() => setIsEditing((prev) => !prev)}
          />
        </div>
      </div>

      {/* Content */}
      <div className="text-sm space-y-2">
        {data.map((item) => (
          <div
            key={item.key}
            className="flex justify-between items-start border-b border-gray-100 py-2"
          >
            <span className="text-gray-500 text-[12px]">{item.label}</span>
            <span className="font-medium text-gray-800 min-w-0 break-words text-[13px]">
              {isEditing && item.key !== "uuid" ? (
                <input
                  type={item.key === "basic_salary" ? "number" : "text"}
                  value={formData[item.key] || ""}
                  onChange={(e) => handleChange(item.key, e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-gray-800 w-full max-w-[160px]"
                />
              ) : (
                formData[item.key] || "-"
              )}
            </span>
          </div>
        ))}
      </div>

      <Toaster />
    </div>
  );
}
