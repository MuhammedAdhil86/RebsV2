import React, { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { Icon } from "@iconify/react";
import {
  updateAdvanceSalaryStatus,
  removeAdvanceSalary,
} from "../service/advanceSalaryService"; // <- adjust path
import DeleteConfirmationModal from "./deletemodal"; // <- adjust path/file name
import { showApiSuccess, showApiError } from "../utils/apiToast";
import ModalButton from "./button/modalbutton";

// Badge colours for request status (lowercase input)
const getStatusBadge = (status) => {
  if (status.includes("approved")) return "bg-green-100 text-green-700";
  if (status.includes("rejected"))
    return "bg-red-50 text-red-600 border border-red-200";
  return "bg-gray-100 text-gray-700"; // pending / anything else
};

const AdvanceSalaryApprovalModal = ({
  open,
  data,
  onClose,
  onSuccess,
  onOptimisticUpdate,
}) => {
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState(""); // "Approved" | "Rejected" (which button shows the spinner)
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleClose = () => {
    if (!loading && onClose) onClose();
  };

  // Close with the Escape key (not while the delete confirmation is open)
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape" && !loading && !confirmDelete && onClose)
        onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, loading, confirmDelete]);

  if (!open || !data) return null;

  // Advance amount as a share of the basic salary
  const amount = Number(data.rawAmount);
  const basic = Number(data.rawBasic);
  const percent =
    basic > 0 && !Number.isNaN(amount)
      ? ((amount / basic) * 100).toFixed(1)
      : "--";

  const statusLower = String(data.status || "pending").toLowerCase();

  const handleAction = async (status) => {
    if (loading) return;

    const previousStatus = data.status;

    try {
      setLoading(true);
      setAction(status);
      onOptimisticUpdate?.(data.id, status);

      // status: "Approved" | "Rejected"
      const body = await updateAdvanceSalaryStatus(data.id, status);

      // Backend message (falls back to a default text)
      showApiSuccess(
        body,
        `Advance request ${status.toLowerCase()} successfully`,
      );

      onClose();
      onSuccess?.();
    } catch (error) {
      onOptimisticUpdate?.(data.id, previousStatus);
      console.error("STATUS ERROR:", error);
      // Backend message + data (or error) in one toast
      showApiError(error, "Failed to update advance request");
    } finally {
      setLoading(false);
      setAction("");
    }
  };

  const handleDelete = async () => {
    if (loading) return;

    try {
      setLoading(true);
      setAction("Delete");
      const body = await removeAdvanceSalary(data.id);

      showApiSuccess(body, "Advance request deleted successfully");

      onClose();
      onSuccess?.(); // table reloads, so the deleted row disappears
    } catch (error) {
      console.error("DELETE ERROR:", error);
      showApiError(error, "Failed to delete advance request");
      setConfirmDelete(false);
    } finally {
      setLoading(false);
      setAction("");
    }
  };

  // ---------- Theme styles (same as Leave Request modal) ----------
  const labelCls = "text-[11px] text-gray-500 mb-1";
  const boxCls = "bg-slate-50 border border-gray-200 px-4 py-3 rounded-lg";
  const valueCls = "text-[13px] text-gray-800 break-words";

  return (
    <>
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
                  icon="solar:wallet-outline"
                  className="w-5 h-5 text-black"
                />
              </span>
              <div>
                <h2 className="text-[16px] text-gray-900">Advance Salary</h2>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Review and update the staff request
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              disabled={loading}
              className="text-gray-400 hover:text-black transition-colors disabled:opacity-50"
            >
              <Icon icon="material-symbols:close" className="w-6 h-6" />
            </button>
          </div>

          {/* BODY: staff + amounts on the left, request info on the right */}
          <div className="px-6 py-5 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* ---------- LEFT: STAFF + AMOUNTS ---------- */}
              <div className="space-y-4 min-w-0">
                {/* Staff info */}
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 shrink-0 bg-slate-100 border border-gray-200 rounded-full flex items-center justify-center text-[15px] text-gray-700 uppercase">
                    {data.name && data.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[14px] font-medium text-gray-800 leading-tight truncate">
                      {data.name}
                    </h3>
                    <p className="text-[12px] text-gray-500">Staff</p>
                  </div>
                </div>

                {/* Amounts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className={boxCls}>
                    <p className={labelCls}>Advance Amount</p>
                    <p className={`${valueCls} font-medium tabular-nums`}>
                      {data.amount}
                    </p>
                  </div>
                  <div className={boxCls}>
                    <p className={labelCls}>Basic Salary</p>
                    <p className={`${valueCls} tabular-nums`}>
                      {data.basicSalary}
                    </p>
                  </div>
                </div>

                <div className={boxCls}>
                  <p className={labelCls}>Advance vs Basic</p>
                  <p className={`${valueCls} font-medium tabular-nums`}>
                    {percent === "--" ? "--" : `${percent}%`}
                  </p>
                </div>
              </div>

              {/* ---------- RIGHT: REQUEST INFO ---------- */}
              <div className="border border-gray-200 rounded-lg p-4 self-start min-w-0 space-y-4">
                {/* Title + status */}
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[13px] font-medium text-gray-800">
                    Request Details
                  </p>
                  <span
                    className={`px-3 py-1 rounded-full text-[11px] capitalize whitespace-nowrap ${getStatusBadge(statusLower)}`}
                  >
                    {statusLower}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className={boxCls}>
                    <p className={labelCls}>Requested On</p>
                    <p className={`${valueCls} tabular-nums`}>
                      {data.requestedOn}
                    </p>
                  </div>
                  <div className={boxCls}>
                    <p className={labelCls}>Advance Date</p>
                    <p className={`${valueCls} tabular-nums`}>
                      {data.advanceDate}
                    </p>
                  </div>
                </div>

                <div className={boxCls}>
                  <p className={labelCls}>Approved By</p>
                  <p className={valueCls}>{data.approvedBy}</p>
                </div>

                <div className={boxCls}>
                  <p className={labelCls}>Reason</p>
                  <p className={valueCls}>{data.reason}</p>
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="px-6 py-4 border-t border-gray-100 bg-slate-50/60 flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => setConfirmDelete(true)}
              title="Delete"
              aria-label="Delete"
              className="px-3 py-2 border border-red-200 text-red-600 text-[12px] rounded-lg hover:bg-red-50 disabled:opacity-60 transition-colors"
            >
              <Trash2 size={16} />
            </button>

            <div className="flex gap-2">
              <ModalButton
                variant="danger"
                onClick={() => handleAction("Rejected")}
                disabled={loading || data.status === "Rejected"}
                loading={loading && action === "Rejected"}
              >
                Reject
              </ModalButton>

              <ModalButton
                variant="primary"
                onClick={() => handleAction("Approved")}
                disabled={loading || data.status === "Approved"}
                loading={loading && action === "Approved"}
              >
                Approve
              </ModalButton>
            </div>
          </div>
        </div>
      </div>

      {/* Shared delete confirmation (outside the overlay so clicks don't close the main modal) */}
      <DeleteConfirmationModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        itemName={`${data.name}'s advance request (${data.amount})`}
      />
    </>
  );
};

export default AdvanceSalaryApprovalModal;
