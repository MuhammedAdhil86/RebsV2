import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Icon } from "@iconify/react";
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

// Returns the first usable value; unwraps SQL nullable objects like { Valid, String }
const pick = (...vals) => {
  for (const v of vals) {
    if (v === undefined || v === null || v === "") continue;
    if (typeof v === "object") {
      if (v.Valid) {
        const inner = v.String ?? v.Int64 ?? v.Int32;
        if (inner !== undefined && inner !== "") return inner;
      }
      continue;
    }
    return v;
  }
  return "N/A";
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

  // Uncomment to see the exact keys your row object has:
  // console.log("CLAIM DATA:", data);

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

  /* ---------- Shared style classes (same as AdvanceSalaryApprovalModal) ---------- */
  const labelCls = "block mb-1 font-medium text-gray-700";
  const inputCls =
    "w-full border p-3 rounded-2xl bg-gray-50 text-gray-600 truncate";

  const spinner = (
    <span className="inline-block w-3.5 h-3.5 mr-2 align-middle border-2 border-white/30 border-t-white rounded-full animate-spin" />
  );

  const expenseDateText =
    data.date ||
    (data.expense_date
      ? new Date(data.expense_date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "N/A");

  const amountText = data.amountDisplay
    ? data.amountDisplay
    : `₹ ${(data.amount || 0).toLocaleString("en-IN")}`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm font-poppins text-[12px]"
      onClick={onClose}
    >
      <div
        className="bg-white w-[95%] max-w-[820px] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="px-8 py-4 flex items-center justify-between border-b border-gray-50 bg-white">
          <div className="flex items-center gap-3">
            <Icon
              icon="solar:shield-check-outline"
              className="w-5 h-5 text-black"
            />
            <div>
              <h2 className="text-gray-900 text-[16px] font-medium uppercase">
                {status === "pending"
                  ? "Review Claims Request"
                  : "Request Details"}
              </h2>
              <p className="text-gray-400 text-[10px]">
                Review and update the staff claim
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="px-8 py-5 space-y-4 overflow-y-auto">
          {/* GRID: 3 columns on desktop, 2 on tablet, 1 on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
            <div>
              <label className={labelCls}>Employee Name</label>
              <input
                readOnly
                value={data.employee_name || data.name || ""}
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Designation</label>
              <input
                readOnly
                value={data.employee_designation || data.designation || "N/A"}
                className={inputCls}
              />
            </div>

            {(data.employee_phno || data.employee_phno) && (
              <div>
                <label className={labelCls}>Phone</label>
                <input
                  readOnly
                  value={data.employee_phno}
                  className={`${inputCls} font-mono select-all`}
                />
              </div>
            )}

            <div>
              <label className={labelCls}>Expense Type</label>
              <input
                readOnly
                title={data.expense_type || data.expenseType}
                value={
                  data.expense_type || data.expenseType || "General Expense"
                }
                className={`${inputCls} font-medium`}
              />
            </div>

            <div>
              <label className={labelCls}>Claimed Amount</label>
              <input
                readOnly
                value={amountText}
                className={`${inputCls} font-medium`}
              />
            </div>

            <div>
              <label className={labelCls}>Expense Date</label>
              <div className="relative">
                <input
                  readOnly
                  value={expenseDateText}
                  className={`${inputCls} pr-10`}
                />
                <Icon
                  icon="solar:calendar-outline"
                  className="w-4 h-4 text-black absolute right-4 top-1/2 -translate-y-1/2"
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Status</label>
              <input readOnly value={data.status || ""} className={inputCls} />
            </div>
          </div>

          {/* DESCRIPTION + ATTACHMENTS side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <label className={labelCls}>Description Notes</label>
              <textarea
                rows="3"
                readOnly
                value={data.description || "No descriptions given."}
                className="w-full border p-3 rounded-2xl bg-gray-50 text-gray-600 resize-none"
              />
            </div>

            <div>
              <label className={labelCls}>Uploaded Attachments</label>
              {!data.attachments || data.attachments.length === 0 ? (
                <div className="w-full border p-3 rounded-2xl bg-gray-50 text-gray-400 text-[11px]">
                  No documents attached to this claim.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {data.attachments.map((file) => (
                    <a
                      key={file.id}
                      href={file.path}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 border bg-gray-50 text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-2xl font-medium transition-colors"
                    >
                      <FiPaperclip className="shrink-0 text-black" />
                      <span>{getCleanDocType(file)} File</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* REMARKS */}
          {showRemarksInput && status === "pending" && (
            <div>
              <label className={labelCls}>Action Remarks</label>
              <textarea
                rows="2"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Provide operation review log audit notes here..."
                className="w-full border p-3 rounded-2xl bg-white text-gray-700 focus:outline-none focus:border-gray-900 resize-none"
              />
            </div>
          )}

          {/* FOOTER */}
          <div className="flex justify-between items-center border-t border-gray-50 pt-4 gap-3">
            <div className="flex flex-col gap-0.5 text-gray-600">
              {(data.approved_by || data.approved_at) && (
                <>
                  {data.approved_by && (
                    <div>
                      <span>Processed By: </span>
                      <span className="font-semibold text-gray-900">
                        {data.approved_by}
                      </span>
                    </div>
                  )}
                  {data.approved_at && (
                    <div>
                      <span>Processed At: </span>
                      <span className="font-semibold text-gray-900">
                        {formatExactTime12h(data.approved_at)}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-6 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-2xl disabled:opacity-60 transition-colors"
              >
                Cancel
              </button>

              {showRejectButton && (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => onStatusUpdate(data.id, "Rejected")}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl disabled:opacity-60 transition-colors"
                >
                  {submitting && spinner}
                  Reject
                </button>
              )}

              {showApproveButton && (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => onStatusUpdate(data.id, "Approved")}
                  className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-2xl disabled:opacity-60 transition-colors"
                >
                  {submitting && spinner}
                  Approve
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewClaimModal;
