import React, { useState, useEffect, useMemo } from "react";
import { Plus, Search, Upload, Trash2, AlertCircle } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import PayrollTable from "../../../ui/payrolltable";
import CreateEmailTemplateModal from "../../../ui/createemailmodal";
import UploadEmailTemplateModal from "../../../ui/uploademailmodal";
import ActionMenu from "../../../ui/actionmenu";
import useEmailTemplateStore from "../../../store/emailtemplateStore";
import { deleteEmailTemplateService } from "../../../service/mainServices";

const EmailTemplates = () => {
  // --- STATES ---
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [templateToDelete, setTemplateToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    templates,
    defaultTemplates,
    loading,
    error,
    loadTemplates,
    loadDefaultTemplates,
  } = useEmailTemplateStore();

  // --- DATA LOADING ---
  useEffect(() => {
    activeTab === "all" ? loadTemplates() : loadDefaultTemplates();
  }, [activeTab, loadTemplates, loadDefaultTemplates]);

  // --- DELETE HANDLER ---
  const handleDeleteConfirm = async () => {
    if (!templateToDelete) return;
    const tid = toast.loading("Deleting template...");
    setIsDeleting(true);
    try {
      await deleteEmailTemplateService(templateToDelete.id);
      toast.success("Template deleted successfully", { id: tid });
      activeTab === "all" ? loadTemplates() : loadDefaultTemplates();
      setTemplateToDelete(null);
    } catch (err) {
      toast.error(err.message || "Failed to delete", { id: tid });
    } finally {
      setIsDeleting(false);
    }
  };

  // --- TABLE COLUMNS (STRICT ALIGNMENT) ---
  const columns = useMemo(
    () => [
      {
        key: "name",
        label: "Template Name",
        align: "left", // Anchor point for the table
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
        render: (v) => (
          <div className="flex justify-center items-center w-full">
            <span
              className={`inline-block w-[75px] py-1 rounded-full border text-[11px] font-medium text-center ${
                v || activeTab === "default"
                  ? "bg-green-50 text-green-500 border-green-100"
                  : "bg-indigo-50 text-indigo-500 border-indigo-100"
              }`}
            >
              {v || activeTab === "default" ? "Active" : "Inactive"}
            </span>
          </div>
        ),
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
              refreshTemplates={
                activeTab === "all" ? loadTemplates : loadDefaultTemplates
              }
              onDeleteClick={() => setTemplateToDelete(row)}
            />
          </div>
        ),
      },
    ],
    [activeTab, loadTemplates, loadDefaultTemplates],
  );

  const filteredData = useMemo(() => {
    const data = activeTab === "all" ? templates : defaultTemplates;
    return (data || []).filter((item) =>
      item?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [templates, defaultTemplates, searchQuery, activeTab]);

  return (
    <div className="w-full bg-white rounded-xl p-2">
      <Toaster position="top-right" />

      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3 mt-2 px-2">
        <div className="flex gap-2 items-center w-full sm:w-auto">
          {/* Compact Tab Switcher */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg mr-2">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                activeTab === "all"
                  ? "bg-white text-black shadow-sm"
                  : "text-gray-500"
              }`}
            >
              My Templates
            </button>
            <button
              onClick={() => setActiveTab("default")}
              className={`px-4 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                activeTab === "default"
                  ? "bg-white text-black shadow-sm"
                  : "text-gray-500"
              }`}
            >
              Presets
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={14}
            />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 border border-gray-200 bg-[#f9f9f9] rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end px-2">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 active:scale-95 transition-all"
          >
            <Upload size={14} className="text-gray-600" />
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-[12px] font-medium active:scale-95 transition-all"
          >
            <Plus size={14} /> Create Template
          </button>
        </div>
      </div>

      {/* --- TABLE --- */}
      <div className="w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400 text-[12px]">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin mb-2" />
            <span>Syncing templates...</span>
          </div>
        ) : (
          <PayrollTable columns={columns} data={filteredData} rowsPerPage={8} />
        )}
      </div>

      {/* --- DELETE MODAL --- */}
      {templateToDelete && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !isDeleting && setTemplateToDelete(null)}
          />
          <div className="relative bg-white rounded-2xl p-6 w-full max-sm shadow-2xl animate-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="text-red-500" size={28} />
              </div>
              <h3 className="text-[18px] font-semibold text-gray-900 mb-2">
                Delete Template?
              </h3>
              <p className="text-[13px] text-gray-500 mb-6 leading-relaxed">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-gray-800">
                  "{templateToDelete.name}"
                </span>
                ?
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setTemplateToDelete(null)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl text-[12px] font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl text-[12px] font-medium shadow-lg shadow-red-200"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateEmailTemplateModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          loadTemplates();
        }}
      />
      <UploadEmailTemplateModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          loadTemplates();
        }}
      />
    </div>
  );
};

export default EmailTemplates;
