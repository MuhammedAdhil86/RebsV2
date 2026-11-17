import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { patchInsuranceClaimDecision } from "../service/insuranceservice";
import { showApiToast, showApiSuccess, showApiError } from "../utils/apiToast";
import ModalButton from "./button/modalbutton";

const formatExactTime12h = (isoString) => {
  if (
    !isoString ||
    typeof isoString !== "string" ||
    isoString.startsWith("0001-01-01")
  ) {
    return "N/A";
  }

  try {
    const parts = isoString.split("T");
    if (parts.length < 2) return isoString;

    const [datePart, timePart] = parts;
    const timeSegments = timePart.split(":");
    if (timeSegments.length < 2) return isoString;

    const hourStr = timeSegments[0];
    const minStr = timeSegments[1];
    const secWithMs = timeSegments[2] || "00";
    const secStr = secWithMs.substring(0, 2);

    const [year, month, day] = datePart.split("-");
    let hour = parseInt(hourStr, 10);
    if (isNaN(hour)) return isoString;

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

    const formattedDate = `${day} ${months[parseInt(month, 10) - 1] || month} ${year}`;
    return `${formattedHour}:${minStr}:${secStr} ${ampm} (${formattedDate})`;
  } catch (e) {
    return "N/A";
  }
};

const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || amount === "") return "₹0.00";
  if (typeof amount === "string" && amount.includes("₹")) return amount;

  const numericValue = typeof amount === "number" ? amount : parseFloat(amount);
  if (isNaN(numericValue)) return "₹0.00";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(numericValue);
};

// Badge colours for claim status (lowercase input)
const getStatusBadge = (status) => {
  if (status.includes("approved")) return "bg-green-100 text-green-700";
  if (status.includes("rejected"))
    return "bg-red-50 text-red-600 border border-red-200";
  return "bg-gray-100 text-gray-700"; // pending / anything else
};

const InsuranceApprovalModal = ({
  open,
  data,
  onClose,
  onSuccess,
  onOptimisticUpdate,
}) => {
  const [remarks, setRemarks] = useState("");
  const [settlementAmountInput, setSettlementAmountInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionType, setActionType] = useState(null);

  useEffect(() => {
    if (open && data) {
      setRemarks(data.remarks || "");
      setSettlementAmountInput(
        data.settlement_amount || data.claim_amount || "",
      );
      setActionType(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, data?.id]);

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

  const rawStatus = data.claim_status || data.status || "Pending";
  const status = String(rawStatus).toLowerCase();
  // Keep the pending layout while a request is running (the optimistic
  // update changes the status before the API answers)
  const isPending = status === "pending" || submitting;

  const resolvedId = data.id ?? "N/A";
  const resolvedInsuranceId = data.insurance_id ?? "N/A";
  const resolvedEmployeeId = data.employee_id || data.user_uuid || "N/A";
  const resolvedEmployeeName = data.employee_name || data.name || "N/A";
  const resolvedClaimNumber = data.claim_number || data.policy_number || "N/A";

  const resolvedClaimAmount = formatCurrency(
    data.claim_amount || data.claimAmount,
  );
  const resolvedSettlementAmount = data.settlement_amount
    ? formatCurrency(data.settlement_amount)
    : null;

  const resolvedCreatedDate = data.created_at || data.claim_date || data.date;
  const resolvedSettlementDate = data.settlement_date
    ? formatExactTime12h(data.settlement_date)
    : null;

  const handleStatusAction = async (targetStatus) => {
    if (submitting) return;

    // Front-end safeguard check
    if (status !== "pending") {
      showApiToast("error", "Only pending claims can be processed.");
      return;
    }

    setSubmitting(true);
    setActionType(targetStatus);

    const formattedTargetStatus =
      targetStatus.charAt(0).toUpperCase() +
      targetStatus.slice(1).toLowerCase();

    try {
      if (onOptimisticUpdate) {
        onOptimisticUpdate(data.id, formattedTargetStatus);
      }

      const payload = {
        claim_status: formattedTargetStatus,
        settlement_amount:
          formattedTargetStatus === "Approved"
            ? parseFloat(settlementAmountInput) || data.claim_amount || 0
            : 0,
        settlement_date: new Date().toISOString(),
        remarks: remarks || `Status set to ${formattedTargetStatus}`,
      };

      const res = await patchInsuranceClaimDecision(data.id, payload);

      // Backend message (falls back to the old text)
      showApiSuccess(res, `Insurance claim ${targetStatus} successfully!`);

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("❌ Failed to update claim decision:", error);
      // Backend message + data (or error) in one toast
      showApiError(error, "Failed to update claim decision.");

      if (onOptimisticUpdate) {
        onOptimisticUpdate(data.id, rawStatus);
      }
    } finally {
      setSubmitting(false);
      setActionType(null);
    }
  };

  // ---------- Theme styles (same as Leave Request modal) ----------
  const labelCls = "text-[11px] text-gray-500 mb-1";
  const boxCls = "bg-slate-50 border border-gray-200 px-4 py-3 rounded-lg";
  const valueCls = "text-[13px] text-gray-800 break-words";
  const inputCls =
    "w-full px-3 py-2.5 text-[13px] text-gray-800 placeholder-gray-400 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black tabular-nums";

  return (
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center px-4 bg-black/50 backdrop-blur-[2px] font-poppins text-[12px]"
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
                icon="solar:shield-check-outline"
                className="w-5 h-5 text-black"
              />
            </span>
            <div>
              <h2 className="text-[16px] text-gray-900">
                Review Insurance Claim
              </h2>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Review the claim details and update the decision
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

        {/* BODY: employee + amounts on the left, decision on the right */}
        <div className="px-6 py-5 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* ---------- LEFT: EMPLOYEE + CLAIM ---------- */}
            <div className="space-y-4 min-w-0">
              {/* Employee info */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 shrink-0 bg-slate-100 border border-gray-200 rounded-full flex items-center justify-center text-[15px] text-gray-700 uppercase">
                    {resolvedEmployeeName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[14px] font-medium text-gray-800 leading-tight truncate">
                      {resolvedEmployeeName}
                    </h3>
                    <p className="text-[12px] text-gray-500 truncate">
                      Employee ID #{resolvedEmployeeId}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] bg-gray-100 text-gray-700 whitespace-nowrap font-mono">
                  {resolvedClaimNumber}
                </span>
              </div>

              {/* Amounts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className={boxCls}>
                  <p className={labelCls}>Claim Amount</p>
                  <p className={`${valueCls} font-medium tabular-nums`}>
                    {resolvedClaimAmount}
                  </p>
                </div>
                <div className={boxCls}>
                  <p className={labelCls}>Settlement Amount</p>
                  <p
                    className={`${valueCls} font-medium tabular-nums text-emerald-700`}
                  >
                    {resolvedSettlementAmount || "Pending"}
                  </p>
                </div>
              </div>

              {/* IDs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className={boxCls}>
                  <p className={labelCls}>Claim ID</p>
                  <p className={`${valueCls} font-mono select-all`}>
                    {resolvedId}
                  </p>
                </div>
                <div className={boxCls}>
                  <p className={labelCls}>Insurance ID</p>
                  <p className={`${valueCls} font-mono select-all`}>
                    #{resolvedInsuranceId}
                  </p>
                </div>
              </div>

              <div className={boxCls}>
                <p className={labelCls}>Submitted</p>
                <p className={`${valueCls} tabular-nums`}>
                  {formatExactTime12h(resolvedCreatedDate)}
                </p>
              </div>
            </div>

            {/* ---------- RIGHT: DECISION ---------- */}
            <div className="border border-gray-200 rounded-lg p-4 self-start min-w-0 space-y-4">
              {/* Title + status */}
              <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] font-medium text-gray-800">
                  Claim Decision
                </p>
                <span
                  className={`px-3 py-1 rounded-full text-[11px] capitalize whitespace-nowrap ${getStatusBadge(status)}`}
                >
                  {rawStatus}
                </span>
              </div>

              {/* Approved logs */}
              {status === "approved" && !submitting && (
                <>
                  {resolvedSettlementDate && (
                    <div className={boxCls}>
                      <p className={labelCls}>Settlement Date</p>
                      <p className={`${valueCls} tabular-nums`}>
                        {resolvedSettlementDate}
                      </p>
                    </div>
                  )}
                  {data.remarks && (
                    <div className={boxCls}>
                      <p className={labelCls}>Verification Note</p>
                      <p className={valueCls}>{data.remarks}</p>
                    </div>
                  )}
                </>
              )}

              {/* Rejected note */}
              {status === "rejected" && !submitting && data.remarks && (
                <div className={boxCls}>
                  <p className={labelCls}>Rejection Note</p>
                  <p className={valueCls}>{data.remarks}</p>
                </div>
              )}

              {/* Inputs only while pending */}
              {isPending && (
                <>
                  <div>
                    <p className={labelCls}>Settlement Amount (₹)</p>
                    <input
                      type="number"
                      value={settlementAmountInput}
                      onChange={(e) => setSettlementAmountInput(e.target.value)}
                      placeholder="Enter settlement amount"
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <p className={labelCls}>Action Remarks</p>
                    <textarea
                      className="w-full h-24 px-3 py-2.5 text-[13px] text-gray-800 placeholder-gray-400 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black resize-none"
                      placeholder="Provide operation review log audit notes here..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-gray-100 bg-slate-50/60 flex justify-end gap-2">
          {isPending ? (
            <>
              <ModalButton
                variant="danger"
                onClick={() => handleStatusAction("rejected")}
                disabled={submitting}
                loading={submitting && actionType === "rejected"}
              >
                Reject
              </ModalButton>

              <ModalButton
                variant="primary"
                onClick={() => handleStatusAction("approved")}
                disabled={submitting}
                loading={submitting && actionType === "approved"}
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

export default InsuranceApprovalModal;
