import React, { useEffect, useState, useMemo } from "react";
import { MoreHorizontal, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

// Services
import { fetchRegularizationRequests } from "../../service/employeeService";
import {
  approveRegularization,
  getShiftPolicyById,
} from "../../service/companyService";

// The Modal you provided earlier
import RegularizationApprovalModal from "../../ui/regularizationapproval";

const statusColors = {
  Pending: "text-yellow-500",
  Approved: "text-green-600",
  Rejected: "text-red-600",
};

/* ================= CARD COMPONENT ================= */
const RegularizeCard = ({ req, onCardClick }) => (
  <div
    onClick={() => onCardClick(req)}
    className="bg-white p-5 rounded-xl shadow-sm border w-full cursor-pointer hover:border-gray-300 transition-all"
  >
    <div className="flex justify-between items-start">
      <div>
        <p className="text-[12px] font-medium">{req.name}</p>
        <p className="text-[11px] text-gray-500">{req.designation_name}</p>
        <span
          className={`text-[11px] flex items-center gap-1 ${statusColors[req.status]}`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              req.status === "Pending"
                ? "bg-yellow-600"
                : statusColors[req.status].replace("text", "bg")
            }`}
          ></span>
          {req.status}
        </span>
      </div>
      <MoreHorizontal className="w-4 h-4 text-gray-400 cursor-pointer" />
    </div>

    <div className="bg-[#f9fafb] p-3 rounded-lg mt-3">
      <p className="text-[11px] text-gray-700">Remarks :</p>
      <p className="text-[11px] text-gray-600 mt-1 leading-relaxed line-clamp-2">
        {req.remarks}
      </p>

      {(req.status === "Approved" || req.status === "Rejected") &&
        req.approved_by && (
          <>
            <p className="text-[11px] text-gray-700 mt-3">Processed By :</p>
            <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
              {req.approved_by}
            </p>
          </>
        )}

      <div className="flex justify-between mt-4 text-[11px] text-gray-500">
        <span className="bg-white px-3 py-1 rounded">{req.displayInDate}</span>
        <span className="bg-white px-3 py-1 rounded">{req.displayOutDate}</span>
      </div>
    </div>

    {req.status === "Pending" && (
      <div className="flex gap-2 mt-5" onClick={(e) => e.stopPropagation()}>
        <button className="flex-1 px-3 py-1.5 text-[11px] rounded-lg border border-red-400 text-red-500 hover:bg-red-50">
          Reject
        </button>
        <button className="flex-1 px-3 py-1.5 text-[11px] rounded-lg bg-black text-white hover:bg-gray-800">
          Approve
        </button>
      </div>
    )}
  </div>
);

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
      const transformed = res.data.map((item) => ({
        ...item,
        id: item.id,
        userId: item.user_id,
        name: item.user_name || "N/A",
        designation_name: item.designation_name || "N/A",
        designation: item.designation_name || "N/A", // used by your modal
        status: item.status
          ? item.status.charAt(0).toUpperCase() +
            item.status.slice(1).toLowerCase()
          : "Pending",
        remarks: item.remarks || "",
        date: item.in_date ? new Date(item.in_date).toLocaleDateString() : "--",
        checkIn: item.in_date
          ? new Date(item.in_date).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "--",
        checkOut: item.out_date
          ? new Date(item.out_date).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "--",
        displayInDate: item.in_date
          ? new Date(item.in_date).toLocaleDateString()
          : "--",
        displayOutDate: item.out_date
          ? new Date(item.out_date).toLocaleDateString()
          : "--",
        workingHours: item.total_work_hours || "--",
        remaining: item.remaining || 0,
      }));
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

  // Open modal and fetch shift logic
  const handleOpenModal = async (req) => {
    setSelectedRequest(req);
    setIsModalOpen(true);
    try {
      const shift = await getShiftPolicyById(req.userId);
      setShiftData(shift);
    } catch (err) {
      setShiftData({ shift_name: "Not Allocated" });
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

  const groups = useMemo(
    () => ({
      pending: data.filter((r) => r.status === "Pending"),
      approved: data.filter((r) => r.status === "Approved"),
      rejected: data.filter((r) => r.status === "Rejected"),
    }),
    [data],
  );

  if (loading)
    return (
      <div className="p-20 text-center text-gray-400">Loading Board...</div>
    );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 p-4">
      {/* PENDING */}
      <div>
        <h3 className="text-[12px] mb-3">
          Pending Requests{" "}
          <span className="text-gray-400">({groups.pending.length})</span>
        </h3>
        <div className="flex flex-col gap-4">
          {groups.pending.map((req) => (
            <RegularizeCard
              key={req.id}
              req={req}
              onCardClick={handleOpenModal}
            />
          ))}
        </div>
      </div>

      {/* APPROVED */}
      <div>
        <h3 className="text-[12px] mb-3">
          Approved Requests{" "}
          <span className="text-gray-400">({groups.approved.length})</span>
        </h3>
        <div className="flex flex-col gap-4">
          {groups.approved.map((req) => (
            <RegularizeCard
              key={req.id}
              req={req}
              onCardClick={handleOpenModal}
            />
          ))}
        </div>
      </div>

      {/* REJECTED */}
      <div>
        <h3 className="text-[12px] mb-3">
          Rejected Requests{" "}
          <span className="text-gray-400">({groups.rejected.length})</span>
        </h3>
        <div className="flex flex-col gap-4">
          {groups.rejected.map((req) => (
            <RegularizeCard
              key={req.id}
              req={req}
              onCardClick={handleOpenModal}
            />
          ))}
        </div>
      </div>

      {/* THE MODAL */}
      <RegularizationApprovalModal
        open={isModalOpen}
        data={selectedRequest}
        shiftData={shiftData}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRequest(null);
        }}
        onSuccess={() => fetchData(true)}
        onOptimisticUpdate={handleOptimisticUpdate}
      />
    </div>
  );
}
