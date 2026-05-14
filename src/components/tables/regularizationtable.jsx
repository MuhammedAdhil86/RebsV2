import React, { useEffect, useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { Search, MoreVertical, Pencil, Eye, Plus } from "lucide-react";
import toast from "react-hot-toast";

import UniversalTable from "../../ui/universal_table";
import { fetchRegularizationRequests } from "../../service/employeeService";
import { getShiftPolicyById } from "../../service/companyService";

import AddRegularizeModal from "../../ui/addregularize";
import RegularizationApprovalModal from "../../ui/regularizationapproval";

/* ================= ACTION MENU ================= */
const ActionMenu = ({ row, openMenuId, setOpenMenuId, onEdit }) => {
  const isOpen = openMenuId === row.id;
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const toggleMenu = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({ top: rect.bottom + 6, left: rect.right - 140 });
    }
    setOpenMenuId(isOpen ? null : row.id);
  };

  useEffect(() => {
    const handleOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        !buttonRef.current.contains(e.target)
      ) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [setOpenMenuId]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggleMenu}
        className="p-1 rounded-full hover:bg-gray-100"
      >
        <MoreVertical className="w-4 h-4 text-gray-600" />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
            }}
            className="w-32 bg-white border rounded-lg shadow-xl z-[999999]"
          >
            <button
              onClick={() => {
                setOpenMenuId(null);
                onEdit(row);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>

            <button
              onClick={() => {
                setOpenMenuId(null);
                toast("View coming soon");
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100"
            >
              <Eye className="w-4 h-4" />
              View
            </button>
          </div>,
          document.body,
        )}
    </>
  );
};

/* ================= MAIN COMPONENT ================= */
function RegularizationTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);

  const [selectedRow, setSelectedRow] = useState(null);
  const [shiftData, setShiftData] = useState(null);
  const [modalType, setModalType] = useState(null); // "add" | "approve" | null

  /* ================= FETCH DATA & TRANSFORM ================= */
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetchRegularizationRequests();

      // Standardizing the response to match your specific API Object structure
      const transformed = (res.data || []).map((item) => {
        // Accessing the .Time property within the nested in_date/out_date objects
        const rawInTime = item.in_date?.Time;
        const rawOutTime = item.out_date?.Time;

        const inDateObj = rawInTime ? new Date(rawInTime) : null;
        const outDateObj = rawOutTime ? new Date(rawOutTime) : null;

        return {
          id: item.id,
          userId: item.user_id,
          name: item.user_name || "N/A",
          designation: item.designation_name || "N/A",
          date: inDateObj
            ? inDateObj.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "--",
          checkIn: inDateObj
            ? inDateObj.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "--",
          checkOut: outDateObj
            ? outDateObj.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "--",
          workingHours: item.total_work_hours || "--",
          status: item.status || "pending",
          avatar:
            item.user_image || `https://i.pravatar.cc/40?u=${item.user_id}`,
          remarks: item.remarks || "",
          remaining: item.remaining || 0,
          // Keep raw data for modal usage if needed
          raw_data: item,
        };
      });

      setData(transformed);
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Failed to load regularization requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ================= OPTIMISTIC STATUS UPDATE ================= */
  const handleOptimisticUpdate = (id, status) => {
    setData((prev) =>
      prev.map((row) => (row.id === id ? { ...row, status } : row)),
    );
  };

  /* ================= STATUS COLOR ================= */
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-600";
      case "rejected":
        return "bg-red-100 text-red-600";
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  /* ================= COLUMNS ================= */
  const columns = [
    {
      key: "name",
      label: "Name",
      width: 180,
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <img
            src={row.avatar}
            className="w-7 h-7 rounded-full object-cover"
            alt="avatar"
            onError={(e) => {
              e.target.src = `https://i.pravatar.cc/40?u=${row.userId}`;
            }}
          />
          <span className="font-medium text-gray-700">{val}</span>
        </div>
      ),
    },
    {
      key: "designation",
      label: "Designation",
      width: 160,
      render: (val) => (
        <span className="truncate block max-w-[140px] text-gray-500 text-xs">
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
          className={`px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${getStatusColor(
            val,
          )}`}
        >
          {val}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      width: 60,
      render: (_, row) => (
        <ActionMenu
          row={row}
          openMenuId={openMenuId}
          setOpenMenuId={setOpenMenuId}
          onEdit={async (selectedRow) => {
            setSelectedRow(selectedRow);
            setModalType("approve");
            try {
              const shiftInfo = await getShiftPolicyById(selectedRow.userId);
              setShiftData(shiftInfo || { shift_name: "Not Allocated" });
            } catch (err) {
              setShiftData({ shift_name: "Not Allocated" });
            }
          }}
        />
      ),
    },
  ];

  /* ================= SEARCH FILTER ================= */
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const q = searchTerm.toLowerCase();
    return data.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.designation.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q),
    );
  }, [data, searchTerm]);

  return (
    <>
      <div className="bg-[#f9fafb] rounded-xl p-4 border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-semibold text-gray-800">
            Regularization Requests
          </h3>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedRow(null);
                setModalType("add");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded-md text-xs font-medium hover:bg-gray-800 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Regularize
            </button>

            <div className="flex items-center gap-1 border border-gray-200 px-2 py-1.5 rounded-md bg-white text-xs w-40">
              <input
                type="text"
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent w-full focus:outline-none text-gray-700"
              />
              <Search className="w-3.5 h-3.5 text-gray-400" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col justify-center items-center py-20 text-gray-400 gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            <span className="text-xs">Loading requests...</span>
          </div>
        ) : (
          <UniversalTable
            columns={columns}
            data={filteredData}
            rowsPerPage={10}
          />
        )}
      </div>

      {/* ================= MODALS ================= */}
      {modalType === "add" &&
        createPortal(
          <AddRegularizeModal
            open
            data={selectedRow}
            onClose={() => {
              setModalType(null);
              setSelectedRow(null);
            }}
            onSuccess={() => {
              fetchData();
              setModalType(null);
            }}
          />,
          document.body,
        )}

      {modalType === "approve" &&
        createPortal(
          <RegularizationApprovalModal
            open
            data={selectedRow}
            shiftData={shiftData}
            onClose={() => {
              setModalType(null);
              setSelectedRow(null);
              setShiftData(null);
            }}
            onSuccess={() => {
              fetchData();
              setModalType(null);
            }}
            onOptimisticUpdate={handleOptimisticUpdate}
          />,
          document.body,
        )}
    </>
  );
}

export default RegularizationTable;
