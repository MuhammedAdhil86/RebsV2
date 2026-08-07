import React, { useEffect, useState } from "react";
import {
  X,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  UserCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import { patchInsuranceClaimDecision } from "../service/insuranceService";

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
  }, [open, data]);

  if (!open || !data) return null;

  const rawStatus = data.claim_status || data.status || "Pending";
  const status = String(rawStatus).toLowerCase();

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
    // Front-end safeguard check
    if (status !== "pending") {
      toast.error("Only pending claims can be processed.");
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

      await patchInsuranceClaimDecision(data.id, payload);

      toast.success(`Insurance claim ${targetStatus} successfully!`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("❌ Failed to update claim decision:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update claim decision.",
      );

      if (onOptimisticUpdate) {
        onOptimisticUpdate(data.id, rawStatus);
      }
    } finally {
      setSubmitting(false);
      setActionType(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md transform overflow-hidden rounded-xl bg-white p-6 shadow-2xl transition-all border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-50 rounded-lg text-gray-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">
              Review Insurance Claim
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

        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center text-xs">
            <div>
              <p className="font-medium text-gray-900">
                {resolvedEmployeeName}
              </p>
              <p className="text-gray-500 text-[11px] font-mono">
                Insurance ID: #{resolvedInsuranceId}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className="font-mono bg-gray-200/80 px-2 py-0.5 rounded text-gray-700 font-medium">
                ID #{resolvedEmployeeId}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-100 font-mono">
                {resolvedClaimNumber}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50/50 p-2.5 rounded-lg border border-gray-100 flex flex-col justify-between">
              <div>
                <label className="block text-[11px] font-medium text-gray-400 mb-0.5">
                  Claim Amount
                </label>
                <p
                  className="text-xs font-semibold text-gray-800 truncate"
                  title={resolvedClaimAmount}
                >
                  {resolvedClaimAmount}
                </p>
              </div>
              <div className="text-[10px] border-t border-gray-200/60 pt-1.5 mt-2 text-gray-400 font-mono truncate">
                Claim ID:{" "}
                <span className="text-gray-700 select-all">{resolvedId}</span>
              </div>
            </div>

            <div className="bg-blue-50/30 p-2.5 rounded-lg border border-blue-100/50 flex flex-col justify-between">
              <div>
                <label className="block text-[11px] font-medium text-blue-500 mb-0.5">
                  Settlement Amount
                </label>
                <p
                  className="text-xs font-semibold text-emerald-700 truncate"
                  title={resolvedSettlementAmount || "Pending Settlement"}
                >
                  {resolvedSettlementAmount || "Pending"}
                </p>
              </div>
              <div className="text-[10px] border-t border-blue-200/30 pt-1.5 mt-2 text-blue-400 font-mono truncate">
                Ref:{" "}
                <span className="text-gray-700 select-all">
                  {resolvedClaimNumber}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50/50 p-2.5 rounded-lg border border-gray-100 flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span>
                Submitted:{" "}
                <strong className="text-gray-800">
                  {formatExactTime12h(resolvedCreatedDate)}
                </strong>
              </span>
            </div>
            <span className="text-[11px] font-medium">
              Current Status:{" "}
              <span
                className={`capitalize font-bold ${
                  status === "approved"
                    ? "text-emerald-600"
                    : status === "rejected"
                      ? "text-red-600"
                      : "text-amber-600"
                }`}
              >
                {rawStatus}
              </span>
            </span>
          </div>

          {/* Read-only logs display for already processed claims */}
          {status === "approved" && (
            <div className="p-3 bg-emerald-50/40 rounded-lg border border-emerald-100/70 text-xs text-gray-600 space-y-1">
              <div className="flex items-center gap-1.5 font-medium text-emerald-800 mb-1">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Approval & Settlement Logs</span>
              </div>
              {resolvedSettlementDate && (
                <p className="text-[11px]">
                  Settlement Date:{" "}
                  <span className="text-gray-700 font-medium">
                    {resolvedSettlementDate}
                  </span>
                </p>
              )}
              {data.remarks && (
                <p className="text-[11px]">
                  Verification Note:{" "}
                  <strong className="text-gray-800">{data.remarks}</strong>
                </p>
              )}
            </div>
          )}

          {/* Form inputs available ONLY when status is PENDING */}
          {status === "pending" ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Settlement Amount (₹)
                </label>
                <input
                  type="number"
                  value={settlementAmountInput}
                  onChange={(e) => setSettlementAmountInput(e.target.value)}
                  placeholder="Enter settlement amount"
                  className="w-full border border-gray-200 rounded-lg p-2 text-xs bg-white focus:outline-none focus:border-gray-900"
                />
              </div>

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
                  required
                />
              </div>
            </div>
          ) : (
            data.remarks &&
            status !== "approved" && (
              <div className="p-3 bg-red-50/40 rounded-lg border border-red-100/70 text-xs text-gray-600">
                <p className="text-[11px]">
                  Rejection Note:{" "}
                  <strong className="text-gray-800">{data.remarks}</strong>
                </p>
              </div>
            )
          )}
        </div>

        {/* Action Buttons ONLY when Pending */}
        <div className="mt-6 pt-3 border-t border-gray-100 flex justify-end gap-2">
          {status === "pending" ? (
            <>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleStatusAction("rejected")}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-lg text-xs font-medium transition-colors"
              >
                {submitting && actionType === "rejected" ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                Reject
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => handleStatusAction("approved")}
                className="flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-gray-800 disabled:bg-gray-300 text-white rounded-lg text-xs font-medium transition-colors"
              >
                {submitting && actionType === "approved" ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                Approve
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-medium transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InsuranceApprovalModal;
