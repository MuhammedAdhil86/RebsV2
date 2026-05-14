import React, { useState, useEffect } from "react";
import { Upload } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { addAdditionalInfo } from "../../service/employeeService";

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
  const handleSave = async () => {
    const { bloodGroup, emergencyContact } = info;

    if (!bloodGroup || !emergencyContact) {
      toast.error("Please fill all required fields.");
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        blood_group: bloodGroup,
        emergency_contact_native: emergencyContact,
      };

      await addAdditionalInfo(payload);

      // ✅ Update local progress inline (like your other steps)
      const updatedProgress = {
        ...progress,
        currentStep: "additionalInformation",
        completedSteps: Array.from(
          new Set([...progress.completedSteps, "additionalInformation"])
        ),
      };
      setProgress(updatedProgress);
      localStorage.setItem("employeeProgress", JSON.stringify(updatedProgress));

      toast.success("Additional information saved successfully!");

      // ✅ Trigger parent progress tracker if exists
      if (onStepComplete) onStepComplete("additionalInformation");

      // ✅ Go next
      if (goNextStep) goNextStep();
    } catch (error) {
      console.error("❌ Error saving additional info:", error);
      if (error.response?.status === 400) {
        toast.error("Invalid data. Please check your input.");
      } else if (error.response?.status === 404) {
        toast.error("Employee ID not found. Complete previous steps first.");
      } else {
        toast.error("Failed to save. Please try again.");
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
            Additional Information
          </h2>
          <span className="text-sm text-gray-500">Step 11</span>
        </div>

        {/* Bulk Uploads Button */}
        <button
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
              })
            );
            if (goPrevStep) goPrevStep();
          }}
          className="border border-gray-300 text-gray-700 text-sm px-6 py-2.5 rounded-lg hover:bg-gray-100 mr-3 font-medium"
        >
          Previous
        </button>

        <button
          onClick={handleSave}
          disabled={isSubmitting}
          className="bg-[#111827] hover:bg-black text-white text-sm px-6 py-2.5 rounded-lg shadow font-medium disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : "Save & Complete"}
        </button>
      </div>

      <Toaster />
    </div>
  );
};

export default AdditionalInformation;
