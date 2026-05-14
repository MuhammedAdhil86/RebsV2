import React, { useState, useEffect } from "react";
import CommonUploadActions from "../../ui/commonupload";
import { addContactInfo } from "../../service/employeeService";
import toast, { Toaster } from "react-hot-toast";

const ContactInformation = ({ goNextStep, goPrevStep, onStepComplete }) => {
  const [formData, setFormData] = useState({
    work_phone: "",
    personal_email: "",
    personal_phone: "",
    seating_location: "",
    additional_phone: "",
    tags: "",
    present_address: "",
    permanent_address: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedForm = localStorage.getItem("contactForm");
    if (savedForm) {
      try {
        setFormData(JSON.parse(savedForm));
      } catch {
        console.error("Failed to parse saved contact form");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("contactForm", JSON.stringify(formData));
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await addContactInfo(formData);
      toast.success("Contact information saved successfully!");
      if (onStepComplete) onStepComplete();
      else if (goNextStep) goNextStep();
      setFormData({
        work_phone: "",
        personal_email: "",
        personal_phone: "",
        seating_location: "",
        additional_phone: "",
        tags: "",
        present_address: "",
        permanent_address: "",
      });
      localStorage.removeItem("contactForm");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save contact information.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrev = () => {
    if (goPrevStep) goPrevStep();
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-800 text-[14px]">Contact Information</h3>
        <CommonUploadActions />
      </div>

      {/* Form Fields */}
      <div className="text-sm space-y-3">
        {[
          { name: "work_phone", label: "Work Phone" },
          { name: "personal_email", label: "Personal Email" },
          { name: "personal_phone", label: "Personal Phone" },
          { name: "seating_location", label: "Seating Location" },
          { name: "additional_phone", label: "Additional Phone" },
          { name: "tags", label: "Tags" },
        ].map((field) => (
          <div key={field.name} className="flex justify-between items-center border-b border-gray-100 py-2">
            <span className="text-gray-500 text-[12px]">{field.label}</span>
            <input
              name={field.name}
              value={formData[field.name]}
              onChange={handleChange}
              className="border border-gray-300 rounded px-2 py-1 text-gray-800 w-full max-w-[160px]"
            />
          </div>
        ))}

        {/* Addresses */}
        {["present_address", "permanent_address"].map((field) => (
          <div key={field} className="flex justify-between items-start border-b border-gray-100 py-2">
            <span className="text-gray-500 text-[12px]">
              {field === "present_address" ? "Present Address" : "Permanent Address"}
            </span>
            <textarea
              name={field}
              value={formData[field]}
              onChange={handleChange}
              className="border border-gray-300 rounded px-2 py-1 text-gray-800 w-full max-w-[160px]"
              rows={2}
            />
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-end gap-3 mt-4">
        <button
          onClick={handlePrev}
          className="px-4 py-2 border rounded-md text-sm hover:bg-gray-50"
        >
          Previous
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save"}
        </button>
      </div>

      <Toaster />
    </div>
  );
};

export default ContactInformation;
