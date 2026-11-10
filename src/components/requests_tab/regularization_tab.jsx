import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// Components
import RegularizationApprovalModal from "../../ui/regularizationapproval";

// Services
import { fetchRegularizationRequests } from "../../service/employeeService";
import { fetchRemainingRegularization } from "../../service/companyService";
import { getShiftPolicyById } from "../../service/companyService";

const statusColors = {
  Pending: "bg-yellow-100 text-yellow-700",
  Approved: "bg-green-100 text-green-600",
  Rejected: "bg-red-100 text-red-600",
};

/* ================= TOAST HELPER (all backend messages go through here) ================= */
const getErrorMessage = (err, fallback) =>
  err?.response?.data?.message ||
  (typeof err?.response?.data?.data === "string" && err.response.data.data) ||
  err?.message ||
  fallback;

/* ================= DATE / TIME HELPERS ================= */
// "2026-10-20T09:00:00Z" -> "09:00:00" (shown exactly as stored, no timezone shift)
const formatTime = (raw) => {
  if (!raw) return "--";
  const d = new Date(raw);
  return isNaN(d.getTime()) ? "--" : d.toISOString().slice(11, 19);
};

// "2026-10-20T09:00:00Z" -> "20/10/2026" (UTC, so the date never shifts)
const formatDate = (raw) => {
  if (!raw) return "--";
  const d = new Date(raw);
  return isNaN(d.getTime())
    ? "--"
    : d.toLocaleDateString("en-GB", { timeZone: "UTC" });
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

/* ================= COLUMNS: first = left, all others = center ================= */
const columns = [
  { key: "name", label: "Name", align: "left", width: "20%" },
  {
    key: "designation_name",
    label: "Designation",
    align: "center",
    width: "18%",
  },
  { key: "date", label: "Date", align: "center", width: "14%" },
  { key: "checkIn", label: "Check In", align: "center", width: "12%" },
  { key: "checkOut", label: "Check Out", align: "center", width: "12%" },
  {
    key: "workingHours",
    label: "Working Hours",
    align: "center",
    width: "12%",
  },
  { key: "status", label: "Status", align: "center", width: "12%" },
];

const renderCell = (col, row) => {
  if (col.key === "name") {
    return (
      <div className="flex items-center justify-start">
        <span className="whitespace-nowrap font-medium text-gray-700">
          {row.name ?? "-"}
        </span>
      </div>
    );
  }
  if (col.key === "designation_name") {
    return (
      <div className={`flex items-center ${flexAlign[col.align]}`}>
        <span
          className="truncate block max-w-[140px]"
          title={row.designation_name}
        >
          {row.designation_name || "-"}
        </span>
      </div>
    );
  }
  if (col.key === "status") {
    return (
      <div className={`flex items-center ${flexAlign[col.align]}`}>
        <span
          className={`px-3 py-1 rounded-full text-[11px] font-normal whitespace-nowrap inline-block text-center ${
            statusColors[row.status] || "bg-yellow-100 text-yellow-700"
          }`}
        >
          {row.status}
        </span>
      </div>
    );
  }
  return (
    <div className={`flex items-center ${flexAlign[col.align]}`}>
      <span className="whitespace-nowrap">{row[col.key]}</span>
    </div>
  );
};

/* ================= MAIN COMPONENT ================= */
export default function RegularizationTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  // Modal states
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [shiftData, setShiftData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetchRegularizationRequests();
      const transformed = (res.data || []).map((item) => {
        const rawInDate = item.in_date?.Valid ? item.in_date.Time : null;
        const rawOutDate = item.out_date?.Valid ? item.out_date.Time : null;

        return {
          ...item,
          id: item.id,
          userId: item.user_id,
          name: item.user_name || "N/A",
          designation_name: item.designation_name || "N/A",
          designation: item.designation_name || "N/A",
          status: item.status
            ? item.status.charAt(0).toUpperCase() +
              item.status.slice(1).toLowerCase()
            : "Pending",
          remarks: item.remarks || "",

          date: formatDate(rawInDate),
          checkIn: formatTime(rawInDate),
          checkOut: formatTime(rawOutDate),
          displayInDate: formatDate(rawInDate),
          displayOutDate: formatDate(rawOutDate),
          workingHours: item.total_work_hours || "--",
          remaining: 0,
        };
      });
      setData(transformed);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load requests"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset to first page when searching
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const handleOpenModal = async (req) => {
    // Set the request first so the modal never renders with null data
    setSelectedRequest(req);
    setIsModalOpen(true);
    try {
      const [shift, remainingRes] = await Promise.all([
        getShiftPolicyById(req.userId),
        fetchRemainingRegularization(req.userId),
      ]);

      setShiftData(shift);
      setSelectedRequest({
        ...req,
        remainingData: remainingRes,
      });
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load shift details"));
      setShiftData({ shift_name: "Not Allocated" });
      setSelectedRequest(req);
    }
  };

  const handleOptimisticUpdate = (id, newStatus) => {
    const formattedStatus =
      newStatus.charAt(0).toUpperCase() + newStatus.slice(1).toLowerCase();
    setData((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: formattedStatus } : item,
      ),
    );
  };

  /* ================= SEARCH + PAGINATION ================= */
  const filteredData = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return data;
    return data.filter((r) =>
      [
        r.name,
        r.designation_name,
        r.date,
        r.checkIn,
        r.checkOut,
        r.workingHours,
        r.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [data, searchTerm]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredData.length / ROWS_PER_PAGE),
  );
  const currentPage = Math.min(page, totalPages);
  const pagedData = filteredData.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE,
  );

  return (
    <div className="bg-[#f9fafb] rounded-xl p-4 border border-gray-100 shadow-sm w-full">
      <Toaster position="top-right" />

      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
        <h3 className="text-sm font-semibold text-gray-800">
          Regularization Requests
        </h3>
        <input
          type="text"
          placeholder="Search requests..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-black"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-[12px]">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin mb-2" />
          <span>Loading requests...</span>
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
                      No requests found
                    </td>
                  </tr>
                ) : (
                  pagedData.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => handleOpenModal(row)}
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
          {filteredData.length > ROWS_PER_PAGE && (
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

      {/* THE MODAL */}
      {isModalOpen &&
        createPortal(
          <RegularizationApprovalModal
            open={isModalOpen}
            data={selectedRequest}
            shiftData={shiftData}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedRequest(null);
              setShiftData(null);
            }}
            onSuccess={() => fetchData(true)}
            onOptimisticUpdate={handleOptimisticUpdate}
          />,
          document.body,
        )}
    </div>
  );
}
