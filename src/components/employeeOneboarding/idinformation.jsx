import React, { useState } from "react";
import { toast } from "react-toastify"; // <ToastContainer /> lives in App.jsx
import CommonUploadActions from "../../ui/commonupload";
import { addIDInfo } from "../../service/employeeService";

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

const emptyForm = {
  pf_number: "",
  pan: "",
  aadhar: "",
};

const IDInformation = ({ goNextStep, goPrevStep, onStepComplete }) => {
  const [formData, setFormData] = useState(emptyForm);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🧠 Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Handle form submission
  // (required PAN / Aadhar are validated by the backend and shown via toast)
  const handleSubmit = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const response = await addIDInfo(formData);

      // ✅ Backend success message
      showBackendSuccess(response);

      // Tell parent to move next or update progress
      if (onStepComplete) onStepComplete();
      else if (goNextStep) goNextStep();

      // Reset form after success
      setFormData(emptyForm);
    } catch (error) {
      console.error("❌ Error saving ID information:", error);
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
            ID Information
          </h2>
          <span className="text-sm text-gray-500">Step 06</span>
        </div>
        <CommonUploadActions />
      </div>

      {/* Content Card */}
      <div className="bg-white rounded-lg shadow-sm px-6 py-8 mt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
          {/* PF Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PF Number
            </label>
            <input
              type="text"
              name="pf_number"
              value={formData.pf_number}
              onChange={handleChange}
              placeholder="Enter PF Number"
              className="block w-full rounded-md border border-gray-300 bg-gray-50 p-2 text-gray-700 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* PAN */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PAN Number
            </label>
            <input
              type="text"
              name="pan"
              value={formData.pan}
              onChange={handleChange}
              placeholder="Enter PAN Number"
              className="block w-full rounded-md border border-gray-300 bg-gray-50 p-2 text-gray-700 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Aadhar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Aadhar Number
            </label>
            <input
              type="text"
              name="aadhar"
              value={formData.aadhar}
              onChange={handleChange}
              placeholder="Enter Aadhar Number"
              className="block w-full rounded-md border border-gray-300 bg-gray-50 p-2 text-gray-700 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-end mt-4 gap-3">
        <button
          type="button"
          onClick={goPrevStep}
          className="border border-gray-300 text-gray-700 text-sm px-5 py-2 rounded-md hover:bg-gray-100"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-[#111827] hover:bg-black text-white text-sm px-5 py-2 rounded-md shadow disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : "Save & Complete"}
        </button>
      </div>
    </div>
  );
};

export default IDInformation;
