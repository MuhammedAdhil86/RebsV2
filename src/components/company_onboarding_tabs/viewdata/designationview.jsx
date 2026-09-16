import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { MoreHorizontal, Pencil, Trash2, X, Loader2 } from "lucide-react";

import UniversalTable from "../../../ui/universal_table";
import GlowButton from "../../../components/helpers/glowbutton";
import DeleteConfirmationModal from "../../../ui/deletemodal";
import {
  getDesignationData,
  editDesignationData,
  deleteDesignationData,
} from "../../../service/companyService";

/* ---------- UNIVERSAL MODAL COMPONENT ---------- */
function UniversalModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "max-w-[500px]",
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm font-poppins text-[12px] p-4">
      <div
        className={`bg-white w-[95%] ${maxWidth} rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20`}
      >
        {/* Header */}
        <div className="px-8 py-5 flex items-center justify-between border-b border-gray-50 bg-white">
          <div>
            <h2 className="text-gray-900 text-[16px] font-medium uppercase tracking-wide">
              {title}
            </h2>
            {subtitle && (
              <p className="text-gray-400 text-[10px] mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors p-1 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-8 overflow-y-auto space-y-6">{children}</div>
      </div>
    </div>
  );
}

/* ---------- PORTAL ACTION MENU ---------- */
function ActionMenuPortal({ row, onEdit, onDeleteClick }) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  const toggleDropdown = (e) => {
    e.stopPropagation();
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuCoords({
        top: rect.bottom + window.scrollY + 6,
        left: rect.right + window.scrollX - 128,
      });
    }
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleDismissOnScrollOrResize = () => {
      if (isOpen) setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      window.addEventListener("scroll", handleDismissOnScrollOrResize, true);
      window.addEventListener("resize", handleDismissOnScrollOrResize);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("scroll", handleDismissOnScrollOrResize, true);
      window.removeEventListener("resize", handleDismissOnScrollOrResize);
    };
  }, [isOpen]);

  return (
    <div className="flex justify-center items-center w-full">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleDropdown}
        aria-label="Actions"
        className="p-1.5 rounded-md hover:bg-gray-200/70 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "absolute",
              top: `${menuCoords.top}px`,
              left: `${menuCoords.left}px`,
              zIndex: 9999,
            }}
            className="w-32 bg-white border border-gray-100 rounded-lg shadow-xl py-1 text-xs animate-in fade-in zoom-in-95 duration-75 select-none"
          >
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onEdit(row);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-50 transition-colors text-left font-medium cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5 text-gray-500" />
              Edit
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onDeleteClick(row);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 transition-colors text-left font-medium cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}

/* ---------- MAIN COMPONENT ---------- */
const DesignationView = () => {
  const [designationData, setDesignationData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Edit State
  const [editModalData, setEditModalData] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);

  /* ---------- FETCH DATA ---------- */
  const fetchDesignations = async () => {
    setLoading(true);
    try {
      const response = await getDesignationData();
      setDesignationData(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error("Error fetching designation data:", error);
      toast.error(
        error?.message || error?.error || "Failed to load designations",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDesignations();
  }, []);

  /* ---------- DELETE HANDLERS ---------- */
  const handleOpenDelete = (designation) => {
    setDeleteTarget(designation);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget?.id) return;

    try {
      const res = await deleteDesignationData(deleteTarget.id);
      toast.success(res?.message || "Designation deleted successfully");
      setDesignationData((prev) =>
        prev.filter((d) => d.id !== deleteTarget.id),
      );
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err?.message || err?.error || err?.detail || "Delete failed");
    }
  };

  /* ---------- EDIT MODAL OPEN ---------- */
  const handleOpenEdit = (designation) => {
    setEditModalData({
      id: designation.id,
      name: designation.name || "",
      code: designation.code || "",
      email: designation.email || "",
    });
  };

  /* ---------- UPDATE HANDLER ---------- */
  const handleUpdateSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsUpdating(true);

    const { id, ...payload } = editModalData;

    try {
      const res = await editDesignationData(id, payload);
      toast.success(res?.message || "Designation updated successfully");
      setDesignationData((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...payload } : d)),
      );
      setEditModalData(null);
    } catch (err) {
      toast.error(err?.message || err?.error || err?.detail || "Update failed");
    } finally {
      setIsUpdating(false);
    }
  };

  /* ---------- TABLE COLUMNS ---------- */
  const columns = [
    {
      key: "name",
      label: "Designation Name",
      align: "left",
      headerAlign: "left",
      render: (value) => (
        <div title={value} className="text-gray-800 font-normal">
          {value
            ? value.length > 25
              ? value.slice(0, 25) + "..."
              : value
            : "—"}
        </div>
      ),
    },
    {
      key: "code",
      label: "Designation Code",
      align: "center",
      headerAlign: "center",
      render: (val) => <div className="text-center w-full">{val || "—"}</div>,
    },
    {
      key: "email",
      label: "Email",
      align: "left",
      headerAlign: "left",
      render: (val) => <div className="text-gray-600">{val || "—"}</div>,
    },
    {
      key: "createdon",
      label: "Created On",
      align: "center",
      headerAlign: "center",
      render: (value) => (
        <div className="text-center w-full text-gray-500">
          {value ? new Date(value).toLocaleDateString("en-GB") : "—"}
        </div>
      ),
    },
    {
      key: "action",
      label: "Action",
      width: 80,
      align: "center",
      headerAlign: "center",
      render: (_, row) => (
        <ActionMenuPortal
          row={row}
          onEdit={handleOpenEdit}
          onDeleteClick={handleOpenDelete}
        />
      ),
    },
  ];

  return (
    <>
      <div className="flex-1 grid grid-cols-1 gap-4 px-4 pb-4 bg-[#f9fafb] rounded-xl w-full mx-auto mt-5 font-poppins">
        <div className="flex justify-between items-center py-2">
          <h3 className="text-base font-medium text-gray-800">Designations</h3>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-blue-500 border-dashed rounded-full animate-spin" />
          </div>
        ) : (
          <UniversalTable
            columns={columns}
            data={designationData}
            rowsPerPage={6}
          />
        )}
      </div>

      {/* ---------- EDIT VIA UNIVERSAL MODAL ---------- */}
      <UniversalModal
        isOpen={Boolean(editModalData)}
        onClose={() => setEditModalData(null)}
        title="Edit Designation"
        subtitle="Update designation details"
        maxWidth="max-w-[480px]"
      >
        {editModalData && (
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] font-medium text-gray-600 block mb-1">
                Designation Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Senior Software Engineer"
                value={editModalData.name}
                onChange={(e) =>
                  setEditModalData((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                className="w-full border border-gray-200 p-3 rounded-2xl text-xs text-gray-800 focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-gray-600 block mb-1">
                Designation Code
              </label>
              <input
                type="text"
                required
                placeholder="e.g. SSE"
                value={editModalData.code}
                onChange={(e) =>
                  setEditModalData((prev) => ({
                    ...prev,
                    code: e.target.value,
                  }))
                }
                className="w-full border border-gray-200 p-3 rounded-2xl text-xs text-gray-800 focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-gray-600 block mb-1">
                Email
              </label>
              <input
                type="email"
                placeholder="e.g. sse@example.com"
                value={editModalData.email}
                onChange={(e) =>
                  setEditModalData((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                className="w-full border border-gray-200 p-3 rounded-2xl text-xs text-gray-800 focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setEditModalData(null)}
                disabled={isUpdating}
                className="px-4 py-2 border border-gray-200 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <GlowButton type="submit" onClick={handleUpdateSubmit}>
                {isUpdating ? (
                  <Loader2 className="animate-spin w-4 h-4" />
                ) : (
                  "Save Changes"
                )}
              </GlowButton>
            </div>
          </form>
        )}
      </UniversalModal>

      {/* ---------- DELETE CONFIRMATION MODAL ---------- */}
      <DeleteConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        itemName={deleteTarget?.name || "Designation"}
      />
    </>
  );
};

export default DesignationView;
