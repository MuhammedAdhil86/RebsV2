import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";

// Adjust these paths to match your project structure.
import shiftSwapService from "../../service/policiesService";
import { getDepartmentData } from "../../service/companyService";
import CustomSelect from "../../ui/customselect";

const STATUS_FILTERS = ["All", "Pending", "Approved", "Rejected"];

/* ================= TOAST HELPERS (backend message + data in one toast) ================= */

// Turns the "data" field into readable text (string stays, object is stringified)
const detailToText = (detail) => {
  if (detail === null || detail === undefined || detail === "") return "";
  if (typeof detail === "string") return detail;
  if (typeof detail === "object") {
    if (typeof detail.message === "string") return detail.message;
    try {
      return JSON.stringify(detail);
    } catch {
      return "";
    }
  }
  return String(detail);
};

// Pulls { message, detail } from an error. Works for axios errors
// (err.response.data) and for services that throw the response body itself.
const getErrorParts = (err, fallback) => {
  const body = err?.response?.data ?? err;
  const message =
    (typeof body?.message === "string" && body.message) ||
    (typeof body?.error === "string" && body.error) ||
    (typeof err?.message === "string" && err.message) ||
    fallback;
  let detail = detailToText(body?.data);
  if (detail === message) detail = ""; // don't show the same text twice
  return { message, detail };
};

// Pulls { message, detail } from a success response (plain or axios-style)
const getSuccessParts = (res, fallback) => {
  const body = res?.data?.message !== undefined ? res.data : res;
  const message =
    (typeof body?.message === "string" && body.message) || fallback;
  let detail = typeof body?.data === "string" ? body.data : "";
  if (detail === message) detail = "";
  return { message, detail };
};

// Toast body: message on top, data underneath
const ToastBody = ({ message, detail }) => (
  <div>
    <div style={{ fontWeight: 600, fontSize: 13 }}>{message}</div>
    {detail && (
      <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>{detail}</div>
    )}
  </div>
);

// New error toast
const showErrorToast = (err, fallback, options = {}) => {
  const { message, detail } = getErrorParts(err, fallback);
  toast.error(<ToastBody message={message} detail={detail} />, options);
};

// Turns a loading toast into a success / error toast (react-toastify way)
const finishToast = (id, type, { message, detail }) => {
  toast.update(id, {
    render: <ToastBody message={message} detail={detail} />,
    type,
    isLoading: false,
    autoClose: 5000,
    closeOnClick: true,
    closeButton: true,
    draggable: true,
  });
};

const getStatusColor = (status) => {
  if (!status) return "bg-gray-100 text-gray-600";
  const s = status.toString().toLowerCase();
  if (s.includes("approved")) return "bg-green-100 text-green-600";
  if (s.includes("pending")) return "bg-orange-100 text-orange-600";
  if (
    s.includes("rejected") ||
    s.includes("declined") ||
    s.includes("cancel") ||
    s.includes("inactive")
  )
    return "bg-red-100 text-red-600";
  return "bg-gray-100 text-gray-600";
};

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB");
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.toLocaleDateString("en-GB")} ${d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

/* ================= SHARED ALIGNMENT (used by BOTH <th> and <td>) ================= */
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
// One single cell class so header and content can never differ
const cellBase = "px-4 py-3 align-middle";

const ROWS_PER_PAGE = 10;

/* ================= COLUMNS: first = left, all others = center, Status = last ================= */
const columns = [
  {
    key: "requester_employee_name",
    label: "Requested By",
    align: "left",
    width: "15%",
  },
  {
    key: "target_employee_name",
    label: "Swap With",
    align: "center",
    width: "15%",
  },
  { key: "swap_date", label: "Swap Date", align: "center", width: "10%" },
  { key: "requested_at", label: "Requested At", align: "center", width: "14%" },
  {
    key: "responded_by_name",
    label: "Responded By",
    align: "center",
    width: "18%",
  },
  { key: "responded_at", label: "Responded At", align: "center", width: "18%" },
  { key: "status", label: "Status", align: "center", width: "10%" },
];

const renderCell = (col, row) => {
  const val = row[col.key];

  if (col.key === "status") {
    const status = val ?? "";
    return (
      <div className={`flex items-center ${flexAlign[col.align]}`}>
        <span
          title={status}
          className={`px-3 py-1 rounded-full text-[11px] font-normal whitespace-nowrap inline-block text-center capitalize ${getStatusColor(status)}`}
        >
          {status || "-"}
        </span>
      </div>
    );
  }

  let text;
  if (col.key === "swap_date") text = formatDate(val);
  else if (col.key === "requested_at" || col.key === "responded_at")
    text = formatDateTime(val);
  else text = val || (col.key === "responded_by_name" ? "—" : "-");

  return (
    <div className={`flex items-center ${flexAlign[col.align]}`}>
      <span className="whitespace-nowrap">{text}</span>
    </div>
  );
};

/* ---------- STATUS UPDATE MODAL ---------- */
const SwapStatusModal = ({
  open,
  data,
  onClose,
  onStatusUpdate,
  submitting = false,
}) => {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open && data) setReason("");
  }, [open, data]);

  if (!open || !data) return null;

  const status = data.status ? data.status.toString().toLowerCase() : "pending";

  const showRejectButton = status === "pending" || status === "approved";
  const showApproveButton = status === "pending" || status === "rejected";

  const labelCls = "block mb-1 font-medium text-gray-700";
  const inputCls =
    "w-full border p-3 rounded-2xl bg-gray-50 text-gray-600 truncate";

  const spinner = (
    <span className="inline-block w-3.5 h-3.5 mr-2 align-middle border-2 border-white/30 border-t-white rounded-full animate-spin" />
  );

  // API field name for the swap request id
  const requestId = data.request_id ?? data.id;

  const handleReject = () => {
    if (!reason.trim()) {
      toast.error("Rejection reason is required", {
        toastId: "swap-reason-required",
      });
      return;
    }
    onStatusUpdate(requestId, "rejected", reason);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm font-poppins text-[12px]"
      onClick={onClose}
    >
      <div
        className="bg-white w-[95%] max-w-[760px] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="px-8 py-4 flex items-center justify-between border-b border-gray-50 bg-white">
          <div className="flex items-center gap-3">
            <Icon
              icon="solar:shield-check-outline"
              className="w-5 h-5 text-black"
            />
            <div>
              <h2 className="text-gray-900 text-[16px] font-medium uppercase">
                {status === "pending"
                  ? "Review Shift Swap Request"
                  : "Shift Swap Details"}
              </h2>
              <p className="text-gray-400 text-[10px]">
                Review and update the swap request status
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="px-8 py-5 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
            <div>
              <label className={labelCls}>Requested By</label>
              <input
                readOnly
                value={data.requester_employee_name || "N/A"}
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Swap With</label>
              <input
                readOnly
                value={data.target_employee_name || "N/A"}
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Swap Date</label>
              <div className="relative">
                <input
                  readOnly
                  value={formatDate(data.swap_date)}
                  className={`${inputCls} pr-10`}
                />
                <Icon
                  icon="solar:calendar-outline"
                  className="w-4 h-4 text-black absolute right-4 top-1/2 -translate-y-1/2"
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Requested At</label>
              <input
                readOnly
                value={formatDateTime(data.requested_at)}
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Status</label>
              <input
                readOnly
                value={data.status || ""}
                className={`${inputCls} capitalize`}
              />
            </div>
          </div>

          {/* REJECTION REASON (required only when rejecting) */}
          {showRejectButton && (
            <div>
              <label className={labelCls}>
                Rejection Reason{" "}
                <span className="text-gray-400 font-normal">
                  (required to reject, shown to the requester)
                </span>
              </label>
              <textarea
                rows="2"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Insufficient staffing coverage on the requested date."
                className="w-full border p-3 rounded-2xl bg-white text-gray-700 focus:outline-none focus:border-gray-900 resize-none"
              />
            </div>
          )}

          {/* FOOTER */}
          <div className="flex justify-between items-center border-t border-gray-50 pt-4 gap-3">
            <div className="flex flex-col gap-0.5 text-gray-600">
              {data.responded_by_name && (
                <div>
                  <span>Processed By: </span>
                  <span className="font-semibold text-gray-900">
                    {data.responded_by_name}
                  </span>
                </div>
              )}
              {data.responded_at && (
                <div>
                  <span>Processed At: </span>
                  <span className="font-semibold text-gray-900">
                    {formatDateTime(data.responded_at)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-6 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-2xl disabled:opacity-60 transition-colors"
              >
                Cancel
              </button>

              {showRejectButton && (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleReject}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl disabled:opacity-60 transition-colors"
                >
                  {submitting && spinner}
                  Reject
                </button>
              )}

              {showApproveButton && (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => onStatusUpdate(requestId, "approved", "")}
                  className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-2xl disabled:opacity-60 transition-colors"
                >
                  {submitting && spinner}
                  Approve
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * ShiftSwapTab: all shift swap requests of the company.
 *
 * Props:
 *  - departmentId (optional): initial department filter (?department_id=)
 */
function ShiftSwapTab({ departmentId }) {
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  // Departments (fetched with getDepartmentData) for the filter dropdown
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(
    departmentId ? String(departmentId) : "",
  );

  // Status update modal
  const [selectedSwap, setSelectedSwap] = useState(null);
  const [updating, setUpdating] = useState(false);

  /* ---------- FETCH DEPARTMENTS ---------- */
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const data = await getDepartmentData();
        setDepartments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load departments:", err);
        showErrorToast(err, "Failed to load departments", {
          toastId: "swap-departments-error",
        });
      }
    };
    loadDepartments();
  }, []);

  // Keep the dropdown in sync if the parent changes the prop
  useEffect(() => {
    setSelectedDepartment(departmentId ? String(departmentId) : "");
  }, [departmentId]);

  const departmentOptions = useMemo(
    () => [
      { value: "", label: "All Departments" },
      ...departments.map((d) => ({ value: String(d.id), label: d.name })),
    ],
    [departments],
  );

  /* ---------- FETCH SWAPS ---------- */
  // Each request gets an id; only the LATEST request may update the screen.
  // This stops slow, older responses (from earlier department changes)
  // from overwriting newer data or hiding the loader too early.
  const latestRequestRef = useRef(0);

  const fetchSwaps = useCallback(async () => {
    const requestId = ++latestRequestRef.current;
    setLoading(true);
    try {
      const list = await shiftSwapService.fetchCompanyShiftSwaps(
        selectedDepartment || undefined,
      );
      if (requestId !== latestRequestRef.current) return; // stale response
      setSwaps(Array.isArray(list) ? list : []);
    } catch (err) {
      if (requestId !== latestRequestRef.current) return; // stale response
      console.error("Failed to load shift swap requests:", err);
      setSwaps([]);
      showErrorToast(err, "Failed to load shift swap requests", {
        toastId: "swap-load-error",
      });
    } finally {
      if (requestId === latestRequestRef.current) setLoading(false);
    }
  }, [selectedDepartment]);

  useEffect(() => {
    fetchSwaps();
  }, [fetchSwaps]);

  // Reset to first page when filtering, searching or changing department
  useEffect(() => {
    setPage(1);
  }, [filterStatus, searchQuery, selectedDepartment]);

  /* ---------- UPDATE STATUS ---------- */
  const handleStatusUpdate = async (requestId, status, rejectionReason) => {
    if (updating) return;
    setUpdating(true);
    const tid = toast.loading("Updating request...");
    try {
      const res = await shiftSwapService.respondToSwapRequest({
        requestId,
        status,
        rejectionReason,
      });
      finishToast(
        tid,
        "success",
        getSuccessParts(res, `Request ${status} successfully`),
      );
      setSelectedSwap(null);
      fetchSwaps();
    } catch (err) {
      console.error("Failed to respond to swap request:", err);
      // shows: message (e.g. "Failed to reject shift swap request")
      // and data (e.g. "request already processed") in the same toast
      finishToast(tid, "error", getErrorParts(err, "Status update failed"));
    } finally {
      setUpdating(false);
    }
  };

  /* ---------- FILTER + SORT ---------- */
  const filteredSwaps = useMemo(() => {
    let arr = [...swaps];

    if (filterStatus !== "All") {
      arr = arr.filter(
        (req) =>
          (req.status ?? "").toString().toLowerCase() ===
          filterStatus.toLowerCase(),
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      arr = arr.filter((req) =>
        [
          req.requester_employee_name,
          req.target_employee_name,
          req.responded_by_name,
        ].some((field) => (field ?? "").toString().toLowerCase().includes(q)),
      );
    }

    // Newest requests first.
    arr.sort((a, b) => {
      const dateA = a.requested_at ? new Date(a.requested_at) : new Date(0);
      const dateB = b.requested_at ? new Date(b.requested_at) : new Date(0);
      return dateB - dateA;
    });

    return arr;
  }, [swaps, filterStatus, searchQuery]);

  /* ---------- PAGINATION ---------- */
  const totalPages = Math.max(
    1,
    Math.ceil(filteredSwaps.length / ROWS_PER_PAGE),
  );
  const currentPage = Math.min(page, totalPages);
  const pagedData = filteredSwaps.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE,
  );

  return (
    <>
      <div className="flex-1 grid grid-cols-1 gap-4 px-4 pb-4 bg-[#f9fafb] rounded-xl w-full mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
          <h3 className="text-base font-medium text-gray-800">
            Shift Swap Requests
          </h3>

          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 w-full lg:w-auto">
            <CustomSelect
              label="Department"
              value={selectedDepartment}
              options={departmentOptions}
              onChange={setSelectedDepartment}
              minWidth={160}
            />

            <div className="flex flex-wrap items-center gap-2">
              {STATUS_FILTERS.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 text-xs rounded-md border transition ${
                    filterStatus === status
                      ? "bg-black text-white border-black"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 border px-3 py-2 rounded-lg bg-white text-sm w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-gray-600 w-full focus:outline-none text-sm placeholder:text-[12px]"
              />
              <Search className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-[12px]">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin mb-2" />
            <span>Loading shift swap requests...</span>
          </div>
        ) : (
          <>
            <div className="w-full overflow-x-auto border border-gray-100 rounded-xl bg-white">
              <table className="w-full table-fixed border-collapse min-w-[1000px] font-['Poppins']">
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
                        key={row.id ?? row.request_id ?? idx}
                        onClick={() => setSelectedSwap(row)}
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
            {filteredSwaps.length > ROWS_PER_PAGE && (
              <div className="flex items-center justify-between text-[12px] text-gray-500">
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
      </div>

      {/* ---------- STATUS UPDATE MODAL ---------- */}
      <SwapStatusModal
        open={Boolean(selectedSwap)}
        data={selectedSwap}
        onClose={() => !updating && setSelectedSwap(null)}
        onStatusUpdate={handleStatusUpdate}
        submitting={updating}
      />
    </>
  );
}

export default ShiftSwapTab;
