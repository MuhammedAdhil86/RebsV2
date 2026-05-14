import React, { useState, useRef, useEffect } from "react";
import { Calendar, Clock, ChevronDown } from "lucide-react";
import attendancePolicyService from "../service/attendancepolicyService";
import ColorPicker from "./colorpicker";
import toast from "react-hot-toast";

const UpdateAttendancePolicyTab = ({ initialData, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    policy_name: "",
    policy_code: "",
    policy_colour: "#4CAF50",
    start_time: "",
    end_time: "",
    working_hours: "",
    delay: "",
    delay_unpaid_count: "",
    delay_cut: "",
    late: "",
    late_unpaid_count: "",
    late_cut: "",
    delay_action_type: "",
    delay_fine_amount: "",
    delay_fine_source: "",
    late_action_type: "",
    late_fine_amount: "",
    late_fine_source: "",
    half_day: "",
    break_time_from: "",
    break_time_to: "",
    lunch_break_from: "",
    lunch_break_to: "",
    work_from_home: false,
    over_time_benefit: false,
    over_time_pay: "",
    regularisation_limit: "",
    regularisation_type: "Monthly",
    start_date: "",
    end_date: "",
    overtime_cap_limit: "",
    overtime_cap_period: "Monthly",
    consider_as_halfday: false,
    policy_halfday_type: "",
    for_weekly_off: false,
  });

  // LOGIC: Format incoming time strings (HH:mm:ss)
  const formatTimeForInput = (timeString) => {
    if (!timeString) return "";
    if (typeof timeString === "string" && timeString.includes("T")) {
      return timeString.split("T")[1].split("Z")[0].substring(0, 8);
    }
    return timeString;
  };

  // LOGIC: Initial Data Population
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
        over_time_pay: initialData.over_time_pay || "",
      });
    }
  }, [initialData]);

  // LOGIC: Auto-calculate working hours
  useEffect(() => {
    if (formData.start_time && formData.end_time) {
      const [sH, sM] = formData.start_time.split(":").map(Number);
      const [eH, eM] = formData.end_time.split(":").map(Number);
      const start = new Date(0, 0, 0, sH, sM || 0);
      const end = new Date(0, 0, 0, eH, eM || 0);
      let diff = end.getTime() - start.getTime();
      if (diff < 0) diff += 24 * 60 * 60 * 1000;
      const hours = (diff / (1000 * 60 * 60)).toFixed(2);
      setFormData((prev) => ({ ...prev, working_hours: hours }));
    }
  }, [formData.start_time, formData.end_time]);

  const handleInputChange = (field, value) => {
    if (
      ["delay_fine_amount", "late_fine_amount", "over_time_pay"].includes(field)
    ) {
      if (value !== "" && parseFloat(value) < 0) return;
    }
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "consider_as_halfday" && value === false) {
        updated.policy_halfday_type = "";
      }
      if (field === "over_time_benefit" && value === false) {
        updated.over_time_pay = "";
      }
      return updated;
    });
  };

  const formatTimeToHMS = (timeStr) => {
    if (!timeStr) return "00:00:00";
    const parts = timeStr.split(":");
    return parts.length === 2 ? `${timeStr}:00` : timeStr;
  };

  const handleSubmit = async () => {
    if (formData.consider_as_halfday && !formData.policy_halfday_type) {
      toast.error("Please select a Policy Half Day Type");
      return;
    }

    setLoading(true);
    const policyId = initialData?.id || initialData?._id;

    const payload = {
      ...formData,
      start_time: formatTimeToHMS(formData.start_time),
      end_time: formatTimeToHMS(formData.end_time),
      delay: formatTimeToHMS(formData.delay),
      late: formatTimeToHMS(formData.late),
      working_hours: Number(formData.working_hours) || 0,
      over_time_pay: parseFloat(formData.over_time_pay) || 0,
    };

    try {
      const response = await attendancePolicyService.updatePolicy(
        policyId,
        payload,
      );
      if (response.status === 200 || response.status === 201) {
        toast.success("Policy Updated Successfully!");
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Internal Server Error");
    } finally {
      setLoading(false);
    }
  };

  // UI Components (Shared Styles)
  const inputClass =
    "w-full px-4 py-2.5 bg-[#F4F6F8] border border-gray-100 rounded-xl text-[12px] font-normal focus:outline-none transition-all appearance-none custom-input-hide-icon";
  const labelClass =
    "text-[12px] font-medium text-gray-700 mb-1.5 block font-['Poppins']";
  const iconWrapper =
    "absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-black transition-colors";

  const ToggleButton = ({ label, value, field }) => (
    <div className="flex flex-col gap-1.5">
      <label className={labelClass}>{label}</label>
      <button
        type="button"
        onClick={() => handleInputChange(field, !value)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${value ? "bg-black" : "bg-gray-300"}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${value ? "translate-x-6" : "translate-x-1"}`}
        />
      </button>
    </div>
  );

  const TimeInput = ({ label, field, placeholder }) => {
    const inputRef = useRef(null);
    return (
      <div>
        <label className={labelClass}>{label}</label>
        <div className="relative group">
          <input
            ref={inputRef}
            type="time"
            step="1"
            placeholder={placeholder}
            value={formData[field]}
            className={`${inputClass} pr-10`}
            onChange={(e) => handleInputChange(field, e.target.value)}
          />
          <div
            className={iconWrapper}
            onClick={() => inputRef.current?.showPicker()}
          >
            <Clock size={14} />
          </div>
        </div>
      </div>
    );
  };

  const DateInput = ({ label, field }) => {
    const inputRef = useRef(null);
    return (
      <div>
        <label className={labelClass}>{label}</label>
        <div className="relative group">
          <input
            ref={inputRef}
            type="date"
            value={formData[field]}
            className={`${inputClass} pr-10`}
            onChange={(e) => handleInputChange(field, e.target.value)}
          />
          <div
            className={iconWrapper}
            onClick={() => inputRef.current?.showPicker()}
          >
            <Calendar size={14} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 space-y-6 overflow-y-auto font-['Poppins']">
      <style>{`.custom-input-hide-icon::-webkit-calendar-picker-indicator { display: none; }`}</style>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={20} className="text-gray-900" />
          <h2 className="text-[16px] text-gray-900 font-semibold">
            Update Attendance Policy
          </h2>
        </div>
      </div>

      <div className="flex gap-6">
        {/* LEFT COLUMN */}
        <div className="w-[32%] space-y-4">
          <div>
            <label className={labelClass}>Policy Name</label>
            <input
              type="text"
              className={inputClass}
              value={formData.policy_name}
              onChange={(e) => handleInputChange("policy_name", e.target.value)}
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
              <label className={labelClass}>Policy Color</label>
              <ColorPicker
                value={formData.policy_colour}
                onChange={(color) => handleInputChange("policy_colour", color)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ToggleButton
              label="Work From Home"
              value={formData.work_from_home}
              field="work_from_home"
            />
            <ToggleButton
              label="Over Time Benefit"
              value={formData.over_time_benefit}
              field="over_time_benefit"
            />
          </div>

          {/* EXACT CLONE: Conditional OverTime Pay Input */}
          {formData.over_time_benefit && (
            <div className="animate-in fade-in slide-in-from-top-1">
              <label className={`${labelClass} text-orange-600`}>
                OverTime Pay (per hour) *
              </label>
              <input
                type="number"
                placeholder="0.00"
                className={`${inputClass} border-orange-100 bg-orange-50/30 font-semibold text-orange-700`}
                value={formData.over_time_pay}
                onChange={(e) =>
                  handleInputChange("over_time_pay", e.target.value)
                }
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <ToggleButton
              label="Consider Half Day"
              value={formData.consider_as_halfday}
              field="consider_as_halfday"
            />
            <ToggleButton
              label="For Weekly Off"
              value={formData.for_weekly_off}
              field="for_weekly_off"
            />
          </div>

          {formData.consider_as_halfday && (
            <div className="animate-in fade-in slide-in-from-top-1">
              <label className={`${labelClass} text-blue-600`}>
                Half Day Type *
              </label>
              <div className="relative">
                <select
                  className={`${inputClass} border-blue-100 bg-blue-50/30 pr-10 appearance-none`}
                  value={formData.policy_halfday_type}
                  onChange={(e) =>
                    handleInputChange("policy_halfday_type", e.target.value)
                  }
                >
                  <option value="">Select Half</option>
                  <option value="First Half">First Half</option>
                  <option value="Second Half">Second Half</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Regularization Limit</label>
              <input
                type="number"
                className={inputClass}
                value={formData.regularisation_limit}
                onChange={(e) =>
                  handleInputChange("regularisation_limit", e.target.value)
                }
              />
            </div>
            <div className="relative">
              <label className={labelClass}>Period</label>
              <select
                className={`${inputClass} appearance-none`}
                value={formData.regularisation_type}
                onChange={(e) =>
                  handleInputChange("regularisation_type", e.target.value)
                }
              >
                <option value="Monthly">Monthly</option>
                <option value="Weekly">Weekly</option>
              </select>
              <ChevronDown
                className="absolute right-4 top-[38px] text-gray-400 pointer-events-none"
                size={14}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TimeInput label="OverTime Cap Limit" field="overtime_cap_limit" />
            <div className="relative">
              <label className={labelClass}>Period</label>
              <select
                className={`${inputClass} appearance-none`}
                value={formData.overtime_cap_period}
                onChange={(e) =>
                  handleInputChange("overtime_cap_period", e.target.value)
                }
              >
                <option value="Monthly">Monthly</option>
                <option value="Weekly">Weekly</option>
              </select>
              <ChevronDown
                className="absolute right-4 top-[38px] text-gray-400 pointer-events-none"
                size={14}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DateInput label="Effective From" field="start_date" />
            <DateInput label="Effective To" field="end_date" />
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="w-[68%] space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm grid grid-cols-2 gap-x-10 gap-y-4">
            <TimeInput
              label="Check in Time"
              field="start_time"
              placeholder="09:30:00"
            />
            <TimeInput
              label="Check out Time"
              field="end_time"
              placeholder="18:30:00"
            />
            <TimeInput label="Lunch Break From" field="lunch_break_from" />
            <TimeInput label="Lunch Break To" field="lunch_break_to" />
            <TimeInput label="Short Break From" field="break_time_from" />
            <TimeInput label="Short Break To" field="break_time_to" />
            <TimeInput label="Half Day Start Time" field="half_day" />
            <div>
              <label className={labelClass}>Total Working Hours (Auto)</label>
              <input
                type="text"
                value={formData.working_hours}
                className={`${inputClass} bg-blue-50/50 border-blue-100 font-bold text-blue-700`}
                readOnly
              />
            </div>
            <TimeInput label="Late Limit (Time)" field="late" />
            <TimeInput label="Delay Limit (Time)" field="delay" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Delay Section */}
            <div className="bg-[#FFF6E9] border border-[#FDE3C3] rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center text-gray-800 text-[13px] font-medium">
                Consider Delay{" "}
                <span className="text-gray-500 font-normal">Compensates</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  className="w-20 bg-white h-10 rounded-xl px-3 text-[12px] shadow-sm border-none focus:outline-none"
                  value={formData.delay_unpaid_count}
                  onChange={(e) =>
                    handleInputChange("delay_unpaid_count", e.target.value)
                  }
                />
                <span className="text-[12px] font-medium text-gray-600">
                  as
                </span>
                <div className="relative flex-1">
                  <select
                    className="w-full bg-white h-10 rounded-xl pl-3 pr-10 text-[12px] shadow-sm border-none appearance-none focus:outline-none"
                    value={formData.delay_action_type}
                    onChange={(e) =>
                      handleInputChange("delay_action_type", e.target.value)
                    }
                  >
                    <option value="">Select</option>
                    <option value="day">Day</option>
                    <option value="fine">Fine</option>
                    <option value="email">Email</option>
                  </select>
                  <ChevronDown
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    size={14}
                  />
                </div>
              </div>
              {formData.delay_action_type === "day" && (
                <div className="relative animate-in slide-in-from-top-1">
                  <select
                    className={`${inputClass} bg-white pr-10 border-none shadow-sm appearance-none`}
                    value={formData.delay_cut}
                    onChange={(e) =>
                      handleInputChange("delay_cut", e.target.value)
                    }
                  >
                    <option value="">Select Cut</option>
                    <option value="Half Day">Half Day</option>
                    <option value="Full Day">Full Day</option>
                  </select>
                  <ChevronDown
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    size={14}
                  />
                </div>
              )}
            </div>

            {/* Late Section */}
            <div className="bg-[#FFEBF3] border border-[#FFD2E5] rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center text-gray-800 text-[13px] font-medium">
                Consider Late{" "}
                <span className="text-gray-500 font-normal">Compensates</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  className="w-20 bg-white h-10 rounded-xl px-3 text-[12px] shadow-sm border-none focus:outline-none"
                  value={formData.late_unpaid_count}
                  onChange={(e) =>
                    handleInputChange("late_unpaid_count", e.target.value)
                  }
                />
                <span className="text-[12px] font-medium text-gray-600">
                  as
                </span>
                <div className="relative flex-1">
                  <select
                    className="w-full bg-white h-10 rounded-xl pl-3 pr-10 text-[12px] shadow-sm border-none appearance-none focus:outline-none"
                    value={formData.late_action_type}
                    onChange={(e) =>
                      handleInputChange("late_action_type", e.target.value)
                    }
                  >
                    <option value="">Select</option>
                    <option value="day">Day</option>
                    <option value="fine">Fine</option>
                    <option value="email">Email</option>
                  </select>
                  <ChevronDown
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    size={14}
                  />
                </div>
              </div>
              {formData.late_action_type === "day" && (
                <div className="relative animate-in slide-in-from-top-1">
                  <select
                    className={`${inputClass} bg-white pr-10 border-none shadow-sm appearance-none`}
                    value={formData.late_cut}
                    onChange={(e) =>
                      handleInputChange("late_cut", e.target.value)
                    }
                  >
                    <option value="">Select Cut</option>
                    <option value="Half Day">Half Day</option>
                    <option value="Full Day">Full Day</option>
                  </select>
                  <ChevronDown
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    size={14}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={onClose}
          className="px-10 py-2.5 border border-gray-300 rounded-xl text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-10 py-2.5 bg-black text-white rounded-xl text-[13px] font-medium hover:bg-zinc-800 disabled:opacity-50 transition-all shadow-lg"
        >
          {loading ? "Updating..." : "Update"}
        </button>
      </div>
    </div>
  );
};

export default UpdateAttendancePolicyTab;
