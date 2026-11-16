import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { fetchUpdateDeviceStatus } from "../service/deviceService";
import { showApiSuccess, showApiError } from "../utils/apiToast";
import ModalButton from "./button/modalbutton";

// Helper function to extract exact API time segments into 12-hour AM/PM format
const formatExactTime12h = (isoString) => {
  if (!isoString || isoString.startsWith("0001-01-01")) return "N/A";

  try {
    // Extract exact segments: "2026-06-11" and "11:22:26"
    const [datePart, timePart] = isoString.split("T");
    const [hourStr, minStr, secWithMs] = timePart.split(":");
    const secStr = secWithMs.substring(0, 2); // get exact seconds

    const [year, month, day] = datePart.split("-");
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? "PM" : "AM";

    // Convert to 12-hour format
    hour = hour % 12;
    hour = hour ? hour : 12; // '0' should be '12'

    const formattedHour = hour < 10 ? `0${hour}` : hour;

    // Output layout matching exactly: 11:22:26 AM (11 Jun 2026)
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

// Badge colours for request status (lowercase input)
const getStatusBadge = (status) => {
  if (status.includes("approved")) return "bg-green-100 text-green-700";
  if (status.includes("rejected"))
    return "bg-red-50 text-red-600 border border-red-200";
  return "bg-gray-100 text-gray-700"; // pending / anything else
};

const DeviceApprovalModal = ({
  open,
  data,
  onClose,
  onSuccess,
  onOptimisticUpdate,
}) => {
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionType, setActionType] = useState(null);

  useEffect(() => {
    if (open && data) {
      setRemarks("");
      setActionType(null);
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

  const status = data.status ? data.status.toLowerCase() : "pending";

  const resolvedCurrentDeviceId =
    typeof data.device_id === "object"
      ? data.device_id?.Valid
        ? data.device_id.String
        : ""
      : data.device_id || "";

  const resolvedNewDeviceId =
    typeof data.new_device_id === "object"
      ? data.new_device_id?.Valid
        ? data.new_device_id.String
        : ""
      : data.new_device_id || "";

  // Formats exact raw values into 12H representation
  const resolvedApprovedAt = data.approved_at?.Valid
    ? formatExactTime12h(data.approved_at.Time)
    : null;

  const resolvedApprovedByName = data.approved_by_name?.Valid
    ? data.approved_by_name.String
    : null;

  const handleStatusAction = async (targetStatus) => {
    if (submitting) return;
    setSubmitting(true);
    setActionType(targetStatus);

    try {
      const payloadBody = {
        device_id: resolvedCurrentDeviceId,
        remarks: remarks || `Device request status updated to ${targetStatus}`,
      };

      if (onOptimisticUpdate) {
        onOptimisticUpdate(data.id, targetStatus);
      }

      const res = await fetchUpdateDeviceStatus(
        data.user_uuid,
        targetStatus,
        payloadBody,
      );

      // Backend message (falls back to the old text)
      showApiSuccess(res, `Device request ${targetStatus} successfully!`);

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      // Backend message + data (or error) in one toast
      showApiError(error, "Failed to update device request status.");

      if (onOptimisticUpdate) {
        onOptimisticUpdate(data.id, data.status);
      }
    } finally {
      setSubmitting(false);
      setActionType(null);
    }
  };

  const detectedText =
    data.change_detected_date?.Valid &&
    data.change_detected_date.Time !== "0001-01-01T00:00:00Z"
      ? formatExactTime12h(data.change_detected_date.Time)
      : data.date || "N/A";

  // ---------- Theme styles (same as Leave Request modal) ----------
  const labelCls = "text-[11px] text-gray-500 mb-1";
  const boxCls = "bg-slate-50 border border-gray-200 px-4 py-3 rounded-lg";
  const valueCls = "text-[13px] text-gray-800 break-words";

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
                icon="solar:laptop-outline"
                className="w-5 h-5 text-black"
              />
            </span>
            <div>
              <h2 className="text-[16px] text-gray-900">Device Request</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Review and update the device change request
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

        {/* BODY: employee + devices on the left, request info on the right */}
        <div className="px-6 py-5 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* ---------- LEFT: EMPLOYEE + DEVICES ---------- */}
            <div className="space-y-4 min-w-0">
              {/* Employee info */}
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

              {/* Device type */}
              <div className={boxCls}>
                <p className={labelCls}>Device Type</p>
                <p className={valueCls}>
                  {data.is_first_device
                    ? "This is first device"
                    : "This is not first device"}
                </p>
              </div>

              {/* Current / Requested device */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className={boxCls}>
                  <p className={labelCls}>Current Device</p>
                  <p
                    className={`${valueCls} font-medium`}
                    title={data.oldDevice || data.device}
                  >
                    {data.oldDevice || data.device || "None"}
                  </p>
                </div>
                <div className={boxCls}>
                  <p className={labelCls}>Requested Device</p>
                  <p
                    className={`${valueCls} font-medium`}
                    title={data.newDevice}
                  >
                    {data.newDevice || "None"}
                  </p>
                </div>
              </div>

              {/* Device IDs */}
              {(resolvedCurrentDeviceId || resolvedNewDeviceId) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {resolvedCurrentDeviceId && (
                    <div className={boxCls}>
                      <p className={labelCls}>Current Device ID</p>
                      <p className={`${valueCls} font-mono select-all`}>
                        {resolvedCurrentDeviceId}
                      </p>
                    </div>
                  )}
                  {resolvedNewDeviceId && (
                    <div className={boxCls}>
                      <p className={labelCls}>Requested Device ID</p>
                      <p className={`${valueCls} font-mono select-all`}>
                        {resolvedNewDeviceId}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ---------- RIGHT: REQUEST INFO ---------- */}
            <div className="border border-gray-200 rounded-lg p-4 self-start min-w-0 space-y-4">
              {/* Title + status */}
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

              <div className={boxCls}>
                <p className={labelCls}>Detected</p>
                <p className={`${valueCls} tabular-nums`}>{detectedText}</p>
              </div>

              <div className={boxCls}>
                <p className={labelCls}>User UUID</p>
                <p className={`${valueCls} font-mono`}>
                  #{data.user_uuid ?? ""}
                </p>
              </div>

              {/* Approved info */}
              {status === "approved" &&
                (resolvedApprovedByName || resolvedApprovedAt) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {resolvedApprovedByName && (
                      <div className={boxCls}>
                        <p className={labelCls}>Approved By</p>
                        <p className={valueCls}>{resolvedApprovedByName}</p>
                      </div>
                    )}
                    {resolvedApprovedAt && (
                      <div className={boxCls}>
                        <p className={labelCls}>Approved At</p>
                        <p className={`${valueCls} tabular-nums`}>
                          {resolvedApprovedAt}
                        </p>
                      </div>
                    )}
                  </div>
                )}

              {/* Remarks (pending only) */}
              {status === "pending" && (
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

export default DeviceApprovalModal;
