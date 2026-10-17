import { useState, useRef, useEffect } from "react";
import { Clock, ChevronDown } from "lucide-react";
import { Icon } from "@iconify/react";
import attendancePolicyService from "../service/attendancepolicyService";
import ColorPicker from "./colorpicker";
import toast, { Toaster } from "react-hot-toast";

// Every field that is sent to the backend as a time value.
const TIME_FIELDS = [
  "start_time",
  "end_time",
  "delay",
  "late",
  "half_day",
  "break_time_from",
  "break_time_to",
  "lunch_break_from",
  "lunch_break_to",
  "overtime_cap_limit",
];

// Always returns strict 24-hour "HH:mm:ss", or null if the value is invalid.
// Empty value -> "00:00:00".
const to24Hour = (input) => {
  if (!input) return "00:00:00";

  let str = String(input).trim();

  if (str.includes("T")) str = str.split("T")[1];
  str = str.replace(/Z$|[+-]\d{2}:?\d{2}$/, "").trim();

  const match = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const second = parseInt(match[3] || "0", 10);
  const meridiem = match[4]?.toUpperCase();

  if (meridiem) {
    if (hour < 1 || hour > 12) return null;
    if (meridiem === "PM" && hour !== 12) hour += 12;
    if (meridiem === "AM" && hour === 12) hour = 0;
  }

  if (hour > 23 || minute > 59 || second > 59) return null;

  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(hour)}:${pad(minute)}:${pad(second)}`;
};

// Today's date as "YYYY-MM-DD" in the user's LOCAL timezone (not UTC),
// used as the minimum selectable date so past dates can never be chosen.
const getToday = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Builds the exact error text from the API response: "message: data"
const getApiErrorText = (error) => {
  const res = error?.response?.data;
  if (!res) return error?.message || "Create Failed";
  const detail =
    typeof res.data === "string"
      ? res.data
      : res.data
        ? JSON.stringify(res.data)
        : "";
  const msg = res.message || res.error || "";
  return [msg, detail].filter(Boolean).join(": ") || "Create Failed";
};

const INITIAL_FORM = {
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
  weekly_expected_hours: "",
  overtime_cap_limit: "",
  overtime_cap_period: "Monthly",
  consider_as_halfday: false,
  policy_halfday_type: "",
  for_weekly_off: false,
};

// One draft for the create form
const STORAGE_KEY = "attendance_policy_create_draft";

const CreateAttendancePolicyTab = ({ onClose, onCreated }) => {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [apiError, setApiError] = useState("");
  const [hydrated, setHydrated] = useState(false);

  // Load saved draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const draft = { ...INITIAL_FORM, ...JSON.parse(saved) };
        // A draft saved on an earlier day may hold dates that are now in the past
        const today = getToday();
        if (draft.start_date && draft.start_date < today) draft.start_date = "";
        if (draft.end_date && draft.end_date < today) draft.end_date = "";
        setFormData(draft);
      }
    } catch (e) {
      /* corrupted or blocked - start empty */
    }
    setHydrated(true);
  }, []);

  // Auto-save draft on every change so a refresh never loses data
  useEffect(() => {
    if (!hydrated) return;
    try {
      const current = JSON.stringify(formData);
      if (current === JSON.stringify(INITIAL_FORM)) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, current);
      }
    } catch (e) {
      /* storage full or blocked - ignore */
    }
  }, [formData, hydrated]);

  const clearDraft = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      /* ignore */
    }
  };

  const handleClear = () => {
    clearDraft();
    setFormData(INITIAL_FORM);
    setApiError("");
    toast.success("Form cleared");
  };

  // Auto-calculate working hours from check in / check out
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
      [
        "delay_fine_amount",
        "late_fine_amount",
        "over_time_pay",
        "weekly_expected_hours",
      ].includes(field)
    ) {
      if (value !== "" && parseFloat(value) < 0) return;
    }
    // Never allow past dates (covers typing a date by hand)
    if (["start_date", "end_date"].includes(field)) {
      if (value && value < getToday()) {
        toast.error("Past dates are not allowed");
        return;
      }
    }
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // End date can never be before the start date
      if (
        field === "start_date" &&
        value &&
        prev.end_date &&
        prev.end_date < value
      ) {
        updated.end_date = "";
      }
      if (field === "consider_as_halfday" && value === false) {
        updated.policy_halfday_type = "";
      }
      return updated;
    });
  };

  const handleSubmit = async () => {
    setApiError("");

    if (!formData.policy_name.trim()) {
      toast.error("Please enter a Policy Name");
      return;
    }
    if (!formData.policy_code.trim()) {
      toast.error("Please enter a Policy Code");
      return;
    }
    if (formData.consider_as_halfday && !formData.policy_halfday_type) {
      toast.error("Please select a Policy Half Day Type");
      return;
    }

    const today = getToday();
    if (!formData.start_date || !formData.end_date) {
      toast.error("Please select Effective From and Effective To dates");
      return;
    }
    if (formData.start_date < today || formData.end_date < today) {
      toast.error("Past dates are not allowed");
      return;
    }
    if (formData.end_date < formData.start_date) {
      toast.error("Effective To cannot be before Effective From");
      return;
    }

    // Normalise + validate every time field to strict 24h HH:mm:ss
    const times = {};
    for (const field of TIME_FIELDS) {
      const normalized = to24Hour(formData[field]);
      if (normalized === null) {
        toast.error(`Invalid time format for ${field.replace(/_/g, " ")}`);
        return;
      }
      times[field] = normalized;
    }

    const getSafeSource = (type, source) => {
      if (type !== "fine") return null;
      const s = source?.toLowerCase();
      return s === "payroll" || s === "hand" ? s : "payroll";
    };

    const payload = {
      ...formData,
      ...times, // all time fields, strict 24h HH:mm:ss
      working_hours: Number(formData.working_hours) || 0,
      weekly_expected_hours: Number(formData.weekly_expected_hours) || 0,
      delay_unpaid_count: Number(formData.delay_unpaid_count) || 0,
      late_unpaid_count: Number(formData.late_unpaid_count) || 0,
      over_time_pay: parseFloat(formData.over_time_pay) || 0.0,
      regularisation_limit: Number(formData.regularisation_limit) || 0,
      delay_fine_amount:
        formData.delay_action_type === "fine"
          ? Number(formData.delay_fine_amount)
          : 0,
      late_fine_amount:
        formData.late_action_type === "fine"
          ? Number(formData.late_fine_amount)
          : 0,
      delay_fine_source: getSafeSource(
        formData.delay_action_type,
        formData.delay_fine_source,
      ),
      late_fine_source: getSafeSource(
        formData.late_action_type,
        formData.late_fine_source,
      ),
    };

    // Backend rejects policy_halfday_type when consider_as_halfday is false
    if (!formData.consider_as_halfday) {
      delete payload.policy_halfday_type;
    }

    console.log("Payload sent to backend:", payload);

    try {
      // NOTE: change `createPolicy` if your service uses a different name
      const response = await attendancePolicyService.createPolicy(payload);
      if (response.status === 200 || response.status === 201) {
        toast.success("Policy Created Successfully!");
        clearDraft();
        setFormData(INITIAL_FORM);
        onCreated?.(response.data);
        onClose?.();
      }
    } catch (error) {
      const errorText = getApiErrorText(error);
      setApiError(errorText);
      toast.error(errorText, { duration: 6000 });
    }
  };

  // Shared Styles
  const inputClass =
    "w-full px-4 py-2.5 bg-[#F4F6F8] border border-gray-100 rounded-xl text-[12px] font-normal focus:outline-none transition-all appearance-none custom-input-hide-icon";
  const labelClass =
    "text-[12px] font-medium text-gray-700 mb-1.5 block font-['Poppins']";
  const iconWrapper =
    "absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-black transition-colors";
  const calendarIconClass =
    "absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-800 hover:text-black transition-colors";

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

  const DateInput = ({ label, field, min }) => {
    const inputRef = useRef(null);
    return (
      <div>
        <label className={labelClass}>{label}</label>
        <div className="relative group">
          <input
            ref={inputRef}
            type="date"
            min={min || getToday()}
            value={formData[field]}
            className={`${inputClass} pr-10`}
            onChange={(e) => handleInputChange(field, e.target.value)}
          />
          <div
            className={calendarIconClass}
            onClick={() => inputRef.current?.showPicker()}
          >
            <Icon icon="solar:calendar-outline" className="w-4 h-4" />
          </div>
        </div>
      </div>
    );
  };

  const SelectArrow = () => (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
      <ChevronDown size={14} />
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 space-y-6 overflow-y-auto font-['Poppins']">
      <style>{`
        /* Hides native calendar/clock icons in Chrome/Safari/Edge */
        .custom-input-hide-icon::-webkit-calendar-picker-indicator {
          display: none;
          -webkit-appearance: none;
        }
      `}</style>

      <Toaster position="top-right" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon
            icon="solar:calendar-outline"
            className="w-4 h-4 text-gray-800 hover:text-black"
          />
          <h2 className="text-[16px] text-gray-900 font-semibold">
            Create Attendance Policy
          </h2>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="px-3 py-1 border border-gray-300 rounded-lg text-[11px] font-medium text-gray-600 hover:bg-gray-50 hover:text-black transition-colors"
        >
          Clear
        </button>
      </div>

      {apiError && (
        <div className="flex items-start justify-between gap-3 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-[12px] font-medium">
          <span>{apiError}</span>
          <button
            type="button"
            onClick={() => setApiError("")}
            className="text-red-400 hover:text-red-700 text-[14px] leading-none"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex gap-6">
        <div className="w-[32%] space-y-4">
          <div>
            <label className={labelClass}>Policy Name</label>
            <input
              type="text"
              placeholder="Enter Policy Name"
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
                placeholder="GEN001"
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

          {formData.over_time_benefit && (
            <div>
              <label className={labelClass}>Over Time Pay</label>
              <input
                type="number"
                placeholder="Amount"
                className={inputClass}
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
                <SelectArrow />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Regularization Limit</label>
              <input
                type="number"
                placeholder="count"
                className={inputClass}
                value={formData.regularisation_limit}
                onChange={(e) =>
                  handleInputChange("regularisation_limit", e.target.value)
                }
              />
            </div>
            <div>
              <label className={labelClass}>Period</label>
              <div className="relative">
                <select
                  className={`${inputClass} pr-10 appearance-none`}
                  value={formData.regularisation_type}
                  onChange={(e) =>
                    handleInputChange("regularisation_type", e.target.value)
                  }
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Weekly">Weekly</option>
                </select>
                <SelectArrow />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TimeInput label="OverTime Cap Limit" field="overtime_cap_limit" />
            <div>
              <label className={labelClass}>Period</label>
              <div className="relative">
                <select
                  className={`${inputClass} pr-10 appearance-none`}
                  value={formData.overtime_cap_period}
                  onChange={(e) =>
                    handleInputChange("overtime_cap_period", e.target.value)
                  }
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Weekly">Weekly</option>
                </select>
                <SelectArrow />
              </div>
            </div>
          </div>

          <div>
            <label className={labelClass}>Weekly Expected Hours</label>
            <input
              type="number"
              placeholder="48"
              className={inputClass}
              value={formData.weekly_expected_hours}
              onChange={(e) =>
                handleInputChange("weekly_expected_hours", e.target.value)
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DateInput label="Effective From" field="start_date" />
            <DateInput
              label="Effective To"
              field="end_date"
              min={formData.start_date || getToday()}
            />
          </div>
        </div>

        <div className="w-[68%] space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm grid grid-cols-2 gap-x-10 gap-y-4">
            <TimeInput
              label="Check in Time"
              field="start_time"
              placeholder="09:00:00"
            />
            <TimeInput
              label="Check out Time"
              field="end_time"
              placeholder="18:00:00"
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
            <div className="bg-[#FFF6E9] border border-[#FDE3C3] rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center text-gray-800 text-[13px]">
                <span className="font-medium">Consider Delay</span>
                <span className="text-gray-500">Compensates</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  placeholder="Count"
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
                    className="w-full bg-white h-10 rounded-xl pl-3 pr-10 text-[12px] shadow-sm border-none appearance-none focus:outline-none cursor-pointer"
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
                  <SelectArrow />
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
                  <SelectArrow />
                </div>
              )}
              {formData.delay_action_type === "fine" && (
                <div className="flex gap-2 animate-in slide-in-from-top-1">
                  <input
                    type="number"
                    placeholder="Amt"
                    className="w-1/2 bg-white h-10 rounded-xl px-3 text-[12px] border-none shadow-sm focus:outline-none"
                    value={formData.delay_fine_amount}
                    onChange={(e) =>
                      handleInputChange("delay_fine_amount", e.target.value)
                    }
                  />
                  <div className="relative w-1/2">
                    <select
                      className="w-full bg-white h-10 rounded-xl pl-3 pr-10 text-[12px] border-none shadow-sm appearance-none focus:outline-none cursor-pointer"
                      value={formData.delay_fine_source}
                      onChange={(e) =>
                        handleInputChange("delay_fine_source", e.target.value)
                      }
                    >
                      <option value="">Source</option>
                      <option value="payroll">Payroll</option>
                      <option value="hand">Hand</option>
                    </select>
                    <SelectArrow />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-[#FFEBF3] border border-[#FFD2E5] rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center text-gray-800 text-[13px]">
                <span className="font-medium">Consider Late</span>
                <span className="text-gray-500">Compensates</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  placeholder="Count"
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
                    className="w-full bg-white h-10 rounded-xl pl-3 pr-10 text-[12px] shadow-sm border-none appearance-none focus:outline-none cursor-pointer"
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
                  <SelectArrow />
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
                  <SelectArrow />
                </div>
              )}
              {formData.late_action_type === "fine" && (
                <div className="flex gap-2 animate-in slide-in-from-top-1">
                  <input
                    type="number"
                    placeholder="Amt"
                    className="w-1/2 bg-white h-10 rounded-xl px-3 text-[12px] border-none shadow-sm focus:outline-none"
                    value={formData.late_fine_amount}
                    onChange={(e) =>
                      handleInputChange("late_fine_amount", e.target.value)
                    }
                  />
                  <div className="relative w-1/2">
                    <select
                      className="w-full bg-white h-10 rounded-xl pl-3 pr-10 text-[12px] border-none shadow-sm appearance-none focus:outline-none cursor-pointer"
                      value={formData.late_fine_source}
                      onChange={(e) =>
                        handleInputChange("late_fine_source", e.target.value)
                      }
                    >
                      <option value="">Source</option>
                      <option value="payroll">Payroll</option>
                      <option value="hand">Hand</option>
                    </select>
                    <SelectArrow />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="px-10 py-2.5 border border-gray-300 rounded-xl text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="px-10 py-2.5 bg-black text-white rounded-xl text-[13px] font-medium hover:bg-zinc-800 transition-all shadow-lg"
        >
          Create
        </button>
      </div>
    </div>
  );
};

export default CreateAttendancePolicyTab;
