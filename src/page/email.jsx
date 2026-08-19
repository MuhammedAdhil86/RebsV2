import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { Plus, Search, Upload, AlertCircle } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

import DashboardLayout from "../ui/pagelayout";
import HeaderGlobal from "../ui/headerglobal";
import PayrollTable from "../ui/payrolltable";
import ActionMenu from "../ui/actionmenu";
import CreateEmailTemplateModal from "../ui/createemailmodal";
import UploadEmailTemplateModal from "../ui/uploademailmodal";

import useEmailTemplateStore from "../store/emailtemplateStore";
import { deleteEmailTemplateService } from "../service/mainServices";

// Configured navigation tabs matching your standard tab layout
const TABS = [
  { id: "all", label: "My Templates" },
  { id: "default", label: "Presets" },
];

// Helper to extract detailed backend error messages across all API formats
const extractErrorMessage = (error, defaultMsg) => {
  if (typeof error === "string") return error;
  return (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.error ||
    error?.data?.error ||
    error?.data?.message ||
    error?.message ||
    defaultMsg
  );
};

function EmailTemplates() {
  // Lazy state initialization from localStorage to remember tab choices across refreshes
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("email_templates_active_tab") || "all";
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    templates,
    defaultTemplates,
    loading,
    loadTemplates,
    loadDefaultTemplates,
  } = useEmailTemplateStore();

  // Synchronize activeTab choices inside localStorage
  useEffect(() => {
    localStorage.setItem("email_templates_active_tab", activeTab);
  }, [activeTab]);

  // Data fetch handler scoped to current active tab with backend error extraction
  const fetchCurrentTabData = useCallback(async () => {
    try {
      if (activeTab === "all") {
        await loadTemplates();
      } else {
        await loadDefaultTemplates();
      }
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to load templates"));
    }
  }, [activeTab, loadTemplates, loadDefaultTemplates]);

  useEffect(() => {
    fetchCurrentTabData();
  }, [fetchCurrentTabData]);

  // Handle template deletion with backend error handling
  const handleDeleteConfirm = async () => {
    if (!templateToDelete) return;
    const toastId = toast.loading("Deleting template...");
    setIsDeleting(true);

    try {
      await deleteEmailTemplateService(templateToDelete.id);
      toast.success("Template deleted successfully", { id: toastId });
      await fetchCurrentTabData();
      setTemplateToDelete(null);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to delete template"), {
        id: toastId,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Table Columns Configuration
  const columns = useMemo(
    () => [
      {
        key: "name",
        label: "Template Name",
        align: "left",
      },
      {
        key: "is_manual",
        label: "Type",
        align: "center",
        render: (v) => (
          <div className="flex justify-center w-full">
            <span className="text-gray-600 text-[12px] min-w-[60px] text-center">
              {v === undefined ? "System" : v ? "Manual" : "Auto"}
            </span>
          </div>
        ),
      },
      {
        key: "created_at",
        label: "Created on",
        align: "center",
        render: (v) => (
          <div className="flex justify-center w-full text-gray-500 text-[12px]">
            {v ? new Date(v).toLocaleDateString("en-GB") : "—"}
          </div>
        ),
      },
      {
        key: "is_active",
        label: "Status",
        align: "center",
        render: (v) => {
          const isActive = Boolean(v || activeTab === "default");
          return (
            <div className="flex justify-center items-center w-full">
              <span
                className={`inline-block w-[75px] py-1 rounded-full border text-[11px] font-medium text-center ${
                  isActive
                    ? "bg-green-50 text-green-500 border-green-100"
                    : "bg-indigo-50 text-indigo-500 border-indigo-100"
                }`}
              >
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>
          );
        },
      },
      {
        key: "action",
        label: "Action",
        align: "center",
        render: (_, row) => (
          <div className="flex justify-center items-center w-full">
            <ActionMenu
              row={row}
              isPresetTab={activeTab === "default"}
              refreshTemplates={fetchCurrentTabData}
              onDeleteClick={() => setTemplateToDelete(row)}
            />
          </div>
        ),
      },
    ],
    [activeTab, fetchCurrentTabData],
  );

  // Search filtering logic — excludes letter generation templates
  const filteredData = useMemo(() => {
    const dataSource = activeTab === "all" ? templates : defaultTemplates;
    const query = searchQuery.trim().toLowerCase();

    // Filter to only include email templates (for_letter_generation === false)
    const emailOnlyTemplates = (dataSource || []).filter(
      (item) => !item.for_letter_generation,
    );

    if (!query) return emailOnlyTemplates;

    return emailOnlyTemplates.filter((item) =>
      item?.name?.toLowerCase().includes(query),
    );
  }, [templates, defaultTemplates, searchQuery, activeTab]);

  return (
    <DashboardLayout userName="Admin" onLogout={() => {}}>
      <Toaster position="top-right" />

      <div className="w-full space-y-4">
        {/* Global shared navbar element */}
        <HeaderGlobal userName="Admin" />

        {/* Navigation Tab Links Header Layout */}
        <div className="flex justify-between items-center border-b px-4 bg-white pt-2 shadow-sm rounded-t-lg select-none overflow-x-auto gap-4">
          <div className="flex gap-4 text-[14px]">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`pb-2 px-1 transition-all relative font-medium whitespace-nowrap ${
                  activeTab === tab.id
                    ? "text-black font-semibold after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-black"
                    : "text-gray-500 hover:text-black"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Actions: Search & Quick Buttons */}
          <div className="flex items-center gap-2 pb-2">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                size={14}
              />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 border border-gray-200 bg-[#f9f9f9] rounded-lg text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-black w-48 sm:w-64 transition-all"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              title="Upload Template"
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 active:scale-95 transition-all text-gray-600"
            >
              <Upload size={14} />
            </button>

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 bg-black text-white px-3 py-1.5 rounded-lg text-[12px] font-medium active:scale-95 transition-all whitespace-nowrap"
            >
              <Plus size={14} /> Create Template
            </button>
          </div>
        </div>

        {/* Tab Content Display Area */}
        <div className="mt-2 bg-white rounded-b-lg p-2 min-h-[350px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400 text-[12px]">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin mb-2" />
              <span>Syncing templates...</span>
            </div>
          ) : (
            <PayrollTable
              key={`template-table-${activeTab}`}
              columns={columns}
              data={filteredData}
              rowsPerPage={8}
            />
          )}
        </div>
      </div>

      {/* Delete Confirmation Portal Modal */}
      {templateToDelete &&
        createPortal(
          <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => !isDeleting && setTemplateToDelete(null)}
            />
            <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in duration-200 z-10">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="text-red-500" size={24} />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  Delete Template?
                </h3>
                <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-gray-800">
                    "{templateToDelete.name}"
                  </span>
                  ? This action cannot be undone.
                </p>
                <div className="flex gap-3 w-full">
                  <button
                    type="button"
                    onClick={() => setTemplateToDelete(null)}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-medium text-gray-700 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteConfirm}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-medium shadow-md transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Creation Modals */}
      <CreateEmailTemplateModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          fetchCurrentTabData();
        }}
      />

      <UploadEmailTemplateModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          fetchCurrentTabData();
        }}
      />
    </DashboardLayout>
  );
}

export default EmailTemplates;
