import React, { useState, useEffect, useMemo, useRef } from "react";
import { X, Paperclip, Send, Loader2, FileText, Search } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import GlowButton from "../helpers/glowbutton";

import { getStaffDetails } from "../../service/employeeService";
import { getDepartmentData } from "../../service/companyService";
import announceService from "../../service/announceService";

const AnnouncementModal = ({ isOpen, onClose }) => {
  const fileInputRef = useRef(null);

  const [staff, setStaff] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filePreview, setFilePreview] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    audienceType: "All",
    selectedEmployees: [],
    selectedDepartmentId: "",
    attachment: null,
  });

  // ✅ FETCH DATA
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const [staffRes, deptRes] = await Promise.all([
            getStaffDetails(),
            getDepartmentData(),
          ]);

          // ✅ FIXED STAFF
          const staffList =
            staffRes?.data?.data || staffRes?.data || staffRes || [];

          // ✅ FIXED DEPT
          const deptList = deptRes || [];

          setStaff(Array.isArray(staffList) ? staffList : []);
          setDepartments(Array.isArray(deptList) ? deptList : []);
        } catch (err) {
          toast.error("Failed to load staff/departments");
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [isOpen]);

  // ✅ FILTER STAFF
  const filteredStaff = useMemo(() => {
    return staff.filter((emp) => {
      const name =
        `${emp.first_name || ""} ${emp.last_name || ""}`.toLowerCase();
      return name.includes(searchTerm.toLowerCase());
    });
  }, [staff, searchTerm]);

  // ✅ SELECT EMPLOYEE
  const toggleEmployee = (id) => {
    setFormData((prev) => ({
      ...prev,
      selectedEmployees: prev.selectedEmployees.includes(id)
        ? prev.selectedEmployees.filter((e) => e !== id)
        : [...prev.selectedEmployees, id],
    }));
  };

  // ✅ FILE HANDLER
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFormData((prev) => ({ ...prev, attachment: file }));

    if (file.type.startsWith("image/")) {
      setFilePreview(URL.createObjectURL(file));
    } else {
      setFilePreview("file_icon");
    }
  };

  // ✅ SUBMIT
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);

    // ✅ VALIDATION
    if (
      formData.audienceType === "Specific employees" &&
      formData.selectedEmployees.length === 0
    ) {
      toast.error("Select at least one employee");
      setIsSubmitting(false);
      return;
    }

    if (
      formData.audienceType === "Department" &&
      !formData.selectedDepartmentId
    ) {
      toast.error("Select a department");
      setIsSubmitting(false);
      return;
    }

    const payload = new FormData();
    payload.append("title", formData.title);
    payload.append("description", formData.content);
    payload.append("priority", formData.audienceType === "Department" ? 2 : 1);
    payload.append("audience_type", formData.audienceType);

    if (formData.audienceType === "Specific employees") {
      payload.append("send_to", JSON.stringify(formData.selectedEmployees));
    }

    if (formData.audienceType === "Department") {
      payload.append("department", formData.selectedDepartmentId);
    }

    if (formData.attachment) {
      payload.append("attachment", formData.attachment);
      payload.append("attachment_type", formData.attachment.type);
    }

    try {
      await announceService.addAnnouncement(payload);
      toast.success("Announcement broadcasted successfully!");
      handleClose();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Internal Server Error";
      toast.error(`Push Failed: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: "",
      content: "",
      audienceType: "All",
      selectedEmployees: [],
      selectedDepartmentId: "",
      attachment: null,
    });
    setFilePreview(null);
    setSearchTerm("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />

      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm font-poppins text-[12px]">
        <div className="bg-white w-[95%] max-w-[500px] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20">
          {/* Header */}
          <div className="px-8 py-5 flex items-center justify-between border-b border-gray-50 bg-white">
            <div>
              <h2 className="text-gray-900 text-[16px] font-medium uppercase">
                New Announcement
              </h2>
              <p className="text-gray-400 text-[10px]">
                Fill details to notify your team
              </p>
            </div>
            <button onClick={handleClose}>
              <X size={20} />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-8 space-y-6 overflow-y-auto"
          >
            {/* TITLE */}
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Enter title..."
              className="w-full border p-4 rounded-2xl"
              required
            />

            {/* MESSAGE */}
            <textarea
              rows="4"
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              placeholder="Write your announcement..."
              className="w-full border p-4 rounded-2xl"
              required
            />

            {/* TABS */}
            <div className="bg-gray-100 p-1 rounded-2xl flex gap-1">
              {["All", "Department", "Specific employees"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, audienceType: type }))
                  }
                  className={`flex-1 py-2 rounded-xl ${
                    formData.audienceType === type
                      ? "bg-black text-white"
                      : "text-gray-400"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* ✅ DEPARTMENT */}
            {formData.audienceType === "Department" && (
              <select
                value={formData.selectedDepartmentId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    selectedDepartmentId: e.target.value,
                  })
                }
                className="w-full border p-3 rounded-2xl"
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            )}

            {/* ✅ STAFF LIST */}
            {formData.audienceType === "Specific employees" && (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 border p-3 rounded-2xl"
                  />
                </div>

                <div className="max-h-[200px] overflow-y-auto border rounded-2xl p-3">
                  {filteredStaff.map((emp) => (
                    <label
                      key={emp.id}
                      className="flex justify-between items-center p-2 hover:bg-gray-50 rounded"
                    >
                      <span>
                        {emp.first_name} {emp.last_name}
                      </span>

                      <input
                        type="checkbox"
                        checked={formData.selectedEmployees.includes(emp.id)}
                        onChange={() => toggleEmployee(emp.id)}
                      />
                    </label>
                  ))}
                </div>
              </>
            )}

            {/* FOOTER */}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={handleClose}>
                Cancel
              </button>

              <GlowButton onClick={handleSubmit}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : "Send"}
              </GlowButton>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AnnouncementModal;
