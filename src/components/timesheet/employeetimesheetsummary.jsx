import React from "react";
import { Calendar, Clock } from "lucide-react";

export default function EmployeeTimeSheetSummary({ summary }) {
  // Helper to get total minutes safely (uses summary.totalMinutes or computes from "Xh Ym" string)
  const getDisplayMinutes = () => {
    if (summary?.totalMinutes !== undefined && summary?.totalMinutes !== null) {
      return summary.totalMinutes;
    }
    if (summary?.totalHours) {
      const match = summary.totalHours.match(/(?:(\d+)h)?\s*(?:(\d+)m)?/);
      if (match) {
        const hours = parseInt(match[1] || "0", 10);
        const mins = parseInt(match[2] || "0", 10);
        return hours * 60 + mins;
      }
    }
    return 0;
  };

  const totalMins = getDisplayMinutes();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-poppins font-normal text-gray-700">
      {/* 1. From Date */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
        <div className="p-2.5 bg-gray-100 text-black rounded-lg">
          <Calendar size={18} />
        </div>
        <div>
          <p className="text-xs text-gray-500 font-normal">From Date</p>
          <p className="text-sm font-normal text-gray-800">
            {summary?.fromDate || "—"}
          </p>
        </div>
      </div>

      {/* 2. To Date */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
        <div className="p-2.5 bg-gray-100 text-black rounded-lg">
          <Calendar size={18} />
        </div>
        <div>
          <p className="text-xs text-gray-500 font-normal">To Date</p>
          <p className="text-sm font-normal text-gray-800">
            {summary?.toDate || "—"}
          </p>
        </div>
      </div>

      {/* 3. Total Minutes (Replaced Active Employees) */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
          <Clock size={18} />
        </div>
        <div>
          <p className="text-xs text-gray-500 font-normal">Total Minutes</p>
          <p className="text-sm font-normal text-gray-800">{totalMins} mins</p>
        </div>
      </div>

      {/* 4. Total Hours */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
        <div className="p-2.5 bg-gray-100 text-black rounded-lg">
          <Clock size={18} />
        </div>
        <div>
          <p className="text-xs text-gray-500 font-normal">Total Hours</p>
          <p className="text-sm font-normal text-gray-800">
            {summary?.totalHours || "0h 0m"}
          </p>
        </div>
      </div>
    </div>
  );
}
