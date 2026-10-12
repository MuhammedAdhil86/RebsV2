import React, { useEffect, useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { MoreHorizontal, Pencil, Trash2, X, Loader2 } from "lucide-react";

import UniversalTable from "../../../ui/universal_table";
import GlowButton from "../../../components/helpers/glowbutton";
import DeleteConfirmationModal from "../../../ui/deletemodal";
import {
  getDepartmentData,
  editDepartmentData,
  deleteDepartmentData,
} from "../../../service/companyService";

/* ---------- HELPERS ---------- */

// Collects every descendant id of a department so they can't be chosen as its parent.
const getDescendantIds = (departments, rootId) => {
  const descendants = new Set();
  const queue = [String(rootId)];

  while (queue.length) {
    const current = queue.shift();
    departments.forEach((d) => {
      if (
        d.parent_id !== null &&
        d.parent_id !== undefined &&
        String(d.parent_id) === current &&
        !descendants.has(String(d.id))
      ) {
        descendants.add(String(d.id));
        queue.push(String(d.id));
      }
    });
  }

  return descendants;
};

/* ---------- UNIVERSAL MODAL COMPONENT ---------- */
function UniversalModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "max-w-[520px]",
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
            aria-label="Close"
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
const DepartmentView = () => {
  const [departmentData, setDepartmentData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Edit modal state (form values are kept as strings for the inputs)
  const [editModalData, setEditModalData] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /* ---------- FETCH DATA ---------- */
  // showLoader = false -> refresh the list in the background (no spinner flash)
  const fetchDepartments = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const data = await getDepartmentData();
      setDepartmentData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching department data:", error);
      toast.error(
        error?.message || error?.error || "Failed to load departments",
      );
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();

    // The create form dispatches this after a successful save:
    //   window.dispatchEvent(new Event("department:changed"));
    const handleDepartmentChanged = () => fetchDepartments(false);
    window.addEventListener("department:changed", handleDepartmentChanged);
    return () =>
      window.removeEventListener("department:changed", handleDepartmentChanged);
  }, []);

  /* ---------- PARENT OPTIONS (no self, no descendants) ---------- */
  const parentOptions = useMemo(() => {
    if (!editModalData) return [];
    const blocked = getDescendantIds(departmentData, editModalData.id);
    blocked.add(String(editModalData.id));
    return departmentData.filter((d) => !blocked.has(String(d.id)));
  }, [departmentData, editModalData?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- DELETE HANDLERS ---------- */
  const handleOpenDelete = (department) => {
    setDeleteTarget(department);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget?.id || isDeleting) return;

    setIsDeleting(true);
    try {
      const res = await deleteDepartmentData(deleteTarget.id);
      toast.success(res?.message || "Department deleted successfully");
      setDepartmentData((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err?.message || err?.error || err?.detail || "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  /* ---------- EDIT MODAL OPEN ---------- */
  const handleOpenEdit = (dept) => {
    // API uses parent_id "0" (or empty) to mean "no parent"
    const parentId =
      dept.parent_id && String(dept.parent_id) !== "0"
        ? String(dept.parent_id)
        : "";
    const hasParent = String(dept.has_parent) === "true" || Boolean(parentId);

    setEditModalData({
      id: dept.id,
      name: dept.name || "",
      code: dept.code || "",
      desc: dept.desc || dept.description || "",
      has_parent: String(hasParent),
      parent_id: parentId,
      email: dept.email || "",
    });
  };

  /* ---------- UPDATE HANDLER ---------- */
  const handleUpdateSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!editModalData || isUpdating) return;

    const { id, has_parent, parent_id, ...rest } = editModalData;
    const hasParent = has_parent === "true";

    if (hasParent && !parent_id) {
      toast.error("Please select a parent department");
      return;
    }

    // The API returns and stores these as strings ("false", "0"), so send the same shape
    const payload = {
      ...rest,
      has_parent: hasParent ? "true" : "false",
      parent_id: hasParent ? String(parent_id) : "0",
    };

    setIsUpdating(true);
    try {
      const res = await editDepartmentData(id, payload);
      toast.success(res?.message || "Department updated successfully");

      // Keep the "Parent Department" column in sync without a refetch
      const parentName = hasParent
        ? (departmentData.find((d) => String(d.id) === String(parent_id))
            ?.name ?? null)
        : null;

      setDepartmentData((prev) =>
        prev.map((d) =>
          d.id === id
            ? { ...d, ...payload, parent: parentName, parent_name: parentName }
            : d,
        ),
      );
      setEditModalData(null);

      // Instant UI update above, then re-sync with the server in the background
      fetchDepartments(false);
    } catch (err) {
      toast.error(err?.message || err?.error || err?.detail || "Update failed");
    } finally {
      setIsUpdating(false);
    }
  };

  /* ---------- FORM FIELD HELPER ---------- */
  const updateField = (field) => (e) => {
    const value = e.target.value;
    setEditModalData((prev) => ({ ...prev, [field]: value }));
  };

  /* ---------- TABLE COLUMNS ---------- */
  const columns = [
    {
      key: "name",
      label: "Department Name",
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
      label: "Code",
      align: "center",
      headerAlign: "center",
      render: (val) => <div className="text-center w-full">{val || "—"}</div>,
    },
    {
      key: "parent",
      label: "Parent Department",
      align: "left",
      headerAlign: "left",
      render: (value, row) => (
        <div className="text-gray-600">{value || row.parent_name || "—"}</div>
      ),
    },
    {
      key: "email",
      label: "Email",
      align: "left",
      headerAlign: "left",
      render: (value) => <div className="text-gray-600">{value || "—"}</div>,
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

  const inputClass =
    "w-full border border-gray-200 p-3 rounded-2xl text-xs text-gray-800 focus:outline-none focus:border-gray-400 transition-colors";
  const labelClass = "text-[11px] font-medium text-gray-600 block mb-1";

  return (
    <>
      <div className="flex-1 grid grid-cols-1 gap-4 px-4 pb-4 bg-[#f9fafb] rounded-xl w-full mx-auto mt-5 font-poppins">
        <div className="flex justify-between items-center py-2">
          <h3 className="text-base font-medium text-gray-800">Departments</h3>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-blue-500 border-dashed rounded-full animate-spin" />
          </div>
        ) : (
          <UniversalTable
            columns={columns}
            data={departmentData}
            rowsPerPage={6}
          />
        )}
      </div>

      {/* ---------- EDIT VIA UNIVERSAL MODAL ---------- */}
      <UniversalModal
        isOpen={Boolean(editModalData)}
        onClose={() => !isUpdating && setEditModalData(null)}
        title="Edit Department"
        subtitle="Update department details and hierarchy"
        maxWidth="max-w-[500px]"
      >
        {editModalData && (
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            {/* Name & Code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Department Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Human Resources"
                  value={editModalData.name}
                  onChange={updateField("name")}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Department Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HR"
                  value={editModalData.code}
                  onChange={updateField("code")}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                placeholder="e.g. hr@example.com"
                value={editModalData.email}
                onChange={updateField("email")}
                className={inputClass}
              />
            </div>

            {/* Description */}
            <div>
              <label className={labelClass}>Description</label>
              <textarea
                rows={2}
                placeholder="e.g. Human Resources Department"
                value={editModalData.desc}
                onChange={updateField("desc")}
                className={`${inputClass} resize-none`}
              />
            </div>

            {/* Parent Department Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Has Parent?</label>
                <select
                  value={editModalData.has_parent}
                  onChange={(e) => {
                    const value = e.target.value;
                    setEditModalData((prev) => ({
                      ...prev,
                      has_parent: value,
                      parent_id: value === "false" ? "" : prev.parent_id,
                    }));
                  }}
                  className={inputClass}
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>

              {editModalData.has_parent === "true" && (
                <div>
                  <label className={labelClass}>Parent Department</label>
                  <select
                    required
                    value={editModalData.parent_id}
                    onChange={updateField("parent_id")}
                    className={inputClass}
                  >
                    <option value="">Select Parent</option>
                    {parentOptions.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setEditModalData(null)}
                disabled={isUpdating}
                className="px-4 py-2 border border-gray-200 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>

              {/* No onClick here: the form's onSubmit handles it, so native
                  validation (required / type="email") runs first. */}
              <GlowButton type="submit" disabled={isUpdating}>
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
        onClose={() => !isDeleting && setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        itemName={deleteTarget?.name || "Department"}
        isLoading={isDeleting}
      />
    </>
  );
};

export default DepartmentView;
