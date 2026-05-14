import React, { useState } from "react";
import { Calendar } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import CommonUploadActions from "../../ui/commonupload";
import { addDependantDetails } from "../../service/employeeService";

const DependantDetails = ({ goNextStep, goPrevStep, onStepComplete }) => {
  const [dependantData, setDependantData] = useState({
    name: "",
    relation: "",
    dateOfBirth: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🧩 Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setDependantData((prev) => ({ ...prev, [name]: value }));
  };

  // 🧠 Handle save logic
  const handleSave = async () => {
    const { name, relation, dateOfBirth } = dependantData;

    // ✅ Basic validation
    if (!name || !relation || !dateOfBirth) {
      toast.error("Please fill all required fields.");
      return;
    }

    try {
      setIsSubmitting(true);

      // ✅ Prepare payload for backend
      const dependantPayload = {
        dependant_name: name.trim(),
        dependant_relation: relation.trim(),
        dependant_date_of_birth: new Date(dateOfBirth).toISOString(),
      };

      // ✅ Call API
      await addDependantDetails(dependantPayload);

      // ✅ Update progress in localStorage (consistent with PersonalInformation)
      const progress = JSON.parse(localStorage.getItem("employeeProgress")) || {};
      const completed = new Set(progress.completedSteps || []);
      completed.add("dependantDetails");

      const updatedProgress = {
        ...progress,
        currentStep: "dependantDetails",
        completedSteps: Array.from(completed),
        dependantDetails: true,
      };

      localStorage.setItem("employeeProgress", JSON.stringify(updatedProgress));

      // ✅ Notify success
      toast.success("Dependant details saved successfully!");

      // ✅ Move to next step or notify parent
      if (onStepComplete) onStepComplete();
      else if (goNextStep) goNextStep();

      // ✅ Reset form
      setDependantData({ name: "", relation: "", dateOfBirth: "" });
    } catch (error) {
      console.error("❌ Error saving dependant details:", error);

      if (error.response?.status === 400) {
        toast.error("Invalid data sent to server. Please check your fields.");
      } else if (error.response?.status === 404) {
        toast.error("Employee ID not found. Please complete Personal Info first.");
      } else {
        toast.error("Failed to save dependant details. Please try again.");
      }
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
            <div className="relative">
              <input
                type="date"
                name="dateOfBirth"
                value={dependantData.dateOfBirth}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 bg-gray-50 p-2 text-gray-700 text-sm pr-10"
                required
              />
              <Calendar className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
            </div>
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
          onClick={handleSave}
          disabled={isSubmitting}
          className="bg-[#111827] hover:bg-black text-white text-sm px-5 py-2 rounded-md shadow disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : "Save & Complete"}
        </button>
      </div>

      <Toaster />
    </div>
  );
};

export default DependantDetails;
