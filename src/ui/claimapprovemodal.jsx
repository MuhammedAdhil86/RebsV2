import React from "react";
import { X, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { FiPaperclip } from "react-icons/fi";

const ViewClaimModal = ({
  open,
  data,
  onClose,
  onStatusUpdate,
  submitting = false,
}) => {
  if (!open || !data) return null;

  const getCleanDocType = (file) => {
    if (file.document_type?.includes("pdf")) return "PDF";
    return "IMG";
  };

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
      {/* Backdrop background layer mask overlay shadow */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Primary content platform card box */}
      <div className="relative w-full max-w-md transform overflow-hidden rounded-xl bg-white p-6 shadow-2xl transition-all border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Title Context Header Alignment */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-50 rounded-lg text-gray-800">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">
              {data.status === "Pending"
                ? "Review Claims Request"
                : "Request Details"}
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
              <p className="font-semibold text-gray-900 text-sm">{data.name}</p>
              <p className="text-gray-500 text-[11px] mt-0.5">
                {data.designation}
              </p>
            </div>
            <span className="font-mono bg-gray-200/80 px-2 py-0.5 rounded text-gray-700">
              CLAIM #{data.id}
            </span>
          </div>

          {/* Details Metadata Stack */}
          <div className="space-y-2.5 text-xs text-gray-600 px-0.5">
            <p className="flex justify-between border-b border-gray-50 pb-1.5">
              <span className="text-gray-400">Employee Name:</span>
              <strong className="text-gray-900 font-semibold">
                {data.name}
              </strong>
            </p>
            <p className="flex justify-between border-b border-gray-50 pb-1.5">
              <span className="text-gray-400">Phone Number:</span>
              <strong className="text-gray-800 font-medium">
                {data.employee_phno || "N/A"}
              </strong>
            </p>
            <p className="flex justify-between border-b border-gray-50 pb-1.5">
              <span className="text-gray-400">Expense Type:</span>
              <strong className="text-gray-800 font-medium">
                {data.expenseType}
              </strong>
            </p>
            <p className="flex justify-between border-b border-gray-50 pb-1.5">
              <span className="text-gray-400">Amount:</span>
              <strong className="text-gray-900 font-bold text-sm">
                {data.amountDisplay}
              </strong>
            </p>
          </div>

          {/* Date Context Summary Banner */}
          <div className="bg-gray-50/50 p-2.5 rounded-lg border border-gray-100 flex items-center gap-2 text-xs text-gray-600">
            <AlertCircle className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span>
              Expense Date:{" "}
              <strong className="text-gray-800">{data.date}</strong>
            </span>
          </div>

          {/* Notes Block */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Description Notes
            </label>
            <div className="w-full border border-gray-100 rounded-lg p-2.5 text-xs bg-gray-50/50 text-gray-600 italic max-h-20 overflow-y-auto break-words">
              "{data.description || "No descriptions given."}"
            </div>
          </div>

          {/* Attachments Section Layout */}
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

          {/* Audit processed check signature */}
          {data.approved_by?.trim() && (
            <div className="pt-2 border-t border-dashed border-gray-100 text-[11px] text-gray-400 flex justify-between">
              <span>Processed Handler:</span>
              <span className="font-medium text-gray-700">
                {data.approved_by}
              </span>
            </div>
          )}
        </div>

        {/* Action Button Controls Row Panel */}
        <div className="mt-6 pt-3 border-t border-gray-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-medium transition-colors"
          >
            Close
          </button>

          {data.status === "Pending" && (
            <>
              <button
                type="button"
                disabled={submitting}
                onClick={() => onStatusUpdate(data.id, "Rejected")}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
              >
                {submitting && (
                  <span className="w-3.5 h-3.5 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
                )}
                Reject
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => onStatusUpdate(data.id, "Approved")}
                className="flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                Approve
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewClaimModal;
