import React, { useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify"; // <ToastContainer /> lives in App.jsx
import CommonUploadActions from "../../ui/commonupload";
import { addDependantDetails } from "../../service/employeeService";

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

// 🔹 Date input with a single custom icon that opens the native calendar
const DateField = ({ name, value, onChange, required = false }) => {
  const inputRef = useRef(null);

  const openCalendar = () => {
    const el = inputRef.current;
    if (!el) return;
    if (typeof el.showPicker === "function") {
      el.showPicker(); // modern browsers
    } else {
      el.focus(); // fallback
      el.click();
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="date"
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="block w-full rounded-md border border-gray-300 bg-gray-50 p-2 pr-10 text-gray-700 text-sm
                   [&::-webkit-calendar-picker-indicator]:hidden"
      />
      <button
        type="button"
        onClick={openCalendar}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-700 hover:text-black"
        aria-label="Open calendar"
      >
        <Icon icon="solar:calendar-outline" className="w-4 h-4" />
      </button>
    </div>
  );
};

const emptyDependant = { name: "", relation: "", dateOfBirth: "" };

const DependantDetails = ({ goNextStep, goPrevStep, onStepComplete }) => {
  const [dependantData, setDependantData] = useState(emptyDependant);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🧩 Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setDependantData((prev) => ({ ...prev, [name]: value }));
  };

  // 🧠 Handle save logic
  // (required fields are validated by the backend and shown via toast)
  const handleSave = async () => {
    if (isSubmitting) return;

    const { name, relation, dateOfBirth } = dependantData;

    try {
      setIsSubmitting(true);

      // ✅ Prepare payload for backend
      const dependantPayload = {
        dependant_name: name.trim(),
        dependant_relation: relation.trim(),
        dependant_date_of_birth: dateOfBirth
          ? new Date(dateOfBirth).toISOString()
          : null,
      };

      // ✅ Call API
      const response = await addDependantDetails(dependantPayload);

      // ✅ Update progress in localStorage (consistent with PersonalInformation)
      const progress =
        JSON.parse(localStorage.getItem("employeeProgress")) || {};
      const completed = new Set(progress.completedSteps || []);
      completed.add("dependantDetails");

      const updatedProgress = {
        ...progress,
        currentStep: "dependantDetails",
        completedSteps: Array.from(completed),
        dependantDetails: true,
      };

      localStorage.setItem("employeeProgress", JSON.stringify(updatedProgress));

      // ✅ Backend success message
      showBackendSuccess(response);

      // ✅ Move to next step or notify parent
      if (onStepComplete) onStepComplete();
      else if (goNextStep) goNextStep();

      // ✅ Reset form
      setDependantData(emptyDependant);
    } catch (error) {
      console.error("❌ Error saving dependant details:", error);
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
            Dependant Details
          </h2>
          <span className="text-sm text-gray-500">Step 10</span>
        </div>
        <CommonUploadActions />
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-lg shadow-sm px-6 py-8 mt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6 max-w-3xl">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={dependantData.name}
              onChange={handleChange}
              placeholder="Enter name"
              className="block w-full rounded-md border border-gray-300 bg-gray-50 p-2 text-gray-700 text-sm"
              required
            />
          </div>

          {/* Relation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Relation
            </label>
            <input
              type="text"
              name="relation"
              value={dependantData.relation}
              onChange={handleChange}
              placeholder="Enter relation"
              className="block w-full rounded-md border border-gray-300 bg-gray-50 p-2 text-gray-700 text-sm"
              required
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth
            </label>
            <DateField
              name="dateOfBirth"
              value={dependantData.dateOfBirth}
              onChange={handleChange}
              required
            />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end mt-8 gap-3">
        <button
          onClick={goPrevStep}
          type="button"
          className="border border-gray-300 text-gray-700 text-sm px-5 py-2 rounded-md hover:bg-gray-100"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSubmitting}
          className="bg-[#111827] hover:bg-black text-white text-sm px-5 py-2 rounded-md shadow disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : "Save & Complete"}
        </button>
      </div>
    </div>
  );
};

export default DependantDetails;
