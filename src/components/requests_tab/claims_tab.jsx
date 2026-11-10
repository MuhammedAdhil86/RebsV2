import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  fetchCompanyClaims,
  updateCompanyClaimStatus,
} from "../../service/companyService";
import { FiPaperclip, FiChevronDown, FiChevronUp } from "react-icons/fi";
import ViewClaimModal from "../../ui/claimapprovemodal";

const statusColors = {
  Approved: "bg-green-100 text-green-600",
  Rejected: "bg-red-100 text-red-600",
  Pending: "bg-yellow-100 text-yellow-700",
};

/* ================= TOAST HELPERS (all backend messages go through here) ================= */
const getErrorMessage = (err, fallback) =>
  err?.response?.data?.message ||
  err?.response?.data?.error ||
  (typeof err?.response?.data?.data === "string" && err.response.data.data) ||
  err?.message ||
  fallback;

// Success message from the backend response (works for plain or axios-style responses)
const getSuccessMessage = (res, fallback) =>
  (typeof res?.message === "string" && res.message) ||
  (typeof res?.data?.message === "string" && res.data.message) ||
  fallback;

// Turns a loading toast into a success / error toast (react-toastify way)
const finishToast = (id, type, message) => {
  toast.update(id, {
    render: message,
    type,
    isLoading: false,
    autoClose: 4000,
    closeOnClick: true,
    closeButton: true,
    draggable: true,
  });
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
  { key: "expenseType", label: "Expense Type", align: "center", width: "17%" },
  { key: "amountDisplay", label: "Amount", align: "center", width: "14%" },
  { key: "date", label: "Expense Date", align: "center", width: "15%" },
  { key: "attachments", label: "Attachments", align: "center", width: "19%" },
  { key: "status", label: "Status", align: "center", width: "15%" },
];

const getCleanDocType = (file) => {
  if (file.document_type?.includes("pdf")) return "PDF";
  return "IMG";
};

export default function ClaimsRequestTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submittingModal, setSubmittingModal] = useState(false);
  const [page, setPage] = useState(1);

  // --- OVERLAY STATES ---
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [expandedAttachments, setExpandedAttachments] = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const responseData = await fetchCompanyClaims();

      // Accept: plain array, { claims: [] }, { data: [] }, or { items: [] }
      const claimsArray = Array.isArray(responseData)
        ? responseData
        : responseData?.claims ||
          responseData?.data ||
          responseData?.items ||
          [];

      const transformed = (Array.isArray(claimsArray) ? claimsArray : []).map(
        (item) => {
          const rawStatus =
            item.status && String(item.status).trim() !== ""
              ? String(item.status)
              : "Pending";

          const cleanExpenseDate = item.expense_date
            ? new Date(item.expense_date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "--";

          return {
            ...item,
            id: item.id ?? item.claim_id,
            name: item.employee_name?.trim() || `ID: ${item.employee_id}`,
            designation: item.employee_designation || "N/A",
            expenseType: item.expense_type || "General Expense",
            amountDisplay: `₹ ${Number(item.amount || 0).toLocaleString("en-IN")}`,
            date: cleanExpenseDate,
            attachments: item.attachments || item.claim_attachments || [],
            status:
              rawStatus.charAt(0).toUpperCase() +
              rawStatus.slice(1).toLowerCase(),
          };
        },
      );

      setData(transformed);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load company claims data."), {
        toastId: "claims-load-error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRowClick = (claimRowObject) => {
    setSelectedClaim(claimRowObject);
  };

  // --- TRIGGERED FROM MODAL SUBMIT BUTTONS ---
  const handleStatusUpdate = async (id, action) => {
    if (submittingModal) return;
    setSubmittingModal(true);
    const tid = toast.loading("Updating claim...");
    try {
      const res = await updateCompanyClaimStatus(id, action);
      finishToast(
        tid,
        "success",
        getSuccessMessage(
          res,
          `Claim #${id} has been successfully ${action.toLowerCase()}!`,
        ),
      );
      setSelectedClaim(null);
      fetchData(); // Reload table data with fresh backend values
    } catch (err) {
      finishToast(
        tid,
        "error",
        getErrorMessage(err, `Failed to update status to ${action}`),
      );
    } finally {
      setSubmittingModal(false);
    }
  };

  const toggleAttachmentsVisibility = (e, claimId) => {
    e.stopPropagation();
    setExpandedAttachments((prev) => ({
      ...prev,
      [claimId]: !prev[claimId],
    }));
  };

  /* ================= CELL RENDERING ================= */
  const renderCell = (col, row) => {
    if (col.key === "name") {
      return (
        <div className="flex flex-col justify-center items-start">
          <div className="font-medium text-gray-800 leading-tight">
            {row.name}
          </div>
          <div className="text-[11px] text-gray-400 font-normal mt-0.5 leading-none">
            {row.designation}
          </div>
        </div>
      );
    }

    if (col.key === "amountDisplay") {
      return (
        <div className={`flex items-center ${flexAlign[col.align]}`}>
          <span className="font-semibold text-gray-800 whitespace-nowrap">
            {row.amountDisplay}
          </span>
        </div>
      );
    }

    if (col.key === "attachments") {
      const attachments = row.attachments;
      if (!attachments || attachments.length === 0) {
        return (
          <div className={`flex items-center ${flexAlign[col.align]}`}>
            <span className="text-gray-400 text-xs font-normal leading-none">
              None
            </span>
          </div>
        );
      }

      const isExpanded = !!expandedAttachments[row.id];
      const itemsToRender = isExpanded ? attachments : [attachments[0]];

      return (
        <div className="flex flex-col gap-1.5 justify-center items-center">
          {itemsToRender.map((file) => (
            <a
              key={file.id}
              href={file.path}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center justify-center gap-1.5 text-blue-600 hover:underline bg-blue-50/70 border border-blue-100 px-2 py-0.5 rounded text-[11px] font-semibold tracking-wider leading-none whitespace-nowrap"
            >
              <FiPaperclip className="text-xs shrink-0 text-blue-500" />
              <span>{getCleanDocType(file)}</span>
            </a>
          ))}

          {attachments.length > 1 && (
            <button
              onClick={(e) => toggleAttachmentsVisibility(e, row.id)}
              className="text-[11px] font-medium text-gray-500 hover:text-gray-800 flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded transition-colors whitespace-nowrap"
            >
              {isExpanded ? (
                <>
                  Hide <FiChevronUp />
                </>
              ) : (
                <>
                  <span className="text-gray-600">
                    +{attachments.length - 1}
                  </span>{" "}
                  More <FiChevronDown />
                </>
              )}
            </button>
          )}
        </div>
      );
    }

    if (col.key === "status") {
      return (
        <div className={`flex items-center ${flexAlign[col.align]}`}>
          <span
            className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider inline-block whitespace-nowrap ${
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
          Company Claims Requests
        </h3>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-[12px]">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin mb-2" />
          <span>Loading company claims...</span>
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
                      No claims found
                    </td>
                  </tr>
                ) : (
                  pagedData.map((row) => (
                    <tr
                      key={row.id}
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

      <ViewClaimModal
        open={Boolean(selectedClaim)}
        data={selectedClaim}
        submitting={submittingModal}
        onClose={() => setSelectedClaim(null)}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  );
}
