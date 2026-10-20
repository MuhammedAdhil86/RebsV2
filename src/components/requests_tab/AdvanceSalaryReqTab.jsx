import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";

// Components
import UniversalTable from "../../ui/universal_table";
import AdvanceSalaryApprovalModal from "../../ui/advancesalarystatusmodal";

// Services
import { fetchAdvanceSalaries } from "../../service/advanceSalaryService";

const statusColors = {
  Pending: "bg-yellow-100 text-yellow-700",
  Approved: "bg-green-100 text-green-600",
  Rejected: "bg-red-100 text-red-600",
};

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

/* ================= MAIN COMPONENT ================= */
export default function AdvanceSalaryReqTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

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
      toast.error(err?.message || "Failed to load requests");
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

  /* ================= UNIVERSAL TABLE COLUMNS CONFIGURATION ================= */
  const columns = [
    {
      key: "name",
      label: "Name",
      width: 180,
      render: (val) => <span className="font-medium text-gray-700">{val}</span>,
    },
    { key: "amount", label: "Advance Amount", width: 140 },
    { key: "basicSalary", label: "Basic Salary", width: 130 },
    {
      key: "reason",
      label: "Reason",
      width: 160,
      render: (val) => (
        <span
          className="truncate block max-w-[140px] text-gray-500 mx-auto"
          title={val}
        >
          {val}
        </span>
      ),
    },
    { key: "advanceDate", label: "Advance Date", width: 120 },
    { key: "requestedOn", label: "Requested On", width: 120 },
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

  if (loading)
    return (
      <div className="p-20 text-center text-gray-400">Loading Board...</div>
    );

  return (
    <div className="bg-[#f9fafb] rounded-xl p-4 border border-gray-100 shadow-sm w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-gray-800">
          Advance Salary Requests
        </h3>
      </div>

      {/* Render the core shared system component */}
      <UniversalTable
        columns={columns}
        data={data}
        rowsPerPage={10}
        rowClickHandler={handleOpenModal}
      />

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
