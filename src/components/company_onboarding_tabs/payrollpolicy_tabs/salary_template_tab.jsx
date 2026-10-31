import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";
import { MoreHorizontal, Trash2, AlertTriangle, X } from "lucide-react";
import toast from "react-hot-toast"; // <Toaster /> lives globally in App.jsx

// Services
import payrollService from "../../../service/payrollService";

// Helpers
import {
  getApiMessage,
  getApiError,
  isApiFailure,
} from "../../helpers/apiMessage.js"; // adjust path if needed

// UI Components
import PayrollTable from "../../../ui/payrolltable.jsx";
import CommonButton from "../../../ui/bottom.jsx";
import TabsSwitch from "../../../ui/tabswitch.jsx";

// Tabs
import SalaryComponents from "./salary_components_tab.jsx";
import StatutoryComponents from "./statutorycomponents.jsx";
import CreateSalaryTemplate from "./statutory_component_tabs/createsalarytemplate.jsx";
import CreateSalaryComponent from "./statutory_component_tabs/createsalarycomponents.jsx";
import UpdateSalaryTemplate from "./salary_component_tabs/updatesalarytemplate.jsx";

// ---------------- HELPERS ----------------
const TRUNCATE_LIMIT = 27;

// Cell wrapper so the content always lines up with the header alignment
const ALIGN_CLASS = {
  left: "justify-start text-left",
  center: "justify-center text-center",
  right: "justify-end text-right",
};

const CellWrap = ({ align = "left", children }) => (
  <div className={`flex items-center w-full ${ALIGN_CLASS[align]}`}>
    {children}
  </div>
);

// Shows the first characters + "..." and the full text in a tooltip on hover.
// The tooltip is rendered in a portal so table overflow never clips it.
const TruncatedText = ({ text, limit = TRUNCATE_LIMIT }) => {
  const [tooltip, setTooltip] = useState(null);

  const value = text && String(text).trim() ? String(text) : "-";
  const isLong = value.length > limit;
  const display = isLong ? `${value.slice(0, limit)}...` : value;

  const showTooltip = (e) => {
    if (!isLong) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      top: rect.bottom + 6,
      left: Math.min(rect.left, window.innerWidth - 280),
    });
  };

  const hideTooltip = () => setTooltip(null);

  return (
    <>
      <span
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        className={`text-gray-600 whitespace-nowrap ${
          isLong ? "cursor-help" : "cursor-default"
        }`}
      >
        {display}
      </span>

      {tooltip &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: tooltip.top,
              left: tooltip.left,
              zIndex: 10002,
            }}
            className="max-w-[260px] bg-gray-900 text-white text-[11px] font-['Poppins'] leading-snug rounded-lg px-3 py-2 shadow-lg whitespace-normal break-words pointer-events-none"
          >
            {value}
          </div>,
          document.body,
        )}
    </>
  );
};

export default function SalaryTemplate() {
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showCreateComponent, setShowCreateComponent] = useState(false);
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const [showFilter, setShowFilter] = useState(false);
  const [activeTab, setActiveTab] = useState("salary-template");

  // --- DELETE & MENU STATES ---
  const [menuPosition, setMenuPosition] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const tabs = [
    { id: "salary-template", label: "Salary Template" },
    { id: "salary-components", label: "Salary Components" },
    { id: "statutory-components", label: "Statutory Components" },
  ];

  // ---------------- FETCH DATA ----------------
  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await payrollService.getSalaryTemplates();
      const rawItems = response?.data?.items || response || [];
      const formatted = rawItems.map((item, index) => ({
        ...item,
        id: item.id ?? index,
        name: item.name || "-",
        annualCTC: `₹${Number(item.annual_ctc || 0).toLocaleString()}`,
        status:
          item.status === "active" || item.status === true
            ? "Active"
            : "Inactive",
      }));
      setTableData(formatted);
    } catch (err) {
      console.log("[fetch templates] error:", err, err?.response?.data); // DEBUG - remove later
      const msg = getApiError(err, "Failed to load salary templates.");
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "salary-template") {
      fetchTemplates();
    }
  }, [activeTab, showCreateTemplate, isEditingTemplate]);

  // ---------------- ACTION MENU HANDLERS ----------------
  const openMenu = (event, row) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + window.scrollY + 5,
      left: rect.right + window.scrollX - 150,
    });
    setSelectedRow(row);
  };

  const closeMenu = () => {
    setMenuPosition(null);
    if (!isDeleteModalOpen) setSelectedRow(null);
  };

  const openDeleteModal = () => {
    setIsDeleteModalOpen(true);
    setMenuPosition(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedRow(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedRow) return;
    const toastId = "delete-template";
    toast.loading("Deleting template...", { id: toastId });

    try {
      const res = await payrollService.deleteTemplate(selectedRow.id);
      console.log("[delete template] success:", res); // DEBUG - remove later
      // Backend may reply 200 with { ok: false, error: "..." }
      if (isApiFailure(res)) {
        toast.error(
          getApiError({ response: { data: res } }, "Failed to delete template"),
          { id: toastId },
        );
        return;
      }
      toast.success(getApiMessage(res, "Template deleted successfully"), {
        id: toastId,
      });
      closeDeleteModal();
      fetchTemplates();
    } catch (err) {
      console.log("[delete template] error:", err, err?.response?.data); // DEBUG - remove later
      toast.error(getApiError(err, "Failed to delete template"), {
        id: toastId,
      });
    }
  };

  const handleEditClick = (rowData) => {
    setSelectedTemplate(rowData);
    setIsEditingTemplate(true);
  };

  // ---------------- TABLE COLUMNS ----------------
  // Template Name is left aligned; all other columns are center aligned.
  // Each render wraps its content in <CellWrap align="..."> so header and content line up.
  const templateColumns = [
    {
      key: "name",
      label: "Template Name",
      align: "left",
      render: (value) => (
        <CellWrap align="left">
          <span className="font-medium text-gray-800">{value}</span>
        </CellWrap>
      ),
    },
    {
      key: "description",
      label: "Description",
      align: "center",
      render: (value) => (
        <CellWrap align="center">
          <TruncatedText text={value} limit={TRUNCATE_LIMIT} />
        </CellWrap>
      ),
    },
    {
      key: "annualCTC",
      label: "Annual CTC",
      align: "center",
      render: (value) => (
        <CellWrap align="center">
          <span className="text-gray-800 tabular-nums">{value}</span>
        </CellWrap>
      ),
    },
    {
      key: "status",
      label: "Status",
      align: "center",
      render: (value) => {
        const isActive = value === "Active";
        return (
          <CellWrap align="center">
            <span className={isActive ? "text-green-600" : "text-red-600"}>
              {value}
            </span>
          </CellWrap>
        );
      },
    },
    {
      key: "action",
      label: "Action",
      align: "center",
      render: (_, row) => (
        <CellWrap align="center">
          <button
            onClick={(e) => openMenu(e, row)}
            className="text-gray-400 hover:text-gray-900 p-1"
          >
            <MoreHorizontal size={18} />
          </button>
        </CellWrap>
      ),
    },
  ];

  // ---------------- EXTRA BUTTONS ----------------
  const extraButtons = (tab) => {
    if (tab === "salary-template") {
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="p-1 rounded-md hover:bg-gray-100"
          >
            <Icon icon="mdi:filter-variant" width={20} height={20} />
          </button>
          <CommonButton
            onClick={() => setShowCreateTemplate(true)}
            text="Create Template"
            icon="mdi:plus"
          />
        </div>
      );
    }
    if (tab === "salary-components") {
      // Don't show the "Create" button if we are already inside the create view
      if (showCreateComponent) return null;

      return (
        <div className="flex items-center gap-2">
          <CommonButton
            onClick={() => setShowCreateComponent(true)}
            text="Create Component"
          />
        </div>
      );
    }
    return null;
  };

  const renderTabContent = (tab) => {
    switch (tab) {
      case "salary-template":
        return (
          <>
            <PayrollTable
              columns={templateColumns}
              data={tableData}
              rowClickHandler={handleEditClick}
            />
            {loading && (
              <div className="text-center py-4 text-gray-400 animate-pulse">
                Loading templates...
              </div>
            )}
            {error && !loading && (
              <div className="text-center py-4 text-red-500">{error}</div>
            )}
          </>
        );
      case "salary-components":
        // Render the create component view INSIDE the tab content
        if (showCreateComponent) {
          return (
            <CreateSalaryComponent
              onCancel={() => setShowCreateComponent(false)}
            />
          );
        }
        return <SalaryComponents />;
      case "statutory-components":
        return <StatutoryComponents />;
      default:
        return null;
    }
  };

  return (
    <div className="rounded-2xl shadow-sm min-h-screen font-[Poppins] text-sm bg-white p-4">
      {/* No <Toaster /> here: the global one in App.jsx handles all toasts */}

      {showCreateTemplate ? (
        <CreateSalaryTemplate onCancel={() => setShowCreateTemplate(false)} />
      ) : isEditingTemplate && selectedTemplate ? (
        <UpdateSalaryTemplate
          data={selectedTemplate}
          onCancel={() => {
            setIsEditingTemplate(false);
            setSelectedTemplate(null);
          }}
        />
      ) : (
        /* IMPORTANT: showCreateComponent is handled inside renderTabContent.
          This keeps TabsSwitch mounted so activeTab ("salary-components") is preserved.
        */
        <TabsSwitch
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          renderTabContent={renderTabContent}
          extraButtons={extraButtons}
        />
      )}

      {/* --- ACTION MENU PORTAL --- */}
      {menuPosition &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[9999] bg-transparent"
              onClick={closeMenu}
            />
            <div
              style={{
                position: "absolute",
                top: menuPosition.top,
                left: menuPosition.left,
                zIndex: 10000,
              }}
              className="w-44 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden p-1.5"
            >
              <button
                className="w-full text-left px-3 py-2 text-[11px] font-medium font-['Poppins'] text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2 rounded-lg"
                onClick={openDeleteModal}
              >
                <Trash2 size={14} /> Delete Template
              </button>
            </div>
          </>,
          document.body,
        )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {isDeleteModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
              onClick={closeDeleteModal}
            />
            <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                  <AlertTriangle size={20} />
                </div>
                <button
                  onClick={closeDeleteModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>
              <h3 className="text-[16px] font-semibold text-gray-900 font-['Poppins'] mb-2 tracking-tight">
                Delete Template?
              </h3>
              <p className="text-[13px] text-gray-500 font-['Poppins'] leading-relaxed mb-6">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-gray-800">
                  "{selectedRow?.name}"
                </span>
                ? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={closeDeleteModal}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-[13px] font-medium hover:bg-gray-50 transition-all font-['Poppins']"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-[13px] font-medium hover:bg-red-700 transition-all font-['Poppins'] shadow-sm shadow-red-200"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
