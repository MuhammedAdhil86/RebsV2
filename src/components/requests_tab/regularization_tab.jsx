import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";

// Components
import UniversalTable from "../../ui/universal_table";
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

/* ================= MAIN COMPONENT ================= */
export default function RegularizationTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

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

          date: rawInDate ? new Date(rawInDate).toLocaleDateString() : "--",
          checkIn: rawInDate
            ? new Date(rawInDate).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "--",
          checkOut: rawOutDate
            ? new Date(rawOutDate).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "--",
          displayInDate: rawInDate
            ? new Date(rawInDate).toLocaleDateString()
            : "--",
          displayOutDate: rawOutDate
            ? new Date(rawOutDate).toLocaleDateString()
            : "--",
          workingHours: item.total_work_hours || "--",
          remaining: 0,
        };
      });
      setData(transformed);
    } catch (err) {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = async (req) => {
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

  /* ================= UNIVERSAL TABLE COLUMNS CONFIGURATION ================= */
  const columns = [
    {
      key: "name",
      label: "Name",
      width: 180,
      render: (val) => <span className="font-medium text-gray-700">{val}</span>,
    },
    {
      key: "designation_name",
      label: "Designation",
      width: 160,
      render: (val) => (
        <span className="truncate block max-w-[140px] text-gray-500 mx-auto">
          {val}
        </span>
      ),
    },
    { key: "date", label: "Date", width: 120 },
    { key: "checkIn", label: "Check In", width: 100 },
    { key: "checkOut", label: "Check Out", width: 100 },
    { key: "workingHours", label: "Working Hours", width: 130 },
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
          Regularization Requests
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
