import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import CommonUploadActions from "../../ui/commonupload";
import { addBasicInformation } from "../../service/employeeService";
import toast, { Toaster } from "react-hot-toast";

const BasicInformation = ({ goNextStep, onStepComplete }) => {
  // 🧠 Local form state
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    nick_name: "",
    email: "",
    ph_no: "",
    basic_salary: "",
    image: null,
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🧩 Load saved form (restore from localStorage)
  useEffect(() => {
    const saved = localStorage.getItem("basicInfoForm");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(parsed);
      } catch {
        console.error("Failed to parse saved form data");
      }
    }
  }, []);

  // 💾 Auto-save form data to localStorage
  useEffect(() => {
    localStorage.setItem("basicInfoForm", JSON.stringify(formData));
  }, [formData]);

  // 🧩 Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 🧩 Handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));

      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // ✅ Submit form and trigger parent progress
  const handleSubmit = async () => {
    // Validation
    if (!formData.first_name || !formData.last_name || !formData.email) {
      toast.error("Please fill out all required fields.");
      return;
    }

    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== "") {
        formDataToSend.append(key, value);
      }
    });

    try {
      setIsSubmitting(true);
      const response = await addBasicInformation(formDataToSend);

      // Store backend employee ID for next steps
      const employeeId = response?.data?.id;
      if (employeeId) {
        localStorage.setItem("employeeId", employeeId);
      }

      // ✅ Show success toast
      toast.success("Employee created successfully!");

      // 🧹 Remove saved form data
      localStorage.removeItem("basicInfoForm");

      // 🧠 Save progress in localStorage
      localStorage.setItem("basicInfoCompleted", "true");

      // ✅ Notify parent (progress to next step)
      if (onStepComplete) {
        onStepComplete();
      } else if (goNextStep) {
        goNextStep();
      }

      // Reset local form (optional)
      setFormData({
        first_name: "",
        last_name: "",
        nick_name: "",
        email: "",
        ph_no: "",
        basic_salary: "",
        image: null,
      });
      setImagePreview(null);
    } catch (error) {
      console.error("Error creating employee:", error);
      toast.error("Failed to create employee. Please try again.");
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
            Basic Information
          </h2>
          <span className="text-sm text-gray-500">Step 01</span>
        </div>
        <CommonUploadActions />
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-lg shadow-sm p-6 pb-10 relative mt-2">
        {/* Profile Picture */}
        <div className="relative inline-block mb-6">
          <label htmlFor="file-upload" className="cursor-pointer">
            <img
              src={imagePreview || "https://i.pravatar.cc/100?img=12"}
              alt="profile"
              className="w-20 h-20 rounded-full border-2 border-gray-300 object-cover"
            />
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <div
              className="absolute bottom-2 left-1/2 transform -translate-x-1/2 
                backdrop-blur-md rounded-full p-1.5 shadow-md transition"
            >
              <Icon
                icon="solar:camera-outline"
                className="w-5 h-5 text-white opacity-90"
              />
            </div>
          </label>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-2 gap-4">
          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              First Name
            </label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              placeholder="Enter first name"
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white p-2 text-gray-700 text-sm"
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Last Name
            </label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              placeholder="Enter last name"
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white p-2 text-gray-700 text-sm"
            />
          </div>

          {/* Email */}
          <div className="mt-5">
            <label className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter email"
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white p-2 text-gray-700 text-sm"
            />
          </div>

          {/* Salary */}
          <div className="mt-5">
            <label className="block text-sm font-medium text-gray-700">
              Current Salary
            </label>
            <input
              type="text"
              name="basic_salary"
              value={formData.basic_salary}
              onChange={handleInputChange}
              placeholder="Enter salary"
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white p-2 text-gray-700 text-sm"
            />
          </div>

          {/* Phone Number */}
          <div className="mt-5">
            <label className="block text-sm font-medium text-gray-700">
              Contact Number
            </label>
            <input
              type="text"
              name="ph_no"
              value={formData.ph_no}
              onChange={handleInputChange}
              placeholder="Enter phone number"
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white p-2 text-gray-700 text-sm"
            />
          </div>

          {/* Nickname */}
          <div className="mt-5">
            <label className="block text-sm font-medium text-gray-700">
              Nick Name
            </label>
            <input
              type="text"
              name="nick_name"
              value={formData.nick_name}
              onChange={handleInputChange}
              placeholder="Enter nickname"
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white p-2 text-gray-700 text-sm"
            />
          </div>
        </div>
      </div>

      {/* ✅ Save Button */}
      <div className="flex justify-end mt-6">
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

export default BasicInformation;
