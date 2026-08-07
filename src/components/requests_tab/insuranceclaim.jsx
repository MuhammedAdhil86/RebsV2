import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import UniversalTable from "../../ui/universal_table";
import InsuranceApprovalModal from "../../ui/insurancestatusmodal";
import { fetchInsuranceClaimList } from "../../service/insuranceservice";

const statusColors = {
  Pending: "bg-yellow-100 text-yellow-700",
  Approved: "bg-green-100 text-green-600",
  Rejected: "bg-red-100 text-red-600",
};

// Helper function to format numeric values to local currency format
const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function InsuranceClaimTab({ onRowClick }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- MODAL STATES ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const responseData = await fetchInsuranceClaimList();

      // Transform raw backend payload to match component table expectations
      const transformed = responseData.map((item) => {
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
      toast.error(err.message || "Failed to load insurance claims");
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

  /* ================= COLUMNS CONFIGURATION ================= */
  const columns = [
    {
      key: "name",
      label: "Employee",
      width: 150,
      render: (val, row) => (
        <div>
          <span className="font-medium text-gray-800 block">{val}</span>
        </div>
      ),
    },
    {
      key: "claimNumber",
      label: "Claim Number",
      width: 140,
      render: (val) => (
        <span className="font-mono text-gray-600 text-xs">{val}</span>
      ),
    },
    {
      key: "claimAmount",
      label: "Claim Amount",
      width: 120,
      render: (val) => (
        <span className="font-semibold text-gray-800">{val}</span>
      ),
    },
    {
      key: "settlementAmount",
      label: "Settlement Amount",
      width: 130,
      render: (val) => (
        <span className="text-emerald-700 font-medium text-xs">{val}</span>
      ),
    },
    { key: "date", label: "Claim Date", width: 120 },
    {
      key: "status",
      label: "Status",
      width: 120,
      render: (val) => (
        <span
          className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider mx-auto inline-block ${
            statusColors[val] || "bg-yellow-100 text-yellow-700"
          }`}
        >
          {val}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="p-20 text-center text-gray-400">
        Loading Insurance Claims...
      </div>
    );
  }

  return (
    <div className="bg-[#f9fafb] rounded-xl p-4 border border-gray-100 shadow-sm w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-gray-800">
          Insurance Claim Requests
        </h3>
      </div>

      <UniversalTable
        columns={columns}
        data={data}
        rowsPerPage={10}
        rowClickHandler={handleRowClick}
      />

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
