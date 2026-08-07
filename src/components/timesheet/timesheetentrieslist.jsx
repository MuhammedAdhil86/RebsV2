import React from "react";
import {
  Calendar,
  Download,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
} from "lucide-react";

export default function TimeSheetEntriesList({
  timesheetData,
  loading,
  error,
  openSections,
  toggleSection,
  formatIsoTime,
  onEditClick,
  onCreateClick,
}) {
  return (
    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4 font-poppins font-normal text-gray-700 text-sm">
      <div className="flex justify-between items-center">
        <h2 className="text-base font-normal text-gray-900">
          Timesheet Entries
        </h2>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCreateClick}
            className="flex items-center gap-1.5 bg-black hover:bg-gray-800 text-white font-normal px-3 py-1.5 rounded-lg text-xs transition-colors"
          >
            <Plus size={14} className="text-white" />
            Create Entry
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 font-normal px-3 py-1.5 rounded-lg text-xs transition-colors"
          >
            <Download size={14} />
            Export
          </button>
        </div>
      </div>

      {loading && (
        <div className="p-8 text-center text-gray-500 text-xs font-normal">
          Loading timesheet data...
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-lg text-xs font-normal">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-4">
          {timesheetData.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs font-normal border border-dashed rounded-lg">
              No timesheet records found for the selected filter.
            </div>
          ) : (
            timesheetData.map((group) => {
              const isOpen = !!openSections[group.work_date];
              const hoursTaken = `${Math.floor(group.total_minutes / 60)}h ${group.total_minutes % 60}m`;

              return (
                <div
                  key={group.work_date}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  {/* Group Header Bar */}
                  <button
                    type="button"
                    onClick={() => toggleSection(group.work_date)}
                    className="w-full flex justify-between items-center bg-gray-50 hover:bg-gray-100 p-3 text-left transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-black" />
                      <span className="font-normal text-gray-900 text-sm">
                        {group.work_date}
                      </span>
                      <span className="text-xs text-gray-500 font-normal ml-2">
                        Total: {group.total_minutes} mins ({hoursTaken})
                      </span>
                    </div>
                    <ChevronUp
                      size={16}
                      className={`text-gray-700 transition-transform duration-200 ${
                        isOpen ? "" : "rotate-180"
                      }`}
                    />
                  </button>

                  {/* Group Table */}
                  {isOpen && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse font-normal">
                        <thead>
                          <tr className="border-b border-gray-100 bg-white text-gray-500 font-normal">
                            <th className="p-3 w-10 font-normal">#</th>
                            <th className="p-3 font-normal">Project</th>
                            <th className="p-3 font-normal">Task</th>
                            <th className="p-3 font-normal">Start Time</th>
                            <th className="p-3 font-normal">End Time</th>
                            <th className="p-3 font-normal">Time Taken</th>
                            <th className="p-3 font-normal">Status</th>
                            <th className="p-3 font-normal">Remarks</th>
                            <th className="p-3 font-normal text-center">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700 font-normal">
                          {group.entries.map((item, idx) => {
                            const hours = Math.floor(
                              item.time_taken_minutes / 60,
                            );
                            const mins = item.time_taken_minutes % 60;
                            const timeFormatted = `${item.time_taken_minutes} mins (${hours}h ${mins}m)`;

                            return (
                              <tr
                                key={item.id}
                                className="hover:bg-gray-50/60 transition-colors"
                              >
                                <td className="p-3 text-gray-500 font-normal">
                                  {idx + 1}
                                </td>
                                <td className="p-3 font-normal text-gray-900">
                                  {item.project}
                                </td>
                                <td className="p-3 font-normal">{item.task}</td>
                                <td className="p-3 text-gray-500 font-normal">
                                  {formatIsoTime(item.start_time)}
                                </td>
                                <td className="p-3 text-gray-500 font-normal">
                                  {formatIsoTime(item.end_time)}
                                </td>
                                <td className="p-3 font-normal">
                                  {timeFormatted}
                                </td>
                                <td className="p-3">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-normal bg-emerald-50 text-emerald-700 border border-emerald-100">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    {item.status_name}
                                  </span>
                                </td>
                                <td className="p-3 text-gray-600 font-normal">
                                  {item.remarks || "—"}
                                </td>
                                <td className="p-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onEditClick(item, group.work_date)
                                    }
                                    className="p-1 text-gray-500 hover:text-black transition-colors rounded hover:bg-gray-100"
                                    title="Edit Entry"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row justify-between items-center pt-2 text-xs text-gray-500 font-normal gap-2">
        <span>
          Showing 1 to {timesheetData.length} of {timesheetData.length} dates
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="p-1.5 rounded border border-gray-200 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            disabled
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            className="px-2.5 py-1 rounded bg-black text-white font-normal text-xs"
          >
            1
          </button>
          <button
            type="button"
            className="p-1.5 rounded border border-gray-200 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            disabled
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
