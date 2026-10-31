import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import useEmployeeStore from "../../store/employeeStore";
import axiosInstance from "../../service/axiosinstance";
import toast from "react-hot-toast"; // uses the global <Toaster /> from App.jsx

// Formats "2003-02-02T00:00:00Z" as "02 Feb 2003" (no timezone shift)
const formatDob = (value) => {
  if (!value) return "-";
  const [y, m, d] = String(value).slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return "-";
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Converts 360000, "360000", 1.2e+06, "1.2E+6" -> "1200000" (plain digits, no
// scientific notation, no commas)
const normalizeSalary = (value) => {
  if (value === null || value === undefined || value === "") return "";
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return n.toLocaleString("en-US", {
    useGrouping: false,
    maximumFractionDigits: 2,
  });
};

export default function BasicInfoSection() {
  const { selectedEmployee, setSelectedEmployee } = useEmployeeStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(null);

  // Initialize formData from store (salary normalized so it never shows 1.2e+06)
  useEffect(() => {
    if (selectedEmployee) {
      setFormData({
        ...selectedEmployee,
        basic_salary: normalizeSalary(selectedEmployee.basic_salary),
      });
    }
  }, [selectedEmployee]);

  const data = [
    { label: "First Name", key: "first_name" },
    { label: "Last Name", key: "last_name" },
    { label: "Date of Birth", key: "date_of_birth", readOnly: true },
    { label: "Email Address", key: "email" },
    { label: "Contact Number", key: "ph_no" },
    { label: "Annual CTC", key: "basic_salary" },
    { label: "Employee ID", key: "uuid", readOnly: true },
  ];

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!formData || !formData.id) return;

    try {
      setLoading(true);

      // date_of_birth is read-only and intentionally NOT part of the payload
      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        ph_no: formData.ph_no,
        basic_salary: normalizeSalary(formData.basic_salary), // e.g. "1200000"
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
        <h3 className="font-medium text-gray-800 text-[14px]">
          Basic Information
        </h3>
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
              {isEditing && !item.readOnly ? (
                // type="number" is what turns 1200000 into 1.2e+06, so use text
                <input
                  type="text"
                  inputMode={item.key === "basic_salary" ? "numeric" : "text"}
                  value={formData[item.key] ?? ""}
                  onChange={(e) => {
                    const val =
                      item.key === "basic_salary"
                        ? e.target.value.replace(/[^\d.]/g, "") // digits and dot only
                        : e.target.value;
                    handleChange(item.key, val);
                  }}
                  className="border border-gray-300 rounded px-2 py-1 text-gray-800 w-full max-w-[160px]"
                />
              ) : item.key === "date_of_birth" ? (
                formatDob(formData[item.key])
              ) : item.key === "basic_salary" ? (
                normalizeSalary(formData[item.key]) || "-"
              ) : (
                formData[item.key] || "-"
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
