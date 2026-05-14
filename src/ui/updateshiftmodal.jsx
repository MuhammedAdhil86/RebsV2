import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, Calendar, ChevronDown, X } from "lucide-react";
import axiosInstance from "../service/axiosinstance";
import toast from "react-hot-toast";
import ColorPicker from "./colorpicker";

const UpdateShiftTab = ({ onClose, shiftData, refreshData }) => {
  const [shiftName, setShiftName] = useState(shiftData?.shift_name || "");
  const [shiftCode, setShiftCode] = useState(shiftData?.shift_code || "");
  const [shiftColour, setShiftColour] = useState(shiftData?.shift_colour || "");
  const [isCrossShift, setIsCrossShift] = useState(
    shiftData?.is_cross_shift || false,
  );

  const [policies, setPolicies] = useState([]);
  const [allPolicies, setAllPolicies] = useState([]);

  // LOGIC: Extracts the string from the { String: "...", Valid: true } object
  const [remarks, setRemarks] = useState(() => {
    if (shiftData?.remarks && typeof shiftData.remarks === "object") {
      return shiftData.remarks.String || "";
    }
    return shiftData?.remarks || "";
  });

  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (shiftData?.policies) {
      const existingPolicyIds = shiftData.policies.map((p) => p.id);
      setPolicies(existingPolicyIds);
    }
  }, [shiftData]);

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const res = await axiosInstance.get("/attendance-policy/get");
        setAllPolicies(res.data.data || []);
      } catch (err) {
        toast.error("Failed to load policies.");
      }
    };
    fetchPolicies();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const togglePolicy = (policyId) => {
    setPolicies((prev) =>
      prev.includes(policyId)
        ? prev.filter((id) => id !== policyId)
        : [...prev, policyId],
    );
  };

  const handleUpdate = async () => {
    if (!shiftName || !shiftCode) {
      toast.error("Shift Name and Code are required");
      return;
    }

    // This payload now matches your successful Postman test body
    const payload = {
      shift_id: shiftData.id,
      shift_name: shiftName,
      shift_code: shiftCode,
      shift_colour: shiftColour,
      is_cross_shift: isCrossShift,
      is_default: shiftData.is_default || false,
      policies: policies,
      remarks: remarks,
    };

    try {
      setLoading(true);
      await axiosInstance.put(`/shifts/update/${shiftData.id}`, payload);
      toast.success("Shift updated successfully!");
      if (refreshData) refreshData();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error updating shift");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle =
    "w-full h-11 px-3 bg-[#F4F6F8] border border-gray-200 rounded-xl text-[12px] text-[#797979] font-[Poppins] focus:outline-none focus:ring-1 focus:ring-gray-300 flex items-center";
  const labelStyle = "text-[12px] font-[Poppins] text-black mb-1 block";

  return (
    <div className="w-full min-h-screen bg-white p-2 font-[Poppins]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onClose}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-900 font-medium"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="bg-[#F4F6F8] rounded-lg border border-gray-100 p-1">
            <Calendar size={18} />
          </div>
          <h2 className="text-[16px] font-medium text-black">Update Shift</h2>
        </div>
      </div>

      {/* Form Grid */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-5">
        <div>
          <label className={labelStyle}>Shift Name</label>
          <input
            type="text"
            className={inputStyle}
            value={shiftName}
            onChange={(e) => setShiftName(e.target.value)}
          />
        </div>

        <div ref={dropdownRef} className="relative">
          <label className={labelStyle}>Attendance Policies</label>
          <div
            className={`${inputStyle} justify-between cursor-pointer`}
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <span className="truncate text-gray-400">
              {policies.length > 0
                ? `${policies.length} Policies Selected`
                : "Select policies"}
            </span>
            <ChevronDown size={16} />
          </div>
          {dropdownOpen && (
            <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-52 overflow-auto text-[12px]">
              {allPolicies.map((policy) => (
                <div
                  key={policy.id}
                  className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                  onClick={() => togglePolicy(policy.id)}
                >
                  <input
                    type="checkbox"
                    checked={policies.includes(policy.id)}
                    readOnly
                    className="mr-2 h-4 w-4 accent-black"
                  />
                  {policy.policy_name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelStyle}>Shift Code</label>
            <input
              type="text"
              className={inputStyle}
              value={shiftCode}
              onChange={(e) => setShiftCode(e.target.value)}
            />
          </div>
          <div className="relative">
            <label className={labelStyle}>Is Cross Shift?</label>
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
              className="absolute right-3 top-[38px] text-gray-500 pointer-events-none"
            />
          </div>
        </div>

        <div>
          <label className={labelStyle}>Shift Color</label>
          <ColorPicker
            value={shiftColour}
            onChange={(color) => setShiftColour(color)}
          />
        </div>

        <div>
          <label className={labelStyle}>Remarks</label>
          <input
            type="text"
            className={inputStyle}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Enter remarks..."
          />
        </div>

        <div>
          <label className={labelStyle}>Selected Policies</label>
          <div className="flex flex-wrap gap-2 min-h-[44px]">
            {allPolicies
              .filter((p) => policies.includes(p.id))
              .map((policy) => (
                <div
                  key={policy.id}
                  className="flex items-center gap-2 bg-[#F4F6F8] border border-gray-200 px-3 py-2 rounded-xl text-[11px] text-black"
                >
                  <span className="font-medium">{policy.policy_name}</span>
                  <button
                    onClick={() => togglePolicy(policy.id)}
                    className="hover:text-red-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-10">
        <button
          onClick={onClose}
          className="px-8 py-2 border border-gray-300 rounded-xl text-[12px] hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleUpdate}
          disabled={loading}
          className="px-10 py-2 bg-black text-white rounded-xl text-[12px] hover:bg-neutral-800 disabled:bg-gray-400"
        >
          {loading ? "Updating..." : "Update Changes"}
        </button>
      </div>
    </div>
  );
};

export default UpdateShiftTab;
