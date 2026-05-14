import React, { useState } from "react";
import { Calendar } from "lucide-react";
import CommonUploadActions from "../../ui/commonupload";
import toast, { Toaster } from "react-hot-toast";
import { addEducationalDetails } from "../../service/employeeService";

const EducationalDetails = ({ goNextStep, goPrevStep, onStepComplete }) => {
  const [educationList, setEducationList] = useState([]);
  const [newEducation, setNewEducation] = useState({
    institutionName: "",
    specialization: "",
    degree: "",
    completionDate: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔹 Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewEducation((prev) => ({ ...prev, [name]: value }));
  };

  // 🔹 Add educational detail
  const handleAdd = async () => {
    if (
      !newEducation.institutionName ||
      !newEducation.specialization ||
      !newEducation.degree ||
      !newEducation.completionDate
    ) {
      toast.error("Please fill all fields before adding.");
      return;
    }

    const payload = {
      institution_name: newEducation.institutionName,
      degree: newEducation.degree,
      specialisation: newEducation.specialization,
      date_of_completion: new Date(newEducation.completionDate).toISOString(),
    };

    try {
      setIsSubmitting(true);
      await addEducationalDetails(payload);

      // ✅ Update local state only after success
      setEducationList((prev) => [
        ...prev,
        { ...newEducation, id: Date.now() },
      ]);

      // ✅ Reset form
      setNewEducation({
        institutionName: "",
        specialization: "",
        degree: "",
        completionDate: "",
      });

      toast.success("Education detail added successfully!");
    } catch (err) {
      console.error("❌ Failed to save education detail:", err);
      toast.error("Failed to save education detail. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🔹 Save & Move to Next Step
  const handleSaveAndNext = () => {
    if (educationList.length === 0) {
      toast.error("Please add at least one education detail before continuing.");
      return;
    }

    if (onStepComplete) onStepComplete("educationDetails");
    goNextStep();
  };

  return (
    <div className="flex-1 p-3 bg-[#f9fafb]">
      <Toaster />

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-medium text-gray-900">
            Educational Details
          </h2>
          <span className="text-sm text-gray-500">Step 09</span>
        </div>
        <CommonUploadActions />
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-lg shadow-sm px-6 py-8 mt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6 max-w-3xl">
          {/* Institution Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Institution Name
            </label>
            <input
              type="text"
              name="institutionName"
              value={newEducation.institutionName}
              onChange={handleChange}
              placeholder="Enter institution name"
              className="block w-full rounded-md border border-gray-300 bg-gray-50 p-2 text-gray-700 text-sm"
            />
          </div>

          {/* Specialization */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Specialization
            </label>
            <input
              type="text"
              name="specialization"
              value={newEducation.specialization}
              onChange={handleChange}
              placeholder="Enter specialization"
              className="block w-full rounded-md border border-gray-300 bg-gray-50 p-2 text-gray-700 text-sm"
            />
          </div>

          {/* Degree */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Degree / Diploma
            </label>
            <input
              type="text"
              name="degree"
              value={newEducation.degree}
              onChange={handleChange}
              placeholder="Enter degree"
              className="block w-full rounded-md border border-gray-300 bg-gray-50 p-2 text-gray-700 text-sm"
            />
          </div>

          {/* Date of Completion */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Completion
            </label>
            <div className="relative">
              <input
                type="date"
                name="completionDate"
                value={newEducation.completionDate}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 bg-gray-50 p-2 text-gray-700 text-sm pr-10"
              />
              <Calendar className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Add Button */}
        <div className="flex justify-end mt-6">
          <button
            onClick={handleAdd}
            disabled={isSubmitting}
            className={`text-sm px-5 py-2 rounded-md shadow-md ${
              isSubmitting
                ? "bg-gray-400 cursor-not-allowed text-white"
                : "bg-[#111827] hover:bg-black text-white"
            }`}
          >
            {isSubmitting ? "Saving..." : "Add"}
          </button>
        </div>
      </div>

      {/* Added Education List */}
      {educationList.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Added Education
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {educationList.map((edu) => (
              <div
                key={edu.id}
                className="bg-white rounded-lg shadow-sm p-4 border border-gray-200"
              >
                <p className="text-sm font-medium text-gray-900">
                  {edu.institutionName}
                </p>
                <p className="text-xs text-gray-600">{edu.specialization}</p>
                <p className="text-xs text-gray-500 mt-2">{edu.degree}</p>
                <p className="text-xs text-blue-600 mt-3">
                  {edu.completionDate}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-end mt-8 gap-3">
        <button
          onClick={goPrevStep}
          className="border border-gray-300 text-gray-700 text-sm px-5 py-2 rounded-md hover:bg-gray-100"
        >
          Previous
        </button>
        <button
          onClick={handleSaveAndNext}
          className="bg-[#111827] hover:bg-black text-white text-sm px-5 py-2 rounded-md shadow"
        >
          Save & Complete
        </button>
      </div>
    </div>
  );
};

export default EducationalDetails;
