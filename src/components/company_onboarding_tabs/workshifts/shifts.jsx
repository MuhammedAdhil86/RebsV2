import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Plus,
  MoreHorizontal,
  Trash2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import CreateShiftModal from "../../../ui/createshiftmodal";
import { ShiftDataGet, deleteshift } from "../../../service/companyService";
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

// --- SHARED ALIGNMENT (used by BOTH <th> and <td>) ---
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

const ROWS_PER_PAGE = 8;

const Shifts = () => {
  const [viewMode, setViewMode] = useState("list");
  const [selectedShift, setSelectedShift] = useState(null);
  const [rawApiData, setRawApiData] = useState([]);
  const [shiftData, setShiftData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  // Menu & Delete Modal State
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [shiftToDelete, setShiftToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
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
    setError(null);
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
          isDefault: !!shift.is_default,
          duration: `${policy?.working_hours || 0} Hrs`,
          time:
            policy?.start_time && policy?.end_time
              ? `${formatTime(policy.start_time)} - ${formatTime(policy.end_time)}`
              : "N/A",
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
      toast.error("Failed to load shifts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShiftsData();
  }, []);

  // Reset to first page when searching
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const toggleMenu = (e, rowId) => {
    e.stopPropagation();
    if (openMenuId === rowId) {
      setOpenMenuId(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      // fixed menu (w-40 = 160px), centered under the button
      setMenuPosition({
        top: rect.bottom + 5,
        left: rect.left + rect.width / 2 - 80,
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
    if (deleting) return;
    setDeleting(true);
    const tid = toast.loading("Deleting shift...");
    try {
      await deleteshift(shiftToDelete.id);
      toast.success("Shift deleted successfully", { id: tid });
      setIsDeleteModalOpen(false);
      fetchShiftsData();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (typeof err.response?.data?.data === "string" &&
          err.response.data.data) ||
        "Failed to delete shift";
      toast.error(msg, { id: tid });
    } finally {
      setDeleting(false);
    }
  };

  const handleRowClick = (row) => {
    const originalShift = rawApiData.find((s) => s.id === row.id);
    if (originalShift) {
      setSelectedShift(originalShift);
      setViewMode("update");
    }
  };

  // --- COLUMNS: first = left, all others = center ---
  const columns = [
    { key: "name", label: "Shift Name", align: "left", width: "22%" },
    { key: "duration", label: "Duration", align: "center", width: "10%" },
    { key: "time", label: "Time", align: "center", width: "20%" },
    { key: "staff", label: "Allocated Staffs", align: "center", width: "12%" },
    { key: "break", label: "Break Time", align: "center", width: "18%" },
    {
      key: "reg",
      label: "Regularization",
      align: "center",
      width: "12%",
    },
    { key: "actions", label: "Actions", align: "center", width: "6%" },
  ];

  const renderCell = (col, row) => {
    if (col.key === "name") {
      return (
        <div className="flex items-center gap-2 justify-start">
          <span>{row.name}</span>
          {row.isDefault && (
            <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200 text-[10px] font-medium whitespace-nowrap">
              Default
            </span>
          )}
        </div>
      );
    }
    if (col.key === "actions") {
      return (
        <div className="relative flex justify-center">
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
      );
    }
    return (
      <div className={`flex items-center ${flexAlign[col.align]}`}>
        <span className="whitespace-nowrap">{row[col.key]}</span>
      </div>
    );
  };

  // --- SEARCH + PAGINATION ---
  const filteredData = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return shiftData;
    return shiftData.filter((r) =>
      [r.name, r.duration, r.time, r.staff, r.break, r.reg]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [shiftData, searchTerm]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredData.length / ROWS_PER_PAGE),
  );
  const currentPage = Math.min(page, totalPages);
  const pagedData = filteredData.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE,
  );

  // --- RENDER LOGIC ---
  return (
    <div className="w-full bg-white rounded-xl p-2">
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
            ) : error ? (
              <div className="py-16 text-center text-[12px] text-red-500">
                {error}
              </div>
            ) : (
              <>
                <div className="w-full overflow-x-auto border border-gray-100 rounded-xl">
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
                            No shifts found
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
                {filteredData.length > ROWS_PER_PAGE && (
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
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
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
          </div>
        </>
      )}
    </div>
  );
};

export default Shifts;
