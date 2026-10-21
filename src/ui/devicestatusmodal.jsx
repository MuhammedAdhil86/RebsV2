import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Icon } from "@iconify/react";
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

  const inputCls =
    "w-full border p-3 rounded-2xl bg-gray-50 text-gray-600 truncate";
  const labelCls = "block mb-1 font-medium text-gray-700";

  const detectedText =
    data.change_detected_date?.Valid &&
    data.change_detected_date.Time !== "0001-01-01T00:00:00Z"
      ? formatExactTime12h(data.change_detected_date.Time)
      : data.date || "N/A";

  const spinner = (
    <span className="inline-block w-3.5 h-3.5 mr-2 align-middle border-2 border-white/30 border-t-white rounded-full animate-spin" />
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm font-poppins text-[12px]"
      onClick={onClose}
    >
      <div
        className="bg-white w-[95%] max-w-[500px] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="px-8 py-5 flex items-center justify-between border-b border-gray-50 bg-white">
          <div className="flex items-center gap-3">
            <Icon icon="solar:laptop-outline" className="w-5 h-5 text-black" />
            <div>
              <h2 className="text-gray-900 text-[16px] font-medium uppercase">
                Device Request
              </h2>
              <p className="text-gray-400 text-[10px]">
                Review and update the device change request
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-8 space-y-5 overflow-y-auto">
          {/* GRID */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <div>
              <label className={labelCls}>Employee Name</label>
              <input readOnly value={data.name || ""} className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Designation</label>
              <input
                readOnly
                value={data.designation || ""}
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>User UUID</label>
              <input
                readOnly
                value={`#${data.user_uuid ?? ""}`}
                className={`${inputCls} font-mono`}
              />
            </div>

            <div>
              <label className={labelCls}>Device Type</label>
              <input
                readOnly
                value={
                  data.is_first_device
                    ? "This is first device"
                    : "This is not first device"
                }
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Current Device</label>
              <input
                readOnly
                title={data.oldDevice || data.device}
                value={data.oldDevice || data.device || "None"}
                className={`${inputCls} font-medium`}
              />
            </div>

            <div>
              <label className={labelCls}>Requested Device</label>
              <input
                readOnly
                title={data.newDevice}
                value={data.newDevice || "None"}
                className={`${inputCls} font-medium`}
              />
            </div>

            {resolvedCurrentDeviceId && (
              <div>
                <label className={labelCls}>Current Device ID</label>
                <input
                  readOnly
                  value={resolvedCurrentDeviceId}
                  className={`${inputCls} font-mono select-all`}
                />
              </div>
            )}

            {resolvedNewDeviceId && (
              <div>
                <label className={labelCls}>Requested Device ID</label>
                <input
                  readOnly
                  value={resolvedNewDeviceId}
                  className={`${inputCls} font-mono select-all`}
                />
              </div>
            )}

            <div>
              <label className={labelCls}>Detected</label>
              <input readOnly value={detectedText} className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Status</label>
              <input readOnly value={data.status || ""} className={inputCls} />
            </div>
          </div>

          {/* REMARKS */}
          {status === "pending" && (
            <div>
              <label className={labelCls}>Action Remarks</label>
              <textarea
                rows="3"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Provide operation review log audit notes here..."
                className="w-full border p-3 rounded-2xl bg-white text-gray-700 focus:outline-none focus:border-gray-900 resize-none"
                required
              />
            </div>
          )}

          {/* FOOTER */}
          <div className="flex justify-between items-center border-t border-gray-50 pt-4 gap-3">
            <div className="flex flex-col gap-0.5 text-gray-600">
              {status === "approved" &&
                (resolvedApprovedAt || resolvedApprovedByName) && (
                  <>
                    {resolvedApprovedByName && (
                      <div>
                        <span>Approved By: </span>
                        <span className="font-semibold text-gray-900">
                          {resolvedApprovedByName}
                        </span>
                      </div>
                    )}
                    {resolvedApprovedAt && (
                      <div>
                        <span>Approved At: </span>
                        <span className="font-semibold text-gray-900">
                          {resolvedApprovedAt}
                        </span>
                      </div>
                    )}
                  </>
                )}
            </div>

            <div className="flex gap-3">
              {status === "pending" ? (
                <>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleStatusAction("rejected")}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl disabled:opacity-60 transition-colors"
                  >
                    {submitting && actionType === "rejected" && spinner}
                    Reject
                  </button>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleStatusAction("approved")}
                    className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-2xl disabled:opacity-60 transition-colors"
                  >
                    {submitting && actionType === "approved" && spinner}
                    Approve
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-2xl transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceApprovalModal;
