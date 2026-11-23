import React, { useState, useEffect, useMemo, useRef } from "react";
import { X, Search, Loader2, ChevronDown, Check } from "lucide-react";
import { Icon } from "@iconify/react";
import { getAllStaff } from "../service/staffservice";
import useLeaveStore from "../store/useleaveStore";
import GlowButton from "../components/helpers/glowbutton";
import { showApiToast, showApiSuccess, showApiError } from "../utils/apiToast"; // adjust path if needed

/* ---------- date helpers (local time, no timezone shifts) ---------- */
const pad = (n) => String(n).padStart(2, "0");
const toKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const keyFromDate = (dt) =>
  toKey(dt.getFullYear(), dt.getMonth(), dt.getDate());
const parseKey = (k) => {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const formatKey = (k) =>
  parseKey(k).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

// Whole days between two "YYYY-MM-DD" keys, both days counted
const daysBetween = (fromKey, toKeyValue) =>
  Math.round((parseKey(toKeyValue) - parseKey(fromKey)) / 86400000) + 1;

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const emptyForm = {
  employeeUuid: "",
  leave_policy: "",
  reason: "",
  leave_date: [], // regular leave: [{ date, half_day, half_day_type }]
  event_date: "", // event leave
  from_date: "", // event leave
  to_date: "", // event leave
  cc: [],
};

// A policy is "event leave" when its accrual method is "event" (or flagged so)
const isEventPolicy = (policy) =>
  !!policy &&
  (policy.accrual_method === "event" || policy.event_based === true);

// Same label style as the Announcement modal
const labelClass = "block mb-1 font-medium text-gray-700";

/* ------------------------------------------------------------------ */
/* DateField: custom calendar icon, whole field opens the picker.      */
/* Text size / style follows the Announcement modal (12px, p-3,        */
/* rounded-2xl, gray-700 medium labels).                               */
/* ------------------------------------------------------------------ */
const DateField = ({ label, value, onChange, min, max, disabled = false }) => (
  <div>
    {label && <label className={labelClass}>{label}</label>}
    <div className="relative">
      <input
        type="date"
        min={min}
        max={max}
        disabled={disabled}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="relative w-full border p-3 pr-10 rounded-2xl disabled:bg-gray-50 disabled:text-gray-400
          [&::-webkit-calendar-picker-indicator]:absolute
          [&::-webkit-calendar-picker-indicator]:inset-0
          [&::-webkit-calendar-picker-indicator]:w-full
          [&::-webkit-calendar-picker-indicator]:h-full
          [&::-webkit-calendar-picker-indicator]:opacity-0
          [&::-webkit-calendar-picker-indicator]:cursor-pointer"
      />
      <Icon
        icon="solar:calendar-outline"
        className="w-4 h-4 text-gray-700 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
      />
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* SelectField: custom dropdown, same text style as the Announcement   */
/* modal.                                                              */
/* ------------------------------------------------------------------ */
const SelectField = ({
  label,
  options = [],
  value,
  onChange,
  placeholder = "Select...",
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => String(o.value) === String(value));

  return (
    <div className="relative" ref={ref}>
      {label && <label className={labelClass}>{label}</label>}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="w-full border p-3 rounded-2xl text-left bg-white flex justify-between items-center select-none disabled:bg-gray-50 disabled:text-gray-400"
      >
        <span
          className={`truncate pr-2 ${selected ? "text-gray-900" : "text-gray-400"}`}
        >
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-2xl shadow-xl z-20 max-h-[180px] overflow-y-auto p-2 space-y-1">
          {options.length === 0 && (
            <div className="p-3 text-center text-gray-400">No options</div>
          )}
          {options.map((o) => {
            const active = String(o.value) === String(value);
            return (
              <button
                type="button"
                key={o.value}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 p-2 rounded-lg text-left transition-colors hover:bg-gray-50 ${
                  active ? "bg-gray-50" : ""
                }`}
              >
                <span className="font-medium text-gray-800 truncate">
                  {o.label}
                </span>
                {active && <Check size={14} className="flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* PolicyDetails: "View details" button + animated accordion           */
/* ------------------------------------------------------------------ */
const yesNo = (v) => (v ? "Yes" : "No");
const orDash = (v) => (v === null || v === undefined || v === "" ? "-" : v);
const days = (v) =>
  v === null || v === undefined || v === ""
    ? "-"
    : `${Number(v)} day${Number(v) === 1 ? "" : "s"}`;
const cap = (s) =>
  s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : "-";

const DetailRow = ({ label, value }) => (
  <div className="flex justify-between gap-4 py-1.5 border-b border-gray-50 last:border-0">
    <span className="text-gray-500">{label}</span>
    <span className="font-medium text-gray-800 text-right">{value}</span>
  </div>
);

const DetailSection = ({ title, children }) => (
  <div>
    <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">
      {title}
    </p>
    <div>{children}</div>
  </div>
);

// Every key we render explicitly. Anything else the API sends shows up
// automatically in the "Other fields" section, so nothing is ever missed.
const KNOWN_POLICY_KEYS = [
  "accrual_method",
  "booked_days",
  "branch",
  "can_apply",
  "can_apply_reason",
  "code",
  "color",
  "employment_type",
  "event_based",
  "events_taken",
  "final_balance",
  "has_employment_setting",
  "id",
  "is_enabled",
  "leave_type",
  "name",
  "postpone_accrual_period",
  "reporting_manager_name",
  "settings",
  "total_leave",
  "total_used",
];

const KNOWN_SETTING_KEYS = [
  "allow_half_day",
  "document_required",
  "document_required_after_days",
  "event_apply_window_days",
  "long_leave_advance_days",
  "long_leave_max_days",
  "max_requests_per_period",
  "min_service_unit",
  "min_service_value",
  "request_limit_period",
  "short_leave_advance_days",
  "short_leave_max_days",
];

// Generic value formatter for the "Other fields" fallback
const showVal = (v) => {
  if (v === null || v === undefined || v === "") return "-";
  if (typeof v === "boolean") return yesNo(v);
  if (Array.isArray(v)) return v.length ? v.map(showVal).join(", ") : "-";
  if (typeof v === "object")
    return Object.entries(v)
      .map(([k, x]) => `${k}: ${showVal(x)}`)
      .join(" | ");
  return String(v);
};

const labelize = (k) => cap(String(k).replace(/_/g, " "));

const PolicyDetails = ({ policy, open, onToggle }) => {
  if (!policy) return null;
  const s = policy.settings || {};
  const event = isEventPolicy(policy);

  // Anything the API sends that is not listed above
  const extraPolicyKeys = Object.keys(policy).filter(
    (k) => !KNOWN_POLICY_KEYS.includes(k),
  );
  const extraSettingKeys = Object.keys(s).filter(
    (k) => !KNOWN_SETTING_KEYS.includes(k),
  );

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex items-center gap-1.5 font-medium text-gray-700 hover:text-black transition-colors"
      >
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: policy.color || "#999" }}
        />
        {open ? "Hide details" : "View details"}
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* grid-rows trick = smooth height animation */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          open
            ? "grid-rows-[1fr] opacity-100 mt-2"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border rounded-2xl p-4 space-y-4 bg-gray-50/50 max-h-[340px] overflow-y-auto">
            {/* ---------------- Overview ---------------- */}
            <DetailSection title="Overview">
              <DetailRow label="Policy ID" value={orDash(policy.id)} />
              <DetailRow label="Name" value={orDash(policy.name)} />
              <DetailRow label="Code" value={orDash(policy.code)} />
              <DetailRow
                label="Colour"
                value={
                  policy.color ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="w-3 h-3 rounded-full border border-gray-200"
                        style={{ backgroundColor: policy.color }}
                      />
                      {policy.color}
                    </span>
                  ) : (
                    "-"
                  )
                }
              />
              <DetailRow label="Leave type" value={orDash(policy.leave_type)} />
              <DetailRow
                label="Accrual method"
                value={cap(policy.accrual_method)}
              />
              <DetailRow
                label="Event based"
                value={yesNo(policy.event_based === true || event)}
              />
              <DetailRow
                label="Status"
                value={policy.is_enabled ? "Enabled" : "Disabled"}
              />
              <DetailRow label="Branch" value={orDash(policy.branch?.name)} />
              <DetailRow label="Branch ID" value={orDash(policy.branch?.id)} />
              <DetailRow
                label="Employment type"
                value={orDash(policy.employment_type?.name)}
              />
              <DetailRow
                label="Employment type ID"
                value={orDash(policy.employment_type?.id)}
              />
              <DetailRow
                label="Reporting manager"
                value={orDash(policy.reporting_manager_name)}
              />
              <DetailRow
                label="Has employment setting"
                value={yesNo(policy.has_employment_setting)}
              />
              <DetailRow
                label="Postpone accrual period"
                value={cap(policy.postpone_accrual_period)}
              />
            </DetailSection>

            {/* ---------------- Balance ---------------- */}
            <DetailSection title="Balance">
              <DetailRow label="Total leave" value={days(policy.total_leave)} />
              <DetailRow label="Total used" value={days(policy.total_used)} />
              <DetailRow label="Booked days" value={days(policy.booked_days)} />
              <DetailRow
                label="Final balance"
                value={days(policy.final_balance)}
              />
              <DetailRow
                label="Events taken"
                value={orDash(policy.events_taken)}
              />
            </DetailSection>

            {/* ---------------- Eligibility ---------------- */}
            <DetailSection title="Eligibility">
              <DetailRow
                label="Can apply"
                value={
                  <span
                    className={
                      policy.can_apply === false
                        ? "text-red-500"
                        : "text-green-600"
                    }
                  >
                    {yesNo(policy.can_apply)}
                  </span>
                }
              />
              <DetailRow
                label="Reason code"
                value={orDash(policy.can_apply_reason?.code)}
              />
              <DetailRow
                label="Reason message"
                value={orDash(policy.can_apply_reason?.message)}
              />
            </DetailSection>

            {/* ---------------- Settings ---------------- */}
            <DetailSection title="Settings">
              <DetailRow
                label="Allow half day"
                value={yesNo(s.allow_half_day)}
              />
              <DetailRow
                label="Document required"
                value={yesNo(s.document_required)}
              />
              <DetailRow
                label="Document required after"
                value={days(s.document_required_after_days)}
              />
              <DetailRow
                label="Event apply window"
                value={days(s.event_apply_window_days)}
              />
              <DetailRow
                label="Short leave advance notice"
                value={days(s.short_leave_advance_days)}
              />
              <DetailRow
                label="Short leave max days"
                value={days(s.short_leave_max_days)}
              />
              <DetailRow
                label="Long leave advance notice"
                value={days(s.long_leave_advance_days)}
              />
              <DetailRow
                label="Long leave max days"
                value={days(s.long_leave_max_days)}
              />
              <DetailRow
                label="Max requests per period"
                value={orDash(s.max_requests_per_period)}
              />
              <DetailRow
                label="Request limit period"
                value={cap(s.request_limit_period)}
              />
              <DetailRow
                label="Min service value"
                value={orDash(s.min_service_value)}
              />
              <DetailRow
                label="Min service unit"
                value={cap(s.min_service_unit)}
              />
              {extraSettingKeys.map((k) => (
                <DetailRow key={k} label={labelize(k)} value={showVal(s[k])} />
              ))}
            </DetailSection>

            {/* ---------------- Anything new from the API ---------------- */}
            {extraPolicyKeys.length > 0 && (
              <DetailSection title="Other fields">
                {extraPolicyKeys.map((k) => (
                  <DetailRow
                    key={k}
                    label={labelize(k)}
                    value={showVal(policy[k])}
                  />
                ))}
              </DetailSection>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminLeaveModal = ({ isOpen, onClose }) => {
  const { applyLeaveAdmin, fetchEmployeeLeavePolicies, employeeLeavePolicies } =
    useLeaveStore();

  const [staffList, setStaffList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [fetchingPolicies, setFetchingPolicies] = useState(false);
  const [showPolicyDetails, setShowPolicyDetails] = useState(false);

  // Calendar state (regular leave)
  const today = new Date();
  const todayKey = keyFromDate(today);
  const [view, setView] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });
  const [rangeMode, setRangeMode] = useState(false);
  const [skipWeekends, setSkipWeekends] = useState(true);
  const [anchor, setAnchor] = useState(null);

  const [formData, setFormData] = useState(emptyForm);

  // Local submit state, so a stuck store `loading` flag can never block the button
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  // Works whether the store keeps the array or the whole { count, policies }
  const policyList = useMemo(() => {
    if (Array.isArray(employeeLeavePolicies)) return employeeLeavePolicies;
    if (Array.isArray(employeeLeavePolicies?.policies))
      return employeeLeavePolicies.policies;
    return [];
  }, [employeeLeavePolicies]);

  // The policy picked in the dropdown, and whether it is an event leave
  const selectedPolicy = useMemo(
    () =>
      policyList.find((p) => String(p.id) === String(formData.leave_policy)) ||
      null,
    [policyList, formData.leave_policy],
  );
  const isEventLeave = isEventPolicy(selectedPolicy);

  // Event leave: length of the chosen period
  const eventDays = useMemo(() => {
    if (!formData.from_date || !formData.to_date) return 0;
    if (formData.to_date < formData.from_date) return 0;
    return daysBetween(formData.from_date, formData.to_date);
  }, [formData.from_date, formData.to_date]);

  const maxEventDays =
    Number(
      selectedPolicy?.settings?.long_leave_max_days ??
        selectedPolicy?.settings?.short_leave_max_days,
    ) || null;

  const exceedsMax = !!maxEventDays && eventDays > maxEventDays;

  // Fetch staff list when modal opens
  useEffect(() => {
    if (!isOpen) return;
    const fetchStaff = async () => {
      try {
        const staff = await getAllStaff();
        setStaffList(Array.isArray(staff) ? staff : []);
      } catch (err) {
        setStaffList([]);
        showApiError(err, "Failed to load staff list");
      }
    };
    fetchStaff();
  }, [isOpen]);

  // Reset the dates when the employee / policy changes (regular <-> event)
  const resetDates = (prev) => ({
    ...prev,
    leave_date: [],
    event_date: "",
    from_date: "",
    to_date: "",
  });

  const handlePolicyChange = (policyId) => {
    setAnchor(null);
    setShowPolicyDetails(false);
    setFormData((prev) => ({
      ...resetDates(prev),
      leave_policy: policyId,
    }));
  };

  // Handle employee selection and fetch their leave policies
  const handleEmployeeChange = async (employeeId) => {
    setShowPolicyDetails(false);
    setFormData((prev) => ({
      ...resetDates(prev),
      employeeUuid: employeeId,
      leave_policy: "",
    }));

    if (!employeeId) return;

    setFetchingPolicies(true);
    try {
      const res = await fetchEmployeeLeavePolicies(employeeId);
      const list = Array.isArray(res) ? res : res?.policies;
      if (Array.isArray(list) && list.length > 0) {
        setFormData((prev) => ({ ...prev, leave_policy: list[0].id }));
      } else if (Array.isArray(list)) {
        showApiToast("error", "No leave policies found for this employee");
      }
    } catch (err) {
      showApiError(err, "Failed to load leave policies for selected employee");
    } finally {
      setFetchingPolicies(false);
    }
  };

  /* ---------- calendar selection logic (regular leave) ---------- */
  const selectedMap = useMemo(() => {
    const map = {};
    formData.leave_date.forEach((r) => (map[r.date] = r));
    return map;
  }, [formData.leave_date]);

  const sortedDates = useMemo(
    () => [...formData.leave_date].sort((a, b) => (a.date < b.date ? -1 : 1)),
    [formData.leave_date],
  );

  const totalDays = useMemo(
    () =>
      formData.leave_date.reduce((sum, r) => sum + (r.half_day ? 0.5 : 1), 0),
    [formData.leave_date],
  );

  // Add many dates at once, keeping existing rows (and their half-day flags)
  const addDates = (keys) => {
    setFormData((prev) => {
      const existing = new Set(prev.leave_date.map((r) => r.date));
      const added = keys
        .filter((k) => !existing.has(k))
        .map((k) => ({ date: k, half_day: false, half_day_type: 0 }));
      return { ...prev, leave_date: [...prev.leave_date, ...added] };
    });
  };

  const removeDate = (key) => {
    setFormData((prev) => ({
      ...prev,
      leave_date: prev.leave_date.filter((r) => r.date !== key),
    }));
  };

  const updateDateRow = (key, changes) => {
    setFormData((prev) => ({
      ...prev,
      leave_date: prev.leave_date.map((row) =>
        row.date === key ? { ...row, ...changes } : row,
      ),
    }));
  };

  const clearDates = () => {
    setFormData((prev) => ({ ...prev, leave_date: [] }));
    setAnchor(null);
  };

  const handleDayClick = (key) => {
    if (!rangeMode) {
      if (selectedMap[key]) removeDate(key);
      else addDates([key]);
      return;
    }

    // Range mode: first click = start, second click = end
    if (!anchor) {
      setAnchor(key);
      return;
    }
    const start = parseKey(anchor < key ? anchor : key);
    const end = parseKey(anchor < key ? key : anchor);
    const keys = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      if (skipWeekends && isWeekend) continue;
      keys.push(keyFromDate(d));
    }
    addDates(keys);
    setAnchor(null);
  };

  const changeMonth = (delta) => {
    setView((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const calendarCells = useMemo(() => {
    const first = new Date(view.year, view.month, 1).getDay();
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    const cells = Array(first).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [view]);

  /* ---------- CC ---------- */
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const fullName = (s.full_name || s.name || "").toLowerCase();
      return fullName.includes(searchTerm.toLowerCase());
    });
  }, [staffList, searchTerm]);

  const toggleCcEmployee = (uuid) => {
    setFormData((prev) => ({
      ...prev,
      cc: prev.cc.includes(uuid)
        ? prev.cc.filter((id) => id !== uuid)
        : [...prev.cc, uuid],
    }));
  };

  const handleClose = () => {
    setFormData(emptyForm);
    setSearchTerm("");
    setAnchor(null);
    setRangeMode(false);
    setShowPolicyDetails(false);
    onClose();
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    // Prevent double submit (button click + form submit)
    if (submittingRef.current) return;

    if (!formData.employeeUuid)
      return showApiToast("error", "Please select an employee");
    if (!formData.leave_policy)
      return showApiToast("error", "Please select a leave policy");

    let payload;

    if (isEventLeave) {
      // 8.4 Event leave: event_date + from_date + to_date
      if (!formData.event_date)
        return showApiToast("error", "Please select the event date");
      if (!formData.from_date || !formData.to_date)
        return showApiToast(
          "error",
          "Please select the leave start and end dates",
        );
      if (formData.to_date < formData.from_date)
        return showApiToast(
          "error",
          "End date cannot be before the start date",
        );
      if (exceedsMax)
        return showApiToast(
          "error",
          `Leave cannot be longer than ${maxEventDays} days for this policy`,
        );

      payload = {
        leave_policy: Number(formData.leave_policy),
        reason: formData.reason,
        cc: formData.cc,
        event_date: formData.event_date,
        from_date: formData.from_date,
        to_date: formData.to_date,
      };
    } else {
      // 8.3 Regular leave: list of dates
      if (formData.leave_date.length === 0)
        return showApiToast("error", "Please select at least one leave date");

      payload = {
        leave_policy: Number(formData.leave_policy),
        reason: formData.reason,
        cc: formData.cc,
        leave_date: sortedDates,
      };
    }

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const res = await applyLeaveAdmin(formData.employeeUuid, payload);
      showApiSuccess(res, "Leave applied successfully!");
      handleClose();
    } catch (err) {
      showApiError(err, "Failed to apply leave");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const employeeOptions = staffList.map((s) => ({
    value: s.uuid,
    label: s.full_name || s.name,
  }));

  const policyOptions = policyList.map((p) => ({
    value: p.id,
    label: `${p.name}${isEventPolicy(p) ? " (Event)" : ""}`,
  }));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm font-poppins text-[12px]">
      <div className="bg-white w-[95%] max-w-[980px] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20">
        {/* Header */}
        <div className="px-8 py-5 flex items-center justify-between border-b border-gray-50 bg-white">
          <div>
            <h2 className="text-gray-900 text-[16px] font-medium uppercase">
              Apply Admin Leave
            </h2>
            <p className="text-gray-400 text-[10px]">
              Record staff absence manually
            </p>
          </div>
          <button type="button" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 overflow-y-auto">
          {/* Two columns: inputs on the left, calendar / event on the right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* ================= LEFT: inputs ================= */}
            <div className="space-y-5 min-w-0">
              {/* Employee */}
              <SelectField
                label="Employee"
                placeholder="Select Staff Member"
                options={employeeOptions}
                value={formData.employeeUuid}
                onChange={handleEmployeeChange}
              />

              {/* Leave Policy */}
              <SelectField
                label="Leave Policy / Type"
                disabled={!formData.employeeUuid || fetchingPolicies}
                placeholder={
                  fetchingPolicies
                    ? "Loading policies..."
                    : !formData.employeeUuid
                      ? "Select an employee first"
                      : policyList.length === 0
                        ? "No policies found"
                        : "Select Leave Policy"
                }
                options={policyOptions}
                value={formData.leave_policy}
                onChange={handlePolicyChange}
              />

              {/* Policy details accordion */}
              {selectedPolicy && (
                <PolicyDetails
                  policy={selectedPolicy}
                  open={showPolicyDetails}
                  onToggle={() => setShowPolicyDetails((o) => !o)}
                />
              )}

              {/* CC Notification Search */}
              <div className="space-y-2">
                <label className={labelClass}>CC (Notify Staff)</label>
                <div className="relative">
                  <Search
                    className="absolute left-3 top-3 text-gray-400"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="Search staff..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 border p-2.5 rounded-2xl"
                  />
                </div>

                <div className="max-h-[180px] overflow-y-auto border rounded-2xl p-2 space-y-1">
                  {filteredStaff.length === 0 ? (
                    <div className="p-3 text-center text-gray-400">
                      No staff found
                    </div>
                  ) : (
                    filteredStaff.map((s) => (
                      <label
                        key={s.uuid}
                        className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                      >
                        <span className="font-medium text-gray-800">
                          {s.full_name || s.name}
                        </span>
                        <input
                          type="checkbox"
                          checked={formData.cc.includes(s.uuid)}
                          onChange={() => toggleCcEmployee(s.uuid)}
                          className="rounded border-gray-300"
                        />
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Reason Section */}
              <div>
                <label className={labelClass}>Reason</label>
                <textarea
                  rows="3"
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, reason: e.target.value }))
                  }
                  placeholder="Personal work..."
                  className="w-full border p-3 rounded-2xl"
                />
              </div>
            </div>

            {/* ================= RIGHT: event leave / calendar ================= */}
            <div className="min-w-0">
              {isEventLeave ? (
                <>
                  {/* ---------- 8.4 EVENT LEAVE VIEW (date range) ---------- */}
                  <label className={labelClass}>Event Leave</label>

                  <div className="border rounded-2xl p-4 space-y-4">
                    <div>
                      <p className="font-medium text-gray-900 text-[13px]">
                        {selectedPolicy.name}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        This is an event based leave. Pick the event date and
                        the leave period, no need to mark each day.
                      </p>
                    </div>

                    {selectedPolicy.can_apply === false && (
                      <div className="rounded-xl bg-amber-50 border border-amber-100 text-amber-700 px-3 py-2 text-[11px]">
                        {selectedPolicy.can_apply_reason?.message ||
                          "This employee may not be eligible for this leave right now. The server may reject this request."}
                      </div>
                    )}

                    <div>
                      <DateField
                        label="Event Date"
                        value={formData.event_date}
                        onChange={(v) =>
                          setFormData((prev) => ({ ...prev, event_date: v }))
                        }
                      />
                      {selectedPolicy.settings?.event_apply_window_days ? (
                        <p className="mt-1 text-[10px] text-gray-400">
                          Apply window:{" "}
                          {selectedPolicy.settings.event_apply_window_days} days
                        </p>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <DateField
                        label="From Date"
                        value={formData.from_date}
                        onChange={(v) =>
                          setFormData((prev) => ({
                            ...prev,
                            from_date: v,
                            // keep the range valid if the new start is after the end
                            to_date:
                              prev.to_date && prev.to_date < v
                                ? ""
                                : prev.to_date,
                          }))
                        }
                      />
                      <DateField
                        label="To Date"
                        min={formData.from_date || undefined}
                        value={formData.to_date}
                        onChange={(v) =>
                          setFormData((prev) => ({ ...prev, to_date: v }))
                        }
                      />
                    </div>

                    {/* Summary */}
                    {eventDays > 0 && (
                      <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5">
                        <p className="text-gray-800 font-medium">
                          {formatKey(formData.from_date)} to{" "}
                          {formatKey(formData.to_date)}
                        </p>
                        <p className="text-gray-500 mt-0.5">
                          {eventDays} day{eventDays !== 1 ? "s" : ""} of leave
                        </p>
                        {exceedsMax && (
                          <p className="text-red-500 mt-1 text-[11px]">
                            This is longer than the policy maximum of{" "}
                            {maxEventDays} days.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Policy info chips */}
                    <div className="flex flex-wrap gap-2 text-[10px]">
                      {selectedPolicy.final_balance !== undefined && (
                        <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                          Balance: {Number(selectedPolicy.final_balance)} days
                        </span>
                      )}
                      {maxEventDays && (
                        <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                          Max: {maxEventDays} days
                        </span>
                      )}
                      {selectedPolicy.settings?.document_required && (
                        <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                          Document required
                        </span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* ---------- 8.3 REGULAR LEAVE VIEW (calendar) ---------- */}
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-medium text-gray-700">
                      Leave Dates
                    </label>
                    {formData.leave_date.length > 0 && (
                      <button
                        type="button"
                        onClick={clearDates}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  <div className="border rounded-2xl p-4">
                    {/* Mode switch */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex bg-gray-100 rounded-full p-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setRangeMode(false);
                            setAnchor(null);
                          }}
                          className={`px-3 py-1 rounded-full transition-colors ${
                            !rangeMode
                              ? "bg-black text-white"
                              : "text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          Pick days
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRangeMode(true);
                            setAnchor(null);
                          }}
                          className={`px-3 py-1 rounded-full transition-colors ${
                            rangeMode
                              ? "bg-black text-white"
                              : "text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          Select range
                        </button>
                      </div>

                      {rangeMode && (
                        <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                          <input
                            type="checkbox"
                            className="accent-black w-4 h-4 rounded"
                            checked={skipWeekends}
                            onChange={(e) => setSkipWeekends(e.target.checked)}
                          />
                          Skip weekends
                        </label>
                      )}
                    </div>

                    {/* Month navigation */}
                    <div className="flex items-center justify-between mb-2">
                      <button
                        type="button"
                        onClick={() => changeMonth(-1)}
                        aria-label="Previous month"
                        className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <Icon
                          icon="solar:alt-arrow-left-outline"
                          className="w-4 h-4"
                        />
                      </button>
                      <span className="font-medium text-gray-900 text-[13px]">
                        {MONTHS[view.month]} {view.year}
                      </span>
                      <button
                        type="button"
                        onClick={() => changeMonth(1)}
                        aria-label="Next month"
                        className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <Icon
                          icon="solar:alt-arrow-right-outline"
                          className="w-4 h-4"
                        />
                      </button>
                    </div>

                    {/* Weekday header */}
                    <div className="grid grid-cols-7 mb-1">
                      {WEEKDAYS.map((w) => (
                        <div
                          key={w}
                          className="text-center text-[10px] text-gray-400 py-1"
                        >
                          {w}
                        </div>
                      ))}
                    </div>

                    {/* Day grid */}
                    <div className="grid grid-cols-7 gap-y-1">
                      {calendarCells.map((day, i) => {
                        if (day === null) return <div key={`b-${i}`} />;
                        const key = toKey(view.year, view.month, day);
                        const row = selectedMap[key];
                        const isSelected = !!row;
                        const isToday = key === todayKey;
                        const isAnchor = key === anchor;
                        const isWeekend = i % 7 === 0 || i % 7 === 6;

                        return (
                          <div key={key} className="flex justify-center">
                            <button
                              type="button"
                              onClick={() => handleDayClick(key)}
                              title={row?.half_day ? "Half day" : undefined}
                              className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                                isSelected
                                  ? "bg-black text-white font-medium"
                                  : isAnchor
                                    ? "bg-gray-200 text-gray-900 font-medium"
                                    : isWeekend
                                      ? "text-gray-400 hover:bg-gray-100"
                                      : "text-gray-800 hover:bg-gray-100"
                              } ${
                                isToday && !isSelected
                                  ? "ring-1 ring-black ring-inset"
                                  : ""
                              }`}
                            >
                              {day}
                              {isSelected && row.half_day && (
                                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-white" />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <p className="mt-3 text-[10px] text-gray-400">
                      {rangeMode
                        ? anchor
                          ? `Start: ${formatKey(anchor)}. Now tap the end date.`
                          : "Tap a start date, then an end date to add the whole range."
                        : "Tap any day to select or unselect it."}
                    </p>
                  </div>

                  {/* Selected dates */}
                  {sortedDates.length > 0 && (
                    <div className="mt-3">
                      <p className="mb-2 text-gray-500">
                        {sortedDates.length} date
                        {sortedDates.length > 1 ? "s" : ""} selected ·{" "}
                        {totalDays} day{totalDays !== 1 ? "s" : ""} of leave
                      </p>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                        {sortedDates.map((row) => (
                          <div
                            key={row.date}
                            className="flex items-center justify-between gap-3 border px-3 py-2 rounded-2xl"
                          >
                            <span className="font-medium text-gray-800">
                              {formatKey(row.date)}
                            </span>

                            <div className="flex items-center gap-3">
                              {/* Only show Half Day when the policy allows it */}
                              {selectedPolicy?.settings?.allow_half_day !==
                                false && (
                                <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    className="accent-black w-4 h-4 rounded"
                                    checked={row.half_day}
                                    onChange={(e) =>
                                      updateDateRow(row.date, {
                                        half_day: e.target.checked,
                                        half_day_type: e.target.checked ? 1 : 0,
                                      })
                                    }
                                  />
                                  Half Day
                                </label>
                              )}

                              <button
                                type="button"
                                onClick={() => removeDate(row.date)}
                                aria-label="Remove date"
                                title="Remove"
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <Icon
                                  icon="solar:trash-bin-trash-outline"
                                  className="w-4 h-4"
                                />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Footer: Cancel / Confirm under the calendar */}
              <div className="flex justify-end gap-3 pt-5">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>

                <GlowButton
                  onClick={handleSubmit}
                  disabled={submitting || fetchingPolicies}
                >
                  {submitting ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    "Confirm Leave"
                  )}
                </GlowButton>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLeaveModal;
