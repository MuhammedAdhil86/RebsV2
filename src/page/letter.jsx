import React, { useState, useEffect, useRef, useMemo } from "react";
import DashboardLayout from "../ui/pagelayout";
import HeaderGlobal from "../ui/headerglobal";
import PayrollTable from "../ui/payrolltable";
import TemplatePreviewView from "../ui/emailandletterpriview";
import EditEmailTemplateView from "../ui/editemailandletter";
import EditLetterPdfTemplateView from "../ui/editletterpdftemplate";
import CreateLetterPdfTemplateForm from "../ui/createletterpdf";
import CreateLetterEmailTemplateForm from "../ui/createletteremail";
import LetterActionModal from "../ui/letteractionmodal";
import DeleteConfirmationModal from "../ui/deletemodal";
import GeneratedLetterListView from "../ui/generatedletterlistview";
import {
  FiLoader,
  FiMoreHorizontal,
  FiMaximize,
  FiEdit2,
  FiTrash2,
  FiCopy,
  FiSend,
  FiFileText,
  FiPlus,
  FiList,
  FiExternalLink,
  FiSearch,
} from "react-icons/fi";

// Standard Backend Services
import {
  fetchEmailTemplates,
  fetchDefaultEmailTemplates,
  cloneDefaultEmailTemplate,
  deleteEmailTemplateService,
  sendLetterService,
} from "../service/mainServices";

// Cloudflare Dedicated Service (Letter Generation)
import { generateLetterService } from "../service/cloudflareLetterServices";

import toast from "react-hot-toast";

const Letter = () => {
  // --- Navigation & View States ---
  const [activeTab, setActiveTab] = useState("pdf"); // 'pdf' or 'email'
  const [subTab, setSubTab] = useState("my-templates"); // 'my-templates' or 'presets'
  const [viewMode, setViewMode] = useState("table"); // 'table', 'preview', 'edit', 'create', 'generated-list'

  // --- Data States ---
  const [customTemplates, setCustomTemplates] = useState([]);
  const [presetTemplates, setPresetTemplates] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- Generated Letters State ---
  const [generatedLetters, setGeneratedLetters] = useState([]);
  const [generatedSearch, setGeneratedSearch] = useState("");

  // --- UI Component States ---
  const [initialData, setInitialData] = useState(null);
  const [selectedForPreview, setSelectedForPreview] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    id: null,
    name: "",
  });
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const menuRef = useRef(null);

  // --- Determine Active Company ID ---
  const currentCompanyId = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return Number(
        user?.company_id || localStorage.getItem("company_id") || 0,
      );
    } catch {
      return 0;
    }
  }, []);

  const isCompany8 = currentCompanyId === 8;

  // Helper to extract detailed backend error messages
  const extractErrorMessage = (error, defaultMsg) => {
    return (
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.data?.message ||
      error?.message ||
      defaultMsg
    );
  };

  // --- Data Fetching ---
  const loadTemplatesData = async () => {
    setLoading(true);
    try {
      const [customRes, presetRes] = await Promise.all([
        fetchEmailTemplates(),
        fetchDefaultEmailTemplates(),
      ]);

      const parsedCustom = Array.isArray(customRes)
        ? customRes
        : Array.isArray(customRes?.data)
          ? customRes.data
          : [];

      const parsedPresets = Array.isArray(presetRes)
        ? presetRes
        : Array.isArray(presetRes?.data)
          ? presetRes.data
          : [];

      setCustomTemplates(parsedCustom);
      setPresetTemplates(parsedPresets);
    } catch (error) {
      toast.error(extractErrorMessage(error, "Failed to load templates"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplatesData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Action Handler (Generate PDF / Send Email) ---
  const handleExecuteAction = async (payload) => {
    const resolvedPurpose = payload?.purpose || payload?.letter_category;
    const resolvedUserId = payload?.userId || payload?.user_id;

    if (!resolvedPurpose) {
      toast.error("Purpose is required");
      return;
    }

    const loader = toast.loading(
      activeTab === "pdf" ? "Generating PDF..." : "Sending Email...",
    );

    try {
      if (activeTab === "pdf") {
        const res = await generateLetterService(
          resolvedUserId,
          resolvedPurpose,
        );

        toast.success(res?.message || "Successfully generated letter", {
          id: loader,
        });

        const fileUrl = res?.data?.file_url;
        if (fileUrl) {
          // Track generated letter entry in list
          const newEntry = {
            id: Date.now(),
            user_id: resolvedUserId,
            purpose: resolvedPurpose,
            file_url: fileUrl,
            created_at: new Date().toLocaleString(),
          };
          setGeneratedLetters((prev) => [newEntry, ...prev]);

          window.open(fileUrl, "_blank", "noopener,noreferrer");
        }
      } else {
        const res = await sendLetterService(
          resolvedUserId,
          resolvedPurpose,
          payload?.cc || [],
          payload?.bcc || [],
        );
        toast.success(res?.message || "Email Letter Sent Successfully!", {
          id: loader,
        });
      }
      setIsActionModalOpen(false);
    } catch (error) {
      toast.error(extractErrorMessage(error, "Failed to process request"), {
        id: loader,
      });
    }
  };

  const handleToggleMenu = (e, id) => {
    if (openMenuId === id) {
      setOpenMenuId(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY + 5,
        left: rect.left + window.scrollX - 150,
      });
      setOpenMenuId(id);
    }
  };

  const handleClonePreset = async (id) => {
    setOpenMenuId(null);
    const loadingToast = toast.loading("Cloning preset...");
    try {
      await cloneDefaultEmailTemplate(id);
      toast.success("Cloned to My Templates!", { id: loadingToast });
      setSubTab("my-templates");
      await loadTemplatesData();
      setViewMode("table");
    } catch (error) {
      toast.error(extractErrorMessage(error, "Clone failed"), {
        id: loadingToast,
      });
    }
  };

  const handleDeleteTemplate = async () => {
    const templateId = deleteModal.id;
    if (!templateId) return;

    const loadingToast = toast.loading("Deleting template...");
    try {
      await deleteEmailTemplateService(templateId);

      setCustomTemplates((prev) =>
        prev.filter((item) => item.id !== templateId),
      );
      setPresetTemplates((prev) =>
        prev.filter((item) => item.id !== templateId),
      );

      setDeleteModal({ show: false, id: null, name: "" });
      toast.success("Deleted successfully!", { id: loadingToast });
    } catch (error) {
      toast.error(extractErrorMessage(error, "Failed to delete template"), {
        id: loadingToast,
      });
    }
  };

  // --- Filtering Logic ---
  const filteredData = useMemo(() => {
    let sourceData = [];

    if (isCompany8) {
      const map = new Map();
      [...presetTemplates, ...customTemplates].forEach((item) => {
        if (item?.id) map.set(item.id, item);
      });
      sourceData = Array.from(map.values());
    } else {
      if (subTab === "presets") {
        sourceData = presetTemplates;
      } else {
        sourceData = customTemplates.filter(
          (item) => item.is_default === false || item.is_default === undefined,
        );
      }
    }

    return sourceData.filter((item) => {
      if (item.for_letter_generation !== true) return false;

      const purpose = (item.purpose || "").toLowerCase();
      const isPdf = purpose.endsWith("_pdf") || purpose.includes("pdf");
      const isMail =
        purpose.endsWith("_mail") ||
        purpose.includes("mail") ||
        purpose.includes("email");

      return activeTab === "pdf" ? isPdf : isMail;
    });
  }, [subTab, presetTemplates, customTemplates, activeTab, isCompany8]);

  const columns = [
    { key: "name", label: "Template Name", align: "left" },
    { key: "purpose", label: "Purpose", align: "left" },
    {
      key: "is_active",
      label: "Status",
      render: (val) => (
        <span
          className={`px-2 py-1 rounded-full text-[10px] font-normal ${
            val ? "text-green-600 bg-green-50" : "text-gray-400 bg-gray-50"
          }`}
        >
          {val ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      align: "center",
      render: (_, row) => {
        const canClone = subTab === "presets" && !isCompany8;

        return (
          <div className="relative flex justify-center">
            <button
              type="button"
              onClick={(e) => handleToggleMenu(e, row.id)}
              className="p-1 text-gray-400 hover:text-black transition-colors cursor-pointer"
            >
              <FiMoreHorizontal size={18} />
            </button>
            {openMenuId === row.id && (
              <div
                ref={menuRef}
                className="fixed w-48 border border-gray-200 rounded-xl shadow-2xl bg-white z-[9999] py-1 animate-in fade-in zoom-in duration-100"
                style={{ top: menuPosition.top, left: menuPosition.left }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedForPreview(row);
                    setViewMode("preview");
                    setOpenMenuId(null);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] text-black hover:bg-gray-50 font-poppins font-normal cursor-pointer"
                >
                  <FiMaximize size={14} className="text-black" /> Preview
                </button>

                {canClone ? (
                  <button
                    type="button"
                    onClick={() => handleClonePreset(row.id)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] text-black hover:bg-gray-50 border-t border-gray-50 font-poppins font-normal cursor-pointer"
                  >
                    <FiCopy size={14} className="text-black" /> Clone
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setInitialData(row);
                        setViewMode("edit");
                        setOpenMenuId(null);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] text-black hover:bg-gray-50 border-t border-gray-50 font-poppins font-normal cursor-pointer"
                    >
                      <FiEdit2 size={14} className="text-black" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteModal({
                          show: true,
                          id: row.id,
                          name: row.name || `Template #${row.id}`,
                        });
                        setOpenMenuId(null);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] text-red-500 hover:bg-red-50 font-poppins font-normal cursor-pointer"
                    >
                      <FiTrash2 size={14} /> Delete
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <DashboardLayout>
      <div className="w-full space-y-4">
        <HeaderGlobal userName="Admin" />

        {/* Action Modal (Generate PDF / Send Email) */}
        <LetterActionModal
          isOpen={isActionModalOpen}
          onClose={() => setIsActionModalOpen(false)}
          onExecute={handleExecuteAction}
          activeTab={activeTab}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={deleteModal.show}
          onClose={() => setDeleteModal({ show: false, id: null, name: "" })}
          onConfirm={handleDeleteTemplate}
          itemName={deleteModal.name}
        />

        <div className="font-poppins font-normal px-3 text-black">
          {viewMode === "table" ? (
            <>
              {/* Type Switcher: PDF vs Email */}
              <div className="flex gap-6 border-b border-gray-100 px-2 mb-3 text-[12px]">
                <button
                  type="button"
                  onClick={() => setActiveTab("pdf")}
                  className={`pb-2 transition-all relative cursor-pointer ${
                    activeTab === "pdf"
                      ? "text-black font-semibold after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-black"
                      : "text-gray-400"
                  }`}
                >
                  PDF Letters
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("email")}
                  className={`pb-2 transition-all relative cursor-pointer ${
                    activeTab === "email"
                      ? "text-black font-semibold after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-black"
                      : "text-gray-400"
                  }`}
                >
                  Email Letters
                </button>
              </div>

              {/* Subtab Switcher & Action Buttons */}
              <div className="flex justify-between items-center mb-4 px-2">
                <div className="flex gap-2 bg-gray-50 p-1 rounded-lg border border-gray-100">
                  <button
                    type="button"
                    onClick={() => setSubTab("my-templates")}
                    className={`px-4 py-1.5 rounded-md text-[11px] transition-all cursor-pointer ${
                      subTab === "my-templates"
                        ? "bg-white shadow-sm text-black font-medium"
                        : "text-gray-400"
                    }`}
                  >
                    My Templates
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubTab("presets")}
                    className={`px-4 py-1.5 rounded-md text-[11px] transition-all cursor-pointer ${
                      subTab === "presets"
                        ? "bg-white shadow-sm text-black font-medium"
                        : "text-gray-400"
                    }`}
                  >
                    System Presets
                  </button>
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Generated List Button (shown in PDF Letters tab) */}
                  {activeTab === "pdf" && (
                    <button
                      type="button"
                      onClick={() => setViewMode("generated-list")}
                      className="flex items-center gap-1.5 bg-white border border-gray-300 text-gray-800 px-3.5 py-2 rounded-lg text-[12px] font-medium hover:bg-gray-50 hover:border-gray-400 transition-all shadow-2xs cursor-pointer"
                    >
                      <FiList size={14} className="text-black" />
                      <span>Generated List</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsActionModalOpen(true)}
                    className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-[12px] font-normal hover:bg-gray-800 transition-all shadow-sm cursor-pointer"
                  >
                    {activeTab === "pdf" ? (
                      <>
                        <FiFileText size={14} /> Generate PDF
                      </>
                    ) : (
                      <>
                        <FiSend size={14} /> Send Email
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode("create")}
                    className="flex items-center gap-1.5 bg-white border border-gray-300 text-gray-800 px-4 py-2 rounded-lg text-[12px] font-medium hover:bg-gray-50 hover:border-gray-400 transition-all shadow-2xs cursor-pointer"
                  >
                    <FiPlus size={15} className="text-black" />
                    <span>Create Template</span>
                  </button>
                </div>
              </div>

              {/* Table / Loader */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[400px] text-[12px]">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-64">
                    <FiLoader className="animate-spin text-black" size={24} />
                  </div>
                ) : (
                  <PayrollTable
                    columns={columns}
                    data={filteredData}
                    rowsPerPage={8}
                  />
                )}
              </div>
            </>
          ) : viewMode === "generated-list" ? (
            /* Dedicated Generated Letter List View */
            <GeneratedLetterListView
              data={generatedLetters}
              onBack={() => setViewMode("table")}
            />
          ) : viewMode === "preview" ? (
            <TemplatePreviewView
              data={selectedForPreview}
              subTab={subTab}
              onBack={() => setViewMode("table")}
              onClone={(id) => handleClonePreset(id)}
            />
          ) : viewMode === "create" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className="text-xs text-gray-500 hover:text-black transition-colors cursor-pointer"
                >
                  ← Back to templates
                </button>
              </div>
              {activeTab === "pdf" ? (
                <CreateLetterPdfTemplateForm
                  onBack={() => setViewMode("table")}
                  onSuccess={() => {
                    setViewMode("table");
                    loadTemplatesData();
                  }}
                />
              ) : (
                <CreateLetterEmailTemplateForm
                  onBack={() => setViewMode("table")}
                  onSuccess={() => {
                    setViewMode("table");
                    loadTemplatesData();
                  }}
                />
              )}
            </div>
          ) : activeTab === "pdf" ? (
            <EditLetterPdfTemplateView
              initialData={initialData}
              onBack={() => {
                setViewMode("table");
                loadTemplatesData();
              }}
              onSuccess={() => {
                setViewMode("table");
                loadTemplatesData();
              }}
            />
          ) : (
            <EditEmailTemplateView
              initialData={initialData}
              onBack={() => {
                setViewMode("table");
                loadTemplatesData();
              }}
              onSuccess={() => {
                setViewMode("table");
                loadTemplatesData();
              }}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Letter;
