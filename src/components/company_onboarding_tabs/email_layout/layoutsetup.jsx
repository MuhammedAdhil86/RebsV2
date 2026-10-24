import React, { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  Search,
  Pencil,
  MoreHorizontal,
  Trash2,
  Power,
} from "lucide-react";
import toast from "react-hot-toast";
import PayrollTable from "../../../ui/payrolltable";
import {
  fetchCompanyLayouts,
  deleteLayout,
  updateLayoutStatus,
} from "../../../service/companyService";
import { confirm } from "../../../ui/ConfirmationModal"; // adjust path to where you saved it
import CreateLayout from "./CreateLayout";
import UpdateLayout from "./UpdateLayout";

const TABS = [
  { key: "email", label: "Email Layout" },
  { key: "letter", label: "Letter Layout" },
];
const typeLabel = (type) => (type === "letter" ? "Letter" : "Email");

// Date only (no time), e.g. "20 Oct 2026"
const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// GET /admin/company/layouts?layout_type=email|letter
// Always returns an ARRAY of layouts for the requested type.
// Handles every response shape:
//   { data: [ {...layout}, ... ] }                       (array  <- your current API)
//   { data: { ...singleLayout } }                        (single object)
//   { data: { email: {...} | null, letter: {...} | null } } (keyed by type)
const extractLayouts = (res, type) => {
  const d = res?.data?.data ?? res?.data ?? res;
  if (!d) return [];

  // Array response
  if (Array.isArray(d)) {
    return d.filter((l) => l && (!l.layout_type || l.layout_type === type));
  }

  // Single layout object
  if (d.layout_type) return d.layout_type === type ? [d] : [];

  // Keyed by type
  const keyed = d[type];
  if (Array.isArray(keyed)) return keyed;
  return keyed ? [keyed] : [];
};

// Works whether axios throws the full error ({ response: { status, data } })
// or an interceptor throws just the response body ({ error: "..." }).
const getErrorInfo = (err) => {
  const data = err?.response?.data ?? err;
  const text =
    (typeof data === "string" ? data : data?.error || data?.message) ||
    err?.message ||
    "";
  const status = err?.response?.status ?? err?.status ?? err?.status_code;
  return { status, text };
};

// Backend says there is simply no layout of this type yet
// e.g. 404 { "error": "No active letter layout found" }
const isNoLayoutError = (err) => {
  const { status, text } = getErrorInfo(err);
  return status === 404 || /no active .* layout found/i.test(text);
};

// Horizontal three-dot action menu (Edit / Active-Inactive / Delete).
// Rendered in a portal with fixed positioning so the table never clips it.
const ActionMenu = ({ isActive, onEdit, onToggleStatus, onDelete }) => {
  const [pos, setPos] = useState(null); // { top, right } | null
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const close = useCallback(() => setPos(null), []);

  useEffect(() => {
    if (!pos) return;
    const onMouseDown = (e) => {
      if (
        btnRef.current?.contains(e.target) ||
        menuRef.current?.contains(e.target)
      )
        return;
      close();
    };
    const onKey = (e) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [pos, close]);

  const toggle = (e) => {
    e.stopPropagation(); // don't trigger the row click
    if (pos) return close();
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
  };

  const itemClass =
    "w-full flex items-center gap-2 px-3 py-2 text-[12px] font-['Poppins'] text-left hover:bg-gray-50 transition-colors cursor-pointer";

  return (
    <div className="flex justify-end">
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        title="Actions"
        className="p-1.5 rounded-lg text-gray-500 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer"
      >
        <MoreHorizontal size={18} />
      </button>

      {pos &&
        createPortal(
          <div
            ref={menuRef}
            onClick={(e) => e.stopPropagation()} // portal events bubble to the row
            style={{ position: "fixed", top: pos.top, right: pos.right }}
            className="w-36 bg-white border border-gray-100 rounded-xl shadow-xl py-1 z-[9999]"
          >
            <button
              type="button"
              className={`${itemClass} text-gray-700`}
              onClick={() => {
                close();
                onEdit();
              }}
            >
              <Pencil size={13} /> Edit
            </button>
            <button
              type="button"
              className={`${itemClass} text-gray-700`}
              onClick={() => {
                close();
                onToggleStatus();
              }}
            >
              <Power size={13} /> {isActive ? "Inactive" : "Active"}
            </button>
            <button
              type="button"
              className={`${itemClass} text-red-600 hover:bg-red-50`}
              onClick={() => {
                close();
                onDelete();
              }}
            >
              <Trash2 size={13} /> Delete
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
};

const LayoutSetup = () => {
  const [activeTab, setActiveTab] = useState("email"); // "email" | "letter"
  const [viewMode, setViewMode] = useState("list"); // "list" | "create" | "update"
  const [formType, setFormType] = useState("email");
  const [editData, setEditData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // type -> array of layouts ([] = none created yet). Missing key = not loaded.
  const [layouts, setLayouts] = useState({});
  const [errors, setErrors] = useState({});

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null); // layout row | null
  const [deleting, setDeleting] = useState(false);

  const loadLayout = useCallback(async (type, signal) => {
    setErrors((prev) => ({ ...prev, [type]: null }));
    try {
      const res = await fetchCompanyLayouts({ layoutType: type, signal });
      if (signal?.aborted) return;
      setLayouts((prev) => ({ ...prev, [type]: extractLayouts(res, type) }));
    } catch (err) {
      if (err?.code === "ERR_CANCELED" || signal?.aborted) return;

      // No layout saved yet for this type -> empty list + Create button
      if (isNoLayoutError(err)) {
        setLayouts((prev) => ({ ...prev, [type]: [] }));
        return;
      }

      const message = getErrorInfo(err).text || "Failed to load layout";
      setErrors((prev) => ({ ...prev, [type]: message }));
      toast.error(message);
    }
  }, []);

  // Load the active tab's layouts the first time it is opened
  useEffect(() => {
    if (layouts[activeTab] !== undefined) return;
    const controller = new AbortController();
    loadLayout(activeTab, controller.signal);
    return () => controller.abort();
  }, [activeTab, layouts, loadLayout]);

  const openCreate = (type) => {
    setFormType(type);
    setEditData(null);
    setViewMode("create");
  };

  const openUpdate = (type, row) => {
    setFormType(type);
    setEditData(row);
    setViewMode("update");
  };

  // Back / after save: return to the list and refresh that tab
  const handleCloseForm = () => {
    setViewMode("list");
    setEditData(null);
    loadLayout(formType);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { id, layout_type } = deleteTarget;
    setDeleting(true);
    try {
      const body = await deleteLayout(id, layout_type);
      if (body?.message) toast.success(body.message); // message from backend
      // remove only the deleted row
      setLayouts((prev) => ({
        ...prev,
        [layout_type]: (prev[layout_type] || []).filter((l) => l.id !== id),
      }));
      setDeleteTarget(null);
    } catch (err) {
      console.error("DELETE ERROR:", err);
      if (err?.message) toast.error(err.message); // message from backend
    } finally {
      setDeleting(false);
    }
  };

  // Ask first (global modal), then send { is_active: true | false }
  const handleStatusChange = async (row) => {
    const { layout_type, name, id, is_active } = row;
    const nextStatus = !is_active;
    const label = nextStatus ? "Active" : "Inactive";

    const ok = await confirm({
      title: "Confirm Status Change",
      message: `Are you sure you want to mark "${
        name || "Untitled Layout"
      }" (${typeLabel(layout_type)}) as ${label}?`,
      confirmText: label,
      variant: "warning",
    });
    if (!ok) return;

    try {
      const body = await updateLayoutStatus(layout_type, id, nextStatus);
      if (body?.message) toast.success(body.message); // message from backend
      // update only the changed row
      setLayouts((prev) => ({
        ...prev,
        [layout_type]: (prev[layout_type] || []).map((l) =>
          l.id === id ? { ...l, is_active: nextStatus } : l,
        ),
      }));
    } catch (err) {
      console.error("STATUS ERROR:", err);
      toast.error(getErrorInfo(err).text || "Failed to update status");
    }
  };

  const switchTab = (key) => {
    setActiveTab(key);
    setSearchTerm("");
  };

  // --- CREATE VIEW (blank form) ---
  if (viewMode === "create") {
    return <CreateLayout layoutType={formType} onClose={handleCloseForm} />;
  }

  // --- UPDATE VIEW (pre-filled form) ---
  if (viewMode === "update") {
    return (
      <UpdateLayout
        layoutType={formType}
        layout={editData}
        onClose={handleCloseForm}
      />
    );
  }

  // --- LIST VIEW (only the active tab's layouts) ---
  const tabLayouts = layouts[activeTab]; // undefined = loading, [] = none yet
  const error = errors[activeTab];
  const isLoading = tabLayouts === undefined && !error;

  const term = searchTerm.toLowerCase();
  const rows = (tabLayouts || []).filter((l) =>
    (l.name || "").toLowerCase().includes(term),
  );

  const columns = [
    {
      key: "name",
      label: "Layout Name",
      align: "left",
      render: (val) => (
        <span className="whitespace-nowrap">{val || "Untitled Layout"}</span>
      ),
    },
    {
      key: "layout_type",
      label: "Type",
      align: "center",
      render: (val) => (
        <span className="whitespace-nowrap">{typeLabel(val)}</span>
      ),
    },
    {
      key: "created_at",
      label: "Created Date",
      align: "center",
      render: (val) => (
        <span className="whitespace-nowrap">{formatDate(val)}</span>
      ),
    },
    {
      key: "updated_at",
      label: "Last Updated",
      align: "center",
      // updated_at is null until the first edit -> fall back to created_at
      render: (val, row) => (
        <span className="whitespace-nowrap">
          {formatDate(val || row?.created_at)}
        </span>
      ),
    },
    {
      key: "is_active",
      label: "Status",
      align: "center",
      render: (val) => (
        <span
          className={`inline-block whitespace-nowrap px-3 py-1 rounded-full border text-[11px] font-medium ${
            val
              ? "bg-green-50 text-green-500 border-green-100"
              : "bg-yellow-50 text-yellow-600 border-yellow-100"
          }`}
        >
          {val ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (_, row) => (
        <ActionMenu
          isActive={!!row.is_active}
          onEdit={() => openUpdate(row.layout_type, row)}
          onToggleStatus={() => handleStatusChange(row)}
          onDelete={() => setDeleteTarget(row)}
        />
      ),
    },
  ];

  return (
    <div className="w-full bg-white rounded-xl">
      <div className="px-2 mb-4">
        <h2 className="text-[16px] font-['Poppins']">Layout Setup</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-100 px-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => switchTab(tab.key)}
            className={`pb-2 text-[13px] font-medium font-['Poppins'] border-b-2 -mb-px transition-colors cursor-pointer ${
              activeTab === tab.key
                ? "border-black text-black"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search + Create button */}
      <div className="flex justify-end items-center gap-3 px-2 py-3">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={14}
          />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-2 border border-gray-200 bg-[#f9f9f9] rounded-lg text-[12px] w-64 focus:outline-none focus:ring-1 focus:ring-black font-['Poppins']"
          />
        </div>
        {/* Create button -> CREATE view. Row click / Edit button -> UPDATE view. */}
        <button
          type="button"
          onClick={() => openCreate(activeTab)}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-[12px] font-medium active:scale-95 transition-transform"
        >
          <Plus size={14} /> Create {typeLabel(activeTab)} Layout
        </button>
      </div>

      <div className="w-full">
        {error ? (
          <div className="flex flex-col items-center justify-center py-20 text-[12px] text-gray-500 gap-3">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => loadLayout(activeTab)}
              className="px-4 py-2 bg-black text-white rounded-lg text-[12px] font-medium"
            >
              Retry
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-[12px]">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin mb-2" />
            <span>Loading layout...</span>
          </div>
        ) : (
          <PayrollTable
            columns={columns}
            data={rows}
            rowsPerPage={8}
            rowClickHandler={(row) => openUpdate(row.layout_type, row)}
          />
        )}
      </div>

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl p-5">
            <h3 className="text-[14px] font-semibold font-['Poppins'] mb-1">
              Delete layout?
            </h3>
            <p className="text-[12px] text-gray-500 mb-5">
              {deleteTarget.name || "Untitled Layout"} (
              {typeLabel(deleteTarget.layout_type)}) will be deleted. This
              cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-[12px] font-medium border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="px-4 py-2 text-[12px] font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LayoutSetup;
