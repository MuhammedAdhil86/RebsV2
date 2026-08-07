import React from "react";
import { Search, RotateCcw, Info } from "lucide-react";

export default function TimeSheetFilter({
  viewBy,
  setViewBy,
  selectedDate,
  setSelectedDate,
  selectedMonth,
  setSelectedMonth,
  selectedWeek,
  setSelectedWeek,
  onApply,
  onReset,
}) {
  const MONTHS_LIST = [
    { value: "1", label: "January (01)" },
    { value: "2", label: "February (02)" },
    { value: "3", label: "March (03)" },
    { value: "4", label: "April (04)" },
    { value: "5", label: "May (05)" },
    { value: "6", label: "June (06)" },
    { value: "7", label: "July (07)" },
    { value: "8", label: "August (08)" },
    { value: "9", label: "September (09)" },
    { value: "10", label: "October (10)" },
    { value: "11", label: "November (11)" },
    { value: "12", label: "December (12)" },
  ];

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-3 font-poppins font-normal text-gray-700 text-sm">
      <div className="flex flex-wrap items-end gap-3">
        {/* View By Toggle Button Group */}
        <div>
          <label className="block text-xs font-normal text-gray-700 mb-1">
            View By
          </label>
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
            {["Year", "Month", "Week", "Date"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setViewBy(type)}
                className={`px-4 py-1.5 text-xs font-normal rounded-md transition-all ${
                  viewBy === type
                    ? "bg-black text-white"
                    : "text-gray-600 hover:text-black"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* 1. Date Input - Shown ONLY for 'Date' View */}
        {viewBy === "Date" && (
          <div>
            <label className="block text-xs font-normal text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40 border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-normal focus:ring-1 focus:ring-black focus:outline-none"
            />
          </div>
        )}

        {/* 2. Month Dropdown - Shown ONLY for 'Month' & 'Week' Views */}
        {(viewBy === "Month" || viewBy === "Week") && (
          <div>
            <label className="block text-xs font-normal text-gray-700 mb-1">
              Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-40 border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-normal focus:ring-1 focus:ring-black focus:outline-none bg-white"
            >
              {MONTHS_LIST.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 3. Week Dropdown - Shown ONLY for 'Week' View */}
        {viewBy === "Week" && (
          <div>
            <label className="block text-xs font-normal text-gray-700 mb-1">
              Week
            </label>
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="w-28 border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-normal focus:ring-1 focus:ring-black focus:outline-none bg-white"
            >
              <option value="1">Week 1</option>
              <option value="2">Week 2</option>
              <option value="3">Week 3</option>
              <option value="4">Week 4</option>
            </select>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onApply}
            className="flex items-center gap-1.5 bg-black hover:bg-gray-800 text-white font-normal px-4 py-1.5 rounded-lg text-xs transition-colors"
          >
            <Search size={14} className="text-white" />
            Apply Filters
          </button>
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 font-normal px-3 py-1.5 rounded-lg text-xs transition-colors"
          >
            <RotateCcw size={13} />
            Reset
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 font-normal">
        <Info size={15} className="text-gray-500 shrink-0" />
        <span>
          You can view your timesheets by Year, Month, Week or any specific
          Date.
        </span>
      </div>
    </div>
  );
}
