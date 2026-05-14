import React, { useState, useEffect } from "react";
import CommonUploadActions from "../../ui/commonupload";
import { addPersonalInfo ,genderData } from "../../service/employeeService";

import toast, { Toaster } from "react-hot-toast";

const PersonalInformation = ({ goNextStep, goPrevStep, onStepComplete }) => {
  const [genders, setGenders] = useState([]);
  const [formData, setFormData] = useState({
    date_of_birth: "",
    gender: "",
    age: "",
    marital_status: "",
    about_me: "",
    expertise: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🧩 Fetch genders from API
  useEffect(() => {
    const fetchGenders = async () => {
      try {
        const data = await genderData();
        setGenders(data);
      } catch (error) {
        console.error("Error fetching gender data:", error);
        toast.error("Failed to load gender options.");
      }
    };
    fetchGenders();
  }, []);

  // 🧠 Handle change for text/select inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Handle form submit
  const handleSubmit = async () => {
    if (!formData.gender || !formData.date_of_birth) {
      toast.error("Please fill all required fields.");
      return;
    }

    // Convert gender id → name (same as old working logic)
    const selectedGender =
      genders.find((g) => g.id === formData.gender)?.name || "";

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
      setFormData({
        date_of_birth: "",
        gender: "",
        age: "",
        marital_status: "",
        about_me: "",
        expertise: "",
      });
    } catch (error) {
      console.error("❌ Error saving personal info:", error);
      toast.error("Failed to save personal information.");
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
            Personal Information
          </h2>
          <span className="text-sm text-gray-500">Step 05</span>
        </div>
        <CommonUploadActions />
      </div>

      {/* Content Card */}
      <div className="bg-white rounded-lg shadow-sm px-6 py-8 mt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6 max-w-2xl">
          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth
            </label>
            <input
              type="date"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 bg-gray-50 p-2 text-gray-700 text-sm"
              required
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 bg-gray-50 p-2 text-gray-700 text-sm"
              required
            >
              <option value="">Select Gender</option>
              {genders?.map((gender) => (
                <option key={gender.id} value={gender.id}>
                  {gender.name}
                </option>
              ))}
            </select>
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Age
            </label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              placeholder="Enter age"
              className="block w-full rounded-md border border-gray-300 bg-gray-50 p-2 text-gray-700 text-sm"
            />
          </div>

          {/* Marital Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Marital Status
            </label>
            <select
              name="marital_status"
              value={formData.marital_status}
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 bg-gray-50 p-2 text-gray-700 text-sm"
            >
              <option value="">Select Status</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="divorced">Divorced</option>
              <option value="widowed">Widowed</option>
            </select>
          </div>

          {/* About Me */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              About Me
            </label>
            <textarea
              name="about_me"
              value={formData.about_me}
              onChange={handleChange}
              rows="2"
              placeholder="Enter about yourself"
              className="block w-full rounded-md border border-gray-300 bg-gray-50 p-2 text-gray-700 text-sm resize-none"
            />
          </div>

          {/* Expertise */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ask Me / Expertise
            </label>
            <textarea
              name="expertise"
              value={formData.expertise}
              onChange={handleChange}
              rows="2"
              placeholder="Enter your expertise"
              className="block w-full rounded-md border border-gray-300 bg-gray-50 p-2 text-gray-700 text-sm resize-none"
            />
          </div>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="flex justify-end mt-4">
        <button
          onClick={goPrevStep}
          className="border border-gray-300 text-gray-700 text-sm px-5 py-2 rounded-md hover:bg-gray-100 mr-3"
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

export default PersonalInformation;
