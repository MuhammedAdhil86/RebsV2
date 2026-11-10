import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import toast, { Toaster } from "react-hot-toast";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Components
import AdvanceSalaryApprovalModal from "../../ui/advancesalarystatusmodal";

// Services
import { fetchAdvanceSalaries } from "../../service/advanceSalaryService";

const statusColors = {
  Pending: "bg-yellow-100 text-yellow-700",
  Approved: "bg-green-100 text-green-600",
  Rejected: "bg-red-100 text-red-600",
};

/* ================= TOAST HELPER (all backend messages go through here) ================= */
const getErrorMessage = (err, fallback) =>
  err?.response?.data?.message ||
  err?.response?.data?.error ||
  (typeof err?.response?.data?.data === "string" && err.response.data.data) ||
  err?.message ||
  fallback;

/* ================= DATE / AMOUNT HELPERS ================= */
// "2026-10-20T10:10:44Z" -> "20/10/2026" (UTC, so the date never shifts)
// Backend sends "0001-01-01T00:00:00Z" when a date is not set -> "--"
const formatDate = (raw) => {
  if (!raw) return "--";
  const d = new Date(raw);
  if (isNaN(d.getTime()) || d.getUTCFullYear() < 1971) return "--";
  return d.toLocaleDateString("en-GB", { timeZone: "UTC" });
};

const formatAmount = (raw) => {
  const n = Number(raw);
  if (raw === null || raw === undefined || raw === "" || isNaN(n)) return "--";
  return n.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
};

const capitalize = (s) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";

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
  { key: "name", label: "Name", align: "left", width: "16%" },
  { key: "amount", label: "Advance Amount", align: "center", width: "15%" },
  { key: "basicSalary", label: "Basic Salary", align: "center", width: "13%" },
  { key: "reason", label: "Reason", align: "center", width: "16%" },
  { key: "advanceDate", label: "Advance Date", align: "center", width: "13%" },
  { key: "requestedOn", label: "Requested On", align: "center", width: "13%" },
  { key: "status", label: "Status", align: "center", width: "14%" },
];

const renderCell = (col, row) => {
  if (col.key === "name") {
    return (
      <div className="flex items-center justify-start">
        <span className="font-medium text-gray-700 whitespace-nowrap">
          {row.name}
        </span>
      </div>
    );
  }

  if (col.key === "reason") {
    return (
      <div className={`flex items-center ${flexAlign[col.align]}`}>
        <span
          className="truncate block max-w-[140px] text-gray-500"
          title={row.reason}
        >
          {row.reason}
        </span>
      </div>
    );
  }

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

  return (
    <div className={`flex items-center ${flexAlign[col.align]}`}>
      <span className="whitespace-nowrap">{row[col.key]}</span>
    </div>
  );
};

/* ================= MAIN COMPONENT ================= */
export default function AdvanceSalaryReqTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  // Modal states
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // body = { status_code, message, data: [ ... ] }
      const body = await fetchAdvanceSalaries();
      const list = Array.isArray(body?.data) ? body.data : [];

      const transformed = list
        .map((item) => ({
          ...item,
          id: item.id,
          // the API returns the staff name inside staff_id
          name: (item.staff_id || "").trim() || "N/A",
          status: capitalize(item.status) || "Pending",
          reason: item.reason || "--",
          approvedBy: item.approved_by || "--",

          rawAmount: item.amount,
          rawBasic: item.basic_salary,
          amount: formatAmount(item.amount),
          basicSalary: formatAmount(item.basic_salary),
          advanceDate: formatDate(item.date),
          requestedOn: formatDate(item.requested_at),
          _requestedAt: item.requested_at,
        }))
        // newest request first
        .sort(
          (a, b) =>
            new Date(b._requestedAt || 0) - new Date(a._requestedAt || 0),
        );

      setData(transformed);
    } catch (err) {
      console.error("LOAD ERROR:", err);
      toast.error(getErrorMessage(err, "Failed to load requests"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (req) => {
    setSelectedRequest(req);
    setIsModalOpen(true);
  };

  const handleOptimisticUpdate = (id, newStatus) => {
    const formattedStatus = capitalize(newStatus);
    setData((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: formattedStatus } : item,
      ),
    );
    // keep the open modal in sync with the table
    setSelectedRequest((prev) =>
      prev && prev.id === id ? { ...prev, status: formattedStatus } : prev,
    );
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
      <Toaster position="top-right" />

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-gray-800">
          Advance Salary Requests
        </h3>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-[12px]">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin mb-2" />
          <span>Loading advance salary requests...</span>
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
                      No advance salary requests found
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

      {/* THE MODAL */}
      {isModalOpen &&
        createPortal(
          <AdvanceSalaryApprovalModal
            open={isModalOpen}
            data={selectedRequest}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedRequest(null);
            }}
            onSuccess={() => fetchData(true)}
            onOptimisticUpdate={handleOptimisticUpdate}
          />,
          document.body,
        )}
    </div>
  );
}
