import React, { useState, useEffect, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Icon } from "@iconify/react";
import CommonUploadActions from "../../ui/commonupload";
import { addPersonalInfo, genderData } from "../../service/employeeService";

const maritalOptions = [
  { id: "single", name: "Single" },
  { id: "married", name: "Married" },
  { id: "divorced", name: "Divorced" },
  { id: "widowed", name: "Widowed" },
];

const emptyForm = {
  date_of_birth: "",
  gender: "",
  age: "",
  marital_status: "",
  about_me: "",
  expertise: "",
};

const PersonalInformation = ({ goNextStep, goPrevStep, onStepComplete }) => {
  const [genders, setGenders] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** ✅ Fetch genders from API */
  useEffect(() => {
    const fetchGenders = async () => {
      try {
        const data = await genderData();
        setGenders(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching gender data:", error);
        toast.error("Failed to load gender options.");
      }
    };
    fetchGenders();
  }, []);

  /** ✅ Handle input changes */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /** ✅ Handle form submission */
  const handleSubmit = async () => {
    if (!formData.gender || !formData.date_of_birth) {
      toast.error("Please fill all required fields.");
      return;
    }

    // Convert gender id → name (select value is a string, so compare as strings)
    const selectedGender =
      genders.find((g) => String(g.id) === String(formData.gender))?.name || "";

    const payload = {
      ...formData,
      gender: selectedGender,
      date_of_birth: formData.date_of_birth
        ? new Date(formData.date_of_birth).toISOString()
        : null,
    };

    try {
      setIsSubmitting(true);
      const response = await addPersonalInfo(payload);
      toast.success("Personal information saved successfully!");
      console.log("✅ Saved personal info:", response.data);

      // Progress update in parent
      if (onStepComplete) onStepComplete();
      else if (goNextStep) goNextStep();

      // Reset form
      setFormData(emptyForm);
    } catch (error) {
      console.error("❌ Error saving personal info:", error);
      toast.error("Failed to save personal information.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 p-4 bg-gray-50">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-base font-medium text-gray-900">
            Personal Information
          </h2>
          <p className="text-sm text-gray-500">Step 05</p>
        </div>
        <CommonUploadActions />
      </div>

      {/* Main Form Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <InputField
            label="Date of Birth"
            type="date"
            name="date_of_birth"
            value={formData.date_of_birth}
            onChange={handleChange}
            required
          />

          <SelectField
            label="Gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            options={genders}
            required
          />

          <InputField
            label="Age"
            type="number"
            name="age"
            value={formData.age}
            onChange={handleChange}
            placeholder="Enter age"
          />

          <SelectField
            label="Marital Status"
            name="marital_status"
            value={formData.marital_status}
            onChange={handleChange}
            options={maritalOptions}
          />

          <TextAreaField
            label="About Me"
            name="about_me"
            value={formData.about_me}
            onChange={handleChange}
            placeholder="Enter about yourself"
          />

          <TextAreaField
            label="Ask Me / Expertise"
            name="expertise"
            value={formData.expertise}
            onChange={handleChange}
            placeholder="Enter your expertise"
          />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={goPrevStep}
          type="button"
          className="border border-gray-300 text-gray-700 text-sm px-6 py-2 rounded-lg hover:bg-gray-100 transition-all"
        >
          Previous
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          type="button"
          className="bg-gray-900 hover:bg-black text-white text-sm px-6 py-2 rounded-lg shadow disabled:opacity-50 transition-all"
        >
          {isSubmitting ? "Saving..." : "Save & Complete"}
        </button>
      </div>

      <Toaster />
    </div>
  );
};

const controlClass =
  "w-full rounded-md border border-gray-300 bg-white p-2 text-sm text-gray-700 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 focus:outline-none transition-all";

/** 🔹 Atomic Input Component
 *  For type="date": hides the browser's default icon and shows a single
 *  Solar calendar icon that opens the native date picker on click.
 */
const InputField = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
}) => {
  const inputRef = useRef(null);
  const isDate = type === "date";

  const openCalendar = () => {
    const el = inputRef.current;
    if (!el) return;
    try {
      if (typeof el.showPicker === "function") el.showPicker();
      else el.focus();
    } catch {
      el.focus();
    }
  };

  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type={type}
          name={name}
          value={value || ""}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`${controlClass} ${
            isDate ? "pr-10 [&::-webkit-calendar-picker-indicator]:hidden" : ""
          }`}
        />
        {isDate && (
          <button
            type="button"
            onClick={openCalendar}
            aria-label="Open calendar"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-700 hover:text-black"
          >
            <Icon icon="solar:calendar-outline" className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

/** 🔹 Atomic Select Component */
const SelectField = ({
  label,
  name,
  value,
  onChange,
  options,
  valueKey = "id",
  required = false,
}) => (
  <div className="flex flex-col">
    <label className="text-sm font-medium text-gray-700 mb-1">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <select
      name={name}
      value={value || ""}
      onChange={onChange}
      required={required}
      className={controlClass}
    >
      <option value="">Select {label}</option>
      {options?.map((opt) => (
        <option key={opt.id} value={opt[valueKey] || opt.id}>
          {opt.name || opt.title || "Unnamed Option"}
        </option>
      ))}
    </select>
  </div>
);

/** 🔹 Atomic Textarea Component */
const TextAreaField = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  rows = 3,
}) => (
  <div className="flex flex-col">
    <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
    <textarea
      name={name}
      value={value || ""}
      onChange={onChange}
      rows={rows}
      placeholder={placeholder}
      className={`${controlClass} resize-none`}
    />
  </div>
);

export default PersonalInformation;
