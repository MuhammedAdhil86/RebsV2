import React, { useState, useEffect } from "react";
import { toast } from "react-toastify"; // <ToastContainer /> lives in App.jsx
import CommonUploadActions from "../../ui/commonupload";
import { addContactInfo } from "../../service/employeeService";

// Change this to the real step number in your onboarding flow
const STEP_NUMBER = "10";

const emptyForm = {
  work_phone: "",
  personal_email: "",
  personal_phone: "",
  seating_location: "",
  additional_phone: "",
  tags: "",
  present_address: "",
  permanent_address: "",
};

const inputFields = [
  { name: "work_phone", label: "Work Phone", placeholder: "Enter work phone" },
  {
    name: "personal_email",
    label: "Personal Email",
    placeholder: "Enter personal email",
  },
  {
    name: "personal_phone",
    label: "Personal Phone",
    placeholder: "Enter personal phone",
  },
  {
    name: "seating_location",
    label: "Seating Location",
    placeholder: "Enter seating location",
  },
  {
    name: "additional_phone",
    label: "Additional Phone",
    placeholder: "Enter additional phone",
  },
  { name: "tags", label: "Tags", placeholder: "Enter tags" },
];

const addressFields = [
  {
    name: "present_address",
    label: "Present Address",
    placeholder: "Enter present address",
  },
  {
    name: "permanent_address",
    label: "Permanent Address",
    placeholder: "Enter permanent address",
  },
];

const inputClass =
  "block w-full rounded-md border border-gray-300 bg-gray-50 p-2 text-gray-700 text-sm";

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

const ContactInformation = ({ goNextStep, goPrevStep, onStepComplete }) => {
  const [formData, setFormData] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedForm = localStorage.getItem("contactForm");
    if (savedForm) {
      try {
        setFormData(JSON.parse(savedForm));
      } catch {
        console.error("Failed to parse saved contact form");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("contactForm", JSON.stringify(formData));
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const response = await addContactInfo(formData);

      // ✅ Backend success message
      showBackendSuccess(response);

      if (onStepComplete) onStepComplete();
      else if (goNextStep) goNextStep();
      setFormData(emptyForm);
      localStorage.removeItem("contactForm");
    } catch (error) {
      console.error(error);
      showBackendError(error); // backend message + error data
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrev = () => {
    if (goPrevStep) goPrevStep();
  };

  return (
    <div className="flex-1 p-3 bg-[#f9fafb]">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-medium text-gray-900">
            Contact Information
          </h2>
          <span className="text-sm text-gray-500">Step {STEP_NUMBER}</span>
        </div>
        <CommonUploadActions />
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-lg shadow-sm px-6 py-8 mt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6 max-w-3xl">
          {inputFields.map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
              </label>
              <input
                type="text"
                name={field.name}
                value={formData[field.name]}
                onChange={handleChange}
                placeholder={field.placeholder}
                className={inputClass}
              />
            </div>
          ))}

          {addressFields.map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
              </label>
              <textarea
                name={field.name}
                value={formData[field.name]}
                onChange={handleChange}
                placeholder={field.placeholder}
                rows={3}
                className={inputClass}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-end mt-8 gap-3">
        <button
          type="button"
          onClick={handlePrev}
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

export default ContactInformation;
