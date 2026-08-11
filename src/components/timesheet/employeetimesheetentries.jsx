import React, { useState } from "react";
import {
  Calendar,
  Download,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  FileSpreadsheet,
  FileText,
  FileCode,
} from "lucide-react";
import { exportEmployeeTimesheetReport } from "../../components/helpers/employeeTimesheetExport";

export default function EmployeeTimeSheetEntriesList({
  timesheetData,
  loading,
  error,
  openSections,
  toggleSection,
  formatIsoTime,
  onEditClick,
  onCreateClick,
  summary,
  viewBy,
  selectedDate,
  selectedMonth,
  selectedWeek,
  selectedEmployee,
}) {
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Guard against null/undefined API responses for dates
  const safeTimesheetData = Array.isArray(timesheetData)
    ? timesheetData
    : Array.isArray(timesheetData?.dates)
      ? timesheetData.dates
      : Array.isArray(timesheetData?.data?.dates)
        ? timesheetData.data.dates
        : [];

  // Helper function to format minutes into "Xh Ym"
  const formatMinutesToHours = (totalMins = 0) => {
    const minsNum = Number(totalMins) || 0;
    const hours = Math.floor(minsNum / 60);
    const mins = minsNum % 60;
    return `${hours}h ${mins}m`;
  };

  const handleExport = (fileType) => {
    setShowExportMenu(false);
    exportEmployeeTimesheetReport({
      fileType,
      timesheetData: safeTimesheetData,
      summary,
      viewBy,
      selectedDate,
      selectedMonth,
      selectedWeek,
      formatIsoTime,
      selectedEmployee,
    });
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4 font-poppins font-normal text-gray-700 text-sm">
      <div className="flex justify-between items-center">
        <h2 className="text-base font-normal text-gray-900">
          Employees Timesheet Entries
        </h2>

        <div className="flex items-center gap-2 relative">
          {onCreateClick && (
            <button
              type="button"
              onClick={onCreateClick}
              className="flex items-center gap-1.5 bg-black hover:bg-gray-800 text-white font-normal px-3 py-1.5 rounded-lg text-xs transition-colors"
            >
              <Plus size={14} className="text-white" />
              Create Entry
            </button>
          )}

          {/* Export Dropdown Container */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu((prev) => !prev)}
              className="flex items-center gap-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 font-normal px-3 py-1.5 rounded-lg text-xs transition-colors"
            >
              <Download size={14} />
              Export
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 text-xs">
                <button
                  type="button"
                  onClick={() => handleExport("xlsx")}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                >
                  <FileSpreadsheet size={14} className="text-emerald-600" />
                  Excel (.xlsx)
                </button>
                <button
                  type="button"
                  onClick={() => handleExport("csv")}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                >
                  <FileCode size={14} className="text-blue-600" />
                  CSV
                </button>
                <button
                  type="button"
                  onClick={() => handleExport("pdf")}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                >
                  <FileText size={14} className="text-rose-600" />
                  PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {loading && (
        <div className="p-8 text-center text-gray-500 text-xs font-normal">
          Loading employee timesheet data...
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-lg text-xs font-normal">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-4">
          {safeTimesheetData.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs font-normal border border-dashed rounded-lg">
              No timesheet records found for the selected filter.
            </div>
          ) : (
            safeTimesheetData.map((group) => {
              const isOpen = !!openSections?.[group.work_date];
              const entriesList = Array.isArray(group.entries)
                ? group.entries
                : [];

              const groupTotalMins = group.total_minutes || 0;
              const groupHoursFormatted = formatMinutesToHours(groupTotalMins);

              return (
                <div
                  key={group.work_date}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  {/* Group Header Bar */}
                  <button
                    type="button"
                    onClick={() =>
                      toggleSection && toggleSection(group.work_date)
                    }
                    className="w-full flex justify-between items-center bg-gray-50 hover:bg-gray-100 p-3 text-left transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-black" />
                      <span className="font-normal text-gray-900 text-sm">
                        Work Date: {group.work_date}
                      </span>
                      <span className="text-xs text-gray-500 font-normal ml-2">
                        ({entriesList.length} entries)
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 font-normal">
                        Day Total: {groupTotalMins} mins ({groupHoursFormatted})
                      </span>
                      <ChevronUp
                        size={16}
                        className={`text-gray-700 transition-transform duration-200 ${
                          isOpen ? "" : "rotate-180"
                        }`}
                      />
                    </div>
                  </button>

                  {/* Group Table */}
                  {isOpen && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse font-normal">
                        <thead>
                          <tr className="border-b border-gray-100 bg-white text-gray-500 font-normal">
                            <th className="p-3 w-10 font-normal">#</th>
                            <th className="p-3 font-normal">Employee</th>
                            <th className="p-3 font-normal">Project</th>
                            <th className="p-3 font-normal">Task</th>
                            <th className="p-3 font-normal">Start Time</th>
                            <th className="p-3 font-normal">End Time</th>
                            <th className="p-3 font-normal">Time Taken</th>
                            <th className="p-3 font-normal">Status</th>
                            <th className="p-3 font-normal">Remarks</th>
                            {onEditClick && (
                              <th className="p-3 font-normal text-center">
                                Action
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700 font-normal">
                          {entriesList.map((item, idx) => {
                            const empObj = item.employee || item.user || {};

                            const firstName =
                              item.first_name || empObj.first_name || "";
                            const lastName =
                              item.last_name || empObj.last_name || "";
                            const joinedName = [firstName, lastName]
                              .filter(Boolean)
                              .join(" ");

                            const fullName =
                              item.employee_name ||
                              item.full_name ||
                              empObj.name ||
                              empObj.full_name ||
                              (joinedName.length > 0 ? joinedName : null) ||
                              item.nick_name ||
                              "—";

                            const empCode =
                              item.employee_code ||
                              item.employee_id ||
                              empObj.employee_code ||
                              empObj.code ||
                              item.uuid ||
                              item.id ||
                              "";

                            const entryMins = item.time_taken_minutes || 0;
                            const entryHoursFormatted =
                              formatMinutesToHours(entryMins);
                            const entryTimeDisplay = `${entryMins} mins (${entryHoursFormatted})`;

                            const safeFormatIsoTime = (timeStr) => {
                              if (typeof formatIsoTime === "function") {
                                return formatIsoTime(timeStr);
                              }
                              return timeStr || "—";
                            };

                            const statusColor = item.status_color;

                            return (
                              <tr
                                key={item.id || idx}
                                className="hover:bg-gray-50/60 transition-colors"
                              >
                                <td className="p-3 text-gray-500 font-normal">
                                  {idx + 1}
                                </td>
                                <td className="p-3 font-normal text-gray-900">
                                  <div className="font-medium text-gray-900">
                                    {fullName}
                                  </div>
                                  {empCode && (
                                    <div className="text-[11px] text-gray-400 font-normal">
                                      ({empCode})
                                    </div>
                                  )}
                                </td>
                                <td className="p-3 font-normal text-gray-900">
                                  {item.project || "—"}
                                </td>
                                <td className="p-3 font-normal">
                                  {item.task || "—"}
                                </td>
                                <td className="p-3 text-gray-500 font-mono">
                                  {safeFormatIsoTime(item.start_time)}
                                </td>
                                <td className="p-3 text-gray-500 font-mono">
                                  {safeFormatIsoTime(item.end_time)}
                                </td>
                                <td className="p-3 font-normal font-mono text-gray-900">
                                  {entryTimeDisplay}
                                </td>
                                <td className="p-3">
                                  {statusColor ? (
                                    <span
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-normal border"
                                      style={{
                                        color: statusColor,
                                        borderColor: `${statusColor}33`,
                                        backgroundColor: `${statusColor}12`,
                                      }}
                                    >
                                      <span
                                        className="w-1.5 h-1.5 rounded-full"
                                        style={{ backgroundColor: statusColor }}
                                      ></span>
                                      {item.status_name || "In Progress"}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-normal bg-emerald-50 text-emerald-700 border border-emerald-100">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                      {item.status_name || "In Progress"}
                                    </span>
                                  )}
                                </td>
                                <td className="p-3 text-gray-600 font-normal">
                                  {item.remarks || "—"}
                                </td>
                                {onEditClick && (
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
                                )}
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
          Showing 1 to {safeTimesheetData.length} of {safeTimesheetData.length}{" "}
          dates
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
