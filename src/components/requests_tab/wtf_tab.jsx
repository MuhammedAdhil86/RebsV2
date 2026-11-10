import React, { useEffect, useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import toast, { Toaster } from "react-hot-toast";
import {
  Search,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Services
import {
  fetchWfhRequests,
  updateWfhStatus,
} from "../../service/employeeService";

/* ================= TOAST HELPERS (all backend messages go through here) ================= */
const getErrorMessage = (err, fallback) =>
  err?.response?.data?.message ||
  (typeof err?.response?.data?.data === "string" && err.response.data.data) ||
  err?.message ||
  fallback;

// Success message from the backend response (works for plain or axios-style responses)
const getSuccessMessage = (res, fallback) =>
  (typeof res?.message === "string" && res.message) ||
  (typeof res?.data?.message === "string" && res.data.message) ||
  fallback;

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

const DEFAULT_AVATAR =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJFYyBlkZfPY6Jb_BDM0gAW2jdMCFsYWxgeQ&s";

const getStatusColor = (status) => {
  if (!status) return "bg-gray-100 text-gray-600";
  const s = status.toString().toLowerCase();
  if (s.includes("approved")) return "bg-green-100 text-green-600";
  if (s.includes("pending")) return "bg-orange-100 text-orange-600";
  if (s.includes("rejected") || s.includes("inactive"))
    return "bg-red-100 text-red-600";
  return "bg-gray-100 text-gray-600";
};

/* ================= COLUMNS: first = left, all others = center ================= */
const columns = [
  { key: "name", label: "Name", align: "left", width: "24%" },
  { key: "fromDate", label: "From Date", align: "center", width: "16%" },
  { key: "toDate", label: "To Date", align: "center", width: "16%" },
  { key: "reason", label: "Reason", align: "center", width: "20%" },
  { key: "status", label: "Status", align: "center", width: "14%" },
  { key: "action", label: "Action", align: "center", width: "10%" },
];

// Portal-based floating action menu with horizontal trigger
function ActionMenuPortal({ row, onUpdate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  const toggleDropdown = (e) => {
    e.stopPropagation();
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuCoords({
        top: rect.bottom + window.scrollY + 6,
        left: rect.right + window.scrollX - 128, // Matches w-32 (128px)
      });
    }
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleDismissOnScrollOrResize = () => {
      if (isOpen) setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      window.addEventListener("scroll", handleDismissOnScrollOrResize, true);
      window.addEventListener("resize", handleDismissOnScrollOrResize);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("scroll", handleDismissOnScrollOrResize, true);
      window.removeEventListener("resize", handleDismissOnScrollOrResize);
    };
  }, [isOpen]);

  const currentStatus = (row.status || "").toLowerCase();
  const showApprove =
    currentStatus === "pending" || currentStatus === "rejected";
  const showReject =
    currentStatus === "pending" || currentStatus === "approved";

  return (
    <div className="flex justify-center items-center w-full">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleDropdown}
        aria-label="Actions"
        className="p-1.5 rounded-md hover:bg-gray-200/70 text-gray-500 hover:text-gray-900 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "absolute",
              top: `${menuCoords.top}px`,
              left: `${menuCoords.left}px`,
              zIndex: 9999,
            }}
            className="w-32 bg-white border border-gray-100 rounded-lg shadow-xl py-1 text-xs animate-in fade-in zoom-in-95 duration-75 select-none"
          >
            {showApprove && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onUpdate(row.id, "Approved");
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-emerald-600 hover:bg-emerald-50 transition-colors text-left font-medium"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approve
              </button>
            )}

            {showReject && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onUpdate(row.id, "Rejected");
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 transition-colors text-left font-medium"
              >
                <XCircle className="w-3.5 h-3.5" />
                Reject
              </button>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}

export default function WfhTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB");
    } catch {
      return "—";
    }
  };

  const fetchData = async (status = filterStatus, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const rawList = await fetchWfhRequests(status);

      const transformed = (rawList || []).map((item) => ({
        ...item,
        id: item.id,
        name: item.name || "-",
        image: item.image || null,
        reason: item.reason?.trim() || "-",
        fromDate: formatDate(item.from_date),
        toDate: formatDate(item.to_date),
        rawDate: item.from_date || item.applied_on || null,
        status: item.status
          ? item.status.charAt(0).toUpperCase() +
            item.status.slice(1).toLowerCase()
          : "Pending",
      }));

      setData(transformed);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load WFH requests"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(filterStatus);
  }, [filterStatus]);

  // Reset to first page when filtering or searching
  useEffect(() => {
    setPage(1);
  }, [filterStatus, searchQuery]);

  const handleStatusUpdate = async (id, nextStatus) => {
    // Optimistic UI state update
    setData((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: nextStatus } : item,
      ),
    );

    const tid = toast.loading("Updating status...");
    try {
      const res = await updateWfhStatus(id, nextStatus);
      toast.success(getSuccessMessage(res, `Request marked as ${nextStatus}`), {
        id: tid,
      });
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update status"), { id: tid });
      fetchData(filterStatus, true);
    }
  };

  const filteredData = useMemo(() => {
    let arr = Array.isArray(data) ? [...data] : [];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      arr = arr.filter((req) => {
        return (
          (req.name ?? "").toLowerCase().includes(q) ||
          (req.reason ?? "").toLowerCase().includes(q)
        );
      });
    }

    arr.sort((a, b) => {
      const dateA = a.rawDate ? new Date(a.rawDate) : new Date(0);
      const dateB = b.rawDate ? new Date(b.rawDate) : new Date(0);
      return dateB - dateA;
    });

    return arr;
  }, [data, searchQuery]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredData.length / ROWS_PER_PAGE),
  );
  const currentPage = Math.min(page, totalPages);
  const pagedData = filteredData.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE,
  );

  const renderCell = (col, row) => {
    if (col.key === "name") {
      const imageSrc =
        row?.image && row.image.trim() !== "" ? row.image : DEFAULT_AVATAR;
      return (
        <div className="flex items-center gap-2.5 justify-start">
          <img
            src={imageSrc}
            alt="avatar"
            className="w-7 h-7 rounded-full object-cover shrink-0 border border-gray-100"
          />
          <span className="whitespace-nowrap">{row.name ?? "-"}</span>
        </div>
      );
    }

    if (col.key === "reason") {
      const text = (row.reason ?? "-").toString();
      const displayedReason =
        text.length > 15 ? text.substring(0, 15) + "..." : text;
      return (
        <div className={`flex items-center ${flexAlign[col.align]}`}>
          <span className="cursor-default text-gray-600" title={text}>
            {displayedReason}
          </span>
        </div>
      );
    }

    if (col.key === "status") {
      const status = row.status ?? "";
      const displayedStatus =
        status.length > 10 ? status.substring(0, 10) + "..." : status;
      return (
        <div className={`flex items-center ${flexAlign[col.align]}`}>
          <span
            title={status}
            className={`px-3 py-1 rounded-full text-[11px] font-normal whitespace-nowrap inline-block max-w-[100px] text-center ${getStatusColor(status)}`}
          >
            {displayedStatus}
          </span>
        </div>
      );
    }

    if (col.key === "action") {
      return <ActionMenuPortal row={row} onUpdate={handleStatusUpdate} />;
    }

    return (
      <div className={`flex items-center ${flexAlign[col.align]}`}>
        <span className="whitespace-nowrap">{row[col.key] ?? "—"}</span>
      </div>
    );
  };

  return (
    <div className="flex-1 grid grid-cols-1 gap-4 px-4 pb-4 bg-[#f9fafb] rounded-xl w-full mx-auto">
      <Toaster position="top-right" />

      {/* Top Header Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 className="text-base font-medium text-gray-800">
          Work From Home Requests
        </h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
          {/* Status Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {["All", "Pending", "Approved", "Rejected"].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 text-xs rounded-md border transition ${
                  filterStatus === status
                    ? "bg-black text-white border-black font-medium"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-2 border border-gray-200 px-3 py-2 rounded-lg bg-white text-sm w-full sm:w-auto focus-within:border-gray-400 transition-colors">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-gray-600 w-full focus:outline-none text-sm placeholder:text-[12px]"
            />
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
          </div>
        </div>
      </div>

      {/* Table Content & Spinner */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-[12px]">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin mb-2" />
          <span>Loading WFH requests...</span>
        </div>
      ) : (
        <>
          <div className="w-full overflow-x-auto border border-gray-100 rounded-xl bg-white">
            <table className="w-full table-fixed border-collapse min-w-[800px] font-['Poppins']">
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
                      No WFH requests found
                    </td>
                  </tr>
                ) : (
                  pagedData.map((row) => (
                    <tr
                      key={row.id}
                      className="border-t border-gray-100 hover:bg-gray-50"
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
          {filteredData.length > ROWS_PER_PAGE && (
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
  );
}
