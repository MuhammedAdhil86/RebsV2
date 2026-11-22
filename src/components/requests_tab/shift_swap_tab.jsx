import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowRightLeft } from "lucide-react";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";
import ModalButton from "../../ui/button/modalbutton"; // TODO: adjust path
import { shiftSwapService } from "../../service/policiesService"; // TODO: holds fetchCompanyShiftSwaps + updateShiftSwapStatus
import {
  showApiError,
  resolveApiSuccess,
  resolveApiError,
} from "../../utils/apiToast";

/* =====================================================================
   HELPERS
   ===================================================================== */

const MONTHS = [
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

const capitalize = (s) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;

// Ignores empty / zero dates from the backend
const isEmptyDate = (v) => !v || String(v).startsWith("0001-01-01");

// "2026-10-24T00:00:00Z" -> "24 Oct 2026" (reads the string, no timezone shift)
const formatDay = (iso) => {
  if (isEmptyDate(iso)) return "--";
  try {
    const [year, month, day] = String(iso).split("T")[0].split("-");
    return `${day} ${MONTHS[parseInt(month, 10) - 1]} ${year}`;
  } catch {
    return "--";
  }
};

// "2026-10-16T08:02:16.88Z" -> "08:02:16 AM (16 Oct 2026)" (no timezone shift)
const formatExactTime12h = (iso) => {
  if (isEmptyDate(iso)) return null;
  try {
    const [datePart, timePart] = String(iso).split("T");
    const [hourStr, minStr, secWithMs] = timePart.split(":");
    const secStr = secWithMs.substring(0, 2);

    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    const formattedHour = hour < 10 ? `0${hour}` : hour;

    return `${formattedHour}:${minStr}:${secStr} ${ampm} (${formatDay(datePart)})`;
  } catch {
    return null;
  }
};

/* =====================================================================
   MODAL
   ===================================================================== */

const getStatusBadge = (status) => {
  if (status.includes("approved")) return "bg-green-100 text-green-700";
  if (status.includes("rejected"))
    return "bg-red-50 text-red-600 border border-red-200";
  if (status.includes("cancel")) return "bg-gray-100 text-gray-500";
  return "bg-yellow-100 text-yellow-700";
};

const labelCls = "text-[11px] text-gray-500 mb-1";
const boxCls = "bg-slate-50 border border-gray-200 px-4 py-3 rounded-lg";
const valueCls = "text-[13px] text-gray-800 break-words";

const InfoBox = ({ label, children, className = "" }) => (
  <div className={boxCls}>
    <p className={labelCls}>{label}</p>
    <p className={`${valueCls} ${className}`}>
      {children !== null && children !== undefined && children !== ""
        ? children
        : "N/A"}
    </p>
  </div>
);

const ShiftSwapApprovalModal = ({
  open,
  data,
  onClose,
  onSuccess, // refetch list after a successful update
  onOptimisticUpdate, // (id, newStatus) -> update row instantly
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [showReject, setShowReject] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    if (open && data) {
      setSubmitting(false);
      setActionType(null);
      setShowReject(false);
      setRejectionReason("");
    }
  }, [open, data?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    if (!submitting && onClose) onClose();
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape" && !submitting && onClose) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, submitting]);

  if (!open || !data) return null;

  const status = data.status ? String(data.status).toLowerCase() : "pending";
  const requestedAt = formatExactTime12h(data.requested_at);
  const respondedAt = formatExactTime12h(data.responded_at);

  /* ---------- APPROVE / REJECT ---------- */
  const handleStatusAction = async (targetStatus) => {
    if (submitting) return;
    if (targetStatus === "Rejected" && !rejectionReason.trim()) return;
    setSubmitting(true);
    setActionType(targetStatus);

    const verb = targetStatus === "Approved" ? "Approving" : "Rejecting";
    const tid = toast.loading(`${verb} shift swap...`);

    try {
      // Service lowercases the status and only sends rejection_reason when rejected
      const res = await shiftSwapService.respondToSwapRequest({
        requestId: data.id,
        status: targetStatus,
        rejectionReason,
      });

      resolveApiSuccess(
        tid,
        res,
        `Shift swap ${targetStatus.toLowerCase()} successfully`,
      );

      onOptimisticUpdate?.(data.id, targetStatus);
      await onSuccess?.();
      onClose?.();
    } catch (err) {
      resolveApiError(
        tid,
        err,
        `Failed to ${targetStatus.toLowerCase()} shift swap`,
      );
      setSubmitting(false);
      setActionType(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/50 backdrop-blur-[2px] font-poppins text-[12px]"
      onClick={handleClose}
    >
      <div
        className="bg-white w-full max-w-[860px] max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-start gap-3">
            <span className="p-2 bg-slate-100 rounded-lg">
              <Icon
                icon="solar:transfer-horizontal-outline"
                className="w-5 h-5 text-black"
              />
            </span>
            <div>
              <h2 className="text-[16px] text-gray-900">Shift Swap Details</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Review and update the shift swap request
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
        <div className="px-6 py-5 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* LEFT: PEOPLE + DATE */}
            <div className="space-y-4 min-w-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 shrink-0 bg-slate-100 border border-gray-200 rounded-full flex items-center justify-center text-[15px] text-gray-700 uppercase">
                  {data.name && data.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-[14px] font-medium text-gray-800 leading-tight truncate">
                    {data.name}
                  </h3>
                  <p className="text-[12px] text-gray-500 truncate">
                    Requested by · ID {data.requester_employee_id || "N/A"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoBox label="Swap With" className="font-medium">
                  {data.swapWith}
                </InfoBox>
                <InfoBox label="Swap With ID" className="tabular-nums">
                  {data.target_employee_id}
                </InfoBox>
              </div>

              <InfoBox label="Swap Date" className="font-medium tabular-nums">
                {data.swapDate}
              </InfoBox>
            </div>

            {/* RIGHT: REQUEST INFO */}
            <div className="border border-gray-200 rounded-lg p-4 self-start min-w-0 space-y-4">
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

              <InfoBox label="Requested On" className="tabular-nums">
                {requestedAt}
              </InfoBox>

              {respondedAt && (
                <InfoBox label="Responded At" className="tabular-nums">
                  {respondedAt}
                </InfoBox>
              )}

              {data.responded_by_name && (
                <InfoBox label="Responded By">{data.responded_by_name}</InfoBox>
              )}
            </div>
          </div>

          {/* Rejection reason (shown after clicking Reject) */}
          {status === "pending" && showReject && (
            <div className="mt-5">
              <label className={labelCls} htmlFor="swap-rejection-reason">
                Rejection reason
              </label>
              <textarea
                id="swap-rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                disabled={submitting}
                rows={3}
                autoFocus
                placeholder="Tell the employee why this swap was rejected"
                className="w-full text-[13px] text-gray-800 bg-white border border-gray-200 focus:border-black outline-none rounded-lg px-3 py-2 resize-none disabled:opacity-60"
              />
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-gray-100 bg-slate-50/60 flex justify-end gap-2">
          {status === "pending" && showReject ? (
            <>
              <ModalButton
                variant="secondary"
                onClick={() => {
                  setShowReject(false);
                  setRejectionReason("");
                }}
                disabled={submitting}
              >
                Back
              </ModalButton>

              <ModalButton
                variant="danger"
                onClick={() => handleStatusAction("Rejected")}
                disabled={submitting || !rejectionReason.trim()}
                loading={submitting && actionType === "Rejected"}
              >
                Confirm Reject
              </ModalButton>
            </>
          ) : status === "pending" ? (
            <>
              <ModalButton
                variant="danger"
                onClick={() => setShowReject(true)}
                disabled={submitting}
              >
                Reject
              </ModalButton>

              <ModalButton
                variant="primary"
                onClick={() => handleStatusAction("Approved")}
                disabled={submitting}
                loading={submitting && actionType === "Approved"}
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

/* =====================================================================
   TABLE
   ===================================================================== */

const statusColors = {
  Pending: "bg-yellow-100 text-yellow-700",
  Approved: "bg-green-100 text-green-600",
  Rejected: "bg-red-100 text-red-600",
  Cancelled: "bg-gray-100 text-gray-600",
};

const textAlign = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};
const flexAlign = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
};
const cellBase = "px-4 py-3 align-middle";

const ROWS_PER_PAGE = 10;

const columns = [
  { key: "name", label: "Requested By", align: "left", width: "22%" },
  { key: "swapWith", label: "Swap With", align: "center", width: "22%" },
  { key: "swapDate", label: "Swap Date", align: "center", width: "15%" },
  { key: "requestedOn", label: "Requested On", align: "center", width: "15%" },
  { key: "respondedBy", label: "Responded By", align: "center", width: "14%" },
  { key: "status", label: "Status", align: "center", width: "12%" },
];

const renderCell = (col, row) => {
  if (col.key === "status") {
    return (
      <div className={`flex items-center ${flexAlign[col.align]}`}>
        <span
          className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider inline-block ${
            statusColors[row.status] || "bg-yellow-100 text-yellow-700"
          }`}
        >
          {row.status}
        </span>
      </div>
    );
  }

  if (col.key === "name") {
    return (
      <div className="flex items-center justify-start">
        <span className="font-medium text-gray-800 whitespace-nowrap">
          {row.name}
        </span>
      </div>
    );
  }

  if (col.key === "swapWith") {
    return (
      <div className={`flex items-center gap-1.5 ${flexAlign[col.align]}`}>
        <ArrowRightLeft size={12} className="text-gray-400" />
        <span className="text-gray-700 whitespace-nowrap">{row.swapWith}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center ${flexAlign[col.align]}`}>
      <span className="whitespace-nowrap">{row[col.key]}</span>
    </div>
  );
};

// Raw backend row -> table/modal row
const transformRow = (item) => {
  const rawStatus =
    item.status && String(item.status).trim() !== "" ? item.status : "Pending";

  return {
    ...item, // keep raw fields for the modal
    name: item.requester_employee_name || "N/A",
    swapWith: item.target_employee_name || "N/A",
    swapDate: formatDay(item.swap_date),
    requestedOn: formatDay(item.requested_at),
    respondedBy: item.responded_by_name || "--",
    status: capitalize(String(rawStatus).trim()),
  };
};

export default function ShiftSwapTab({ onRowClick, departmentId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // fetchCompanyShiftSwaps already returns the clean array
      const list = await shiftSwapService.fetchCompanyShiftSwaps(departmentId);
      setData((Array.isArray(list) ? list : []).map(transformRow));
      setPage(1);
    } catch (err) {
      showApiError(err, "Failed to load shift swap requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentId]);

  const handleRowClick = (row) => {
    setSelectedRequest({ ...row });
    setIsModalOpen(true);
    if (onRowClick) onRowClick(row);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  const handleOptimisticUpdate = (id, newStatus) => {
    const formatted = capitalize(newStatus);

    setData((prev) =>
      prev.map((row) => (row.id === id ? { ...row, status: formatted } : row)),
    );

    if (selectedRequest && selectedRequest.id === id) {
      setSelectedRequest((prev) => ({ ...prev, status: formatted }));
    }
  };

  /* ================= PAGINATION ================= */
  const totalPages = Math.max(1, Math.ceil(data.length / ROWS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pagedData = useMemo(
    () =>
      data.slice(
        (currentPage - 1) * ROWS_PER_PAGE,
        currentPage * ROWS_PER_PAGE,
      ),
    [data, currentPage],
  );

  return (
    <div className="bg-[#f9fafb] rounded-xl p-4 border border-gray-100 shadow-sm w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-gray-800">
          Shift Swap Requests
        </h3>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-[12px]">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin mb-2" />
          <span>Loading shift swap requests...</span>
        </div>
      ) : (
        <>
          <div className="w-full overflow-x-auto border border-gray-100 rounded-xl bg-white">
            <table className="w-full table-fixed border-collapse min-w-[900px] font-['Poppins']">
              <colgroup>
                {columns.map((col) => (
                  <col key={col.key} style={{ width: col.width }} />
                ))}
              </colgroup>
              <thead className="bg-[#f9f9f9]">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`${cellBase} ${textAlign[col.align]} text-[12px] font-semibold text-gray-600`}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="py-12 text-center text-[12px] text-gray-400"
                    >
                      No shift swap requests found
                    </td>
                  </tr>
                ) : (
                  pagedData.map((row, idx) => (
                    <tr
                      key={row.id ?? `swap-${idx}`}
                      onClick={() => handleRowClick(row)}
                      className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                    >
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={`${cellBase} ${textAlign[col.align]} text-[12px] text-gray-800`}
                        >
                          {renderCell(col, row)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {data.length > ROWS_PER_PAGE && (
            <div className="flex items-center justify-between mt-4 text-[12px] text-gray-500">
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 border border-gray-200 rounded-lg disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 border border-gray-200 rounded-lg disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {isModalOpen && selectedRequest && (
        <ShiftSwapApprovalModal
          open={isModalOpen}
          data={selectedRequest}
          onClose={handleCloseModal}
          onSuccess={fetchData}
          onOptimisticUpdate={handleOptimisticUpdate}
        />
      )}
    </div>
  );
}
