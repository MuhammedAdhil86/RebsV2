import { useState, useRef, useEffect } from "react";
import { Calendar, Clock, ChevronDown } from "lucide-react";
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
// Accepts: "HH:mm", "HH:mm:ss", "h:mm AM/PM", "h:mm:ss AM/PM",
// and ISO strings like "0000-01-01T09:30:00Z".
// Empty value -> "00:00:00" (same behaviour as before).
const to24Hour = (input) => {
  if (!input) return "00:00:00";

  let str = String(input).trim();

  // ISO datetime -> take the time part
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

// Builds the exact error text from the API response: "message: data"
const getApiErrorText = (error) => {
  const res = error?.response?.data;
  if (!res) return error?.message || "Update Failed";
  const detail =
    typeof res.data === "string"
      ? res.data
      : res.data
        ? JSON.stringify(res.data)
        : "";
  const msg = res.message || res.error || "";
  return [msg, detail].filter(Boolean).join(": ") || "Update Failed";
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
  overtime_cap_limit: "",
  overtime_cap_period: "Monthly",
  consider_as_halfday: false,
  policy_halfday_type: "",
  for_weekly_off: false,
};

// Form values built from the policy loaded from the server (24h times, plain dates)
// Backend may return the cut as a number (0.5 / 1); the form uses Half/Full Day
const CUT_LABELS = { "0.5": "Half Day", "1": "Full Day" };
const toCutLabel = (v) =>
  v === null || v === undefined || v === ""
    ? ""
    : (CUT_LABELS[String(v)] ?? String(v));

const buildFormFromInitial = (data) => {
  const form = {};
  Object.keys(INITIAL_FORM).forEach((key) => {
    form[key] = data[key] ?? INITIAL_FORM[key];
  });
  TIME_FIELDS.forEach((f) => {
    form[f] = data[f] ? (to24Hour(data[f]) ?? "") : "";
  });
  form.delay_cut = toCutLabel(data.delay_cut);
  form.late_cut = toCutLabel(data.late_cut);
  // Keep these body fields when the backend sends them (same body as create)
  if (data.is_flexible !== undefined) form.is_flexible = data.is_flexible;
  if (data.weekly_expected_hours !== undefined)
    form.weekly_expected_hours = data.weekly_expected_hours;
  form.start_date = data.start_date ? String(data.start_date).split("T")[0] : "";
  form.end_date = data.end_date ? String(data.end_date).split("T")[0] : "";
  form.working_hours = data.working_hours ?? "";
  return form;
};

const FlexibleUpdateAttendancePolicyTab = ({ initialData, onClose }) => {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [apiError, setApiError] = useState("");
  const [hydrated, setHydrated] = useState(false);

  // One draft per policy, so editing different policies never mixes data
  const policyId = initialData?.id || initialData?._id;
  const storageKey = `attendance_policy_update_draft_${policyId}`;

  // Load: saved draft first, otherwise the data from the server
  useEffect(() => {
    if (!initialData) return;
    const base = buildFormFromInitial(initialData);
    let next = base;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) next = { ...base, ...JSON.parse(saved) };
    } catch (e) {
      /* corrupted or blocked - use server data */
    }
    setFormData(next);
    setHydrated(true);
  }, [initialData, storageKey]);

  // Auto-save draft on every change so a refresh never loses data
  useEffect(() => {
    if (!hydrated || !initialData) return;
    try {
      const current = JSON.stringify(formData);
      if (current === JSON.stringify(buildFormFromInitial(initialData))) {
        localStorage.removeItem(storageKey); // unchanged -> keep storage empty
      } else {
        localStorage.setItem(storageKey, current);
      }
    } catch (e) {
      /* storage full or blocked - ignore */
    }
  }, [formData, hydrated, initialData, storageKey]);

  const clearDraft = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {
      /* ignore */
    }
  };

  const handleClear = () => {
    clearDraft();
    if (initialData) setFormData(buildFormFromInitial(initialData));
    setApiError("");
    toast.success("Form cleared");
  };

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
      return updated;
    });
  };

  const handleSubmit = async () => {
    setApiError("");
    if (formData.consider_as_halfday && !formData.policy_halfday_type) {
      toast.error("Please select a Policy Half Day Type");
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

    const {
      id,
      _id,
      created_at,
      updated_at,
      company,
      is_active,
      ...changeableData
    } = formData;

    const payload = {
      ...changeableData,
      ...times, // all time fields, strict 24h HH:mm:ss
      working_hours: Number(formData.working_hours) || 0,
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

    // Same rule as the create form: backend rejects policy_halfday_type
    // when consider_as_halfday is false
    if (!formData.consider_as_halfday) {
      delete payload.policy_halfday_type;
    }

    console.log("Payload sent to backend:", payload);

    try {
      // NOTE: change `updatePolicy` if your service uses a different name
      const response = await attendancePolicyService.updatePolicy(
        policyId,
        payload,
      );
      if (response.status === 200 || response.status === 201) {
        toast.success("Policy Updated Successfully!");
        clearDraft();
        onClose();
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
          {/* Clicking ONLY this div triggers the picker */}
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
          {/* Clicking ONLY this div triggers the picker */}
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
          <Calendar size={20} className="text-gray-900" />
          <h2 className="text-[16px] text-gray-900 font-semibold">
            Update Attendance Policy
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
                placeholder="RP"
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
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <ChevronDown size={14} />
                </div>
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
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DateInput label="Effective From" field="start_date" />
            <DateInput label="Effective To" field="end_date" />
          </div>
        </div>

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
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <ChevronDown size={14} />
                  </div>
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
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <ChevronDown size={14} />
                  </div>
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
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                      <ChevronDown size={14} />
                    </div>
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
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <ChevronDown size={14} />
                  </div>
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
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <ChevronDown size={14} />
                  </div>
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
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                      <ChevronDown size={14} />
                    </div>
                  </div>
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
          className="px-10 py-2.5 bg-black text-white rounded-xl text-[13px] font-medium hover:bg-zinc-800 transition-all shadow-lg"
        >
          Update
        </button>
      </div>
    </div>
  );
};

export default FlexibleUpdateAttendancePolicyTab;