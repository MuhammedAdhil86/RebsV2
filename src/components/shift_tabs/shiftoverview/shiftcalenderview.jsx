import React, { useState, useMemo } from "react";
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiArrowLeft,
  FiSearch,
  FiX,
} from "react-icons/fi";
import { ChevronDown } from "lucide-react";

const ShiftCalendarView = ({
  onBack,
  calendarAllocations = [],
  calendarLoading,
  departmentsList,
  calMonth,
  setCalMonth,
  calUserId,
  setCalUserId,
  calDeptId,
  setCalDeptId,
}) => {
  const [calendarStartIndex, setCalendarStartIndex] = useState(0);

  const calendarDays = Array.from(
    { length: 31 },
    (_, i) => `${String(i + 1).padStart(2, "0")}-Day`,
  );

  // ⚡ High-performance client filter: Returns all if blank, cleans up query immediately
  const filteredAllocations = useMemo(() => {
    const query = (calUserId || "").trim().toLowerCase();
    if (!query) return calendarAllocations;

    return calendarAllocations.filter((emp) => {
      return (
        emp?.full_name?.toLowerCase().includes(query) ||
        String(emp?.user_id || "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [calendarAllocations, calUserId]);

  return (
    <div className="w-full space-y-6 animate-fadeIn">
      {/* --- CALENDAR HEADER TOOLBAR --- */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 mb-2 transition-colors font-normal"
          >
            <FiArrowLeft size={14} /> Back to Bulk Form Panel
          </button>
          <h1 className="text-lg text-gray-900 font-normal tracking-tight">
            Shift Matrix Overview
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Month Input */}
          <div>
            <label className="text-[10px] text-gray-400 block mb-1 font-normal">
              Month
            </label>
            <input
              type="month"
              value={calMonth}
              onChange={(e) => setCalMonth(e.target.value)}
              className="bg-slate-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:bg-white outline-none font-normal"
            />
          </div>

          {/* Department Filter Select Box */}
          <div className="relative">
            <label className="text-[10px] text-gray-400 block mb-1 font-normal">
              Department
            </label>
            <div className="relative">
              <select
                value={calDeptId}
                onChange={(e) => setCalDeptId(e.target.value)}
                className="bg-slate-50 border border-gray-200 rounded-lg pl-2.5 pr-8 py-1.5 text-xs focus:bg-white outline-none font-normal appearance-none min-w-[130px]"
              >
                <option value="">All Departments</option>
                {departmentsList?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                size={12}
              />
            </div>
          </div>

          {/* 🔍 Dynamic Live Name / ID Search Input */}
          <div>
            <label className="text-[10px] text-gray-400 block mb-1 font-normal">
              Search Employee Name / ID
            </label>
            <div className="relative min-w-[180px]">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                <FiSearch size={12} />
              </span>
              <input
                type="text"
                placeholder="Type name or code..."
                value={calUserId || ""}
                onChange={(e) => setCalUserId(e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 rounded-lg pl-7 pr-7 py-1.5 text-xs focus:bg-white focus:border-gray-400 outline-none font-normal text-gray-800"
              />
              {calUserId && (
                <button
                  type="button"
                  onClick={() => setCalUserId("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FiX size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Slider Pagination Controls */}
          <div className="flex items-center gap-1 pl-2 mt-4">
            <button
              onClick={() =>
                setCalendarStartIndex((prev) => Math.max(0, prev - 5))
              }
              className="p-1.5 border rounded-lg bg-white hover:bg-slate-50 text-gray-600 transition-colors"
            >
              <FiChevronLeft size={16} />
            </button>
            <button
              onClick={() =>
                setCalendarStartIndex((prev) =>
                  Math.min(calendarDays.length - 5, prev + 5),
                )
              }
              className="p-1.5 border rounded-lg bg-white hover:bg-slate-50 text-gray-600 transition-colors"
            >
              <FiChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* --- CALENDAR UI GRID --- */}
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-4">
        {calendarLoading ? (
          <div className="flex justify-center p-24 text-gray-400 text-xs font-normal">
            Loading Grid Matrix...
          </div>
        ) : filteredAllocations.length === 0 ? (
          <div className="flex justify-center p-24 text-gray-400 text-xs font-normal">
            No shift allocations found matching search letters.
          </div>
        ) : (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            {/* Header Row */}
            <div className="grid grid-cols-[220px_repeat(5,1fr)] bg-slate-50/80 border-b border-gray-200 text-[11px] font-normal text-gray-500">
              <div className="p-3 border-r border-gray-200 font-normal">
                Staff Details
              </div>
              {calendarDays
                .slice(calendarStartIndex, calendarStartIndex + 5)
                .map((day, i) => (
                  <div
                    key={i}
                    className="p-3 text-center border-r border-gray-200 last:border-r-0 font-normal"
                  >
                    {day}
                  </div>
                ))}
            </div>

            {/* Data Rows */}
            <div className="divide-y divide-gray-200">
              {filteredAllocations.map((emp, idx) => (
                <div
                  key={emp.user_id || idx}
                  className="grid grid-cols-[220px_repeat(5,1fr)] bg-white"
                >
                  <div className="p-3 border-r border-gray-200 flex items-center gap-3">
                    <div className="flex flex-col truncate">
                      <span className="font-normal text-gray-900 truncate">
                        {emp.full_name}
                      </span>
                      <span className="text-[10px] text-gray-400 font-normal">
                        Ref: {emp.user_id}
                      </span>
                    </div>
                  </div>

                  {(emp.shifts || [])
                    .slice(calendarStartIndex, calendarStartIndex + 5)
                    .map((shift, i) => (
                      <div
                        key={i}
                        className="p-2 border-r border-gray-200 last:border-r-0 min-h-[110px]"
                      >
                        {shift?.type === "work" ? (
                          <div className="h-full border border-gray-200 bg-slate-50 rounded-lg p-2 text-[10px] flex flex-col justify-between">
                            <div className="flex items-center gap-1 text-gray-900 font-normal">
                              <span className="uppercase text-[9px] tracking-wide truncate">
                                {shift.name}
                              </span>
                            </div>
                            <div className="space-y-0.5 mt-2 text-gray-500 font-normal text-[9px]">
                              <div className="flex justify-between">
                                <span>Type:</span>{" "}
                                <span className="font-mono text-[8px] text-gray-400">
                                  {shift.in}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full border border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-[10px] text-gray-300 gap-1 bg-gray-50/30 font-normal">
                            <FiCalendar size={13} />
                            <span className="text-[9px]">Weekly Off</span>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShiftCalendarView;
