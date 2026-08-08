import React, { useState, useEffect } from "react";
import {
  postUpsertTimeSheet,
  fetchTimesheetStatuses,
} from "../service/timesheetservice";
import toast from "react-hot-toast";
import { ArrowLeft, Trash2, RotateCcw } from "lucide-react";

export default function UpdateTimeSheet({ initialData, onBack, onSuccess }) {
  const workDate = initialData?.workDate || "";
  const [submitting, setSubmitting] = useState(false);

  // Status options loaded from API
  const [statusOptions, setStatusOptions] = useState([]);
  const [loadingStatuses, setLoadingStatuses] = useState(false);

  // Helper function to convert ISO string to HH:MM format
  const parseIsoToTime = (isoString) => {
    if (!isoString) return "09:00";
    try {
      const d = new Date(isoString);
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      return `${hours}:${minutes}`;
    } catch {
      return "09:00";
    }
  };

  // Pre-fill form state with existing entries retaining their actual IDs
  const [entries, setEntries] = useState(() => {
    if (initialData?.entries && initialData.entries.length > 0) {
      return initialData.entries.map((item) => ({
        id: item.id, // Preserves existing ID for update
        project: item.project || "",
        task: item.task || "",
        startTime: parseIsoToTime(item.start_time),
        endTime: parseIsoToTime(item.end_time),
        status_id: item.status_id || 1,
        remarks: item.remarks || "",
      }));
    }
    return [];
  });

  // Fetch status dropdown options on mount
  useEffect(() => {
    const loadStatuses = async () => {
      setLoadingStatuses(true);
      try {
        const data = await fetchTimesheetStatuses();
        setStatusOptions(data || []);
      } catch (err) {
        console.error("Failed to load statuses:", err);
      } finally {
        setLoadingStatuses(false);
      }
    };
    loadStatuses();
  }, []);

  // Remove entry row
  const handleRemoveEntryRow = (index) => {
    if (entries.length === 1) {
      toast.error("At least one entry is required.");
      return;
    }
    setEntries((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Reset entry row back to initial pre-filled state or clear inputs
  const handleResetEntryRow = (index) => {
    const initialEntry = initialData?.entries?.[index];

    setEntries((prev) => {
      const updated = [...prev];
      if (initialEntry) {
        // Reset back to original values passed from initialData
        updated[index] = {
          id: initialEntry.id,
          project: initialEntry.project || "",
          task: initialEntry.task || "",
          startTime: parseIsoToTime(initialEntry.start_time),
          endTime: parseIsoToTime(initialEntry.end_time),
          status_id: initialEntry.status_id || 1,
          remarks: initialEntry.remarks || "",
        };
      } else {
        // Fallback clear
        const defaultStatus =
          statusOptions.length > 0 ? statusOptions[0].id : 1;
        updated[index] = {
          id: updated[index].id,
          project: "",
          task: "",
          startTime: "09:00",
          endTime: "11:00",
          status_id: defaultStatus,
          remarks: "",
        };
      }
      return updated;
    });

    toast.success(`Entry #${index + 1} reset successfully.`);
  };

  // Field change handler
  const handleInputChange = (index, field, value) => {
    setEntries((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  // Submit Handler for Update API
  const handleSubmit = async (e) => {
    e.preventDefault();

    for (let i = 0; i < entries.length; i++) {
      if (!entries[i].project.trim() || !entries[i].task.trim()) {
        toast.error(`Please complete Project and Task for entry #${i + 1}`);
        return;
      }
    }

    setSubmitting(true);

    try {
      const formattedEntries = entries.map((item) => {
        const payloadEntry = {
          id: Number(item.id) || 0,
          project: item.project,
          task: item.task,
          status_id: Number(item.status_id) || 1,
          remarks: item.remarks || "",
        };

        if (item.startTime && item.endTime) {
          payloadEntry.start_time = `${workDate}T${item.startTime}:00+05:30`;
          payloadEntry.end_time = `${workDate}T${item.endTime}:00+05:30`;
        }

        return payloadEntry;
      });

      const payload = {
        work_date: workDate,
        entries: formattedEntries,
      };

      await postUpsertTimeSheet(payload);
      toast.success("Timesheet updated successfully!");

      if (onSuccess) onSuccess();
      if (onBack) onBack();
    } catch (err) {
      console.error("Error updating timesheet:", err);
      toast.error(err.response?.data?.message || "Failed to update timesheet.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6 font-poppins font-normal text-gray-700 text-sm">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 border border-gray-200 rounded-lg text-gray-600 hover:text-black hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-base font-normal text-gray-900">
              Update Timesheet Entry
            </h2>
            <p className="text-xs text-gray-500 font-normal">
              Editing log entries for {workDate}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-normal text-gray-700">
            Work Date:
          </label>
          <input
            type="date"
            disabled
            value={workDate}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-normal bg-gray-100 cursor-not-allowed text-gray-500"
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {entries.map((entry, index) => {
            // Find current selected status object to extract color
            const currentStatusObj = statusOptions.find(
              (st) => String(st.id) === String(entry.status_id),
            );

            return (
              <div
                key={index}
                className="p-4 border border-gray-200 rounded-xl bg-gray-50/50 space-y-3 relative"
              >
                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                  <span className="text-xs font-normal text-black">
                    Entry #{index + 1}{" "}
                    {entry.id > 0 ? `(ID: #${entry.id})` : ""}
                  </span>

                  {/* Actions: Reset & Remove */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleResetEntryRow(index)}
                      className="p-1 text-gray-400 hover:text-amber-600 transition-colors rounded"
                      title="Reset to initial entry values"
                    >
                      <RotateCcw size={14} />
                    </button>

                    {entries.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveEntryRow(index)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors rounded"
                        title="Remove Entry"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-normal text-gray-700 mb-1">
                      Project *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Payroll"
                      value={entry.project}
                      onChange={(e) =>
                        handleInputChange(index, "project", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-normal focus:ring-1 focus:ring-black focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-normal text-gray-700 mb-1">
                      Task *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bug Fix done"
                      value={entry.task}
                      onChange={(e) =>
                        handleInputChange(index, "task", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-normal focus:ring-1 focus:ring-black focus:outline-none bg-white"
                    />
                  </div>

                  {/* Dynamic Statuses Dropdown with Dynamic Colors */}
                  <div>
                    <label className="block text-xs font-normal text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={entry.status_id}
                      onChange={(e) =>
                        handleInputChange(index, "status_id", e.target.value)
                      }
                      disabled={loadingStatuses}
                      style={{
                        color: currentStatusObj?.color || "#000000",
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-semibold focus:ring-1 focus:ring-black focus:outline-none bg-white"
                    >
                      {statusOptions.length > 0 ? (
                        statusOptions.map((st) => (
                          <option
                            key={st.id}
                            value={st.id}
                            style={{ color: st.color || "#000000" }}
                          >
                            {st.status_name}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value={1} style={{ color: "#2563EB" }}>
                            In Progress
                          </option>
                          <option value={2} style={{ color: "#16A34A" }}>
                            Completed
                          </option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-normal text-gray-700 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={entry.startTime}
                      onChange={(e) =>
                        handleInputChange(index, "startTime", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-normal focus:ring-1 focus:ring-black focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-normal text-gray-700 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={entry.endTime}
                      onChange={(e) =>
                        handleInputChange(index, "endTime", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-normal focus:ring-1 focus:ring-black focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-normal text-gray-700 mb-1">
                      Remarks
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Updated existing task"
                      value={entry.remarks}
                      onChange={(e) =>
                        handleInputChange(index, "remarks", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-normal focus:ring-1 focus:ring-black focus:outline-none bg-white"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-normal text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 bg-black hover:bg-gray-800 text-white rounded-lg text-xs font-normal transition-colors disabled:opacity-50"
          >
            {submitting ? "Updating..." : "Update Timesheet"}
          </button>
        </div>
      </form>
    </div>
  );
}
