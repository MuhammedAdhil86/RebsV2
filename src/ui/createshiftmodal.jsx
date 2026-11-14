import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, Calendar, ChevronDown } from "lucide-react";
import { toast } from "react-toastify"; // <ToastContainer /> lives in App.jsx
import axiosInstance from "../service/axiosinstance";
import { createShift } from "../service/policiesService";
import ColorPicker from "./colorpicker";

/* ================= TOAST HELPERS ================= */
// Flattens backend "data" (string | array | object) into readable text
const detailsText = (data) => {
  if (!data) return "";
  if (typeof data === "string") return data;
  if (Array.isArray(data))
    return data.map(detailsText).filter(Boolean).join(", ");
  if (typeof data === "object")
    return Object.values(data).map(detailsText).filter(Boolean).join(", ");
  return String(data);
};

// Builds the toast body: backend "message" (bold) and "data" (below it).
const errorBody = (error, fallback) => {
  const res = error?.response?.data;
  const message =
    res?.message || (error?.response ? fallback : error?.message || fallback);
  const details = detailsText(res?.data);

  return (
    <div>
      <div style={{ fontWeight: 600 }}>{message}</div>
      {details && details !== message && (
        <div style={{ marginTop: 4, opacity: 0.8 }}>{details}</div>
      )}
    </div>
  );
};

// A loading toast turns off close/drag; switch them back on when it finishes.
const END_LOADING = {
  isLoading: false,
  closeOnClick: true,
  closeButton: true,
  draggable: true,
};

// Shows an error toast. Pass a toastId to turn an existing loading toast
// into the error instead of stacking a second one (also stops duplicates).
const showApiError = (error, fallback, toastId) => {
  const render = errorBody(error, fallback);
  if (toastId && toast.isActive(toastId)) {
    toast.update(toastId, {
      ...END_LOADING,
      render,
      type: "error",
      autoClose: 6000,
    });
  } else {
    toast.error(render, { autoClose: 6000, toastId });
  }
};

// Turns a loading toast into a success toast (new toast if it was dismissed).
const finishSuccess = (toastId, message) => {
  if (toast.isActive(toastId)) {
    toast.update(toastId, {
      ...END_LOADING,
      render: message,
      type: "success",
      autoClose: 4000,
    });
  } else {
    toast.success(message, { autoClose: 4000 });
  }
};

const CreateShiftModal = ({ onClose, refreshData }) => {
  // --- FORM STATE ---
  const [shiftName, setShiftName] = useState("");
  const [shiftCode, setShiftCode] = useState("");
  const [shiftColour, setShiftColour] = useState("");
  const [isCrossShift, setIsCrossShift] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const [policies, setPolicies] = useState([]);
  const [allPolicies, setAllPolicies] = useState([]);
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);

  // --- FETCH POLICIES FOR DROPDOWN ---
  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const res = await axiosInstance.get("/attendance-policy/get");
        setAllPolicies(res.data.data || []);
      } catch (err) {
        showApiError(err, "Failed to load policies.", "policy-load-error");
      }
    };
    fetchPolicies();
  }, []);

  // --- CLOSE DROPDOWN WHEN CLICKING OUTSIDE ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- POLICY SELECTION LOGIC ---
  const togglePolicy = (policyId) => {
    setPolicies((prev) =>
      prev.includes(policyId)
        ? prev.filter((id) => id !== policyId)
        : [...prev, policyId],
    );
  };

  // --- SUBMIT LOGIC ---
  const handleSubmit = async () => {
    if (loading) return; // guard against double submit

    // Basic front-end validation
    if (!shiftName.trim()) return toast.error("Shift Name is required");
    if (policies.length === 0)
      return toast.error("Please select at least one Policy");
    if (!shiftCode.trim()) return toast.error("Shift Code is required");
    if (!shiftColour) return toast.error("Please select a Color");

    const payload = {
      shift_name: shiftName.trim(),
      shift_code: shiftCode.trim(),
      shift_colour: shiftColour,
      is_cross_shift: isCrossShift,
      is_default: isDefault,
      policies,
      remarks,
    };

    setLoading(true);
    const tid = toast.loading("Creating shift...");

    try {
      const response = await createShift(payload);

      finishSuccess(tid, response?.message || "Shift created successfully!");
      if (refreshData) refreshData();
      onClose();
    } catch (err) {
      // Shows the backend message plus its details
      // (e.g. "weekly off policies cannot be combined...")
      showApiError(err, "An internal server error occurred.", tid);
      console.error("Shift Creation Failed:", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  // --- STYLES ---
  const inputStyle =
    "w-full h-11 px-3 bg-[#F4F6F8] border border-gray-200 rounded-xl text-[12px] text-[#797979] font-[Poppins] focus:outline-none focus:ring-1 focus:ring-gray-300 flex items-center";
  const labelStyle = "text-[12px] font-[Poppins] text-black mb-1 block";

  return (
    <div className="w-full bg-white p-4 font-[Poppins]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onClose} className="text-gray-500 hover:text-black">
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="bg-[#F4F6F8] p-1.5 rounded-lg border border-gray-100">
            <Calendar size={18} />
          </div>
          <h2 className="text-[16px] font-medium text-black">Create Shift</h2>
        </div>
      </div>

      {/* Form Grid */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-5">
        {/* Shift Name */}
        <div>
          <label className={labelStyle}>
            Shift Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Enter shift"
            className={inputStyle}
            value={shiftName}
            onChange={(e) => setShiftName(e.target.value)}
          />
        </div>

        {/* Multi-select Policy Dropdown */}
        <div ref={dropdownRef} className="relative">
          <label className={labelStyle}>
            Attendance Policies <span className="text-red-500">*</span>
          </label>
          <div
            className={`${inputStyle} justify-between cursor-pointer`}
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <span className="truncate">
              {policies.length
                ? allPolicies
                    .filter((p) => policies.includes(p.id))
                    .map((p) => p.policy_name)
                    .join(", ")
                : "Select policies"}
            </span>
            <ChevronDown size={16} />
          </div>
          {dropdownOpen && (
            <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-52 overflow-auto">
              {allPolicies.map((policy) => (
                <div
                  key={policy.id}
                  className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer text-[12px]"
                  onClick={() => togglePolicy(policy.id)}
                >
                  <input
                    type="checkbox"
                    checked={policies.includes(policy.id)}
                    readOnly
                    className="mr-2 cursor-pointer"
                  />
                  {policy.policy_name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Shift Code */}
        <div>
          <label className={labelStyle}>
            Shift Code <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Shift Code (eg: NS)"
            className={inputStyle}
            value={shiftCode}
            onChange={(e) => setShiftCode(e.target.value)}
          />
        </div>

        {/* Color Picker */}
        <div>
          <label className={labelStyle}>
            Shift Color <span className="text-red-500">*</span>
          </label>
          <ColorPicker
            value={shiftColour}
            onChange={(color) => setShiftColour(color)}
          />
        </div>

        {/* Cross Shift Select */}
        <div>
          <label className={labelStyle}>Is Cross Shift?</label>
          <div className="relative">
            <select
              className={`${inputStyle} appearance-none pr-10 cursor-pointer`}
              value={String(isCrossShift)}
              onChange={(e) => setIsCrossShift(e.target.value === "true")}
            >
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
            />
          </div>
        </div>

        {/* Default Shift Select */}
        <div>
          <label className={labelStyle}>Set as Default Shift?</label>
          <div className="relative">
            <select
              className={`${inputStyle} appearance-none pr-10 cursor-pointer`}
              value={String(isDefault)}
              onChange={(e) => setIsDefault(e.target.value === "true")}
            >
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
            />
          </div>
        </div>

        {/* Remarks */}
        <div className="col-span-2">
          <label className={labelStyle}>Remarks</label>
          <textarea
            className={`${inputStyle} h-24 resize-none py-2`}
            placeholder="Add any remarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 mt-8">
        <button
          onClick={onClose}
          className="px-8 py-2 border border-gray-300 rounded-xl text-[12px] hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-10 py-2 bg-black text-white rounded-xl text-[12px] hover:bg-neutral-800 transition-colors disabled:bg-gray-400"
        >
          {loading ? "Creating..." : "Create"}
        </button>
      </div>
    </div>
  );
};

export default CreateShiftModal;
