import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { Search, X } from "lucide-react";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";

// Adjust these paths to match your project structure.
import shiftSwapService from "../../service/policiesService";
import { getDepartmentData } from "../../service/companyService";
import UniversalTable from "../../ui/universal_table";
import CustomSelect from "../../ui/customselect";

const STATUS_FILTERS = ["All", "Pending", "Approved", "Rejected"];

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

// Employee name only (ids are intentionally not shown).
const PersonCell = ({ name }) => (
  <span className="block whitespace-nowrap">{name || "-"}</span>
);

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
      toast.error("Rejection reason is required");
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
  const [error, setError] = useState("");

  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

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
        toast.error(err?.message || err?.error || "Failed to load departments");
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
    setError("");
    try {
      const list = await shiftSwapService.fetchCompanyShiftSwaps(
        selectedDepartment || undefined,
      );
      if (requestId !== latestRequestRef.current) return; // stale response
      setSwaps(Array.isArray(list) ? list : []);
    } catch (err) {
      if (requestId !== latestRequestRef.current) return; // stale response
      console.error("Failed to load shift swap requests:", err);
      const message =
        err.response?.data?.message || "Failed to load shift swap requests";
      setSwaps([]);
      setError(message);
      toast.error(message);
    } finally {
      if (requestId === latestRequestRef.current) setLoading(false);
    }
  }, [selectedDepartment]);

  useEffect(() => {
    fetchSwaps();
  }, [fetchSwaps]);

  /* ---------- UPDATE STATUS ---------- */
  const handleStatusUpdate = async (requestId, status, rejectionReason) => {
    if (updating) return;
    setUpdating(true);
    try {
      const res = await shiftSwapService.respondToSwapRequest({
        requestId,
        status,
        rejectionReason,
      });
      toast.success(res?.message || `Request ${status} successfully`);
      setSelectedSwap(null);
      fetchSwaps();
    } catch (err) {
      console.error("Failed to respond to swap request:", err);
      toast.error(
        err?.response?.data?.message || err?.message || "Status update failed",
      );
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

  /* ---------- ROW CLICK -> OPEN MODAL ---------- */
  // Works through event delegation, so it does not depend on UniversalTable
  // supporting an onRowClick prop: find the clicked <tr>, read the request id
  // stored in its first cell, and open the modal for that request.
  const handleTableClick = (e) => {
    const rowEl = e.target.closest("tr, [role='row']");
    if (!rowEl) return;
    const marker = rowEl.querySelector("[data-swap-id]");
    if (!marker) return; // header row or empty row
    const id = marker.getAttribute("data-swap-id");
    const swap = swaps.find((s) => String(s.id) === String(id));
    if (swap) setSelectedSwap(swap);
  };

  const columns = [
    {
      key: "requester_employee_name",
      label: "Requested By",
      width: 160,
      // data-swap-id lets the row click handler find which request was clicked
      render: (val, row) => (
        <span data-swap-id={row?.id} className="block whitespace-nowrap">
          {val || "-"}
        </span>
      ),
    },
    {
      key: "target_employee_name",
      label: "Swap With",
      width: 160,
      render: (val) => <PersonCell name={val} />,
    },
    {
      key: "swap_date",
      label: "Swap Date",
      width: 110,
      render: (val) => formatDate(val),
    },
    {
      key: "requested_at",
      label: "Requested At",
      width: 150,
      render: (val) => (
        <span className="whitespace-nowrap">{formatDateTime(val)}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      width: 110,
      render: (val) => {
        const status = val ?? "";
        return (
          <span
            title={status}
            className={`px-3 py-1 rounded-full text-[11px] font-normal whitespace-nowrap inline-block text-center capitalize ${getStatusColor(status)}`}
          >
            {status || "-"}
          </span>
        );
      },
    },
    {
      key: "responded_by_name",
      label: "Responded By",
      width: 160,
      render: (val) => (val ? <PersonCell name={val} /> : "—"),
    },
    {
      key: "responded_at",
      label: "Responded At",
      width: 150,
      render: (val) => (
        <span className="whitespace-nowrap">{formatDateTime(val)}</span>
      ),
    },
  ];

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
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-blue-500 border-dashed rounded-full animate-spin" />
          </div>
        ) : (
          <div
            onClick={handleTableClick}
            className="[&_tbody_tr]:cursor-pointer"
          >
            <UniversalTable
              key={selectedDepartment || "all"}
              columns={columns}
              data={filteredSwaps}
              rowsPerPage={10}
              onRowClick={(row) => setSelectedSwap(row)}
            />
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-2 text-red-600">Error: {error}</div>
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
