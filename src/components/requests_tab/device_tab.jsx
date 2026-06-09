import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import UniversalTable from "../../ui/universal_table";
import DeviceApprovalModal from "../../ui/devicestatusmodal"; // Adjust path to your modal component if needed
import { fetchDeviceChangeRequests } from "../../service/deviceService";

const statusColors = {
  Pending: "bg-yellow-100 text-yellow-700",
  Approved: "bg-green-100 text-green-600",
  Rejected: "bg-red-100 text-red-600",
};

export default function DeviceRequestTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- MODAL STATES ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const responseData = await fetchDeviceChangeRequests();

      // Transform raw backend object formats safely matching your SQL Null object shapes
      const transformed = responseData.map((item) => {
        const rawStatus =
          item.status && item.status.trim() !== "" ? item.status : "Pending";

        // Parse nested SQL Nullable Date structure
        const rawDate = item.change_detected_date?.Valid
          ? item.change_detected_date.Time
          : "";
        const cleanDate = rawDate
          ? new Date(rawDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "--";

        return {
          ...item, // Keeps original properties intact for the modal payload updates
          name: item.name || "N/A",
          designation: item.designation || "N/A",
          oldDevice: item.device || "N/A",
          // Safely extracts string property from nested Go/SQL nullable object
          newDevice: item.new_device?.Valid ? item.new_device.String : "N/A",
          date: cleanDate,
          status:
            rawStatus.charAt(0).toUpperCase() +
            rawStatus.slice(1).toLowerCase(),
        };
      });

      setData(transformed);
    } catch (err) {
      toast.error(err.message || "Failed to load device requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- HANDLER ACTIONS ---
  const handleRowClick = (reqRowObject) => {
    setSelectedRequest(reqRowObject);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  const handleOptimisticUpdate = (id, newStatus) => {
    // Normalizes formatting to match row configurations (e.g., 'Approved')
    const formattedStatus =
      newStatus.charAt(0).toUpperCase() + newStatus.slice(1).toLowerCase();

    setData((prevRows) =>
      prevRows.map((row) =>
        row.id === id ? { ...row, status: formattedStatus } : row,
      ),
    );
  };

  /* ================= COLUMNS CONFIGURATION ================= */
  const columns = [
    {
      key: "name",
      label: "Employee",
      width: 150,
      render: (val) => <span className="font-medium text-gray-800">{val}</span>,
    },
    {
      key: "designation",
      label: "Designation",
      width: 120,
      render: (val) => <span className="text-gray-600 text-xs">{val}</span>,
    },
    { key: "oldDevice", label: "Current Device", width: 150 },
    { key: "newDevice", label: "Requested Device", width: 150 },
    { key: "date", label: "Detected Date", width: 130 },
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
        Loading Device Requests...
      </div>
    );
  }

  return (
    <div className="bg-[#f9fafb] rounded-xl p-4 border border-gray-100 shadow-sm w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-gray-800">
          Device Change Requests
        </h3>
      </div>

      <UniversalTable
        columns={columns}
        data={data}
        rowsPerPage={10}
        rowClickHandler={handleRowClick}
      />

      {/* --- INTEGRATED MODAL COMPONENT --- */}
      <DeviceApprovalModal
        open={isModalOpen}
        data={selectedRequest}
        onClose={handleCloseModal}
        onSuccess={fetchData} // Re-fetches fresh table view state from backend on action completion
        onOptimisticUpdate={handleOptimisticUpdate}
      />
    </div>
  );
}
