import React, { useState, useEffect } from "react";
import { Upload } from "lucide-react";
import { toast } from "react-toastify"; // <ToastContainer /> lives in App.jsx
import { addAdditionalInfo } from "../../service/employeeService";

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

const AdditionalInformation = ({ goNextStep, goPrevStep, onStepComplete }) => {
  const [info, setInfo] = useState({
    bloodGroup: "",
    emergencyContact: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(() => {
    // ✅ Load existing progress if any
    return (
      JSON.parse(localStorage.getItem("employeeProgress")) || {
        currentStep: "additionalInformation",
        completedSteps: [],
      }
    );
  });

  // ✅ Keep progress in localStorage synced
  useEffect(() => {
    localStorage.setItem("employeeProgress", JSON.stringify(progress));
  }, [progress]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInfo((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Save handler
  // (required fields are validated by the backend and shown via toast)
  const handleSave = async () => {
    if (isSubmitting) return;

    const { bloodGroup, emergencyContact } = info;

    try {
      setIsSubmitting(true);

      const payload = {
        blood_group: bloodGroup,
        emergency_contact_native: emergencyContact,
      };

      const response = await addAdditionalInfo(payload);

      // ✅ Update local progress inline (like your other steps)
      const updatedProgress = {
        ...progress,
        currentStep: "additionalInformation",
        completedSteps: Array.from(
          new Set([...progress.completedSteps, "additionalInformation"]),
        ),
      };
      setProgress(updatedProgress);
      localStorage.setItem("employeeProgress", JSON.stringify(updatedProgress));

      // ✅ Backend success message
      showBackendSuccess(response);

      // ✅ Trigger parent progress tracker if exists
      if (onStepComplete) onStepComplete("additionalInformation");

      // ✅ Go next
      if (goNextStep) goNextStep();
    } catch (error) {
      console.error("❌ Error saving additional info:", error);
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
            Additional Information
          </h2>
          <span className="text-sm text-gray-500">Step 11</span>
        </div>

        {/* Bulk Uploads Button */}
        <button
          type="button"
          onClick={() => console.log("Bulk Uploads clicked")}
          className="bg-[#111827] hover:bg-black text-white text-sm px-4 py-2.5 rounded-lg shadow-md transition duration-200 flex items-center gap-2 font-medium"
        >
          <Upload className="w-4 h-4" />
          Bulk Uploads
        </button>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-lg shadow-sm px-6 py-8 mt-2">
        {/* Form Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6 max-w-4xl">
          {/* Blood Group */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Blood Group
            </label>
            <input
              type="text"
              name="bloodGroup"
              value={info.bloodGroup}
              onChange={handleChange}
              placeholder="Enter blood group"
              className="block w-full rounded-md border border-gray-300 bg-gray-50 p-3 text-gray-700 text-sm focus:border-gray-500 focus:ring-gray-500"
            />
          </div>

          {/* Emergency Contact */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Emergency Contact Native
            </label>
            <input
              type="text"
              name="emergencyContact"
              value={info.emergencyContact}
              onChange={handleChange}
              placeholder="Name, Number, Relation"
              className="block w-full rounded-md border border-gray-300 bg-gray-50 p-3 text-gray-700 text-sm focus:border-gray-500 focus:ring-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-end mt-8">
        <button
          type="button"
          onClick={() => {
            setProgress((prev) => ({
              ...prev,
              currentStep: "previousStep",
            }));
            localStorage.setItem(
              "employeeProgress",
              JSON.stringify({
                ...progress,
                currentStep: "previousStep",
              }),
            );
            if (goPrevStep) goPrevStep();
          }}
          className="border border-gray-300 text-gray-700 text-sm px-6 py-2.5 rounded-lg hover:bg-gray-100 mr-3 font-medium"
        >
          Previous
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSubmitting}
          className="bg-[#111827] hover:bg-black text-white text-sm px-6 py-2.5 rounded-lg shadow font-medium disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : "Save & Complete"}
        </button>
      </div>
    </div>
  );
};

export default AdditionalInformation;
