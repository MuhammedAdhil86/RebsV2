import React, { useState, useMemo, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { Icon } from "@iconify/react";

const VISIBLE_DAYS = 5;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* ================= MONTH FIELD (custom calendar icon) ================= */
const MonthField = ({ label, value, onChange }) => {
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
          type="month"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onClick={openPicker}
          className="bg-slate-50 border border-gray-200 rounded-lg pl-3 pr-9 py-2 text-xs text-gray-700 cursor-pointer focus:bg-white focus:border-gray-900 focus:outline-none transition-all [&::-webkit-calendar-picker-indicator]:hidden"
        />
        <button
          type="button"
          onClick={openPicker}
          tabIndex={-1}
          aria-label="Open month picker"
          className="absolute right-2.5 top-1/2 -translate-y-1/2"
        >
          <Icon icon="solar:calendar-outline" className="w-4 h-4 text-black" />
        </button>
      </div>
    </div>
  );
};

const ShiftCalendarView = ({
  onBack,
  calendarAllocations = [],
  calendarLoading,
  departmentsList = [],
  calMonth,
  setCalMonth,
  calUserId,
  setCalUserId,
  calDeptId,
  setCalDeptId,
}) => {
  const [calendarStartIndex, setCalendarStartIndex] = useState(0);

  // Build the real day list for the selected month (28–31 days)
  const calendarDays = useMemo(() => {
    const [year, month] = (calMonth || "").split("-").map(Number);
    if (!year || !month) return [];
    const total = new Date(year, month, 0).getDate();
    return Array.from({ length: total }, (_, i) => {
      const date = new Date(year, month - 1, i + 1);
      return {
        day: String(i + 1).padStart(2, "0"),
        weekday: WEEKDAYS[date.getDay()],
      };
    });
  }, [calMonth]);

  const maxStart = Math.max(0, calendarDays.length - VISIBLE_DAYS);

  // Go back to the first days whenever the month changes
  useEffect(() => {
    setCalendarStartIndex(0);
  }, [calMonth]);

  const visibleDays = calendarDays.slice(
    calendarStartIndex,
    calendarStartIndex + VISIBLE_DAYS,
  );

  // Client filter: returns all if blank
  const filteredAllocations = useMemo(() => {
    const query = (calUserId || "").trim().toLowerCase();
    if (!query) return calendarAllocations;

    return calendarAllocations.filter(
      (emp) =>
        emp?.full_name?.toLowerCase().includes(query) ||
        String(emp?.user_id || "")
          .toLowerCase()
          .includes(query),
    );
  }, [calendarAllocations, calUserId]);

  const rangeLabel =
    visibleDays.length > 0
      ? `${visibleDays[0].day} – ${visibleDays[visibleDays.length - 1].day}`
      : "";

  return (
    <div className="w-full space-y-6">
      {/* --- CALENDAR HEADER TOOLBAR --- */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 mb-2 transition-colors"
          >
            <Icon icon="solar:arrow-left-outline" className="w-4 h-4" />
            Back to Bulk Form Panel
          </button>
          <h1 className="text-xl text-gray-900 tracking-tight flex items-center gap-2">
            <span className="p-1.5 bg-slate-100 rounded-lg">
              <Icon
                icon="solar:calendar-outline"
                className="w-4 h-4 text-black"
              />
            </span>
            Shift Matrix Overview
          </h1>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          {/* Month */}
          <MonthField label="Month" value={calMonth} onChange={setCalMonth} />

          {/* Department */}
          <div>
            <label className="text-[11px] text-gray-500 block mb-1.5">
              Department
            </label>
            <div className="relative">
              <select
                value={calDeptId}
                onChange={(e) => setCalDeptId(e.target.value)}
                className="bg-slate-50 border border-gray-200 rounded-lg pl-3 pr-9 py-2 text-xs appearance-none text-gray-700 min-w-[150px] focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all"
              >
                <option value="">All Departments</option>
                {departmentsList?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                size={14}
              />
            </div>
          </div>

          {/* Employee search */}
          <div>
            <label className="text-[11px] text-gray-500 block mb-1.5">
              Search Employee Name / ID
            </label>
            <div className="relative min-w-[210px]">
              <Icon
                icon="solar:magnifer-outline"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Type name or code..."
                value={calUserId || ""}
                onChange={(e) => setCalUserId(e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 rounded-lg pl-8 pr-8 py-2 text-xs text-gray-700 placeholder-gray-400 focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all"
              />
              {calUserId && (
                <button
                  type="button"
                  onClick={() => setCalUserId("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  <Icon icon="solar:close-circle-outline" className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Day-range pagination */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={calendarStartIndex === 0}
              onClick={() =>
                setCalendarStartIndex((prev) =>
                  Math.max(0, prev - VISIBLE_DAYS),
                )
              }
              aria-label="Previous days"
              className="p-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Icon icon="solar:alt-arrow-left-outline" className="w-4 h-4" />
            </button>
            <span className="text-[11px] text-gray-500 min-w-[52px] text-center">
              {rangeLabel}
            </span>
            <button
              type="button"
              disabled={calendarStartIndex >= maxStart}
              onClick={() =>
                setCalendarStartIndex((prev) =>
                  Math.min(maxStart, prev + VISIBLE_DAYS),
                )
              }
              aria-label="Next days"
              className="p-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Icon icon="solar:alt-arrow-right-outline" className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* --- CALENDAR UI GRID --- */}
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-4">
        {calendarLoading ? (
          <div className="flex justify-center p-24 text-gray-400 text-xs">
            Loading shift matrix...
          </div>
        ) : filteredAllocations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-24 text-gray-400 gap-2">
            <Icon
              icon="solar:calendar-outline"
              className="w-7 h-7 text-gray-300"
            />
            <span className="text-xs">
              No shift allocations found for this search.
            </span>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-xl overflow-hidden overflow-x-auto">
            <div className="min-w-[640px]">
              {/* Header Row */}
              <div className="grid grid-cols-[220px_repeat(5,1fr)] bg-slate-50/70 border-b border-gray-200 text-[11px] text-gray-500 uppercase tracking-wider">
                <div className="p-3.5 border-r border-gray-200">
                  Staff Details
                </div>
                {visibleDays.map((d) => (
                  <div
                    key={d.day}
                    className="p-3.5 text-center border-r border-gray-200 last:border-r-0"
                  >
                    {d.day}
                    <span className="ml-1 text-gray-400 normal-case">
                      {d.weekday}
                    </span>
                  </div>
                ))}
              </div>

              {/* Data Rows */}
              <div className="divide-y divide-gray-200 text-xs text-gray-700">
                {filteredAllocations.map((emp, idx) => {
                  const initials = (emp.full_name || "S")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <div
                      key={emp.user_id || idx}
                      className="grid grid-cols-[220px_repeat(5,1fr)] bg-white hover:bg-slate-50/40 transition-colors"
                    >
                      <div className="p-3 border-r border-gray-200 flex items-center gap-2.5 min-w-0">
                        <div className="h-7 w-7 shrink-0 rounded-full bg-slate-100 text-gray-600 flex items-center justify-center text-[10px] tracking-wide">
                          {initials}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-gray-900 truncate">
                            {emp.full_name}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            Ref: {emp.user_id}
                          </span>
                        </div>
                      </div>

                      {(emp.shifts || [])
                        .slice(
                          calendarStartIndex,
                          calendarStartIndex + VISIBLE_DAYS,
                        )
                        .map((shift, i) => (
                          <div
                            key={i}
                            className="p-2 border-r border-gray-200 last:border-r-0 min-h-[96px]"
                          >
                            {shift?.type === "work" ? (
                              <div className="h-full border border-yellow-200 bg-yellow-50 rounded-lg p-2 text-[10px] flex flex-col justify-between">
                                <span className="text-gray-900 text-[11px] truncate">
                                  {shift.name}
                                </span>
                                <span
                                  className={`self-start mt-2 px-1.5 py-0.5 rounded text-[9px] ${
                                    shift.in === "Night"
                                      ? "bg-gray-900 text-white"
                                      : "bg-white border border-gray-200 text-gray-600"
                                  }`}
                                >
                                  {shift.in}
                                </span>
                              </div>
                            ) : (
                              <div className="h-full border border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-300 gap-1 bg-gray-50/30">
                                <Icon
                                  icon="solar:calendar-outline"
                                  className="w-4 h-4 text-gray-400"
                                />
                                <span className="text-[9px] text-gray-400">
                                  Weekly Off
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShiftCalendarView;
