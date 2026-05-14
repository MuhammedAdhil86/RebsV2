import React, { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import CommonUploadActions from "../../ui/commonupload";
import { getReportingStaff, addHierarchyInfo } from "../../service/employeeService";

const HierarchyInformation = ({ goNextStep, goPrevStep, onStepComplete }) => {
  const [managers, setManagers] = useState([]);
  const [selectedManager, setSelectedManager] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🧩 Load dropdown data + restore saved draft
  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const data = await getReportingStaff();
        setManagers(data || []);
      } catch (error) {
        console.error("Error fetching reporting staff:", error);
        toast.error("Failed to load reporting managers.");
      }
    };

    fetchManagers();

    const saved = localStorage.getItem("hierarchyForm");
    if (saved) {
      try {
        setSelectedManager(JSON.parse(saved).selectedManager || "");
      } catch {
        console.warn("Invalid saved form data — ignoring");
      }
    }
  }, []);

  // 💾 Auto-save selected manager to localStorage
  useEffect(() => {
    localStorage.setItem("hierarchyForm", JSON.stringify({ selectedManager }));
  }, [selectedManager]);

  // 🧩 Handle dropdown change
  const handleManagerChange = (e) => {
    setSelectedManager(e.target.value);
  };

  // ✅ Submit form and handle progress
  const handleSubmit = async () => {
    if (selectedManager === "") {
      toast.error("Please select a reporting manager.");
      return;
    }

    const employeeId = localStorage.getItem("employeeId");
    if (!employeeId) {
      toast.error("Employee not found. Please restart onboarding.");
      return;
    }

    const hierarchyData = {
      reporting_manager_id: selectedManager,
      employee_id: Number(employeeId),
    };

    try {
      setIsSubmitting(true);
      const response = await addHierarchyInfo(hierarchyData);
      console.log("✅ Hierarchy info updated:", response);

      // ✅ Mark progress locally
      localStorage.setItem("hierarchyCompleted", "true");
      localStorage.removeItem("hierarchyForm");

      toast.success("Hierarchy information saved successfully!");

      // 🧠 Trigger parent progress
      if (onStepComplete) {
        onStepComplete();
      } else if (goNextStep) {
        goNextStep();
      }

      setSelectedManager("");
    } catch (error) {
      console.error("❌ Error updating hierarchy information:", error);
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Error updating hierarchy information.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 p-3 bg-[#f9fafb]">
      <Toaster />

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-medium text-gray-900">Hierarchy Information</h2>
          <span className="text-sm text-gray-500">Step 04</span>
        </div>
        <CommonUploadActions />
      </div>

      {/* Content Card */}
      <div className="bg-white rounded-lg shadow-sm px-8 py-10 mt-2">
        <div className="grid grid-cols-1 gap-y-6 max-w-lg">
          {/* Reporting Manager Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reporting Manager
            </label>
            <select
              value={selectedManager}
              onChange={handleManagerChange}
              className="block w-full rounded-md border border-gray-300 bg-gray-50 p-2 text-gray-700 text-sm focus:ring-2 focus:ring-gray-900 focus:outline-none"
            >
              <option value="">Select Manager</option>
              <option value="0">None</option>
              {managers.length > 0 ? (
                managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))
              ) : (
                <option disabled>Loading managers...</option>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-end mt-4">
        <button
          onClick={goPrevStep}
          type="button"
          className="border border-gray-300 text-gray-700 text-sm px-5 py-2 rounded-md hover:bg-gray-100 mr-3"
        >
          Previous
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          type="button"
          className="bg-[#111827] hover:bg-black text-white text-sm px-5 py-2 rounded-md shadow disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : "Save & Complete"}
        </button>
      </div>
    </div>
  );
};

export default HierarchyInformation;
