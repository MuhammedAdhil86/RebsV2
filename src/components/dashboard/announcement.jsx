import React, { useState, useEffect, useMemo, useRef } from "react";
import { X, Paperclip, Loader2, FileText, Search, User } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import GlowButton from "../helpers/glowbutton";

import { getActiveUsersLight } from "../../service/employeeService";
import { getDepartmentData } from "../../service/companyService";
import announceService from "../../service/announceService";

const AnnouncementModal = ({ isOpen, onClose }) => {
  const fileInputRef = useRef(null);

  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filePreview, setFilePreview] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    priority: 1, // 1: High, 2: Medium, 3: Low
    audienceType: "All",
    selectedEmployees: [],
    selectedDepartmentId: "",
    attachment: null,
  });

  // Fetch active users and departments
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const [usersRes, deptRes] = await Promise.all([
            getActiveUsersLight(),
            getDepartmentData(),
          ]);

          // Handle array whether direct or nested in data
          const usersList = usersRes?.data || usersRes || [];
          const deptList = deptRes?.data || deptRes || [];

          setUsers(Array.isArray(usersList) ? usersList : []);
          setDepartments(Array.isArray(deptList) ? deptList : []);
        } catch (err) {
          toast.error("Failed to load users or departments");
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [isOpen]);

  // Filter users by name or UUID
  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return users.filter((user) => {
      const name = (user.name || "").toLowerCase();
      const uuid = (user.uuid || "").toLowerCase();
      return name.includes(term) || uuid.includes(term);
    });
  }, [users, searchTerm]);

  const toggleEmployee = (id) => {
    setFormData((prev) => ({
      ...prev,
      selectedEmployees: prev.selectedEmployees.includes(id)
        ? prev.selectedEmployees.filter((e) => e !== id)
        : [...prev.selectedEmployees, id],
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFormData((prev) => ({ ...prev, attachment: file }));

    if (file.type.startsWith("image/")) {
      setFilePreview(URL.createObjectURL(file));
    } else {
      setFilePreview(file.name);
    }
  };

  const removeFile = () => {
    setFormData((prev) => ({ ...prev, attachment: null }));
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);

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
    payload.append("priority", Number(formData.priority));
    payload.append("audience_type", formData.audienceType);

    if (formData.audienceType === "Specific employees") {
      payload.append("send_to", JSON.stringify(formData.selectedEmployees));
    }

    if (formData.audienceType === "Department") {
      payload.append("department", formData.selectedDepartmentId);
    }

    if (formData.attachment) {
      payload.append("attachment", formData.attachment);
      const extension = formData.attachment.name.split(".").pop().toLowerCase();
      payload.append("attachment_type", extension);
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
      priority: 1,
      audienceType: "All",
      selectedEmployees: [],
      selectedDepartmentId: "",
      attachment: null,
    });
    setFilePreview(null);
    setSearchTerm("");
    if (fileInputRef.current) fileInputRef.current.value = "";
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
            className="p-8 space-y-5 overflow-y-auto"
          >
            {/* Title */}
            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Enter title..."
                className="w-full border p-3 rounded-2xl"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Description
              </label>
              <textarea
                rows="3"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                placeholder="Write your announcement..."
                className="w-full border p-3 rounded-2xl"
                required
              />
            </div>

            {/* Priority Selector (1: High, 2: Medium, 3: Low) */}
            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Priority
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "High", value: 1 },
                  { label: "Medium", value: 2 },
                  { label: "Low", value: 3 },
                ].map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, priority: p.value }))
                    }
                    className={`py-2 rounded-xl border text-center transition-all ${
                      formData.priority === p.value
                        ? "bg-black text-white border-black font-semibold"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Audience Type Tabs */}
            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Audience
              </label>
              <div className="bg-gray-100 p-1 rounded-2xl flex gap-1">
                {["All", "Department", "Specific employees"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, audienceType: type }))
                    }
                    className={`flex-1 py-2 rounded-xl text-center transition-all ${
                      formData.audienceType === type
                        ? "bg-black text-white"
                        : "text-gray-400"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Department Dropdown */}
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
                required
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            )}

            {/* Active Users Selection */}
            {formData.audienceType === "Specific employees" && (
              <div className="space-y-2">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-3 text-gray-400"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="Search by name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 border p-2.5 rounded-2xl"
                  />
                </div>

                <div className="max-h-[180px] overflow-y-auto border rounded-2xl p-2 space-y-1">
                  {loading ? (
                    <div className="flex items-center justify-center p-4 text-gray-400">
                      <Loader2 className="animate-spin mr-2" size={16} />{" "}
                      Loading users...
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="p-3 text-center text-gray-400">
                      No users found
                    </div>
                  ) : (
                    filteredUsers.map((user) => (
                      <label
                        key={user.id}
                        className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {user.image ? (
                            <img
                              src={user.image}
                              alt={user.name}
                              className="w-7 h-7 rounded-full object-cover border"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                              <User size={14} />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-800 leading-tight">
                              {user.name}
                            </p>
                            <span className="text-[10px] text-gray-400 font-mono">
                              ID: {user.uuid}
                            </span>
                          </div>
                        </div>

                        <input
                          type="checkbox"
                          checked={formData.selectedEmployees.includes(user.id)}
                          onChange={() => toggleEmployee(user.id)}
                          className="rounded border-gray-300"
                        />
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Attachment Input */}
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              />

              {!filePreview ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 border border-dashed border-gray-300 p-3 rounded-2xl text-gray-600 hover:bg-gray-50"
                >
                  <Paperclip size={16} />
                  <span>Attach Document (PDF, Image, etc.)</span>
                </button>
              ) : (
                <div className="flex items-center justify-between border p-3 rounded-2xl bg-gray-50">
                  <div className="flex items-center gap-2 truncate">
                    <FileText
                      size={18}
                      className="text-gray-500 flex-shrink-0"
                    />
                    <span className="truncate text-gray-700">
                      {filePreview}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="text-gray-400 hover:text-red-500 ml-2"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>

              <GlowButton onClick={handleSubmit}>
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  "Broadcast"
                )}
              </GlowButton>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AnnouncementModal;
