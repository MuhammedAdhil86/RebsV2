import React, { useEffect, useState } from "react";
import {
  X,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  UserCheck,
} from "lucide-react";
import { FiPaperclip } from "react-icons/fi";

// Helper function to match exact layout matching: 01:07:23 PM (09 Jun 2026)
const formatExactTime12h = (isoString) => {
  if (!isoString || isoString.startsWith("0001-01-01")) return "N/A";

  try {
    const [datePart, timePart] = isoString.split("T");
    const [hourStr, minStr, secWithMs] = timePart.split(":");
    const secStr = secWithMs.substring(0, 2);

    const [year, month, day] = datePart.split("-");
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? "PM" : "AM";

    hour = hour % 12;
    hour = hour ? hour : 12;

    const formattedHour = hour < 10 ? `0${hour}` : hour;

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const formattedDate = `${day} ${months[parseInt(month, 10) - 1]} ${year}`;

    return `${formattedHour}:${minStr}:${secStr} ${ampm} (${formattedDate})`;
  } catch (e) {
    return "N/A";
  }
};

const ViewClaimModal = ({
  open,
  data,
  onClose,
  onStatusUpdate,
  submitting = false,
}) => {
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (open && data) {
      setRemarks("");
    }
  }, [open, data]);

  if (!open || !data) return null;

  const status = data.status ? data.status.toLowerCase() : "pending";

  const getCleanDocType = (file) => {
    if (file.document_type?.includes("pdf")) return "PDF";
    return "IMG";
  };

  // Button Visibility Controls
  const showRemarksInput =
    status === "pending" || status === "approved" || status === "rejected";
  const showRejectButton = status === "pending" || status === "approved";
  const showApproveButton = status === "pending" || status === "rejected";

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
      {/* Backdrop background layer */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Main Container Card */}
      <div className="relative w-full max-w-md transform overflow-hidden rounded-xl bg-white p-6 shadow-2xl transition-all border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Block */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-50 rounded-lg text-gray-800">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">
              {status === "pending"
                ? "Review Claims Request"
                : "Request Details"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Metadata Display Stack */}
        <div className="space-y-4">
          {/* Identity Information Banner */}
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center text-xs">
            <div>
              <p className="font-medium text-gray-900">
                {data.employee_name || data.name}
              </p>
              <p className="text-gray-500 text-[11px]">
                {data.employee_designation || data.designation || "N/A"}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="font-mono bg-gray-200/80 px-2 py-0.5 rounded text-gray-700 font-medium">
                CLAIM #{data.id}
              </span>
              <span className="text-[10px] text-gray-400 font-mono">
                Emp ID: {data.employee_id || "N/A"}
              </span>
            </div>
          </div>

          {/* Details Dual Grid Matrices Layout */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50/50 p-2.5 rounded-lg border border-gray-100 flex flex-col justify-between">
              <div>
                <label className="block text-[11px] font-medium text-gray-400 mb-0.5">
                  Expense Type
                </label>
                <p
                  className="text-xs font-semibold text-gray-700 truncate"
                  title={data.expense_type || data.expenseType}
                >
                  {data.expense_type || data.expenseType || "General Expense"}
                </p>
              </div>
              {(data.employee_phno || data.employee_phno) && (
                <div className="text-[10px] border-t border-gray-200/60 pt-1.5 mt-2 text-gray-400 font-mono truncate">
                  Ph:{" "}
                  <span className="text-gray-700 select-all">
                    {data.employee_phno}
                  </span>
                </div>
              )}
            </div>

            <div className="bg-blue-50/30 p-2.5 rounded-lg border border-blue-100/50 flex flex-col justify-between">
              <div>
                <label className="block text-[11px] font-medium text-blue-500 mb-0.5">
                  Claimed Amount
                </label>
                <p className="text-sm font-bold text-gray-900 truncate">
                  {data.amountDisplay
                    ? data.amountDisplay
                    : `₹ ${(data.amount || 0).toLocaleString("en-IN")}`}
                </p>
              </div>
            </div>
          </div>

          {/* Date Context Banner Matrix */}
          <div className="bg-gray-50/50 p-2.5 rounded-lg border border-gray-100 flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span>
                Expense Date:{" "}
                <strong className="text-gray-800">
                  {data.date ||
                    (data.expense_date
                      ? new Date(data.expense_date).toLocaleDateString(
                          "en-US",
                          { year: "numeric", month: "short", day: "numeric" },
                        )
                      : "N/A")}
                </strong>
              </span>
            </div>
            <span className="text-[11px] font-medium">
              Current Status:{" "}
              <span
                className={`capitalize font-bold ${status === "approved" ? "text-emerald-600" : status === "rejected" ? "text-red-600" : "text-amber-600"}`}
              >
                {data.status}
              </span>
            </span>
          </div>

          {/* Audit Processed Check Log Row (Rendered if dynamic data state applies) */}
          {(data.approved_by || data.approved_at) && (
            <div className="p-3 bg-emerald-50/40 rounded-lg border border-emerald-100/70 text-xs text-gray-600 space-y-1">
              <div className="flex items-center gap-1.5 font-medium text-emerald-800 mb-1">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Processing Log Details</span>
              </div>
              {data.approved_by && (
                <p className="text-[11px]">
                  Processed Handler:{" "}
                  <strong className="text-gray-800">{data.approved_by}</strong>
                </p>
              )}
              {data.approved_at && (
                <p className="text-[11px]">
                  Processed At:{" "}
                  <span className="text-gray-700 font-medium">
                    {formatExactTime12h(data.approved_at)}
                  </span>
                </p>
              )}
            </div>
          )}

          {/* Notes Segment */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Description Notes
            </label>
            <div className="w-full border border-gray-100 rounded-lg p-2.5 text-xs bg-gray-50/50 text-gray-600 italic max-h-20 overflow-y-auto break-words">
              "{data.description || "No descriptions given."}"
            </div>
          </div>

          {/* Document Attachments Panel Area Layout */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Uploaded Attachments
            </label>
            {!data.attachments || data.attachments.length === 0 ? (
              <span className="text-gray-400 italic text-[11px]">
                No documents attached to this claim.
              </span>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {data.attachments.map((file) => (
                  <a
                    key={file.id}
                    href={file.path}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-blue-600 hover:underline bg-blue-50/70 border border-blue-100 px-2.5 py-1 rounded text-[11px] font-semibold transition-all hover:bg-blue-100/70"
                  >
                    <FiPaperclip className="text-xs shrink-0 text-blue-500" />
                    <span>{getCleanDocType(file)} File</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Actions Input TextArea Area */}
          {showRemarksInput && status === "pending" && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Action Remarks
              </label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Provide operation review log audit notes here..."
                className="w-full border border-gray-200 rounded-lg p-2.5 text-xs bg-white focus:outline-none focus:border-gray-900 resize-none"
              />
            </div>
          )}
        </div>

        {/* Bottom Control Buttons Configuration Panel Layout */}
        <div className="mt-6 pt-3 border-t border-gray-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-medium transition-colors"
          >
            Cancel
          </button>

          {showRejectButton && (
            <button
              type="button"
              disabled={submitting}
              onClick={() => onStatusUpdate(data.id, "Rejected")}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-lg text-xs font-medium transition-colors"
            >
              {submitting ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}
              Reject
            </button>
          )}

          {showApproveButton && (
            <button
              type="button"
              disabled={submitting}
              onClick={() => onStatusUpdate(data.id, "Approved")}
              className="flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-gray-800 disabled:bg-gray-300 text-white rounded-lg text-xs font-medium transition-colors"
            >
              {submitting ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              Approve
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewClaimModal;
