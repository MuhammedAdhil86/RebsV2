import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";

// Components
import UniversalTable from "../../ui/universal_table";
import DeviceApprovalModal from "../../ui/devicestatusmodal";

// Services
import { fetchDeviceChangeRequests } from "../../service/deviceService";

const statusColors = {
  Pending: "bg-yellow-100 text-yellow-700",
  Approved: "bg-green-100 text-green-600",
  Rejected: "bg-red-100 text-red-600",
};

/* ================= HELPERS ================= */
// "2026-10-20T09:00:00Z" -> "20/10/2026" (UTC, so the date never shifts)
const formatDate = (raw) => {
  if (!raw) return "--";
  const d = new Date(raw);
  return isNaN(d.getTime())
    ? "--"
    : d.toLocaleDateString("en-GB", { timeZone: "UTC" });
};

const capitalize = (s) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "Pending";

// One cell style for every text column: centered, truncated, full text on hover
const TextCell = ({
  value,
  maxW = "max-w-[140px]",
  className = "text-gray-500",
}) => (
  <span title={value} className={`truncate block ${maxW} mx-auto ${className}`}>
    {value}
  </span>
);

/* ================= MAIN COMPONENT ================= */
export default function DeviceRequestTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const responseData = await fetchDeviceChangeRequests();

      // Guard: make sure we always map over an array
      const list = Array.isArray(responseData)
        ? responseData
        : responseData?.data || [];

      // Transform raw backend shapes (SQL nullable objects) into flat row data
      const transformed = list.map((item) => {
        const rawDate = item.change_detected_date?.Valid
          ? item.change_detected_date.Time
          : null;

        return {
          ...item, // keeps original properties for the modal payload
          id: item.id,
          name: item.name || "N/A",
          designation: item.designation || "N/A",
          oldDevice: item.device || "N/A",
          newDevice: item.new_device?.Valid ? item.new_device.String : "N/A",
          date: formatDate(rawDate),
          status: item.status?.trim()
            ? capitalize(item.status.trim())
            : "Pending",
        };
      });

      setData(transformed);
    } catch (err) {
      // Prefer the backend's own message over the generic axios 500 text
      toast.error(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to load device requests",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ================= HANDLERS ================= */
  const handleOpenModal = (req) => {
    setSelectedRequest(req);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  const handleOptimisticUpdate = (id, newStatus) => {
    const formattedStatus = capitalize(newStatus);
    setData((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: formattedStatus } : item,
      ),
    );
  };

  /* ================= UNIVERSAL TABLE COLUMNS ================= */
  const columns = [
    {
      key: "name",
      label: "Employee",
      width: 180,
      render: (val) => (
        <TextCell
          value={val}
          maxW="max-w-[150px]"
          className="font-medium text-gray-700"
        />
      ),
    },
    {
      key: "designation",
      label: "Designation",
      width: 160,
      render: (val) => <TextCell value={val} maxW="max-w-[140px]" />,
    },
    {
      key: "oldDevice",
      label: "Current Device",
      width: 170,
      render: (val) => <TextCell value={val} maxW="max-w-[150px]" />,
    },
    {
      key: "newDevice",
      label: "Requested Device",
      width: 170,
      render: (val) => <TextCell value={val} maxW="max-w-[150px]" />,
    },
    {
      key: "date",
      label: "Detected Date",
      width: 130,
      render: (val) => <TextCell value={val} maxW="max-w-[110px]" />,
    },
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
          Device Change Requests
        </h3>
      </div>

      {/* Same shared table component as the Regularization tab */}
      <UniversalTable
        columns={columns}
        data={data}
        rowsPerPage={10}
        rowClickHandler={handleOpenModal}
      />

      {/* THE MODAL */}
      {isModalOpen &&
        createPortal(
          <DeviceApprovalModal
            open={isModalOpen}
            data={selectedRequest}
            onClose={handleCloseModal}
            onSuccess={() => fetchData(true)}
            onOptimisticUpdate={handleOptimisticUpdate}
          />,
          document.body,
        )}
    </div>
  );
}
