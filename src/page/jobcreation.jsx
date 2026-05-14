import React, { useState, useEffect } from "react";
import DashboardLayout from "../ui/pagelayout";
import avatar from "../assets/img/avatar.svg";
import { FiBell } from "react-icons/fi";
import { Icon } from "@iconify/react";
import { RiUploadLine } from "react-icons/ri";
import toast, { Toaster } from "react-hot-toast";
import { createVacancy, fetchPlatforms } from "../service/hiringService";

const JobCreation = () => {
  const [activeTab, setActiveTab] = useState("create");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dynamicPlatforms, setDynamicPlatforms] = useState([]);

  const [formData, setFormData] = useState({
    jobTitle: "",
    designation: "",
    description: "",
    salary: "",
    period: "Monthly",
    experience: "",
    area: "Marketing",
    expiryDate: "",
    jobType: "Full-time",
    location: "",
    poster: null,
    platforms: [],
  });

  useEffect(() => {
    const getPlatformData = async () => {
      try {
        const data = await fetchPlatforms();
        setDynamicPlatforms(data);
      } catch (err) {
        toast.error("Failed to load platforms");
      }
    };
    getPlatformData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, poster: file }));
      toast.success(`Image selected: ${file.name}`);
    }
  };

  const togglePlatform = (id) => {
    setFormData((prev) => {
      const exists = prev.platforms.find((p) => p.id === id);
      if (exists) {
        return {
          ...prev,
          platforms: prev.platforms.filter((p) => p.id !== id),
        };
      }
      return { ...prev, platforms: [...prev.platforms, { id }] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.poster) return toast.error("Please upload a vacancy poster.");
    if (!formData.jobTitle || !formData.expiryDate)
      return toast.error("Please fill required fields.");

    const loadingToast = toast.loading("Creating job vacancy...");
    setIsSubmitting(true);

    try {
      const payload = {
        poster: formData.poster,
        title: formData.jobTitle,
        position: formData.designation,
        expiry_date: formData.expiryDate,
        description: formData.description,
        salary: formData.salary,
        salary_period: formData.period,
        job_type: formData.jobType,
        area_of_work: formData.area,
        year_of_experience: formData.experience,
        work_location: formData.location,
        platform: formData.platforms,
      };

      const result = await createVacancy(payload);
      if (result.ok || result.status_code === 200) {
        toast.success("Job Created Successfully!", { id: loadingToast });
      } else {
        toast.error(result.message || "Failed to create job", {
          id: loadingToast,
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong", {
        id: loadingToast,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const labelStyle = "block text-gray-400 text-[11px] font-medium mb-1";

  // Reusable Select Wrapper to handle the Arrow position
  const SelectWrapper = ({ children }) => (
    <div className="relative h-10">
      {children}
      <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
        <svg
          className="w-3.5 h-3.5 text-gray-500"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </div>
  );

  return (
    <DashboardLayout userName="Admin" onLogout={() => alert("Logout")}>
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-white flex justify-between items-center flex-wrap gap-4 p-3 mb-2">
        <h1 className="text-[15px] font-medium text-gray-800">Job Creation</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-300">
            <FiBell className="text-gray-600 text-lg" />
          </div>
          <button className="text-[13px] text-gray-700 border border-gray-300 px-5 py-1 rounded-full">
            Settings
          </button>
          <div className="w-9 h-9 rounded-full border border-gray-200 overflow-hidden">
            <img
              src={avatar}
              alt="User"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      <div className="overflow-auto min-h-[600px] p-1 rounded-2xl">
        {activeTab === "create" && (
          <div className="bg-white rounded-2xl p-2 flex flex-col gap-6 shadow-sm">
            {/* Upload Poster */}
            <div className="flex items-center justify-between rounded-xl px-5 py-5 bg-[#f9fafb]">
              <div className="flex-1">
                <h3 className="text-[13px] font-medium text-gray-800">
                  Upload Vacancy Poster
                </h3>
                <p className="text-[10px] text-gray-500 mt-1">
                  Ensure the poster includes all necessary details.
                </p>
              </div>
              <input
                type="file"
                id="poster-input"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => document.getElementById("poster-input").click()}
                className="bg-black text-white px-6 py-2 rounded-md text-[11px] font-poppins flex items-center gap-2 border border-gray-300 hover:bg-gray-800 transition"
              >
                <RiUploadLine className="text-lg" />{" "}
                {formData.poster ? "Change Image" : "Upload Image"}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-6 rounded-2xl relative bg-white p-4">
              {/* Left Column */}
              <div className="flex flex-col gap-4">
                <div>
                  <label className={labelStyle}>Job Title</label>
                  <input
                    type="text"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-[#f9fafb] focus:outline-none focus:border-black"
                  />
                </div>
                <div className="flex-1 flex flex-col">
                  <label className={labelStyle}>Job Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full h-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-[#f9fafb] focus:outline-none focus:border-black resize-none"
                  />
                </div>
              </div>

              {/* Middle Column */}
              <div className="flex flex-col gap-4">
                <div>
                  <label className={labelStyle}>Designation</label>
                  <input
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-[#f9fafb] focus:outline-none focus:border-black"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyle}>Salary Offered</label>
                    <input
                      type="text"
                      name="salary"
                      value={formData.salary}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm h-10 bg-[#f9fafb] focus:outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Salary Period</label>
                    <SelectWrapper>
                      <select
                        name="period"
                        value={formData.period}
                        onChange={handleChange}
                        className="w-full h-full appearance-none border border-gray-300 rounded-md px-3 text-sm bg-[#f9fafb] focus:outline-none focus:border-black cursor-pointer"
                      >
                        <option value="Monthly">Monthly</option>
                        <option value="Yearly">Yearly</option>
                      </select>
                    </SelectWrapper>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyle}>Years of Experience</label>
                    <input
                      type="text"
                      name="experience"
                      value={formData.experience}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm h-10 bg-[#f9fafb] focus:outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Area of Work</label>
                    <SelectWrapper>
                      <select
                        name="area"
                        value={formData.area}
                        onChange={handleChange}
                        className="w-full h-full appearance-none border border-gray-300 rounded-md px-3 text-sm bg-[#f9fafb] focus:outline-none focus:border-black cursor-pointer"
                      >
                        <option value="Marketing">Marketing</option>
                        <option value="Development">Development</option>
                      </select>
                    </SelectWrapper>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyle}>Expiry Date</label>
                    <input
                      type="date"
                      name="expiryDate"
                      value={formData.expiryDate}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm h-10 bg-[#f9fafb] focus:outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Job Type</label>
                    <SelectWrapper>
                      <select
                        name="jobType"
                        value={formData.jobType}
                        onChange={handleChange}
                        className="w-full h-full appearance-none border border-gray-300 rounded-md px-3 text-sm bg-[#f9fafb] focus:outline-none focus:border-black cursor-pointer"
                      >
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                      </select>
                    </SelectWrapper>
                  </div>
                </div>

                <div>
                  <label className={labelStyle}>Work Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-[#f9fafb] focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              {/* Right Column: Platform Selection */}
              <div className="flex flex-col relative">
                <h3 className="text-gray-800 font-medium mb-2 text-[14px]">
                  Posted on
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-16">
                  {dynamicPlatforms.map((item) => {
                    const isSelected = formData.platforms.some(
                      (p) => p.id === item.id,
                    );
                    return (
                      <div
                        key={item.id}
                        onClick={() => togglePlatform(item.id)}
                        className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition ${
                          isSelected
                            ? "border-black bg-gray-50"
                            : "bg-[#f9fafb]"
                        }`}
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-5 h-5 object-contain"
                        />
                        <div className="flex flex-col">
                          <span className="font-medium text-[12px]">
                            {item.name}
                          </span>
                          <span className="text-[8px] text-gray-500">
                            Company name
                          </span>
                        </div>
                        <div
                          className={`ml-auto w-4 h-4 rounded-full border flex items-center justify-center transition ${
                            isSelected
                              ? "bg-black border-black"
                              : "bg-white border-gray-300"
                          }`}
                        >
                          {isSelected && (
                            <Icon
                              icon="charm:tick"
                              className="text-white w-3 h-3"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                  className={`absolute bottom-0 right-0 bg-black text-white px-6 py-2 rounded-md text-[11px] font-poppins ${
                    isSubmitting ? "opacity-50" : "hover:bg-gray-800"
                  }`}
                >
                  {isSubmitting ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default JobCreation;
