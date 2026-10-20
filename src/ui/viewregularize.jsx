import React, { useState, useEffect } from "react";
import { X, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

import { addregularize } from "../service/employeeService";

/* Read "HH:MM" straight from the ISO string (same approach as the table).
   No Date object, so no timezone shift. */
const formatToTimeInput = (isoString) => {
  if (!isoString) return "";
  const [datePart, timePart] = String(isoString).replace("Z", "").split("T");
  if (!datePart || !timePart) return "";
  if (datePart.startsWith("0001")) return ""; // empty placeholder date
  const [hour, minute] = timePart.split(":");
  return `${hour}:${minute}`;
};

const ViewRegularizationModal = ({
  open,
  data,
  shiftData,
  onClose,
  onSuccess,
  onOptimisticUpdate,
}) => {
  const [inTime, setInTime] = useState("");
  const [outTime, setOutTime] = useState("");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Initialize form fields from the selected row
  useEffect(() => {
    if (open && data) {
      const raw = data.raw_data || {};

      setInTime(
        formatToTimeInput(raw.in_date?.Valid ? raw.in_date?.Time : raw.in),
      );
      setOutTime(
        formatToTimeInput(raw.out_date?.Valid ? raw.out_date?.Time : raw.out),
      );
      setRemarks(raw.remarks || "Admin approved regularization");
    }
  }, [open, data]);

  if (!open || !data) return null;

  // Show the Punch OUT field only when the fetched data actually has an out time
  const rawData = data.raw_data || {};
  const hasOutTime =
    formatToTimeInput(
      rawData.out_date?.Valid ? rawData.out_date?.Time : rawData.out,
    ) !== "";

  // Date part as YYYY-MM-DD (no timezone conversion)
  const targetDateStr = data.raw_data?.in_date?.Time
    ? data.raw_data.in_date.Time.split("T")[0]
    : new Date().toISOString().split("T")[0];

  const handleSubmitApproval = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const apiItem = data.raw_data || {};

      const numericId = apiItem.id; // table row id
      const employeeId = apiItem.user_id; // employee id used in the path

      const trackingIdentifier = String(employeeId);

      if (!trackingIdentifier || trackingIdentifier === "undefined") {
        throw new Error("Missing structural target user identification token.");
      }

      // Rebuild full ISO timestamps without any timezone conversion
      const finalInTimestamp = inTime ? `${targetDateStr}T${inTime}:00Z` : null;
      const finalOutTimestamp = outTime
        ? `${targetDateStr}T${outTime}:00Z`
        : null;

      const payloadBody = {
        request_id: Number(numericId),
        in: finalInTimestamp,
        out: finalOutTimestamp,
        remarks: remarks || "Admin approved regularization",
      };

      // Optimistic update before the request resolves
      if (onOptimisticUpdate) {
        onOptimisticUpdate(data.id, "approved");
      }

      await addregularize(trackingIdentifier, targetDateStr, payloadBody);

      toast.success("Attendance successfully regularized!");
      if (onSuccess) onSuccess();
      if (onClose) onClose(); // close the modal after a successful save
    } catch (error) {
      console.error("Submission action caught error failure:", error);

      const backendMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to update record regularization.";

      toast.error(backendMessage);

      // Revert optimistic state
      if (onOptimisticUpdate) {
        onOptimisticUpdate(data.id, "pending");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal card */}
      <form
        onSubmit={handleSubmitApproval}
        className="relative w-full max-w-md transform overflow-hidden rounded-xl bg-white p-6 shadow-2xl transition-all border border-gray-100 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-50 rounded-lg text-gray-800">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">
              Approve Regularization
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Employee info */}
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center text-xs">
            <div>
              <p className="font-medium text-gray-900">{data.name}</p>
              <p className="text-gray-500 text-[11px]">{data.designation}</p>
            </div>
            <span className="font-mono bg-gray-200/80 px-2 py-0.5 rounded text-gray-700">
              REQ #{data.raw_data?.id || data.id}
            </span>
          </div>

          {/* Time inputs */}
          <div
            className={`grid gap-3 ${hasOutTime ? "grid-cols-2" : "grid-cols-1"}`}
          >
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Modify Punch IN
              </label>
              <input
                type="time"
                value={inTime}
                onChange={(e) => setInTime(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-gray-900 font-mono"
              />
            </div>
            {hasOutTime && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Modify Punch OUT
                </label>
                <input
                  type="time"
                  value={outTime}
                  onChange={(e) => setOutTime(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-gray-900 font-mono"
                />
              </div>
            )}
          </div>

          {/* Date / shift info */}
          <div className="bg-gray-50/50 p-2.5 rounded-lg border border-gray-100 flex items-center gap-2 text-xs text-gray-600">
            <AlertCircle className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span>
              Target Date Scope:{" "}
              <strong className="text-gray-800">{data.date}</strong> (
              {shiftData?.shift_name || "Standard Shift"})
            </span>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Approval Remarks
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Provide comments logged to transaction log audits..."
              className="w-full border border-gray-200 rounded-lg p-2.5 text-xs bg-white focus:outline-none focus:border-gray-900 resize-none"
              required
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 pt-3 border-t border-gray-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white rounded-lg text-xs font-medium transition-colors"
          >
            {submitting ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            Apply
          </button>
        </div>
      </form>
    </div>
  );
};

export default ViewRegularizationModal;
