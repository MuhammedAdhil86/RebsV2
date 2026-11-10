import React, { useEffect, useState, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";
import useLeaveStore from "../../store/useleaveStore";
import LeaveRequest from "../../ui/approve";

/* ================= TOAST HELPER (all backend messages go through here) ================= */
const getErrorMessage = (err, fallback) => {
  if (!err) return fallback;
  if (typeof err === "string") return err;
  return (
    err?.response?.data?.message ||
    (typeof err?.response?.data?.data === "string" && err.response.data.data) ||
    err?.message ||
    fallback
  );
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
  { key: "name", label: "Name", align: "left", width: "18%" },
  { key: "designation", label: "Designation", align: "center", width: "15%" },
  { key: "applied_on", label: "Applied On", align: "center", width: "13%" },
  { key: "no_of_days", label: "Total Days", align: "center", width: "10%" },
  { key: "reason", label: "Reason", align: "center", width: "17%" },
  { key: "type", label: "Leave Type", align: "center", width: "14%" },
  { key: "status", label: "Status", align: "center", width: "13%" },
];

const renderCell = (col, row) => {
  if (col.key === "name") {
    const imageSrc =
      row?.image && row.image.trim() !== "" ? row.image : DEFAULT_AVATAR;
    return (
      <div className="flex items-center gap-2 justify-start">
        <img
          src={imageSrc}
          alt="avatar"
          className="w-7 h-7 rounded-full object-cover"
        />
        <span className="whitespace-nowrap">{row.name ?? "-"}</span>
      </div>
    );
  }

  if (col.key === "designation" || col.key === "reason") {
    const val = row[col.key];
    return (
      <div className={`flex items-center ${flexAlign[col.align]}`}>
        <span className="truncate block max-w-[140px]" title={val}>
          {val || "-"}
        </span>
      </div>
    );
  }

  if (col.key === "applied_on") {
    return (
      <div className={`flex items-center ${flexAlign[col.align]}`}>
        <span className="whitespace-nowrap">
          {row.applied_on
            ? new Date(row.applied_on).toLocaleDateString("en-GB")
            : "—"}
        </span>
      </div>
    );
  }

  if (col.key === "no_of_days") {
    return (
      <div className={`flex items-center ${flexAlign[col.align]}`}>
        <span>{row.no_of_days != null ? row.no_of_days : "-"}</span>
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

  return (
    <div className={`flex items-center ${flexAlign[col.align]}`}>
      <span className="whitespace-nowrap">{row[col.key] ?? "-"}</span>
    </div>
  );
};

function LeaveRequestes() {
  const { leaves, fetchLeaves, connectWebSocket, loading, error } =
    useLeaveStore();

  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);

  const token = localStorage.getItem("authToken");

  useEffect(() => {
    fetchLeaves();
    if (token) connectWebSocket(token);
  }, [fetchLeaves, connectWebSocket, token]);

  // Show store/backend errors as a toast (toastId prevents duplicate toasts)
  useEffect(() => {
    if (error) {
      toast.error(getErrorMessage(error, "Failed to load leave requests"), {
        toastId: "leave-error",
      });
    }
  }, [error]);

  // Reset to first page when filtering or searching
  useEffect(() => {
    setPage(1);
  }, [filterStatus, searchQuery]);

  const filteredLeaves = useMemo(() => {
    let arr = Array.isArray(leaves) ? [...leaves] : [];

    if (filterStatus !== "All") {
      arr = arr.filter((req) => {
        const st = (req.status ?? "").toString().toLowerCase();
        if (filterStatus === "Pending") return st.includes("pending");
        return st === filterStatus.toLowerCase();
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      arr = arr.filter((req) => {
        return (
          (req.name ?? "").toLowerCase().includes(q) ||
          (req.reason ?? "").toLowerCase().includes(q) ||
          (req.type ?? "").toLowerCase().includes(q)
        );
      });
    }

    arr.sort((a, b) => {
      const dateA = a.applied_on ? new Date(a.applied_on) : new Date(0);
      const dateB = b.applied_on ? new Date(b.applied_on) : new Date(0);
      return dateB - dateA;
    });

    return arr;
  }, [leaves, filterStatus, searchQuery]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredLeaves.length / ROWS_PER_PAGE),
  );
  const currentPage = Math.min(page, totalPages);
  const pagedData = filteredLeaves.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE,
  );

  return (
    <div className="flex-1 grid grid-cols-1 gap-4 px-4 pb-4 bg-[#f9fafb] rounded-xl w-full mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 className="text-base font-medium text-gray-800">Leave Requests</h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
          <div className="flex flex-wrap items-center gap-2">
            {["All", "Pending", "Approved", "Rejected"].map((status) => (
              <button
                key={status}
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
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedLeave(null);
              }}
              className="bg-transparent text-gray-600 w-full focus:outline-none text-sm placeholder:text-[12px]"
            />
            <Search className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-[12px]">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin mb-2" />
          <span>Loading leave requests...</span>
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
                      No leave requests found
                    </td>
                  </tr>
                ) : (
                  pagedData.map((row, idx) => (
                    <tr
                      key={row.id ?? `${row.name}-${row.applied_on}-${idx}`}
                      onClick={() => {
                        setSelectedLeave(row);
                        setDrawerOpen(true);
                      }}
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
          {filteredLeaves.length > ROWS_PER_PAGE && (
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

      {/* Modal renders directly: it already has its own backdrop, close on outside click, Escape and X */}
      {drawerOpen && selectedLeave && (
        <LeaveRequest
          user={selectedLeave}
          onClose={() => {
            setDrawerOpen(false);
            setSelectedLeave(null);
          }}
        />
      )}
    </div>
  );
}

export default LeaveRequestes;
