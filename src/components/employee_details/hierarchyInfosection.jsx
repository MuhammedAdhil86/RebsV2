import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import useEmployeeStore from "../../store/employeeStore";
import axiosInstance from "../../service/axiosinstance";
import toast, { Toaster } from "react-hot-toast";

export default function HierarchyInfoSection() {
  const { selectedEmployee, setSelectedEmployee } = useEmployeeStore();
  const [isEditing, setIsEditing] = useState(false);

  // Local state for the form
  const [formData, setFormData] = useState({
    reporting_manager_id: "",
    reporting_manager: "",
  });

  const [reportingManagers, setReportingManagers] = useState([]);

  // Sync local state when selectedEmployee changes in store
  useEffect(() => {
    if (selectedEmployee) {
      setFormData({
        reporting_manager_id: selectedEmployee.reporting_manager_id || "",
        reporting_manager: selectedEmployee.reporting_manager || "",
      });
    }
  }, [selectedEmployee]);

  // Fetch managers list only when entering edit mode
  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const response = await axiosInstance.get("/master/staff");
        // Ensure we are setting an array from response.data.data
        setReportingManagers(response.data.data || []);
      } catch (error) {
        console.error("Error fetching reporting staff:", error);
        toast.error("Failed to load managers list");
      }
    };

    if (isEditing) fetchManagers();
  }, [isEditing]);

  if (!selectedEmployee) {
    return <p className="p-4 text-gray-500">Loading hierarchy info...</p>;
  }

  const handleManagerChange = (managerId) => {
    // Find the manager object to get the name
    const managerObj = reportingManagers.find(
      (m) => String(m.id) === String(managerId),
    );

    setFormData({
      reporting_manager_id: managerId,
      reporting_manager: managerObj ? managerObj.name : "",
    });
  };

  const handleSave = async () => {
    if (!formData.reporting_manager_id) {
      toast.error("Please select a reporting manager");
      return;
    }

    try {
      await axiosInstance.put(
        `/staff/updatehierarchyinfo/${selectedEmployee.id}`,
        { reporting_manager_id: formData.reporting_manager_id },
      );

      // Update the global Zustand store so other components reflect the change
      setSelectedEmployee({
        ...selectedEmployee,
        reporting_manager: formData.reporting_manager,
        reporting_manager_id: formData.reporting_manager_id,
      });

      toast.success("Hierarchy updated successfully!");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update hierarchy");
      console.error(error);
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border w-full">
      <Toaster />
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-800 text-[14px]">
          Hierarchy Information
        </h3>
        <div className="flex items-center gap-2">
          {isEditing && (
            <button
              onClick={handleSave}
              className="text-sm text-blue-600 font-medium hover:underline"
            >
              Save
            </button>
          )}
          <Icon
            icon="basil:edit-outline"
            className={`w-5 h-5 cursor-pointer ${isEditing ? "text-black" : "text-gray-400"}`}
            onClick={() => setIsEditing((prev) => !prev)}
          />
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-2">
        {/* Reporting Manager Name Field */}
        <div className="flex justify-between items-center border-b border-gray-100 py-2">
          <span className="text-gray-500 text-[12px]">Reporting Manager</span>
          <div className="flex-1 min-w-0 text-right ml-4">
            {isEditing ? (
              <select
                value={formData.reporting_manager_id}
                onChange={(e) => handleManagerChange(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-gray-800 text-[13px] w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select Manager</option>
                {reportingManagers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-gray-800 text-[13px]">
                {formData.reporting_manager || "-"}
              </span>
            )}
          </div>
        </div>

        {/* Reporting Manager ID Field (Read Only) */}
        <div className="flex justify-between items-center border-b border-gray-100 py-2">
          <span className="text-gray-500 text-[12px]">
            Reporting Manager ID
          </span>
          <span className="text-gray-800 text-[13px] flex-1 min-w-0 text-right">
            {formData.reporting_manager_id || "-"}
          </span>
        </div>
      </div>
    </div>
  );
}
