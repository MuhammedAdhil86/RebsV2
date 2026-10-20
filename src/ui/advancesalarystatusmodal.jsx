import React, { useState } from "react";
import { X, Trash2 } from "lucide-react";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import {
  updateAdvanceSalaryStatus,
  removeAdvanceSalary,
} from "../service/advanceSalaryService"; // <- adjust path
import DeleteConfirmationModal from "./deletemodal"; // <- adjust path/file name

const AdvanceSalaryApprovalModal = ({
  open,
  data,
  onClose,
  onSuccess,
  onOptimisticUpdate,
}) => {
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!open || !data) return null;

  // Advance amount as a share of the basic salary
  const amount = Number(data.rawAmount);
  const basic = Number(data.rawBasic);
  const percent =
    basic > 0 && !Number.isNaN(amount)
      ? ((amount / basic) * 100).toFixed(1)
      : "--";

  const handleAction = async (status) => {
    if (loading) return;

    const previousStatus = data.status;

    try {
      setLoading(true);
      onOptimisticUpdate?.(data.id, status);

      // status: "Approved" | "Rejected"
      const body = await updateAdvanceSalaryStatus(data.id, status);

      // message comes from the backend
      if (body?.message) toast.success(body.message);

      onClose();
      onSuccess?.();
    } catch (error) {
      onOptimisticUpdate?.(data.id, previousStatus);
      console.error("STATUS ERROR:", error);
      if (error?.message) toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (loading) return;

    try {
      setLoading(true);
      const body = await removeAdvanceSalary(data.id);

      // message comes from the backend
      if (body?.message) toast.success(body.message);

      onClose();
      onSuccess?.(); // table reloads, so the deleted row disappears
    } catch (error) {
      console.error("DELETE ERROR:", error);
      if (error?.message) toast.error(error.message);
      setConfirmDelete(false);
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
            <Icon icon="solar:wallet-outline" className="w-5 h-5 text-black" />
            <div>
              <h2 className="text-gray-900 text-[16px] font-medium uppercase">
                Advance Salary
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
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Requested On
              </label>
              <div className="relative">
                <input
                  readOnly
                  value={data.requestedOn}
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
                Advance Amount
              </label>
              <input
                readOnly
                value={data.amount}
                className="w-full border p-3 rounded-2xl bg-gray-50 text-gray-600 font-medium"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Basic Salary
              </label>
              <input
                readOnly
                value={data.basicSalary}
                className="w-full border p-3 rounded-2xl bg-gray-50 text-gray-600"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Advance Date
              </label>
              <div className="relative">
                <input
                  readOnly
                  value={data.advanceDate}
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
                Status
              </label>
              <input
                readOnly
                value={data.status}
                className="w-full border p-3 rounded-2xl bg-gray-50 text-gray-600"
              />
            </div>
          </div>

          {/* REASON */}
          <div>
            <label className="block mb-1 font-medium text-gray-700">
              Reason
            </label>
            <textarea
              rows="3"
              readOnly
              value={data.reason}
              className="w-full border p-3 rounded-2xl bg-gray-50 text-gray-600"
            />
          </div>

          {/* FOOTER */}
          <div className="flex justify-between items-center border-t border-gray-50 pt-4 gap-3">
            <div className="flex flex-col gap-0.5 text-gray-600">
              <div>
                <span>Advance vs Basic: </span>
                <span className="font-semibold text-gray-900">
                  {percent === "--" ? "--" : `${percent}%`}
                </span>
              </div>
              <div>
                <span>Approved By: </span>
                <span className="font-semibold text-gray-900">
                  {data.approvedBy}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                disabled={loading}
                onClick={() => setConfirmDelete(true)}
                title="Delete"
                className="px-3 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-2xl disabled:opacity-60 transition-colors"
              >
                <Trash2 size={16} />
              </button>

              <button
                disabled={loading || data.status === "Rejected"}
                onClick={() => handleAction("Rejected")}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl disabled:opacity-60 transition-colors"
              >
                Reject
              </button>

              <button
                disabled={loading || data.status === "Approved"}
                onClick={() => handleAction("Approved")}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-2xl disabled:opacity-60 transition-colors"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Shared delete confirmation */}
      <DeleteConfirmationModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        itemName={`${data.name}'s advance request (${data.amount})`}
      />
    </div>
  );
};

export default AdvanceSalaryApprovalModal;
