import React, { useEffect, useState } from "react";
import { X, Laptop, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { fetchUpdateDeviceStatus } from "../service/deviceService";

const DeviceApprovalModal = ({
  open,
  data,
  onClose,
  onSuccess,
  onOptimisticUpdate,
}) => {
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionType, setActionType] = useState(null); // Tracks 'approved' vs 'rejected' for precise loading states

  useEffect(() => {
    if (open && data) {
      setRemarks("");
      setActionType(null);
    }
  }, [open, data]);

  if (!open || !data) return null;

  // Clean the status string to match comparisons accurately
  const status = data.status ? data.status.toLowerCase() : "pending";

  // Safely extract device_id text string from response structure variations
  const resolvedDeviceId =
    typeof data.device_id === "object"
      ? data.device_id?.Valid
        ? data.device_id.String
        : ""
      : data.device_id || "";

  const handleStatusAction = async (targetStatus) => {
    setSubmitting(true);
    setActionType(targetStatus);

    try {
      // Integrated body payload payload mapping including critical device_id context
      const payloadBody = {
        device_id: resolvedDeviceId,
        remarks: remarks || `Device request status updated to ${targetStatus}`,
      };

      // Optimistic UI updates still target table row indices via the data.id tracker
      if (onOptimisticUpdate) {
        onOptimisticUpdate(data.id, targetStatus);
      }

      // Pass user_uuid into request parameter mapping targeting: /staff/device/approve/100340?action=approved
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
      {/* Backdrop layer mask */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Main Container Card */}
      <div className="relative w-full max-w-md transform overflow-hidden rounded-xl bg-white p-6 shadow-2xl transition-all border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Layout (X icon handles closing) */}
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

        {/* Dynamic Display Information Panel */}
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center text-xs">
            <div>
              <p className="font-medium text-gray-900">{data.name}</p>
              <p className="text-gray-500 text-[11px]">{data.designation}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="font-mono bg-gray-200/80 px-2 py-0.5 rounded text-gray-700 font-medium">
                UUID #{data.user_uuid}
              </span>
            </div>
          </div>

          {/* Current vs Requested Device View Layout */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50/50 p-2.5 rounded-lg border border-gray-100">
              <label className="block text-[11px] font-medium text-gray-400 mb-0.5">
                Current Device
              </label>
              <p
                className="text-xs font-semibold text-gray-700 truncate"
                title={data.oldDevice}
              >
                {data.oldDevice}
              </p>
            </div>
            <div className="bg-blue-50/30 p-2.5 rounded-lg border border-blue-100/50">
              <label className="block text-[11px] font-medium text-blue-500 mb-0.5">
                Requested Device
              </label>
              <p
                className="text-xs font-semibold text-gray-800 truncate"
                title={data.newDevice}
              >
                {data.newDevice}
              </p>
            </div>
          </div>

          {/* Context Meta Row showing device ID metadata */}
          <div className="bg-gray-50/50 p-2.5 rounded-lg border border-gray-100 flex flex-col gap-1.5 text-xs text-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span>
                  Detected:{" "}
                  <strong className="text-gray-800">{data.date}</strong>
                </span>
              </div>
              <span className="text-[11px] font-medium">
                Current Status:{" "}
                <span className="capitalize font-semibold text-gray-800">
                  {data.status}
                </span>
              </span>
            </div>
            {resolvedDeviceId && (
              <div className="text-[11px] border-t border-gray-200/60 pt-1.5 text-gray-500 font-mono truncate">
                Device ID:{" "}
                <span className="text-gray-700 select-all">
                  {resolvedDeviceId}
                </span>
              </div>
            )}
          </div>

          {/* Action Input Logger Remarks */}
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

        {/* Conditional Action Button Grid Layout */}
        <div className="mt-6 pt-3 border-t border-gray-100 flex justify-end gap-2">
          {/* Reject Button */}
          {(status === "pending" || status === "approved") && (
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
          )}

          {/* Approve Button */}
          {(status === "pending" || status === "rejected") && (
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
          )}
        </div>
      </div>
    </div>
  );
};

export default DeviceApprovalModal;
