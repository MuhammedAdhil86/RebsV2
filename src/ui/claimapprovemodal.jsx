import React, { useEffect, useState } from "react";
import { FiX, FiPaperclip, FiCopy, FiCheck } from "react-icons/fi";

const statusColors = {
  Approved: "bg-green-100 text-green-600",
  Rejected: "bg-red-100 text-red-600",
  Pending: "bg-yellow-100 text-yellow-700",
};

// values sent to the backend (lowercase, as the API expects)
const PAYOUT_OPTIONS = [
  { value: "hand", label: "Hand" },
  { value: "payroll", label: "Payroll" },
  { value: "voucher", label: "Voucher" },
];

// Select box sizing (full width inside the modal)
const SELECT_PLACEHOLDER = "Select payout method";
const SELECT_MIN_WIDTH = 120;

const getCleanDocType = (file) =>
  file?.document_type?.includes("pdf") ? "PDF" : "IMG";

const Field = ({ label, children }) => (
  <div>
    <div className="text-[11px] text-gray-400 font-normal mb-0.5">{label}</div>
    <div className="text-[13px] text-gray-800 font-medium break-words">
      {children || "--"}
    </div>
  </div>
);

export default function ViewClaimModal({
  open,
  data,
  submitting = false,
  onClose,
  onStatusUpdate,
}) {
  const [payoutMethod, setPayoutMethod] = useState("");
  const [payoutError, setPayoutError] = useState("");
  const [copied, setCopied] = useState(false);

  // Reset local state every time a different claim is opened
  useEffect(() => {
    setPayoutMethod("");
    setPayoutError("");
    setCopied(false);
  }, [data?.id, open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !submitting) onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, submitting, onClose]);

  if (!open || !data) return null;

  const isPending = data.status === "Pending";
  const isApproved = data.status === "Approved";
  const attachments = data.attachments || [];

  const handleApprove = () => {
    if (!payoutMethod) {
      setPayoutError("Please select a payout method.");
      return;
    }
    setPayoutError("");
    onStatusUpdate?.(data.id, "Approved", payoutMethod);
  };

  const handleReject = () => {
    onStatusUpdate?.(data.id, "Rejected");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.voucher_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard not available */
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 font-['Poppins']"
      onClick={() => !submitting && onClose?.()}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-gray-800">
              Claim Details
            </h3>
            <span
              className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                statusColors[data.status] || statusColors.Pending
              }`}
            >
              {data.status}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40"
            aria-label="Close"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* BODY */}
        <div className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Employee">{data.name}</Field>
            <Field label="Designation">{data.designation}</Field>
            <Field label="Phone">{data.employee_phno}</Field>
            <Field label="Expense Type">{data.expenseType}</Field>
            <Field label="Amount">{data.amountDisplay}</Field>
            <Field label="Expense Date">{data.date}</Field>
          </div>

          <Field label="Description">{data.description}</Field>

          {/* ALREADY APPROVED: approval details */}
          {isApproved && (
            <div className="rounded-lg border border-green-100 bg-green-50/50 p-3 space-y-2">
              {data.approved_by && (
                <div className="text-[12px] text-gray-700">
                  Approved by:{" "}
                  <span className="font-medium">{data.approved_by}</span>
                </div>
              )}
              {data.approved_at && (
                <div className="text-[12px] text-gray-700">
                  Approved on:{" "}
                  <span className="font-medium">
                    {new Date(data.approved_at).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}
              {data.payout_method && (
                <div className="text-[12px] text-gray-700">
                  Payout method:{" "}
                  <span className="font-medium">{data.payout_method}</span>
                </div>
              )}
              {data.voucher_code && (
                <div className="flex items-center gap-2 text-[12px] text-gray-700">
                  Voucher code:
                  <span className="font-mono font-semibold text-gray-900">
                    {data.voucher_code}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline text-[11px]"
                  >
                    {copied ? <FiCheck /> : <FiCopy />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* PENDING: payout method selector */}
          {isPending && (
            <div>
              <label
                htmlFor="payout-method"
                className="block text-[11px] text-gray-400 font-normal mb-1"
              >
                Payout method (required to approve)
              </label>
              <div className="relative w-full">
                <select
                  id="payout-method"
                  value={payoutMethod}
                  onChange={(e) => {
                    setPayoutMethod(e.target.value);
                    setPayoutError("");
                  }}
                  disabled={submitting}
                  className="appearance-none w-full border px-3 py-2.5 text-xs cursor-pointer bg-white focus:outline-none focus:ring-1 focus:ring-black disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    width: "100%",
                    minWidth: `${SELECT_MIN_WIDTH}px`,
                    borderRadius: "6px",
                  }}
                >
                  <option
                    value=""
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                      padding: "8px",
                    }}
                  >
                    {SELECT_PLACEHOLDER}
                  </option>
                  {PAYOUT_OPTIONS.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      style={{
                        borderBottom: "1px solid #e5e7eb",
                        padding: "8px",
                      }}
                    >
                      {opt.label}
                    </option>
                  ))}
                </select>

                <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                  <svg
                    className="w-3 h-3 text-gray-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              {payoutError && (
                <p className="text-[11px] text-red-500 mt-1">{payoutError}</p>
              )}
            </div>
          )}

          {/* ATTACHMENTS */}
          <div>
            <div className="text-[11px] text-gray-400 font-normal mb-1.5">
              Attachments
            </div>
            {attachments.length === 0 ? (
              <span className="text-[12px] text-gray-400">None</span>
            ) : (
              <div className="flex flex-wrap gap-2">
                {attachments.map((file, i) => (
                  <a
                    key={file.id}
                    href={file.path}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-blue-600 hover:underline bg-blue-50/70 border border-blue-100 px-2.5 py-1 rounded text-[11px] font-semibold tracking-wider whitespace-nowrap"
                  >
                    <FiPaperclip className="text-xs text-blue-500" />
                    {getCleanDocType(file)} {i + 1}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-[12px] font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Close
          </button>

          {isPending && (
            <>
              <button
                type="button"
                onClick={handleReject}
                disabled={submitting}
                className="px-4 py-2 text-[12px] font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 disabled:opacity-50"
              >
                {submitting ? "Please wait..." : "Reject"}
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={submitting}
                className="px-4 py-2 text-[12px] font-medium text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                {submitting ? "Please wait..." : "Approve"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
