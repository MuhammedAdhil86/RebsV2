import React, { useState, useEffect, useCallback } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiCoffee,
  FiPlus,
  FiX,
  FiCalendar,
  FiAlertCircle,
  FiMoon,
} from "react-icons/fi";
import { fetchEmployeeShifts } from "../../service/employeeService";
import { fetchShifts, allocateShift } from "../../service/policiesService";
import CustomSelect from "../../ui/customselect";
import toast, { Toaster } from "react-hot-toast";

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

// Pull the exact message the backend sent (handles the common response shapes)
const getBackendMessage = (error) => {
  const data = error?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  return (
    data?.message ||
    data?.error ||
    data?.detail ||
    data?.errors?.[0]?.message ||
    error?.message ||
    ""
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
  const [selectedShiftId, setSelectedShiftId] = useState("");
  const [shiftFrom, setShiftFrom] = useState(formatDate(new Date()));
  const [shiftTo, setShiftTo] = useState("");

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
  useEffect(() => {
    const getShiftsList = async () => {
      try {
        const data = await fetchShifts();
        setAvailableShifts(data || []);
      } catch (error) {
        toast.error(getBackendMessage(error));
      }
    };
    getShiftsList();
  }, []);

  // Reload whenever the employee OR the viewed month changes
  useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  // --- Allocation handler ---
  const handleSaveAllocation = async () => {
    if (!selectedShiftId || !shiftFrom) {
      toast.error("Please select shift and Effective From date.");
      return;
    }

    try {
      const toFullISO = (dateStr) => {
        if (!dateStr) return null;
        return new Date(dateStr).toISOString();
      };

      const payload = {
        shift_id: Number(selectedShiftId),
        staff_id: employeeUUID,
        from_date: toFullISO(shiftFrom),
        to_date: shiftTo ? toFullISO(shiftTo) : null,
      };

      await allocateShift(payload);
      toast.success("Shift allocated successfully!");
      setShowShiftModal(false);
      setSelectedShiftId("");
      setShiftTo("");
      loadShifts(); // Refresh calendar for the viewed month
    } catch (error) {
      toast.error(getBackendMessage(error));
      console.error("Allocation Error Details:", error.response?.data);
    }
  };

  // --- Calendar helpers ---
  const shiftOptions = availableShifts.map((s) => ({
    label: s.shift_name,
    value: s.id,
  }));

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
      <Toaster position="top-right" />

      {/* --- HEADER --- */}
      <div className="px-6 py-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-black text-white flex items-center justify-center">
            <FiCalendar size={20} />
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
          <FiCalendar size={18} className="text-gray-400 shrink-0" />
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

      {/* --- ALLOCATION MODAL --- */}
      {showShiftModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] backdrop-blur-[2px]">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-[360px] animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-gray-900 text-[16px]">Allocate New Shift</h3>
              <button
                onClick={() => setShowShiftModal(false)}
                className="text-gray-400 hover:text-black transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] text-gray-400 uppercase tracking-wider block mb-1.5">
                  Select Shift
                </label>
                <CustomSelect
                  value={selectedShiftId}
                  options={shiftOptions}
                  onChange={(val) => setSelectedShiftId(Number(val))}
                  minWidth={312}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-gray-400 uppercase tracking-wider block mb-1.5">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={shiftFrom}
                    onChange={(e) => setShiftFrom(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none bg-gray-50 focus:border-black transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-400 uppercase tracking-wider block mb-1.5">
                    To (Optional)
                  </label>
                  <input
                    type="date"
                    value={shiftTo}
                    onChange={(e) => setShiftTo(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none bg-gray-50 focus:border-black transition-colors"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveAllocation}
                className="bg-black text-white w-full py-3 rounded-lg mt-4 text-[11px] uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg active:scale-95"
              >
                Confirm Allocation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageShiftTab;
