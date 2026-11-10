import React, { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { ChevronLeft, ChevronRight } from "lucide-react";
import InsuranceApprovalModal from "../../ui/insurancestatusmodal";
import { fetchInsuranceClaimList } from "../../service/insuranceservice";

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

// Helper function to format numeric values to local currency format
const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
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
  { key: "name", label: "Employee", align: "left", width: "20%" },
  { key: "claimNumber", label: "Claim Number", align: "center", width: "17%" },
  { key: "claimAmount", label: "Claim Amount", align: "center", width: "15%" },
  {
    key: "settlementAmount",
    label: "Settlement Amount",
    align: "center",
    width: "17%",
  },
  { key: "date", label: "Claim Date", align: "center", width: "16%" },
  { key: "status", label: "Status", align: "center", width: "15%" },
];

const renderCell = (col, row) => {
  if (col.key === "name") {
    return (
      <div className="flex items-center justify-start">
        <span className="font-medium text-gray-800 whitespace-nowrap">
          {row.name}
        </span>
      </div>
    );
  }

  if (col.key === "claimNumber") {
    return (
      <div className={`flex items-center ${flexAlign[col.align]}`}>
        <span className="font-mono text-gray-600 text-xs whitespace-nowrap">
          {row.claimNumber}
        </span>
      </div>
    );
  }

  if (col.key === "claimAmount") {
    return (
      <div className={`flex items-center ${flexAlign[col.align]}`}>
        <span className="font-semibold text-gray-800 whitespace-nowrap">
          {row.claimAmount}
        </span>
      </div>
    );
  }

  if (col.key === "settlementAmount") {
    return (
      <div className={`flex items-center ${flexAlign[col.align]}`}>
        <span className="text-emerald-700 font-medium text-xs whitespace-nowrap">
          {row.settlementAmount}
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

export default function InsuranceClaimTab({ onRowClick }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  // --- MODAL STATES ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const responseData = await fetchInsuranceClaimList();

      // Guard: make sure we always map over an array
      const list = Array.isArray(responseData)
        ? responseData
        : responseData?.data || [];

      // Transform raw backend payload to match component table expectations
      const transformed = list.map((item) => {
        const rawStatus =
          item.claim_status && item.claim_status.trim() !== ""
            ? item.claim_status
            : "Pending";

        const cleanDate = item.claim_date
          ? new Date(item.claim_date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "--";

        return {
          ...item, // Retains raw object structure for downstream actions
          name: item.employee_name || "N/A",
          user_uuid: item.employee_id || "N/A",
          claimNumber: item.claim_number || "N/A",
          claimAmount: formatCurrency(item.claim_amount),
          settlementAmount: item.settlement_amount
            ? formatCurrency(item.settlement_amount)
            : "--",
          date: cleanDate,
          status:
            rawStatus.charAt(0).toUpperCase() +
            rawStatus.slice(1).toLowerCase(),
        };
      });

      setData(transformed);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load insurance claims"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- HANDLER ACTIONS ---
  const handleRowClick = (reqRowObject) => {
    // Ensures modal receives fresh row object instance on every click
    setSelectedRequest({ ...reqRowObject });
    setIsModalOpen(true);

    if (onRowClick) {
      onRowClick(reqRowObject);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  const handleOptimisticUpdate = (id, newStatus) => {
    const formattedStatus =
      newStatus.charAt(0).toUpperCase() + newStatus.slice(1).toLowerCase();

    setData((prevRows) =>
      prevRows.map((row) =>
        row.id === id
          ? { ...row, status: formattedStatus, claim_status: formattedStatus }
          : row,
      ),
    );

    // Synchronize active selected row inside modal dynamically
    if (selectedRequest && selectedRequest.id === id) {
      setSelectedRequest((prev) => ({
        ...prev,
        status: formattedStatus,
        claim_status: formattedStatus,
      }));
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
      <Toaster position="top-right" />

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-gray-800">
          Insurance Claim Requests
        </h3>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-[12px]">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin mb-2" />
          <span>Loading insurance claims...</span>
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
                      No insurance claims found
                    </td>
                  </tr>
                ) : (
                  pagedData.map((row, idx) => (
                    <tr
                      key={row.id ?? `${row.claimNumber}-${idx}`}
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

      {/* --- INTEGRATED MODAL COMPONENT --- */}
      {isModalOpen && selectedRequest && (
        <InsuranceApprovalModal
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
