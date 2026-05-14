import React, { useState, useEffect, useRef } from "react";
import { Plus, MoreHorizontal, Trash2, AlertCircle } from "lucide-react";
import CreateShiftModal from "../../../ui/createshiftmodal";
import { ShiftDataGet, deleteshift } from "../../../service/companyService";
import PayrollTable from "../../../ui/payrolltable";
import UpdateShiftTab from "../../../ui/updateshiftmodal";
import toast, { Toaster } from "react-hot-toast";

// --- CUSTOM DELETE MODAL ---
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, itemName }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="text-red-500" size={28} />
          </div>
          <h3 className="text-[18px] font-semibold text-gray-900 mb-2 font-['Poppins']">
            Delete Shift?
          </h3>
          <p className="text-[13px] text-gray-500 mb-6 font-['Poppins'] leading-relaxed">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-gray-800">"{itemName}"</span>?
            This action cannot be undone.
          </p>
          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-[12px] font-medium font-['Poppins']"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-[12px] font-medium shadow-lg shadow-red-200 font-['Poppins']"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Shifts = () => {
  const [viewMode, setViewMode] = useState("list");
  const [selectedShift, setSelectedShift] = useState(null);
  const [rawApiData, setRawApiData] = useState([]);
  const [shiftData, setShiftData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Menu & Delete Modal State
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [shiftToDelete, setShiftToDelete] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatTime = (timeStr) => {
    if (!timeStr) return "N/A";
    const [hour, minute] = timeStr.split(":");
    const hr = parseInt(hour, 10);
    const ampm = hr >= 12 ? "PM" : "AM";
    const displayHour = hr % 12 === 0 ? 12 : hr % 12;
    return `${displayHour}:${minute} ${ampm}`;
  };

  const fetchShiftsData = async () => {
    setLoading(true);
    try {
      const response = await ShiftDataGet();
      const data = Array.isArray(response) ? response : response?.data || [];
      setRawApiData(data);

      const mappedData = data.map((shift) => {
        const policy =
          shift.policies && shift.policies.length > 0
            ? shift.policies[0]
            : null;
        return {
          id: shift.id,
          name: shift.shift_name,
          duration: `${policy?.working_hours || 0} Hrs`,
          start: formatTime(policy?.start_time),
          end: formatTime(policy?.end_time),
          staff: shift.allocated_employees || 0,
          break: policy?.lunch_break_from
            ? `${formatTime(policy.lunch_break_from)} - ${formatTime(policy.lunch_break_to)}`
            : "N/A",
          reg: `${policy?.regularisation_limit || 0}/${policy?.regularisation_type || ""}`,
        };
      });

      setShiftData(mappedData);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShiftsData();
  }, []);

  const toggleMenu = (e, rowId) => {
    e.stopPropagation();
    if (openMenuId === rowId) {
      setOpenMenuId(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY + 5,
        left: rect.left + window.scrollX - 140,
      });
      setOpenMenuId(rowId);
    }
  };

  const handleOpenDelete = (e, row) => {
    e.stopPropagation();
    setShiftToDelete(row);
    setIsDeleteModalOpen(true);
    setOpenMenuId(null);
  };

  const handleConfirmDelete = async () => {
    const tid = toast.loading("Deleting shift...");
    try {
      await deleteshift(shiftToDelete.id);
      toast.success("Shift deleted successfully", { id: tid });
      setIsDeleteModalOpen(false);
      fetchShiftsData();
    } catch (err) {
      toast.error("Failed to delete shift", { id: tid });
    }
  };

  const handleRowClick = (row) => {
    const originalShift = rawApiData.find((s) => s.id === row.id);
    if (originalShift) {
      setSelectedShift(originalShift);
      setViewMode("update");
    }
  };

  const columns = [
    { key: "name", label: "Shift Name", align: "left" },
    { key: "duration", label: "Duration" },
    { key: "start", label: "Start Time" },
    { key: "end", label: "End Time" },
    { key: "staff", label: "Allocated Staffs" },
    { key: "break", label: "Break Time" },
    { key: "reg", label: "Regularization Count" },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (_, row) => (
        <div className="relative flex justify-end">
          <button
            onClick={(e) => toggleMenu(e, row.id)}
            className="p-1 text-gray-400 hover:text-gray-900 transition-colors"
          >
            <MoreHorizontal size={18} />
          </button>
          {openMenuId === row.id && (
            <div
              ref={menuRef}
              className="fixed w-40 border border-gray-200 rounded-xl shadow-2xl bg-white z-[9999] py-1"
              style={{ top: menuPosition.top, left: menuPosition.left }}
            >
              <button
                onClick={(e) => handleOpenDelete(e, row)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] text-red-500 hover:bg-red-50 font-semibold text-left"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

  // --- RENDER LOGIC ---
  return (
    <div className="w-full bg-white rounded-xl p-2">
      {/* CRITICAL: Placing Toaster here ensures it stays mounted 
          even when viewMode changes to 'create' or 'update' 
      */}
      <Toaster position="top-right" />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={shiftToDelete?.name}
      />

      {viewMode === "create" ? (
        <div className="p-6 bg-white">
          <CreateShiftModal
            onClose={() => setViewMode("list")}
            refreshData={fetchShiftsData}
          />
        </div>
      ) : viewMode === "update" ? (
        <div className="p-6 bg-white">
          <UpdateShiftTab
            onClose={() => setViewMode("list")}
            shiftData={selectedShift}
            refreshData={fetchShiftsData}
          />
        </div>
      ) : (
        /* LIST VIEW */
        <>
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
            <div className="flex gap-2 items-center w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search shifts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-200 bg-[#f9f9f9] rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
            <button
              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-[12px] font-medium active:scale-95 transition-all"
              onClick={() => setViewMode("create")}
            >
              <Plus size={14} /> Create Shift
            </button>
          </div>

          <div className="w-full">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-[12px]">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin mb-2" />
                <span>Loading shifts...</span>
              </div>
            ) : (
              <PayrollTable
                columns={columns}
                data={shiftData}
                rowsPerPage={8}
                searchTerm={searchTerm}
                rowClickHandler={handleRowClick}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Shifts;
