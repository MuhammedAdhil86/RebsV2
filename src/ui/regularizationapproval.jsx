import React, { useEffect, useState } from "react";
import { X, ChevronDown } from "lucide-react";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import axiosInstance from "../service/axiosinstance";

const RegularizationApprovalModal = ({
  open,
  data,
  shiftData,
  onClose,
  onSuccess,
  onOptimisticUpdate,
}) => {
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRemarks(data?.remarks || "");
  }, [data]);

  if (!open || !data) return null;

  // Extract the target policy object safely from the dynamic data response
  // It handles both raw array payloads or the data nested via custom service extractors
  const policy =
    data.remainingData?.policies?.[0] || data.remaining?.policies?.[0] || null;

  const remainingCount = policy ? policy.remaining : data.remaining || 0;
  const usedCount = policy ? policy.used : 0;
  const limitCount = policy ? policy.regularisation_limit : 0;
  const policyType = policy ? policy.regularisation_type : "";

  const handleAction = async (status) => {
    if (loading) return;

    const previousStatus = data.status;

    try {
      setLoading(true);
      onOptimisticUpdate?.(data.id, status);

      await axiosInstance.put("/admin/attendance/regularize/approval", {
        request_id: data.id,
        status,
        remarks,
      });

      toast.success(
        status === "approved"
          ? "Regularization approved successfully"
          : "Regularization rejected successfully",
      );

      onClose();
      onSuccess?.();
    } catch (error) {
      onOptimisticUpdate?.(data.id, previousStatus);
      toast.error("Failed to update regularization");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm font-poppins text-[12px]">
      <div className="bg-white w-[95%] max-w-[500px] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20">
        {/* HEADER */}
        <div className="px-8 py-5 flex items-center justify-between border-b border-gray-50 bg-white">
          <div className="flex items-center gap-3">
            <Icon
              icon="solar:calendar-outline"
              className="w-5 h-5 text-black"
            />
            <div>
              <h2 className="text-gray-900 text-[16px] font-medium uppercase">
                Attendance Regularization
              </h2>
              <p className="text-gray-400 text-[10px]">
                Review and update the staff request
              </p>
            </div>
          </div>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-8 space-y-5 overflow-y-auto">
          {/* GRID */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Staff Name
              </label>
              <input
                readOnly
                value={data.name}
                className="w-full border p-3 rounded-2xl bg-gray-50 text-gray-600"
              />
              <p className="text-[10px] text-orange-500 text-right mt-1">
                {data.designation}
              </p>
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Date
              </label>
              <div className="relative">
                <input
                  readOnly
                  value={data.date}
                  className="w-full border p-3 pr-10 rounded-2xl bg-gray-50 text-gray-600"
                />
                <Icon
                  icon="solar:calendar-outline"
                  className="w-4 h-4 text-black absolute right-4 top-1/2 -translate-y-1/2"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Check In
              </label>
              <div className="relative">
                <input
                  readOnly
                  value={data.checkIn}
                  className="w-full border p-3 pr-10 rounded-2xl bg-gray-50 text-gray-600"
                />
                <Icon
                  icon="solar:clock-circle-outline"
                  className="w-4 h-4 text-black absolute right-4 top-1/2 -translate-y-1/2"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Check Out
              </label>
              <div className="relative">
                <input
                  readOnly
                  value={data.checkOut}
                  className="w-full border p-3 pr-10 rounded-2xl bg-gray-50 text-gray-600"
                />
                <Icon
                  icon="solar:clock-circle-outline"
                  className="w-4 h-4 text-black absolute right-4 top-1/2 -translate-y-1/2"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Shift
              </label>
              <div className="relative">
                <select
                  disabled
                  value={shiftData?.shift_name || "Not Allocated"}
                  className="w-full border p-3 pr-10 rounded-2xl appearance-none cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option>{shiftData?.shift_name || "Not Allocated"}</option>
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Hours Worked
              </label>
              <input
                readOnly
                value={data.workingHours}
                className="w-full border p-3 rounded-2xl bg-gray-50 text-gray-600 font-medium"
              />
            </div>
          </div>

          {/* REMARKS */}
          <div>
            <label className="block mb-1 font-medium text-gray-700">
              Remarks
            </label>
            <textarea
              rows="3"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full border p-3 rounded-2xl"
            />
          </div>

          {/* FOOTER */}
          <div className="flex justify-between items-center border-t border-gray-50 pt-4 gap-3">
            <div className="flex flex-col gap-0.5 text-gray-600">
              <div>
                <span>Quota Usage: </span>
                <span className="font-semibold text-gray-900">{usedCount}</span>
                <span className="text-gray-400"> / {limitCount}</span>
                {policyType && (
                  <span className="text-[10px] text-gray-500 ml-1 bg-gray-100 px-1.5 py-0.5 rounded capitalize">
                    {policyType.toLowerCase()}
                  </span>
                )}
              </div>
              <div>
                <span>Regularization Remaining: </span>
                <span
                  className={`font-bold ${remainingCount === 0 ? "text-red-500" : "text-green-600"}`}
                >
                  {remainingCount}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                disabled={loading}
                onClick={() => handleAction("rejected")}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl disabled:opacity-60 transition-colors"
              >
                Reject
              </button>

              <button
                disabled={loading}
                onClick={() => handleAction("approved")}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-2xl disabled:opacity-60 transition-colors"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegularizationApprovalModal;
