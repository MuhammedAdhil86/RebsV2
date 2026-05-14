import React, { useState, useEffect } from "react";
import { X, Calendar, Clock, ChevronDown } from "lucide-react";
import { updatePresetTemplate } from "../../../service/companyService";
import ColorPicker from "../../../ui/colorpicker";
import toast from "react-hot-toast";

const EditAttendancePreset = ({ initialData, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    policy_name: "",
    policy_code: "",
    policy_colour: "#4CAF50",
    start_time: "00:00:00",
    end_time: "00:00:00",
    working_hours: "",
    delay: "00:00:00",
    delay_unpaid_count: 0,
    delay_cut: "",
    late: "00:00:00",
    late_unpaid_count: 0,
    late_cut: "",
    delay_action_type: "",
    delay_fine_amount: null,
    delay_fine_source: null,
    late_action_type: "",
    late_fine_amount: null,
    late_fine_source: null,
    half_day: "00:00:00",
    break_time_from: "00:00:00",
    break_time_to: "00:00:00",
    lunch_break_from: "00:00:00",
    lunch_break_to: "00:00:00",
    work_from_home: false,
    over_time_benefit: false,
    over_time_pay: "",
    regularisation_limit: 0,
    regularisation_type: "Monthly",
    start_date: "",
    end_date: "",
    overtime_cap_limit: "00:00:00",
    overtime_cap_period: "Monthly",
    consider_as_halfday: false,
    policy_halfday_type: "",
    for_weekly_off: false,
  });

  // --- UTILS ---
  const formatTimeForInput = (timeString) => {
    if (!timeString) return "00:00:00";
    if (typeof timeString === "string" && timeString.includes("T")) {
      return timeString.split("T")[1].split(".")[0];
    }
    return timeString;
  };

  const ensureSeconds = (t) => {
    if (!t) return "00:00:00";
    const parts = String(t).split(":");
    if (parts.length === 2) return `${t}:00`;
    return t;
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        start_date: initialData.start_date?.split("T")[0] || "",
        end_date: initialData.end_date?.split("T")[0] || "",
        start_time: formatTimeForInput(initialData.start_time),
        end_time: formatTimeForInput(initialData.end_time),
        delay: formatTimeForInput(initialData.delay),
        late: formatTimeForInput(initialData.late),
        half_day: formatTimeForInput(initialData.half_day),
        lunch_break_from: formatTimeForInput(initialData.lunch_break_from),
        lunch_break_to: formatTimeForInput(initialData.lunch_break_to),
        break_time_from: formatTimeForInput(initialData.break_time_from),
        break_time_to: formatTimeForInput(initialData.break_time_to),
        overtime_cap_limit: formatTimeForInput(initialData.overtime_cap_limit),
      });
    }
  }, [initialData]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "delay_action_type" && value !== "fine") {
        updated.delay_fine_amount = null;
        updated.delay_fine_source = null;
      }
      return updated;
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    const toastId = toast.loading("Processing update...");

    try {
      const {
        id,
        _id,
        created_at,
        updated_at,
        company,
        is_active,
        policy_name,
        for_weekly_off,
        consider_as_halfday,
        policy_halfday_type,
        ...changeableData
      } = formData;

      const payload = {
        ...changeableData,
        working_hours: parseFloat(formData.working_hours) || 0,
        delay_unpaid_count: parseInt(formData.delay_unpaid_count) || 0,
        late_unpaid_count: parseInt(formData.late_unpaid_count) || 0,
        over_time_pay: parseFloat(formData.over_time_pay) || 0.0,
        regularisation_limit: parseInt(formData.regularisation_limit) || 0,
        start_time: ensureSeconds(formData.start_time),
        end_time: ensureSeconds(formData.end_time),
        delay: ensureSeconds(formData.delay),
        late: ensureSeconds(formData.late),
        half_day: ensureSeconds(formData.half_day),
        lunch_break_from: ensureSeconds(formData.lunch_break_from),
        lunch_break_to: ensureSeconds(formData.lunch_break_to),
        break_time_from: ensureSeconds(formData.break_time_from),
        break_time_to: ensureSeconds(formData.break_time_to),
        overtime_cap_limit: ensureSeconds(formData.overtime_cap_limit),
      };

      const finalId = initialData.id || initialData._id;
      const response = await updatePresetTemplate(finalId, payload);

      // SUCCESS: Show toast and CLOSE tab
      toast.success(response?.data?.message || "Preset Updated Successfully!", {
        id: toastId,
      });
      onClose();
    } catch (error) {
      console.error("DEBUG - BACKEND ERROR:", error.response);

      // ERROR: Extract message
      const backendErrorMsg =
        error.response?.data?.data ||
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Update Failed (500)";

      // Show toast but DO NOT call onClose()
      toast.error(backendErrorMsg, {
        id: toastId,
        duration: 5000,
      });
    } finally {
      // Always stop the spinner so the user can fix the error and try again
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 bg-[#F4F6F8] border border-gray-100 rounded-xl text-[12px] focus:outline-none transition-all font-['Poppins']";
  const readOnlyClass =
    "w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-[12px] text-gray-500 cursor-not-allowed outline-none font-['Poppins']";
  const labelClass =
    "text-[12px] font-medium text-gray-700 mb-1.5 block font-['Poppins']";
  const iconWrapper =
    "absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none";

  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 space-y-6 overflow-y-auto font-['Poppins'] max-h-[90vh]">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-2">
          <Calendar size={20} className="text-gray-900" />
          <h2 className="text-[16px] font-semibold text-gray-900">
            Update Attendance Preset
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={20} className="text-gray-400" />
        </button>
      </div>

      <div className="flex gap-6">
        {/* LEFT COLUMN */}
        <div className="w-[32%] space-y-4 border-r pr-6 border-gray-50">
          <div>
            <label className={labelClass}>Template Name (Read Only)</label>
            <input
              type="text"
              className={readOnlyClass}
              value={formData.policy_name}
              readOnly
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Policy Code</label>
              <input
                type="text"
                className={inputClass}
                value={formData.policy_code}
                onChange={(e) =>
                  handleInputChange("policy_code", e.target.value)
                }
              />
            </div>
            <div>
              <label className={labelClass}>Color</label>
              <ColorPicker
                value={formData.policy_colour}
                onChange={(c) => handleInputChange("policy_colour", c)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Work From Home</label>
              <select
                className={inputClass}
                value={formData.work_from_home}
                onChange={(e) =>
                  handleInputChange("work_from_home", e.target.value === "true")
                }
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Over Time Benefit</label>
              <select
                className={inputClass}
                value={formData.over_time_benefit}
                onChange={(e) =>
                  handleInputChange(
                    "over_time_benefit",
                    e.target.value === "true",
                  )
                }
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Reg. Limit</label>
              <input
                type="number"
                className={inputClass}
                value={formData.regularisation_limit}
                onChange={(e) =>
                  handleInputChange("regularisation_limit", e.target.value)
                }
              />
            </div>
            <div>
              <label className={labelClass}>Period</label>
              <select
                className={inputClass}
                value={formData.regularisation_type}
                onChange={(e) =>
                  handleInputChange("regularisation_type", e.target.value)
                }
              >
                <option value="Monthly">Monthly</option>
                <option value="Weekly">Weekly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className={labelClass}>Effective From</label>
              <input
                type="date"
                className={inputClass}
                value={formData.start_date}
                onChange={(e) =>
                  handleInputChange("start_date", e.target.value)
                }
              />
            </div>
            <div>
              <label className={labelClass}>Effective To</label>
              <input
                type="date"
                className={inputClass}
                value={formData.end_date}
                onChange={(e) => handleInputChange("end_date", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="w-[68%] space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm grid grid-cols-2 gap-x-10 gap-y-4">
            {[
              { label: "Check in Time", field: "start_time" },
              { label: "Check out Time", field: "end_time" },
              { label: "Lunch From", field: "lunch_break_from" },
              { label: "Lunch To", field: "lunch_break_to" },
              { label: "Short Break From", field: "break_time_from" },
              { label: "Short Break To", field: "break_time_to" },
              { label: "Half Day Start", field: "half_day" },
              { label: "Working Hours", field: "working_hours" },
              { label: "Late Limit", field: "late" },
              { label: "Delay Limit", field: "delay" },
            ].map((item, idx) => (
              <div key={idx}>
                <label className={labelClass}>{item.label}</label>
                <div className="relative">
                  <input
                    type="text"
                    className={inputClass}
                    value={formData[item.field] || ""}
                    onChange={(e) =>
                      handleInputChange(item.field, e.target.value)
                    }
                  />
                  <Clock className={iconWrapper} size={14} />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#FFF6E9] border border-[#FDE3C3] rounded-2xl p-5 space-y-4">
              <span className="text-[13px] font-semibold text-orange-800">
                Delay Logic
              </span>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  className="w-20 bg-white h-10 rounded-xl px-3 text-[12px] border-none shadow-sm"
                  value={formData.delay_unpaid_count}
                  onChange={(e) =>
                    handleInputChange("delay_unpaid_count", e.target.value)
                  }
                />
                <select
                  className="flex-1 bg-white h-10 rounded-xl px-3 text-[12px] border-none shadow-sm"
                  value={formData.delay_action_type}
                  onChange={(e) =>
                    handleInputChange("delay_action_type", e.target.value)
                  }
                >
                  <option value="">Select</option>
                  <option value="day">Day Cut</option>
                  <option value="fine">Fine</option>
                </select>
              </div>
            </div>

            <div className="bg-[#FFEBF3] border border-[#FFD2E5] rounded-2xl p-5 space-y-4">
              <span className="text-[13px] font-semibold text-pink-800">
                Late Logic
              </span>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  className="w-20 bg-white h-10 rounded-xl px-3 text-[12px] border-none shadow-sm"
                  value={formData.late_unpaid_count}
                  onChange={(e) =>
                    handleInputChange("late_unpaid_count", e.target.value)
                  }
                />
                <select
                  className="flex-1 bg-white h-10 rounded-xl px-3 text-[12px] border-none shadow-sm"
                  value={formData.late_action_type}
                  onChange={(e) =>
                    handleInputChange("late_action_type", e.target.value)
                  }
                >
                  <option value="">Select</option>
                  <option value="day">Day Cut</option>
                  <option value="fine">Fine</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          onClick={onClose}
          className="px-10 py-2.5 border border-gray-300 rounded-xl text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-12 py-2.5 bg-black text-white rounded-xl text-[13px] font-medium hover:bg-zinc-800 disabled:opacity-50 transition-all shadow-lg active:scale-95"
        >
          {loading ? "Saving..." : "Update Preset"}
        </button>
      </div>
    </div>
  );
};

export default EditAttendancePreset;
