import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";

import { addregularize } from "../service/employeeService";
import axiosInstance from "../service/axiosinstance";
import ModalButton from "./button/modalbutton";

// ---------- TOAST HELPERS (backend message + data in one toast) ----------
const formatDetail = (detail) => {
  if (detail === null || detail === undefined || detail === "") return "";
  if (Array.isArray(detail)) return detail.map(formatDetail).join(", ");
  if (typeof detail === "object") {
    return Object.entries(detail)
      .map(([k, v]) => `${k}: ${formatDetail(v)}`)
      .join(" | ");
  }
  return String(detail);
};

const showApiToast = (type, message, detail) => {
  const detailText = formatDetail(detail);

  toast[type](
    <div>
      <div>{message}</div>
      {detailText && (
        <div className="mt-1 text-[12px] font-normal text-gray-600 break-words">
          {detailText}
        </div>
      )}
    </div>,
    { autoClose: 5000 },
  );
};

// Works whether the service returns the axios response, the body, or nothing
const getApiBody = (res) =>
  res?.data?.message !== undefined || res?.data?.status_code !== undefined
    ? res.data
    : res;

// Pulls message + data out of an error (backend response first)
const showApiError = (error, fallback) => {
  const errBody = error?.response?.data;
  showApiToast(
    "error",
    errBody?.message || errBody?.error || error?.message || fallback,
    errBody?.data ?? (errBody?.message ? errBody?.error : undefined),
  );
};

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
  const [action, setAction] = useState(""); // "approve" | "reject" (which button shows the spinner)

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

  // Already rejected -> no Reject button
  const currentStatus = String(data.status || "").toLowerCase();
  const showReject = currentStatus !== "rejected";

  // ---------- APPROVE (Apply) ----------
  const handleSubmitApproval = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setAction("approve");

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

      const res = await addregularize(
        trackingIdentifier,
        targetDateStr,
        payloadBody,
      );
      const body = getApiBody(res);

      showApiToast(
        "success",
        body?.message || "Attendance successfully regularized!",
      );
      if (onSuccess) onSuccess();
      if (onClose) onClose(); // close the modal after a successful save
    } catch (error) {
      console.error("Submission action caught error failure:", error);

      showApiError(error, "Failed to update record regularization.");

      // Revert optimistic state
      if (onOptimisticUpdate) {
        onOptimisticUpdate(data.id, "pending");
      }
    } finally {
      setSubmitting(false);
      setAction("");
    }
  };

  // ---------- REJECT ----------
  const handleReject = async () => {
    if (submitting) return;
    setSubmitting(true);
    setAction("reject");

    const previousStatus = data.status || "pending";

    try {
      onOptimisticUpdate?.(data.id, "rejected");

      const res = await axiosInstance.put(
        "/admin/attendance/regularize/approval",
        {
          request_id: data.raw_data?.id ?? data.id,
          status: "rejected",
          remarks: remarks || "Admin rejected regularization",
        },
      );
      const body = getApiBody(res);

      showApiToast(
        "success",
        body?.message || "Regularization rejected successfully",
      );
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (error) {
      console.error("Reject action failed:", error);

      showApiError(error, "Failed to reject regularization.");

      // Revert optimistic state
      onOptimisticUpdate?.(data.id, previousStatus);
    } finally {
      setSubmitting(false);
      setAction("");
    }
  };

  // ---------- Theme styles (same as Leave Request / Regularization modals) ----------
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
      <form
        onSubmit={handleSubmitApproval}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-[640px] max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200"
      >
        {/* HEADER */}
        <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-start gap-3">
            <span className="p-2 bg-slate-100 rounded-lg">
              <Icon
                icon="solar:clock-circle-outline"
                className="w-5 h-5 text-black"
              />
            </span>
            <div>
              <h2 className="text-[16px] text-gray-900">
                Approve Regularization
              </h2>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Review the punch times and apply the regularization
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
        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          {/* Employee info */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-slate-100 border border-gray-200 rounded-full flex items-center justify-center text-[15px] text-gray-700 uppercase">
                {data.name && data.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-[14px] font-medium text-gray-800 leading-tight">
                  {data.name}
                </h3>
                <p className="text-[12px] text-gray-500">{data.designation}</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-[11px] bg-gray-100 text-gray-700 tabular-nums whitespace-nowrap">
              REQ #{data.raw_data?.id || data.id}
            </span>
          </div>

          {/* Date / Shift */}
          <div className="grid grid-cols-2 gap-3">
            <div className={boxCls}>
              <p className={labelCls}>Target Date</p>
              <p className={`${valueCls} tabular-nums`}>{data.date}</p>
            </div>
            <div className={boxCls}>
              <p className={labelCls}>Shift</p>
              <p className={valueCls}>
                {shiftData?.shift_name || "Standard Shift"}
              </p>
            </div>
          </div>

          {/* Time inputs */}
          <div
            className={`grid gap-3 ${hasOutTime ? "grid-cols-2" : "grid-cols-1"}`}
          >
            <div>
              <p className={labelCls}>Modify Punch IN</p>
              <input
                type="time"
                value={inTime}
                onChange={(e) => setInTime(e.target.value)}
                className={inputCls}
              />
            </div>
            {hasOutTime && (
              <div>
                <p className={labelCls}>Modify Punch OUT</p>
                <input
                  type="time"
                  value={outTime}
                  onChange={(e) => setOutTime(e.target.value)}
                  className={inputCls}
                />
              </div>
            )}
          </div>

          {/* Remarks */}
          <div>
            <p className={labelCls}>Approval Remarks</p>
            <textarea
              className="w-full h-24 px-3 py-2.5 text-[13px] text-gray-800 placeholder-gray-400 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black resize-none"
              placeholder="Type your remarks here..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              required
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-gray-100 bg-slate-50/60 flex justify-end gap-2">
          <ModalButton
            variant="secondary"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </ModalButton>

          {showReject && (
            <ModalButton
              variant="danger"
              onClick={handleReject}
              disabled={submitting}
              loading={submitting && action === "reject"}
            >
              Reject
            </ModalButton>
          )}

          <ModalButton
            variant="primary"
            type="submit"
            disabled={submitting}
            loading={submitting && action === "approve"}
          >
            Apply
          </ModalButton>
        </div>
      </form>
    </div>
  );
};

export default ViewRegularizationModal;
