import React, { useEffect, useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { Search, MoreHorizontal, CheckCircle2, XCircle } from "lucide-react";

// Shared Components
import UniversalTable from "../../ui/universal_table";

// Services
import {
  fetchWfhRequests,
  updateWfhStatus,
} from "../../service/employeeService";

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
      toast.error("Failed to load WFH requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(filterStatus);
  }, [filterStatus]);

  const handleStatusUpdate = async (id, nextStatus) => {
    // Optimistic UI state update
    setData((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: nextStatus } : item,
      ),
    );

    try {
      await updateWfhStatus(id, nextStatus);
      toast.success(`Request marked as ${nextStatus}`);
    } catch (err) {
      toast.error("Failed to update status");
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

  const getStatusColor = (status) => {
    if (!status) return "bg-gray-100 text-gray-600";
    const s = status.toString().toLowerCase();
    if (s.includes("approved")) return "bg-green-100 text-green-600";
    if (s.includes("pending")) return "bg-orange-100 text-orange-600";
    if (s.includes("rejected") || s.includes("inactive"))
      return "bg-red-100 text-red-600";
    return "bg-gray-100 text-gray-600";
  };

  const columns = [
    {
      key: "name",
      label: "Name",
      width: 170,
      align: "left",
      headerAlign: "left",
      render: (val, row) => {
        const imageSrc =
          row?.image && row.image.trim() !== ""
            ? row.image
            : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJFYyBlkZfPY6Jb_BDM0gAW2jdMCFsYWxgeQ&s";
        return (
          <div className="flex items-center gap-2.5 w-full text-left">
            <img
              src={imageSrc}
              alt="avatar"
              className="w-7 h-7 rounded-full object-cover shrink-0 border border-gray-100 shadow-2xs"
            />
            <span className="whitespace-nowrap font-normal text-gray-800">
              {val ?? "-"}
            </span>
          </div>
        );
      },
    },
    {
      key: "fromDate",
      label: "From Date",
      width: 120,
      align: "center",
      headerAlign: "center",
      render: (val) => <div className="text-center w-full">{val ?? "—"}</div>,
    },
    {
      key: "toDate",
      label: "To Date",
      width: 120,
      align: "center",
      headerAlign: "center",
      render: (val) => <div className="text-center w-full">{val ?? "—"}</div>,
    },
    {
      key: "reason",
      label: "Reason",
      width: 160,
      align: "center",
      headerAlign: "center",
      render: (val) => {
        const text = (val ?? "-").toString();
        const displayedReason =
          text.length > 15 ? text.substring(0, 15) + "..." : text;

        return (
          <div className="flex justify-center w-full">
            <span
              className="truncate block text-center cursor-default text-gray-600"
              title={text}
            >
              {displayedReason}
            </span>
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      width: 120,
      align: "center",
      headerAlign: "center",
      render: (val) => {
        const status = val ?? "";
        const displayedStatus =
          status.length > 10 ? status.substring(0, 10) + "..." : status;

        return (
          <div className="flex justify-center w-full">
            <span
              title={status}
              className={`px-3 py-1 rounded-full text-[11px] font-normal whitespace-nowrap inline-block max-w-[100px] text-center ${getStatusColor(
                status,
              )}`}
            >
              {displayedStatus}
            </span>
          </div>
        );
      },
    },
    {
      key: "action",
      label: "Action",
      width: 80,
      align: "center",
      headerAlign: "center",
      render: (_, row) => (
        <ActionMenuPortal row={row} onUpdate={handleStatusUpdate} />
      ),
    },
  ];

  return (
    <div className="flex-1 grid grid-cols-1 gap-4 px-4 pb-4 bg-[#f9fafb] rounded-xl w-full mx-auto">
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
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-4 border-blue-500 border-dashed rounded-full animate-spin" />
        </div>
      ) : (
        <UniversalTable
          columns={columns}
          data={filteredData}
          rowsPerPage={10}
        />
      )}
    </div>
  );
}
