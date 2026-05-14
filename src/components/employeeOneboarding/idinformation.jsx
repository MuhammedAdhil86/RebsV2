import React, { useState } from "react";
import CommonUploadActions from "../../ui/commonupload";
import { addIDInfo } from "../../service/employeeService";
import toast, { Toaster } from "react-hot-toast";

const IDInformation = ({ goNextStep, goPrevStep, onStepComplete }) => {
  const [formData, setFormData] = useState({
    pf_number: "",
    pan: "",
    aadhar: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🧠 Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Handle form submission
  const handleSubmit = async () => {
    if (!formData.pan || !formData.aadhar) {
      toast.error("Please fill all required fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await addIDInfo(formData);
      toast.success("ID Information saved successfully!");
      console.log("✅ ID Information response:", response.data);

      // Tell parent to move next or update progress
      if (onStepComplete) onStepComplete();
      else if (goNextStep) goNextStep();

      // Reset form after success
      setFormData({
        pf_number: "",
        pan: "",
        aadhar: "",
      });
    } catch (error) {
      console.error("❌ Error saving ID information:", error);
      toast.error("Failed to save ID information. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 p-3 bg-[#f9fafb]">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-medium text-gray-900">ID Information</h2>
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
          onClick={goPrevStep}
          className="border border-gray-300 text-gray-700 text-sm px-5 py-2 rounded-md hover:bg-gray-100"
        >
          Previous
        </button>
        <button
          onClick={handleSubmit}
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

export default IDInformation;
