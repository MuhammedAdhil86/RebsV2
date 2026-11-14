import React, { useEffect, useState } from "react";
import { toast } from "react-toastify"; // <ToastContainer /> lives in App.jsx
import CommonUploadActions from "../../ui/commonupload";
import {
  getReportingStaff,
  addHierarchyInfo,
} from "../../service/employeeService";

/* ---------- Backend messages -> React-Toastify (no custom texts) ---------- */

// backend `data` (string | array | object) -> list of text lines
const dataToLines = (data) => {
  if (data == null || data === "") return [];
  if (typeof data === "string") return [data];
  if (Array.isArray(data)) return data.flatMap(dataToLines);
  if (typeof data === "object") {
    return Object.entries(data).flatMap(([key, value]) =>
      dataToLines(value).map((line) =>
        /^\d+$/.test(key) ? line : `${key}: ${line}`,
      ),
    );
  }
  return [String(data)];
};

// find the backend's { message, data } in whatever the service returned/threw
const findBody = (input) => {
  const candidates = [
    input?.response?.data, // axios error
    input?.responseText, // XHR-style error
    input?.response,
    input,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;

    let body = candidate;
    if (typeof candidate === "string") {
      try {
        body = JSON.parse(candidate);
      } catch {
        continue;
      }
    }

    if (body && typeof body === "object" && (body.message || body.data)) {
      return body;
    }
  }
  return null;
};

// success: show the backend's message
const showBackendSuccess = (response) => {
  const message = response?.message ?? response?.data?.message;
  if (typeof message === "string" && message) toast.success(message);
};

// error: show the backend's message + the error's data
const showBackendError = (error) => {
  const body = findBody(error);
  const message =
    (typeof body?.message === "string" && body.message) || error?.message || "";
  const lines = body ? dataToLines(body.data) : [];

  toast.error(
    <div>
      {message && <div style={{ fontWeight: 600 }}>{message}</div>}
      {lines.map((line, i) => (
        <div key={i} style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>
          {line}
        </div>
      ))}
    </div>,
  );
};

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
        showBackendError(error);
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
  // (a missing manager / employee is validated by the backend and shown via toast)
  const handleSubmit = async () => {
    if (isSubmitting) return;

    const employeeId = localStorage.getItem("employeeId");

    const hierarchyData = {
      reporting_manager_id: selectedManager,
      employee_id: Number(employeeId),
    };

    try {
      setIsSubmitting(true);
      const response = await addHierarchyInfo(hierarchyData);

      // ✅ Backend success message
      showBackendSuccess(response);

      // ✅ Mark progress locally
      localStorage.setItem("hierarchyCompleted", "true");
      localStorage.removeItem("hierarchyForm");

      // 🧠 Trigger parent progress
      if (onStepComplete) {
        onStepComplete();
      } else if (goNextStep) {
        goNextStep();
      }

      setSelectedManager("");
    } catch (error) {
      console.error("❌ Error updating hierarchy information:", error);
      showBackendError(error); // backend message + error data
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 p-3 bg-[#f9fafb]">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-medium text-gray-900">
            Hierarchy Information
          </h2>
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
            <div className="relative">
              <select
                value={selectedManager}
                onChange={handleManagerChange}
                className="appearance-none cursor-pointer block w-full rounded-md border border-gray-300 bg-gray-50 p-2 pr-8 text-gray-700 text-sm focus:ring-2 focus:ring-gray-900 focus:outline-none"
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

              {/* Arrow (same icon and position as the CustomSelect design) */}
              <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                <svg
                  className="w-3 h-3 text-gray-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
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
