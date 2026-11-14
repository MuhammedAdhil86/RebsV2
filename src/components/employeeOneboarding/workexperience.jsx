import React, { useRef, useState } from "react";
import { toast } from "react-toastify"; // <ToastContainer /> lives in App.jsx
import CommonUploadActions from "../../ui/commonupload";
import { X } from "lucide-react";
import { Icon } from "@iconify/react";
import { addWorkExperience } from "../../service/employeeService";

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
const DateField = ({ name, value, onChange }) => {
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

const emptyExperience = {
  companyName: "",
  jobTitle: "",
  fromDate: "",
  toDate: "",
  jobDescription: "",
};

const WorkExperience = ({ goNextStep, goPrevStep, onStepComplete }) => {
  const [workExperiences, setWorkExperiences] = useState([]);
  const [newExperience, setNewExperience] = useState(emptyExperience);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔹 Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewExperience((prev) => ({ ...prev, [name]: value }));
  };

  // 🔹 Add experience & send to backend
  // (company name / job title are validated by the backend and shown via toast)
  const handleAddExperience = async () => {
    if (isSubmitting) return;

    const payload = {
      company_name: newExperience.companyName,
      job_title: newExperience.jobTitle,
      job_description: newExperience.jobDescription || "",
      from_date: newExperience.fromDate
        ? new Date(newExperience.fromDate).toISOString()
        : null,
      to_date: newExperience.toDate
        ? new Date(newExperience.toDate).toISOString()
        : null,
      is_relavant: "true",
    };

    try {
      setIsSubmitting(true);
      const response = await addWorkExperience(payload);

      setWorkExperiences((prev) => [
        ...prev,
        { ...newExperience, id: Date.now() },
      ]);

      setNewExperience(emptyExperience);

      // ✅ Backend success message
      showBackendSuccess(response);
    } catch (err) {
      console.error("❌ Failed to add experience:", err);
      showBackendError(err); // backend message + error data
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🔹 Delete local experience
  const handleDelete = (id) => {
    setWorkExperiences((prev) => prev.filter((exp) => exp.id !== id));
  };

  // 🔹 Move to next step — notify parent
  const handleSaveAndNext = () => {
    if (onStepComplete) onStepComplete("workExperience");
    goNextStep();
  };

  return (
    <div className="flex-1 p-3 bg-[#f9fafb]">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-medium text-gray-900">
            Work Experience
          </h2>
          <span className="text-sm text-gray-500">Step 08</span>
        </div>
        <CommonUploadActions />
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-lg shadow-sm px-6 py-8 mt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6 max-w-3xl">
          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name
            </label>
            <input
              type="text"
              name="companyName"
              value={newExperience.companyName}
              onChange={handleChange}
              placeholder="Enter company name"
              className="block w-full rounded-md border border-gray-300 bg-gray-50 p-2 text-gray-700 text-sm"
            />
          </div>

          {/* Job Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Title
            </label>
            <input
              type="text"
              name="jobTitle"
              value={newExperience.jobTitle}
              onChange={handleChange}
              placeholder="Enter job title"
              className="block w-full rounded-md border border-gray-300 bg-gray-50 p-2 text-gray-700 text-sm"
            />
          </div>

          {/* From Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <DateField
              name="fromDate"
              value={newExperience.fromDate}
              onChange={handleChange}
            />
          </div>

          {/* To Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <DateField
              name="toDate"
              value={newExperience.toDate}
              onChange={handleChange}
            />
          </div>

          {/* Job Description + Add */}
          <div className="sm:col-span-2 flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Description
              </label>
              <input
                type="text"
                name="jobDescription"
                value={newExperience.jobDescription}
                onChange={handleChange}
                placeholder="Enter job description"
                className="block w-[300px] rounded-md border border-gray-300 bg-gray-50 p-2 text-gray-700 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={handleAddExperience}
              disabled={isSubmitting}
              className={`text-sm px-5 py-2 rounded-md shadow-md self-end ${
                isSubmitting
                  ? "bg-gray-400 cursor-not-allowed text-white"
                  : "bg-[#111827] hover:bg-black text-white"
              }`}
            >
              {isSubmitting ? "Saving..." : "Add"}
            </button>
          </div>
        </div>
      </div>

      {/* Experience List + Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 mt-6">
        {/* List */}
        <div className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {workExperiences.length > 0 ? (
              workExperiences.map((exp) => (
                <div
                  key={exp.id}
                  className="bg-white rounded-[7px] shadow-sm p-4 border border-gray-200 relative"
                  style={{ width: "320px", height: "185px" }}
                >
                  <button
                    type="button"
                    onClick={() => handleDelete(exp.id)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <p className="text-sm font-medium text-gray-900">
                    {exp.companyName}
                  </p>
                  <p className="text-xs text-gray-600">{exp.jobTitle}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {exp.jobDescription}
                  </p>
                  <p className="text-xs text-blue-600 mt-3">
                    {exp.fromDate} - {exp.toDate}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">
                No work experiences added yet.
              </p>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-between gap-3 rounded-md">
          <button
            type="button"
            onClick={goPrevStep}
            className="border border-gray-300 text-sm px-6 py-2"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={handleSaveAndNext}
            className="bg-[#111827] hover:bg-black text-white text-sm px-6 py-2 rounded-md shadow"
          >
            Save & Complete
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkExperience;
