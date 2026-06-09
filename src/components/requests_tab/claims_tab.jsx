import React, { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import UniversalTable from "../../ui/universal_table";
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

export default function ClaimsRequestTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submittingModal, setSubmittingModal] = useState(false);

  // --- OVERLAY STATES ---
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [expandedAttachments, setExpandedAttachments] = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const responseData = await fetchCompanyClaims();
      const claimsArray = Array.isArray(responseData) ? responseData : [];

      const transformed = claimsArray.map((item) => {
        const rawStatus =
          item.status && item.status.trim() !== "" ? item.status : "Pending";

        const cleanExpenseDate = item.expense_date
          ? new Date(item.expense_date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "--";

        return {
          ...item,
          name: item.employee_name?.trim() || `ID: ${item.employee_id}`,
          designation: item.employee_designation || "N/A",
          expenseType: item.expense_type || "General Expense",
          amountDisplay: `₹ ${item.amount?.toLocaleString("en-IN") || 0}`,
          date: cleanExpenseDate,
          status:
            rawStatus.charAt(0).toUpperCase() +
            rawStatus.slice(1).toLowerCase(),
        };
      });

      setData(transformed);
    } catch (err) {
      toast.error(err.message || "Failed to load company claims data.");
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
    setSubmittingModal(true);
    try {
      // Calls your precise 2-argument API signature
      await updateCompanyClaimStatus(id, action);
      toast.success(
        `Claim #${id} has been successfully ${action.toLowerCase()}!`,
      );
      setSelectedClaim(null);
      fetchData(); // Reload table data with fresh backend values
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        `Failed to update status to ${action}`;
      toast.error(errMsg);
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

  const getCleanDocType = (file) => {
    if (file.document_type?.includes("pdf")) return "PDF";
    return "IMG";
  };

  /* ================= COLUMNS CONFIGURATION ================= */
  const columns = [
    {
      key: "name",
      label: "Employee",
      width: 140,
      render: (val, row) => (
        <div className="flex flex-col justify-center py-1">
          <div className="font-medium text-gray-800 leading-tight">{val}</div>
          <div className="text-[11px] text-gray-400 font-normal mt-0.5 leading-none">
            {row.designation}
          </div>
        </div>
      ),
    },
    { key: "expenseType", label: "Expense Type", width: 140 },
    {
      key: "amountDisplay",
      label: "Amount",
      width: 120,
      render: (val) => (
        <div className="flex items-center justify-center text-center h-full w-full py-1">
          <span className="font-semibold text-gray-800 whitespace-nowrap">
            {val}
          </span>
        </div>
      ),
    },
    { key: "date", label: "Expense Date", width: 120 },
    {
      key: "attachments",
      label: "Attachments",
      width: 140,
      render: (attachments, row) => {
        if (!attachments || attachments.length === 0) {
          return (
            <div className="flex items-center justify-center text-center h-full w-full py-1">
              <span className="text-gray-400 text-xs font-normal leading-none">
                None
              </span>
            </div>
          );
        }

        const isExpanded = !!expandedAttachments[row.id];
        const itemsToRender = isExpanded ? attachments : [attachments[0]];

        return (
          <div className="flex flex-col gap-1.5 justify-center items-center text-center h-full w-full py-1">
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
      },
    },
    {
      key: "status",
      label: "Status",
      width: 110,
      render: (val) => (
        <div className="flex items-center justify-center text-center h-full w-full py-1">
          <span
            className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider inline-block whitespace-nowrap ${
              statusColors[val] || "bg-yellow-100 text-yellow-700"
            }`}
          >
            {val}
          </span>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="p-20 text-center text-gray-400">
        Loading Company Claims...
      </div>
    );
  }

  return (
    <div className="bg-[#f9fafb] rounded-xl p-4 border border-gray-100 shadow-sm w-full">
      <Toaster position="top-right" />

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-gray-800">
          Company Claims Requests
        </h3>
      </div>

      <UniversalTable
        columns={columns}
        data={data}
        rowsPerPage={10}
        rowClickHandler={handleRowClick}
      />

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
