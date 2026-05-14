import React, { useState } from "react";
import CommonUploadActions from "../../ui/commonupload";
import { X } from "lucide-react";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import { addWorkExperience } from "../../service/employeeService";

const WorkExperience = ({ goNextStep, goPrevStep, onStepComplete }) => {
  const [workExperiences, setWorkExperiences] = useState([]);
  const [newExperience, setNewExperience] = useState({
    companyName: "",
    jobTitle: "",
    fromDate: "",
    toDate: "",
    jobDescription: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔹 Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewExperience((prev) => ({ ...prev, [name]: value }));
  };

  // 🔹 Add experience & send to backend
  const handleAddExperience = async () => {
    if (!newExperience.companyName || !newExperience.jobTitle) {
      toast.error("Company name and job title are required!");
      return;
    }

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
      await addWorkExperience(payload);

      setWorkExperiences((prev) => [
        ...prev,
        { ...newExperience, id: Date.now() },
      ]);

      setNewExperience({
        companyName: "",
        jobTitle: "",
        fromDate: "",
        toDate: "",
        jobDescription: "",
      });

      toast.success("Work experience added successfully!");
    } catch (err) {
      console.error("❌ Failed to add experience:", err);
      toast.error("Failed to save work experience. Please try again.");
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
    if (workExperiences.length === 0) {
      toast.error("Please add at least one work experience before continuing.");
      return;
    }
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
            <div className="relative">
              <input
                type="date"
                name="fromDate"
                value={newExperience.fromDate}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 bg-gray-50 p-2 text-gray-700 text-sm pr-10"
              />
              <Icon
                icon="solar:calendar-outline"
                className="absolute right-3 top-3 w-4 h-4 text-gray-400"
              />
            </div>
          </div>

          {/* To Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <div className="relative">
              <input
                type="date"
                name="toDate"
                value={newExperience.toDate}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 bg-gray-50 p-2 text-gray-700 text-sm pr-10"
              />
              <Icon
                icon="solar:calendar-outline"
                className="absolute right-3 top-3 w-4 h-4 text-gray-400"
              />
            </div>
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
            onClick={goPrevStep}
            className="border border-gray-300 text-sm px-6 py-2"
          >
            Previous
          </button>
          <button
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
