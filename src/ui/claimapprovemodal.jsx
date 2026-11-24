import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import ModalButton from "./button/modalbutton";

// Reads the ISO string directly (no timezone shift): 11:22:26 AM (11 Jun 2026)
const formatExactTime12h = (isoString) => {
  if (!isoString || String(isoString).startsWith("0001-01-01")) return null;

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
    return null;
  }
};

// Badge colours for claim status (lowercase input)
const getStatusBadge = (status) => {
  if (status.includes("approved")) return "bg-green-100 text-green-700";
  if (status.includes("rejected"))
    return "bg-red-50 text-red-600 border border-red-200";
  return "bg-gray-100 text-gray-700"; // pending / anything else
};

const getCleanDocType = (file) =>
  file?.document_type?.includes("pdf") ? "PDF" : "IMG";

// ---------- Theme styles (same as Device Request modal) ----------
const labelCls = "text-[11px] text-gray-500 mb-1";
const boxCls = "bg-slate-50 border border-gray-200 px-4 py-3 rounded-lg";
const valueCls = "text-[13px] text-gray-800 break-words";

// Label + value box; empty values show N/A
const InfoBox = ({ label, children, className = "" }) => (
  <div className={boxCls}>
    <p className={labelCls}>{label}</p>
    <p className={`${valueCls} ${className}`}>
      {children !== null && children !== undefined && children !== ""
        ? children
        : "N/A"}
    </p>
  </div>
);

const ViewClaimModal = ({
  open,
  data,
  submitting = false,
  onClose,
  onStatusUpdate,
}) => {
  const [copied, setCopied] = useState(false);
  const [actionType, setActionType] = useState(null);

  // Reset local state whenever a different claim is opened
  useEffect(() => {
    if (open && data) {
      setCopied(false);
      setActionType(null);
    }
  }, [open, data]);

  // Clear the active action once the parent finishes submitting
  useEffect(() => {
    if (!submitting) setActionType(null);
  }, [submitting]);

  const handleClose = () => {
    if (!submitting && onClose) onClose();
  };

  // Close with the Escape key
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape" && !submitting && onClose) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, submitting]);

  if (!open || !data) return null;

  const status = data.status ? data.status.toLowerCase() : "pending";
  const attachments = data.attachments || [];

  const submittedOn = formatExactTime12h(data.created_at);
  const lastUpdated = formatExactTime12h(data.updated_at);
  const approvedAt = formatExactTime12h(data.approved_at);

  // Approve sends (id, "Approved"); Reject sends (id, "Rejected")
  const handleStatusAction = (targetStatus) => {
    if (submitting) return;
    setActionType(targetStatus);
    onStatusUpdate?.(data.id, targetStatus);
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
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/50 backdrop-blur-[2px] font-poppins text-[12px]"
      onClick={handleClose}
    >
      <div
        className="bg-white w-full max-w-[960px] max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-start gap-3">
            <span className="p-2 bg-slate-100 rounded-lg">
              <Icon
                icon="solar:bill-list-outline"
                className="w-5 h-5 text-black"
              />
            </span>
            <div>
              <h2 className="text-[16px] text-gray-900">Claim Details</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Review and update the expense claim
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            disabled={submitting}
            className="text-gray-400 hover:text-black transition-colors disabled:opacity-50"
          >
            <Icon icon="material-symbols:close" className="w-6 h-6" />
          </button>
        </div>

        {/* BODY */}
        <div className="px-6 py-5 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* ---------- LEFT: EMPLOYEE + EXPENSE ---------- */}
            <div className="space-y-4 min-w-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 shrink-0 bg-slate-100 border border-gray-200 rounded-full flex items-center justify-center text-[15px] text-gray-700 uppercase">
                  {data.name && data.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-[14px] font-medium text-gray-800 leading-tight truncate">
                    {data.name}
                  </h3>
                  <p className="text-[12px] text-gray-500 truncate">
                    {data.designation}
                  </p>
                </div>
              </div>

              <InfoBox label="Phone">{data.employee_phno}</InfoBox>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoBox label="Expense Type" className="font-medium">
                  {data.expenseType}
                </InfoBox>
                <InfoBox label="Amount" className="font-medium tabular-nums">
                  {data.amountDisplay}
                </InfoBox>
              </div>

              <InfoBox label="Expense Date" className="tabular-nums">
                {data.date}
              </InfoBox>

              <InfoBox label="Description">{data.description}</InfoBox>
            </div>

            {/* ---------- RIGHT: REQUEST INFO ---------- */}
            <div className="border border-gray-200 rounded-lg p-4 self-start min-w-0 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] font-medium text-gray-800">
                  Request Details
                </p>
                <span
                  className={`px-3 py-1 rounded-full text-[11px] capitalize whitespace-nowrap ${getStatusBadge(status)}`}
                >
                  {status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoBox label="Submitted On" className="tabular-nums">
                  {submittedOn}
                </InfoBox>
                <InfoBox label="Initial Status" className="capitalize">
                  {data.initial_status}
                </InfoBox>
              </div>

              {lastUpdated && (
                <InfoBox label="Last Updated" className="tabular-nums">
                  {lastUpdated}
                </InfoBox>
              )}

              {/* Attachments */}
              <div className={boxCls}>
                <p className={labelCls}>Attachments</p>
                {attachments.length === 0 ? (
                  <p className={valueCls}>None</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((file, i) => (
                      <a
                        key={file.id}
                        href={file.path}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-[12px] text-gray-800 bg-white border border-gray-200 hover:border-black px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors"
                      >
                        <Icon
                          icon="solar:paperclip-outline"
                          className="w-3.5 h-3.5 text-gray-500"
                        />
                        {getCleanDocType(file)} {i + 1}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Approved info (read-only) */}
              {status === "approved" &&
                (data.approved_by || approvedAt || data.payout_method) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {data.approved_by && (
                      <InfoBox label="Approved By">{data.approved_by}</InfoBox>
                    )}
                    {approvedAt && (
                      <InfoBox label="Approved At" className="tabular-nums">
                        {approvedAt}
                      </InfoBox>
                    )}
                    {data.payout_method && (
                      <InfoBox label="Payout Method" className="capitalize">
                        {data.payout_method}
                      </InfoBox>
                    )}
                  </div>
                )}

              {/* Voucher code */}
              {data.voucher_code && (
                <div className={boxCls}>
                  <p className={labelCls}>Voucher Code</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className={`${valueCls} font-mono select-all`}>
                      {data.voucher_code}
                    </p>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-black transition-colors"
                    >
                      <Icon
                        icon={
                          copied
                            ? "material-symbols:check"
                            : "solar:copy-outline"
                        }
                        className="w-4 h-4"
                      />
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-gray-100 bg-slate-50/60 flex justify-end gap-2">
          {status === "pending" ? (
            <>
              <ModalButton
                variant="danger"
                onClick={() => handleStatusAction("Rejected")}
                disabled={submitting}
                loading={submitting && actionType === "Rejected"}
              >
                Reject
              </ModalButton>

              <ModalButton
                variant="primary"
                onClick={() => handleStatusAction("Approved")}
                disabled={submitting}
                loading={submitting && actionType === "Approved"}
              >
                Approve
              </ModalButton>
            </>
          ) : (
            <ModalButton variant="secondary" onClick={handleClose}>
              Close
            </ModalButton>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewClaimModal;
