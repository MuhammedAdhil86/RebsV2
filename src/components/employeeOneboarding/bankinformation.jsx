import React, { useState, useEffect } from "react";
import CommonUploadActions from "../../ui/commonupload";
import toast from "react-hot-toast";
import { updateBankInformation } from "../../service/employeeService"; // ✅ Make sure this path matches your structure

const INITIAL_FORM = {
  account_holder_name: "",
  bank_name: "",
  account_number: "",
  ifsc: "",
  bank_branch: "",
};

const BankInformation = ({ goNextStep, goPrevStep, onStepComplete }) => {
  const [formData, setFormData] = useState(INITIAL_FORM);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🧩 Load saved form data when component mounts
  useEffect(() => {
    const saved = localStorage.getItem("bankInfoForm");
    if (saved) {
      try {
        setFormData({ ...INITIAL_FORM, ...JSON.parse(saved) });
      } catch {
        console.error("Failed to parse saved bank info form data");
      }
    }
  }, []);

  // 💾 Auto-save form to localStorage whenever form changes
  useEffect(() => {
    localStorage.setItem("bankInfoForm", JSON.stringify(formData));
  }, [formData]);

  // 🧠 Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Handle form submission
  const handleSubmit = async () => {
    if (isSubmitting) return;

    // 🧾 Validation
    if (
      !formData.account_holder_name ||
      !formData.bank_name ||
      !formData.account_number ||
      !formData.ifsc
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      setIsSubmitting(true);

      // 🧠 Send to backend
      const response = await updateBankInformation(formData);
      console.log("Bank info response:", response);

      // ✅ Success feedback (rendered by the global <Toaster /> in App.jsx)
      toast.success(
        response?.message || "Bank information updated successfully!",
      );

      // 🧹 Clear saved form
      localStorage.removeItem("bankInfoForm");

      // 🧠 Save step completed
      localStorage.setItem("bankInfoCompleted", "true");

      // Reset local form
      setFormData(INITIAL_FORM);

      // ✅ Update progress through parent
      if (onStepComplete) {
        onStepComplete();
      } else if (goNextStep) {
        goNextStep();
      }
    } catch (error) {
      console.error("Error updating bank information:", error);
      toast.error(
        error?.message ||
          error?.error ||
          error?.detail ||
          "Failed to update bank information. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 p-3 bg-[#f9fafb]">
      {/* Header */}
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-medium text-gray-900">
            Bank Information
          </h2>
          <span className="text-sm text-gray-500">Step 02</span>
        </div>
        <CommonUploadActions />
      </div>

      {/* Bank Info Card */}
      <div className="bg-white rounded-lg shadow-sm p-6 mt-4">
        {/* Form Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Account Holder Name
            </label>
            <input
              type="text"
              name="account_holder_name"
              value={formData.account_holder_name}
              onChange={handleInputChange}
              placeholder="Enter account holder name"
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white p-2 text-gray-700 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Bank
            </label>
            <input
              type="text"
              name="bank_name"
              value={formData.bank_name}
              onChange={handleInputChange}
              placeholder="Enter bank name"
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white p-2 text-gray-700 text-sm"
            />
          </div>

          <div className="mt-5">
            <label className="block text-sm font-medium text-gray-700">
              Account Number
            </label>
            <input
              type="text"
              name="account_number"
              value={formData.account_number}
              onChange={handleInputChange}
              placeholder="Enter account number"
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white p-2 text-gray-700 text-sm"
            />
          </div>

          <div className="mt-5">
            <label className="block text-sm font-medium text-gray-700">
              IFSC Code
            </label>
            <input
              type="text"
              name="ifsc"
              value={formData.ifsc}
              onChange={handleInputChange}
              placeholder="Enter IFSC code"
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white p-2 text-gray-700 text-sm"
            />
          </div>

          <div className="mt-5">
            <label className="block text-sm font-medium text-gray-700">
              Branch Name
            </label>
            <input
              type="text"
              name="bank_branch"
              value={formData.bank_branch}
              onChange={handleInputChange}
              placeholder="Enter branch name"
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white p-2 text-gray-700 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={goPrevStep}
          disabled={isSubmitting}
          className="border border-gray-300 text-gray-700 text-sm px-5 py-2 rounded-md hover:bg-gray-100 disabled:opacity-60"
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

      {/* No <Toaster /> here: the single global one lives in App.jsx */}
    </div>
  );
};

export default BankInformation;
