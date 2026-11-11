import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiCoffee,
  FiPlus,
  FiChevronDown,
  FiRefreshCw,
  FiAlertCircle,
  FiMoon,
} from "react-icons/fi";
import { Icon } from "@iconify/react";
import { fetchEmployeeShifts } from "../../service/employeeService";
import { fetchShifts, allocateShift } from "../../service/policiesService";
import { fetchShiftMappedPolicies } from "../../service/companyService";
import { toast } from "react-toastify"; // uses the global <ToastContainer /> from App.jsx

// Format a Date as YYYY-MM-DD using LOCAL time (no timezone shift)
const formatDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Monochrome palette for shift chips (picked per shift type)
const CHIP_COLORS = [
  { bg: "bg-gray-100", bar: "bg-black", text: "text-gray-900" },
  { bg: "bg-gray-50", bar: "bg-gray-700", text: "text-gray-800" },
  { bg: "bg-gray-100", bar: "bg-gray-500", text: "text-gray-700" },
  { bg: "bg-gray-50", bar: "bg-gray-900", text: "text-gray-900" },
];

const getChipColor = (label = "") => {
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = (hash * 31 + label.charCodeAt(i)) % 997;
  }
  return CHIP_COLORS[hash % CHIP_COLORS.length];
};

// Pull the exact message the backend sent (handles the common response shapes).
// If the response has both a message and a detail string in `data`, show both:
// { message: "Failed to upsert shift allocation", data: "at least one policy_id is required" }
const getBackendMessage = (error) => {
  const data = error?.response?.data;
  if (typeof data === "string" && data.trim()) return data;

  const main =
    data?.message ||
    data?.error ||
    data?.detail ||
    data?.errors?.[0]?.message ||
    error?.message ||
    "";
  const detail =
    typeof data?.data === "string" && data.data.trim() ? data.data.trim() : "";

  if (main && detail && !main.includes(detail)) return `${main}: ${detail}`;
  return main || detail;
};

// A mapped policy's id (some APIs call it policy_id)
const policyId = (p) => p?.id ?? p?.policy_id;

/* ================= Sub-components ================= */
function Modal({
  title,
  subtitle,
  icon,
  onClose,
  width = "340px",
  footer,
  children,
}) {
  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
    >
      <div
        style={{ width }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-full max-h-[92vh] flex flex-col animate-in fade-in zoom-in duration-200"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-start gap-3">
            {icon && (
              <span className="p-2 bg-slate-100 rounded-lg">
                <Icon icon={icon} className="w-5 h-5 text-black" />
              </span>
            )}
            <div>
              <h3 className="text-[16px] text-gray-900">{title}</h3>
              {subtitle && (
                <p className="text-[11px] text-gray-500 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            className="text-gray-400 hover:text-black transition-colors"
            onClick={onClose}
          >
            <Icon icon="material-symbols:close" className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-gray-100 bg-slate-50/60 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function DateField({ label, value, onChange, min }) {
  const inputRef = useRef(null);

  const openPicker = () => {
    const el = inputRef.current;
    if (!el) return;
    try {
      el.showPicker();
    } catch {
      el.focus();
    }
  };

  return (
    <div>
      <label className="text-[11px] text-gray-500 block mb-1.5">{label}</label>
      <div className="relative">
        <input
          ref={inputRef}
          type="date"
          value={value}
          min={min}
          onChange={(e) => onChange(e.target.value)}
          onClick={openPicker}
          className="w-full bg-slate-50 border border-gray-200 rounded-lg pl-3 pr-9 py-2 text-xs text-gray-700 cursor-pointer focus:bg-white focus:border-gray-900 focus:outline-none transition-all [&::-webkit-calendar-picker-indicator]:hidden"
        />
        <button
          type="button"
          onClick={openPicker}
          tabIndex={-1}
          aria-label={`Open ${label} calendar`}
          className="absolute right-2.5 top-1/2 -translate-y-1/2"
        >
          <Icon icon="solar:calendar-outline" className="w-4 h-4 text-black" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Update Shift modal (opened by the Allocate button)
// ---------------------------------------------------------------------------
const UpdateShiftModal = ({
  shifts,
  employeeUUID,
  currentShift,
  onClose,
  onAllocated,
}) => {
  const [selectedShiftId, setSelectedShiftId] = useState("");
  const [shiftFrom, setShiftFrom] = useState(formatDate(new Date()));
  const [shiftTo, setShiftTo] = useState("");
  const [saving, setSaving] = useState(false);

  // Mapped policies for the chosen shift
  const [mappedPolicies, setMappedPolicies] = useState([]);
  const [selectedPolicyIds, setSelectedPolicyIds] = useState([]);
  const [policiesLoading, setPoliciesLoading] = useState(false);
  const [policiesError, setPoliciesError] = useState(false);
  const [policyReloadKey, setPolicyReloadKey] = useState(0);

  // Policy cache: shift_id -> policies, plus in-flight requests
  const policyCache = useRef({});
  const policyInflight = useRef({});

  const getPolicies = (shiftId) => {
    if (policyCache.current[shiftId]) {
      return Promise.resolve(policyCache.current[shiftId]);
    }
    if (!policyInflight.current[shiftId]) {
      policyInflight.current[shiftId] = fetchShiftMappedPolicies(shiftId)
        .then((res) => {
          // Accept an array or { data: [...] }
          const list = Array.isArray(res)
            ? res
            : Array.isArray(res?.data)
              ? res.data
              : [];
          policyCache.current[shiftId] = list;
          return list;
        })
        .finally(() => {
          delete policyInflight.current[shiftId];
        });
    }
    return policyInflight.current[shiftId];
  };

  /* ---------- Prefetch every shift's policies when the modal opens ---------- */
  useEffect(() => {
    shifts.forEach((s) => {
      getPolicies(s.id).catch(() => {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shifts]);

  /* ---------- Show mapped policies instantly when the shift changes ---------- */
  useEffect(() => {
    setPoliciesError(false);

    if (!selectedShiftId) {
      setMappedPolicies([]);
      setSelectedPolicyIds([]);
      return;
    }

    // Already cached (prefetched or opened before): show with no delay
    const cached = policyCache.current[selectedShiftId];
    if (cached) {
      setMappedPolicies(cached);
      setSelectedPolicyIds(cached.map(policyId));
      setPoliciesLoading(false);
      return;
    }

    let cancelled = false;
    setSelectedPolicyIds([]);
    setPoliciesLoading(true);

    getPolicies(selectedShiftId)
      .then((policies) => {
        if (cancelled) return;
        setMappedPolicies(policies);
        setSelectedPolicyIds(policies.map(policyId));
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Mapped policies request failed:", err);
        setMappedPolicies([]);
        setPoliciesError(true);
      })
      .finally(() => {
        if (!cancelled) setPoliciesLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShiftId, policyReloadKey]);

  const togglePolicy = (id) => {
    setSelectedPolicyIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const handleAllocate = async () => {
    if (!selectedShiftId || !shiftFrom) {
      toast.error("Please select shift and Effective From date.");
      return;
    }
    if (shiftTo && shiftTo < shiftFrom) {
      toast.error("Effective To cannot be before Effective From.");
      return;
    }
    if (policiesLoading) {
      toast.error("Policies are still loading. Please wait a moment.");
      return;
    }
    if (policiesError) {
      toast.error("Could not load policies. Press Retry and try again.");
      return;
    }
    if (selectedPolicyIds.length === 0) {
      toast.error(
        mappedPolicies.length > 0
          ? "Select at least one policy."
          : "This shift has no policies mapped. Map a policy to it first.",
      );
      return;
    }

    setSaving(true);
    try {
      const payload = {
        shift_id: Number(selectedShiftId),
        staff_id: employeeUUID,
        from_date: `${shiftFrom}T00:00:00Z`,
        to_date: shiftTo ? `${shiftTo}T00:00:00Z` : null,
        policy_ids: selectedPolicyIds,
      };

      await allocateShift(payload);
      toast.success("Shift updated successfully!");
      onAllocated?.();
      onClose();
    } catch (error) {
      toast.error(getBackendMessage(error) || "Failed to update shift");
      console.error("Allocation Error Details:", error?.response?.data);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Update Shift"
      subtitle="Choose the shift and policies, then press Allocate."
      icon="solar:clock-circle-outline"
      width="460px"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-[12px] font-normal text-gray-600 bg-white hover:bg-gray-50 active:bg-gray-100 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAllocate}
            disabled={saving || policiesLoading}
            className={`flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-[12px] font-normal hover:bg-gray-800 transition-all shadow-sm cursor-pointer ${
              saving || policiesLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <Icon icon="solar:check-circle-outline" className="w-4 h-4" />
            {saving ? "Saving..." : "Allocate"}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Current shift */}
        <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2.5">
          <span className="text-[11px] text-gray-500">Current shift</span>
          <span className="text-xs text-gray-900 bg-white border border-gray-200 rounded-full px-2.5 py-0.5">
            {currentShift || "Not assigned"}
          </span>
        </div>

        {/* Shift */}
        <div>
          <label className="text-[11px] text-gray-500 block mb-1.5">
            Select target Shift
          </label>
          <div className="relative">
            <select
              value={selectedShiftId}
              onChange={(e) =>
                setSelectedShiftId(e.target.value ? Number(e.target.value) : "")
              }
              className="w-full bg-slate-50 border border-gray-200 rounded-lg pl-3 pr-10 py-2 text-xs appearance-none text-gray-700 focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all"
            >
              <option value="">Choose Shift Definition</option>
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.shift_name}
                </option>
              ))}
            </select>
            <FiChevronDown
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              size={14}
            />
          </div>
        </div>

        {/* Mapped policies */}
        {selectedShiftId && (
          <div>
            <label className="text-[11px] text-gray-500 mb-1.5 flex items-center gap-1">
              <Icon icon="solar:shield-check-outline" className="w-3.5 h-3.5" />
              Apply Policies
            </label>

            {policiesLoading ? (
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                <FiRefreshCw size={11} className="animate-spin" />
                Loading policies...
              </div>
            ) : policiesError ? (
              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                Could not load policies
                <button
                  type="button"
                  onClick={() => {
                    delete policyCache.current[selectedShiftId];
                    setPolicyReloadKey((k) => k + 1);
                  }}
                  className="underline"
                >
                  Retry
                </button>
              </div>
            ) : mappedPolicies.length === 0 ? (
              <span className="text-[11px] text-gray-400 italic">
                No policies mapped to this shift
              </span>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {mappedPolicies.map((p) => {
                  const active = selectedPolicyIds.includes(policyId(p));
                  return (
                    <button
                      key={policyId(p)}
                      type="button"
                      onClick={() => togglePolicy(policyId(p))}
                      aria-pressed={active}
                      title={p.code}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-[10px] transition-colors ${
                        active
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {active && (
                        <Icon
                          icon="material-symbols:check"
                          className="w-3 h-3"
                        />
                      )}
                      {p.name}
                      <span
                        className={active ? "text-gray-300" : "text-gray-400"}
                      >
                        ({p.code})
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <DateField
            label="From Date"
            value={shiftFrom}
            onChange={setShiftFrom}
          />
          <DateField
            label="To Date (optional)"
            value={shiftTo}
            min={shiftFrom || undefined}
            onChange={setShiftTo}
          />
        </div>
      </div>
    </Modal>
  );
};

const ManageShiftTab = ({ employeeUUID }) => {
  // --- States ---
  const [shifts, setShifts] = useState({}); // Calendar data keyed by YYYY-MM-DD
  const [availableShifts, setAvailableShifts] = useState([]); // Master list for dropdown
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(""); // Exact message from backend

  // Current month being viewed (starts at the current month)
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // --- Modal & Allocation States ---
  const [showShiftModal, setShowShiftModal] = useState(false);

  const scheduledDays = Object.keys(shifts).length;
  const hasData = scheduledDays > 0;
  const todayKey = formatDate(new Date());

  // --- Load calendar data for the viewed month ---
  const loadShifts = useCallback(async () => {
    if (!employeeUUID) return;
    try {
      setLoading(true);
      setErrorMessage("");

      const year = viewDate.getFullYear();
      const month = viewDate.getMonth();

      const from = formatDate(new Date(year, month, 1));
      const to = formatDate(new Date(year, month + 1, 0)); // last day of month

      console.log(
        "📅 Selected month:",
        viewDate.toLocaleString("default", { month: "long", year: "numeric" }),
      );
      console.log("➡️ Request params:", { from, to, user_uuid: employeeUUID });

      const data = await fetchEmployeeShifts(from, to, employeeUUID);

      console.log("✅ API response:", data);

      // Backend sometimes returns 200 with only a message (no array)
      if (!Array.isArray(data) && !Array.isArray(data?.data) && data?.message) {
        setShifts({});
        setErrorMessage(data.message);
        return;
      }

      const list = Array.isArray(data) ? data : data?.data || [];

      const shiftMap = {};
      list.forEach((s) => {
        if (!s?.date) return;
        const dateKey = s.date.split("T")[0];
        shiftMap[dateKey] = s;
      });

      console.log("🗓️ Shift map (by date):", shiftMap);

      setShifts(shiftMap);
    } catch (error) {
      console.error("❌ Error loading shifts:", error?.response?.data || error);
      setShifts({});
      setErrorMessage(getBackendMessage(error));
    } finally {
      setLoading(false);
    }
  }, [employeeUUID, viewDate]);

  // --- Load master shift list for dropdown ---
  const getShiftsList = useCallback(async () => {
    try {
      const res = await fetchShifts();
      // Accept either the array itself or { status_code, message, data: [...] }
      const list = Array.isArray(res) ? res : res?.data;
      setAvailableShifts(Array.isArray(list) ? list : []);
    } catch (error) {
      toast.error(getBackendMessage(error));
    }
  }, []);

  useEffect(() => {
    getShiftsList();
  }, [getShiftsList]);

  // Reload whenever the employee OR the viewed month changes
  useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  // --- Calendar helpers ---
  const prevMonth = () =>
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const nextMonth = () =>
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  const goToday = () => {
    const now = new Date();
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const renderCalendarCells = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const totalRows = Math.ceil((firstDayOfMonth + totalDays) / 7);
    const totalCells = totalRows * 7;

    const cells = [];

    for (let i = 0; i < totalCells; i++) {
      // Real date for this cell (includes previous / next month days)
      const date = new Date(year, month, 1 - firstDayOfMonth + i);
      const inMonth = date.getMonth() === month;
      const dateKey = formatDate(date);
      const col = i % 7;
      const row = Math.floor(i / 7);
      const isWeekend = col === 0 || col === 6;
      const isToday = dateKey === todayKey;

      const shift = inMonth ? shifts[dateKey] : undefined;
      const policies = Array.isArray(shift?.policies) ? shift.policies : [];
      const color = getChipColor(shift?.shift_type || "");

      // Keep the hover card inside the grid
      const alignRight = col >= 4;
      const openAbove = row >= totalRows - 2 && row > 0;

      // First day of a month shows the month name, like a real calendar
      const dayLabel =
        date.getDate() === 1
          ? date.toLocaleString("default", { month: "short" }) + " 1"
          : date.getDate();

      cells.push(
        <div
          key={dateKey}
          className={`group relative min-h-[120px] border-r border-b border-gray-100 p-2 transition-colors hover:z-30 ${
            !inMonth
              ? "bg-gray-50/70"
              : isWeekend
                ? "bg-gray-50/40 hover:bg-gray-100/70"
                : "bg-white hover:bg-gray-50"
          }`}
        >
          {/* Day number */}
          <div className="flex items-center justify-between mb-1.5">
            <span
              className={`inline-flex items-center justify-center text-[11px] min-w-[24px] h-6 px-1.5 rounded-full ${
                isToday
                  ? "bg-black text-white shadow-sm"
                  : inMonth
                    ? "text-gray-800"
                    : "text-gray-300"
              }`}
            >
              {dayLabel}
            </span>
          </div>

          {/* Shift chip */}
          {shift && (
            <div
              className={`relative rounded-md overflow-hidden ${color.bg} cursor-default`}
            >
              <span
                className={`absolute left-0 top-0 bottom-0 w-1 ${color.bar}`}
              />
              <div className="pl-3 pr-2 py-1.5">
                {shift.shift_type && (
                  <p className={`text-[10px] truncate ${color.text}`}>
                    {shift.shift_type}
                  </p>
                )}
                {policies.length > 0 && (
                  <p className="flex items-center gap-1 text-[9px] text-gray-500 mt-0.5">
                    <FiClock size={9} />
                    {policies.length}{" "}
                    {policies.length === 1 ? "policy" : "policies"}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Policies: visible only on hover of this block */}
          {policies.length > 0 && (
            <div
              className={`hidden group-hover:block absolute z-40 w-60 bg-white border border-gray-200 rounded-xl shadow-2xl p-3 ${
                alignRight ? "right-1" : "left-1"
              } ${openAbove ? "bottom-full mb-1" : "top-full mt-1"}`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-gray-900">
                  {date.toLocaleDateString("default", {
                    weekday: "long",
                    day: "numeric",
                    month: "short",
                  })}
                </p>
                <span className="text-[9px] text-gray-400 uppercase tracking-wider">
                  Policies
                </span>
              </div>

              <div className="space-y-2">
                {policies.map((p, i) => {
                  const overnight =
                    p.in_time && p.out_time && p.out_time < p.in_time;
                  return (
                    <div
                      key={`${p.policy_name}-${i}`}
                      className="rounded-lg border border-gray-100 bg-gray-50/70 p-2"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        {p.policy_name && (
                          <p className="text-[10px] text-gray-900 truncate">
                            {p.policy_name}
                          </p>
                        )}
                        {overnight && (
                          <span className="flex items-center gap-0.5 text-[8px] text-white bg-black rounded-full px-1.5 py-0.5 shrink-0">
                            <FiMoon size={8} /> Overnight
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        {p.in_time && (
                          <div>
                            <p className="text-gray-400 text-[8px] uppercase">
                              In
                            </p>
                            <p className="text-gray-800">{p.in_time}</p>
                          </div>
                        )}
                        {p.out_time && (
                          <div>
                            <p className="text-gray-400 text-[8px] uppercase">
                              Out{overnight ? " (+1 day)" : ""}
                            </p>
                            <p className="text-gray-800">{p.out_time}</p>
                          </div>
                        )}
                      </div>

                      <div className="mt-1.5 pt-1.5 border-t border-gray-100 text-[9px] text-gray-500 space-y-0.5">
                        {p.work_hours != null && (
                          <div className="flex items-center gap-1.5">
                            <FiClock size={10} className="text-gray-400" />
                            <span>Work: {p.work_hours} hrs</span>
                          </div>
                        )}
                        {p.break_time && (
                          <div className="flex items-center gap-1.5">
                            <FiCoffee size={10} className="text-gray-400" />
                            <span>Break: {p.break_time}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>,
      );
    }
    return cells;
  };

  return (
    <div
      className="bg-white border border-gray-100 rounded-2xl shadow-xl font-normal"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {/* --- HEADER --- */}
      <div className="px-6 py-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-black text-white flex items-center justify-center">
            <Icon icon="solar:calendar-outline" className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xl text-gray-900 leading-tight">
              {viewDate.toLocaleString("default", { month: "long" })}{" "}
              <span className="text-gray-400">{viewDate.getFullYear()}</span>
            </h3>
            <p className="text-[11px] text-gray-400">
              {hasData
                ? `${scheduledDays} scheduled ${scheduledDays === 1 ? "day" : "days"}`
                : "Shift schedule"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={goToday}
            className="px-4 py-2 text-[11px] text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
          >
            Today
          </button>

          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={prevMonth}
              className="p-2 text-gray-500 hover:bg-gray-50 hover:text-black transition-all"
              aria-label="Previous month"
            >
              <FiChevronLeft size={18} />
            </button>
            <div className="w-px h-5 bg-gray-200" />
            <button
              onClick={nextMonth}
              className="p-2 text-gray-500 hover:bg-gray-50 hover:text-black transition-all"
              aria-label="Next month"
            >
              <FiChevronRight size={18} />
            </button>
          </div>

          <button
            onClick={() => setShowShiftModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white text-[11px] rounded-lg hover:bg-gray-800 transition-all active:scale-95 shadow-md"
          >
            <FiPlus size={14} />
            Allocate
          </button>
        </div>
      </div>

      {/* --- BACKEND MESSAGE / EMPTY NOTICE --- */}
      {!loading && errorMessage && (
        <div className="mx-6 mt-5 flex items-start gap-3 rounded-xl border border-gray-300 bg-gray-50 px-4 py-3">
          <FiAlertCircle size={18} className="text-black mt-0.5 shrink-0" />
          <p className="text-[12px] text-gray-900 leading-relaxed">
            {errorMessage}
          </p>
        </div>
      )}

      {!loading && !errorMessage && !hasData && (
        <div className="mx-6 mt-5 flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <Icon
            icon="solar:calendar-outline"
            className="w-4 h-4 text-gray-400 shrink-0"
          />
          <p className="text-[12px] text-gray-600">
            No data available for{" "}
            {viewDate.toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      )}

      {/* --- CALENDAR GRID --- */}
      <div className="p-6 relative">
        {loading && (
          <div className="absolute inset-0 z-50 bg-white/70 backdrop-blur-sm flex items-center justify-center rounded-b-2xl">
            <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        <div className="grid grid-cols-7 border-t border-l border-gray-100 rounded-lg">
          {WEEKDAYS.map((day, i) => (
            <div
              key={day}
              className={`py-3 text-center text-[10px] uppercase tracking-[0.2em] border-r border-b border-gray-100 bg-gray-50 ${
                i === 0 || i === 6 ? "text-gray-900" : "text-gray-500"
              }`}
            >
              {day}
            </div>
          ))}
          {renderCalendarCells()}
        </div>
      </div>

      {/* --- UPDATE SHIFT MODAL (Allocate button) --- */}
      {showShiftModal && (
        <UpdateShiftModal
          shifts={availableShifts}
          employeeUUID={employeeUUID}
          currentShift={shifts[todayKey]?.shift_type || ""}
          onClose={() => setShowShiftModal(false)}
          onAllocated={loadShifts} // refresh the calendar
        />
      )}
    </div>
  );
};

export default ManageShiftTab;
