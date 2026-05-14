import React, { useRef, useState } from "react";
import { HiOutlineCloudUpload } from "react-icons/hi";
import toast, { Toaster } from "react-hot-toast";
import { addBulkUpload } from "../service/employeeService";

const CommonUploadActions = () => {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  // 🧩 Handle CSV Upload
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a valid CSV file.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await addBulkUpload(formData);
      toast.success(response?.data?.message || "Bulk upload completed successfully!");
    } catch (error) {
      console.error("Bulk upload failed:", error);
      toast.error(
        error?.response?.data?.message ||
          "Failed to upload employee data. Please try again."
      );
    } finally {
      setIsUploading(false);
      // Reset input for re-uploading the same file if needed
      e.target.value = null;
    }
  };

  // 📂 Trigger file picker
  const handleUploadClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="flex items-center gap-4">
      {/* 📘 Sample CSV Download Link */}
      <a
        href="https://rebs.blr1.digitaloceanspaces.com/REBS/staff%20onboarding.csv"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-indigo-600 hover:text-indigo-500 flex items-center gap-1"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z"
          />
        </svg>
        View Sample Employee Upload Format
      </a>

      {/* ☁️ Bulk Upload Button */}
      <button
        onClick={handleUploadClick}
        disabled={isUploading}
        className={`flex items-center gap-2 ${
          isUploading ? "bg-gray-400" : "bg-black hover:bg-gray-900"
        } text-white text-[14px] px-3 py-2 rounded-md transition`}
      >
        <HiOutlineCloudUpload className="w-5 h-5 text-white" />
        {isUploading ? "Uploading..." : "Bulk Upload"}
      </button>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
      />

      <Toaster />
    </div>
  );
};

export default CommonUploadActions;
