import React from "react";
import { Calendar, Clock } from "lucide-react";

export default function TimeSheetSummary({ summary }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-poppins font-normal text-gray-700">
      {/* From Date Card */}
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

      {/* To Date Card */}
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

      {/* Total Minutes Card */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
          <Clock size={18} />
        </div>
        <div>
          <p className="text-xs text-gray-500 font-normal">Total Minutes</p>
          <p className="text-sm font-normal text-gray-800">
            {summary?.totalMinutes ?? 0} mins
          </p>
        </div>
      </div>

      {/* Total Hours Card */}
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
