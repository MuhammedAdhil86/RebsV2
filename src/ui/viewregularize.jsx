import React, { useState, useEffect } from "react";
import { X, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

// Import your dynamic endpoint function
import { addregularize } from "../service/employeeService";

const ViewRegularizationModal = ({
  open,
  data,
  shiftData,
  onClose,
  onSuccess,
  onOptimisticUpdate,
}) => {
  // Capture current state adjustments locally for editing form inputs
  const [inTime, setInTime] = useState("");
  const [outTime, setOutTime] = useState("");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Initialize form fields gracefully from row selection objects
  useEffect(() => {
    if (open && data) {
      const raw = data.raw_data || {};

      // Helper to parse ISO strings safely down into HTML input "HH:MM" format
      const formatToTimeInput = (isoString) => {
        if (!isoString) return "";
        try {
          const d = new Date(isoString);
          // Return empty string if date object points to system base placeholder (0001-01-01)
          if (d.getFullYear() <= 1) return "";
          return d.toTimeString().slice(0, 5); // Returns "HH:MM"
        } catch {
          return "";
        }
      };

      setInTime(formatToTimeInput(raw.in_date?.Time || raw.in));
      setOutTime(formatToTimeInput(raw.out_date?.Time || raw.out));
      setRemarks(raw.remarks || "Admin approved regularization");
    }
  }, [open, data]);

  if (!open || !data) return null;

  // Extract date component safely from string mapping values (e.g., "2026-05-07")
  const targetDateStr = data.raw_data?.in_date?.Time
    ? data.raw_data.in_date.Time.split("T")[0]
    : new Date().toISOString().split("T")[0]; // Fallback to YYYY-MM-DD

  // Execution handler when submittal button fires
  const handleSubmitApproval = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const apiItem = data.raw_data || {};

      const numericId = apiItem.id; // The table sequence integer id (e.g., 91)
      const employeeId = apiItem.user_id; // The employee unique identity token (e.g., "100336")

      // CRITICAL FIX: Pass the user_id (UUID string) as the path parameter flag
      const trackingIdentifier = String(employeeId);

      if (!trackingIdentifier || trackingIdentifier === "undefined") {
        throw new Error("Missing structural target user identification token.");
      }

      // 1. Re-construct raw inputs back into explicit full ISO timestamps context strings
      const finalInTimestamp = inTime ? `${targetDateStr}T${inTime}:00Z` : null;
      const finalOutTimestamp = outTime
        ? `${targetDateStr}T${outTime}:00Z`
        : null;

      // 2. Build flat payload body matching your backend body expectations
      const payloadBody = {
        request_id: Number(numericId), // The sequence row integer id goes into the body as request_id
        in: finalInTimestamp,
        out: finalOutTimestamp,
        remarks: remarks || "Admin approved regularization",
      };

      // 3. Optimistic local state rendering injection before roundtrip resolution completes
      if (onOptimisticUpdate) {
        onOptimisticUpdate(data.id, "approved");
      }

      // 4. Fire the addregularize function endpoint
      await addregularize(trackingIdentifier, targetDateStr, payloadBody);

      toast.success("Attendance successfully regularized!");
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Submission action caught error failure:", error);

      // Extract the real error message text directly from backend response payload if available
      const backendMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to update record regularization.";

      // Display the explicit backend error via react-hot-toast
      toast.error(backendMessage);

      // Revert optimistic presentation state cleanly to pending if network drops out
      if (onOptimisticUpdate) {
        onOptimisticUpdate(data.id, "pending");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
      {/* Backdrop background layer mask overlay shadow */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Primary content platform card box */}
      <form
        onSubmit={handleSubmitApproval}
        className="relative w-full max-w-md transform overflow-hidden rounded-xl bg-white p-6 shadow-2xl transition-all border border-gray-100 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Title Context Header Alignment */}
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

        {/* Dynamic Display Layout Data Rows fields mapping container grids */}
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center text-xs">
            <div>
              <p className="font-medium text-gray-900">{data.name}</p>
              <p className="text-gray-500 text-[11px]">{data.designation}</p>
            </div>
            <span className="font-mono bg-gray-200/80 px-2 py-0.5 rounded text-gray-700">
              REQ #{data.raw_data?.id || data.id}
            </span>
          </div>

          {/* Core Input Entry Boxes Elements */}
          <div className="grid grid-cols-2 gap-3">
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
          </div>

          {/* Allocation Info Sheet summary block container */}
          <div className="bg-gray-50/50 p-2.5 rounded-lg border border-gray-100 flex items-center gap-2 text-xs text-gray-600">
            <AlertCircle className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span>
              Target Date Scope:{" "}
              <strong className="text-gray-800">{data.date}</strong> (
              {shiftData?.shift_name || "Standard Shift"})
            </span>
          </div>

          {/* Submission logging custom text field boxes elements inputs components */}
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

        {/* Lower actionable submission panels layers buttons layouts splits sets */}
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
