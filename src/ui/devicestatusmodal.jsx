import React, { useEffect, useState } from "react";
import {
  X,
  Laptop,
  AlertCircle,
  CheckCircle2,
  XCircle,
  UserCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import { fetchUpdateDeviceStatus } from "../service/deviceService";

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

      await fetchUpdateDeviceStatus(data.user_uuid, targetStatus, payloadBody);

      toast.success(`Device request ${targetStatus} successfully!`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.message || "Failed to update device request status.");

      if (onOptimisticUpdate) {
        onOptimisticUpdate(data.id, data.status);
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
              <Laptop className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">
              Review Device Request
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
              <p className="font-medium text-gray-900">{data.name}</p>
              <p className="text-gray-500 text-[11px]">{data.designation}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className="font-mono bg-gray-200/80 px-2 py-0.5 rounded text-gray-700 font-medium">
                UUID #{data.user_uuid}
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  data.is_first_device
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                    : "bg-amber-50 text-amber-700 border-amber-100"
                }`}
              >
                {data.is_first_device
                  ? "This is first device"
                  : "This is not first device"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50/50 p-2.5 rounded-lg border border-gray-100 flex flex-col justify-between">
              <div>
                <label className="block text-[11px] font-medium text-gray-400 mb-0.5">
                  Current Device
                </label>
                <p
                  className="text-xs font-semibold text-gray-700 truncate"
                  title={data.oldDevice || data.device}
                >
                  {data.oldDevice || data.device || "None"}
                </p>
              </div>
              {resolvedCurrentDeviceId && (
                <div className="text-[10px] border-t border-gray-200/60 pt-1.5 mt-2 text-gray-400 font-mono truncate">
                  ID:{" "}
                  <span className="text-gray-700 select-all">
                    {resolvedCurrentDeviceId}
                  </span>
                </div>
              )}
            </div>

            <div className="bg-blue-50/30 p-2.5 rounded-lg border border-blue-100/50 flex flex-col justify-between">
              <div>
                <label className="block text-[11px] font-medium text-blue-500 mb-0.5">
                  Requested Device
                </label>
                <p
                  className="text-xs font-semibold text-gray-800 truncate"
                  title={data.newDevice}
                >
                  {data.newDevice || "None"}
                </p>
              </div>
              {resolvedNewDeviceId && (
                <div className="text-[10px] border-t border-blue-200/30 pt-1.5 mt-2 text-blue-400 font-mono truncate">
                  ID:{" "}
                  <span className="text-gray-700 select-all">
                    {resolvedNewDeviceId}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50/50 p-2.5 rounded-lg border border-gray-100 flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span>
                Detected:{" "}
                <strong className="text-gray-800">
                  {data.change_detected_date?.Valid &&
                  data.change_detected_date.Time !== "0001-01-01T00:00:00Z"
                    ? formatExactTime12h(data.change_detected_date.Time)
                    : data.date || "N/A"}
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

          {status === "approved" &&
            (resolvedApprovedAt || resolvedApprovedByName) && (
              <div className="p-3 bg-emerald-50/40 rounded-lg border border-emerald-100/70 text-xs text-gray-600 space-y-1">
                <div className="flex items-center gap-1.5 font-medium text-emerald-800 mb-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Approval Log Details</span>
                </div>
                {resolvedApprovedByName && (
                  <p className="text-[11px]">
                    Approved By:{" "}
                    <strong className="text-gray-800">
                      {resolvedApprovedByName}
                    </strong>
                  </p>
                )}
                {resolvedApprovedAt && (
                  <p className="text-[11px]">
                    Approved At:{" "}
                    <span className="text-gray-700 font-medium">
                      {resolvedApprovedAt}
                    </span>
                  </p>
                )}
              </div>
            )}

          {status === "pending" && (
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
          )}
        </div>

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

export default DeviceApprovalModal;
