import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "../ui/pagelayout";
import PayrollTable from "../ui/payrolltable";
import TemplatePreviewView from "../ui/emailandletterpriview";
import EditEmailTemplateView from "../ui/editemailandletter";
import LetterActionModal from "../ui/letteractionmodal";
import {
  FiBell,
  FiLoader,
  FiMoreHorizontal,
  FiMaximize,
  FiEdit2,
  FiTrash2,
  FiCopy,
  FiAlertTriangle,
  FiSend,
  FiFileText,
} from "react-icons/fi";
import useEmailTemplateStore from "../store/emailtemplateStore";
import {
  cloneDefaultEmailTemplate,
  generateLetterService,
  sendLetterService,
} from "../service/mainServices";
import toast from "react-hot-toast";

const Letter = () => {
  // --- Navigation & View States ---
  const [activeTab, setActiveTab] = useState("pdf");
  const [subTab, setSubTab] = useState("my-templates");
  const [viewMode, setViewMode] = useState("table");

  // --- Zustand Store ---
  const {
    templates,
    defaultTemplates,
    loading,
    loadTemplates,
    loadDefaultTemplates,
    removeTemplate,
  } = useEmailTemplateStore();

  // --- UI Component States ---
  const [initialData, setInitialData] = useState(null);
  const [selectedForPreview, setSelectedForPreview] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null });
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    loadDefaultTemplates();
    loadTemplates();
  }, [loadDefaultTemplates, loadTemplates]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target))
        setOpenMenuId(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- API Action Handler ---
  const handleExecuteAction = async ({ userId, letter_category, cc, bcc }) => {
    const loader = toast.loading(
      activeTab === "pdf" ? "Generating PDF..." : "Sending Email...",
    );

    try {
      if (activeTab === "pdf") {
        await generateLetterService(userId, letter_category);
        toast.success("PDF Letter Generated Successfully!", { id: loader });
      } else {
        await sendLetterService(userId, letter_category, cc, bcc);
        toast.success("Email Letter Sent Successfully!", { id: loader });
      }
      setIsActionModalOpen(false);
    } catch (error) {
      toast.error(error.message || "Failed to process request", { id: loader });
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
      loadTemplates();
      setViewMode("table");
    } catch (error) {
      toast.error("Clone failed", { id: loadingToast });
    }
  };

  const filteredData = (
    subTab === "presets" ? defaultTemplates : templates
  ).filter((item) => {
    const isForGeneration = item.for_letter_generation === true;
    const isPdf = item.purpose?.includes("pdf");
    const matchesType = activeTab === "pdf" ? isPdf : !isPdf;
    if (subTab === "my-templates")
      return isForGeneration && matchesType && item.is_default === false;
    return isForGeneration && matchesType && item.is_manual === false;
  });

  const columns = [
    { key: "id", label: "ID", align: "left" },
    { key: "name", label: "Template Name", align: "left" },
    { key: "purpose", label: "Purpose", align: "left" },
    {
      key: "is_active",
      label: "Status",
      render: (val) => (
        <span
          className={`px-2 py-1 rounded-full text-[10px] font-normal ${val ? "text-green-600 bg-green-50" : "text-gray-400 bg-gray-50"}`}
        >
          {val ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      align: "center",
      render: (_, row) => (
        <div className="relative flex justify-center">
          <button
            onClick={(e) => handleToggleMenu(e, row.id)}
            className="p-1 text-gray-400 hover:text-black transition-colors"
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
                onClick={() => {
                  setSelectedForPreview(row);
                  setViewMode("preview");
                  setOpenMenuId(null);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] text-black hover:bg-gray-50 font-poppins font-normal"
              >
                <FiMaximize size={14} className="text-black" /> Preview
              </button>
              {subTab === "presets" ? (
                <button
                  onClick={() => handleClonePreset(row.id)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] text-black hover:bg-gray-50 border-t border-gray-50 font-poppins font-normal"
                >
                  <FiCopy size={14} className="text-black" /> Clone
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setInitialData(row);
                      setViewMode("edit");
                      setOpenMenuId(null);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] text-black hover:bg-gray-50 border-t border-gray-50 font-poppins font-normal"
                  >
                    <FiEdit2 size={14} className="text-black" /> Edit
                  </button>
                  <button
                    onClick={() => {
                      setDeleteModal({ show: true, id: row.id });
                      setOpenMenuId(null);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] text-red-500 hover:bg-red-50 font-poppins font-normal"
                  >
                    <FiTrash2 size={14} /> Delete
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout userName="Admin">
      <LetterActionModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        onExecute={handleExecuteAction}
        activeTab={activeTab}
      />

      {deleteModal.show && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
            <FiAlertTriangle className="text-black text-3xl mx-auto mb-4" />
            <h3 className="text-[16px] text-black font-poppins font-normal">
              Confirm Delete
            </h3>
            <p className="text-[12px] text-gray-500 mt-2 font-poppins font-normal">
              Are you sure? This action is permanent.
            </p>
            <div className="flex gap-3 mt-6 font-poppins">
              <button
                onClick={() => setDeleteModal({ show: false, id: null })}
                className="flex-1 px-4 py-2 bg-gray-100 rounded-xl text-[12px] font-normal text-black transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await removeTemplate(deleteModal.id);
                  setDeleteModal({ show: false, id: null });
                  toast.success("Deleted");
                }}
                className="flex-1 px-4 py-2 bg-black text-white rounded-xl text-[12px] font-normal transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="font-poppins font-normal px-3 text-black">
        <div className="bg-white flex justify-between items-center p-4 mb-4 shadow-sm rounded-lg border border-gray-100">
          <h1 className="text-[16px] text-black font-normal uppercase tracking-tight">
            Document Management
          </h1>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 cursor-pointer hover:bg-gray-50">
              <FiBell className="text-black" />
            </div>
            <img
              src="https://i.pravatar.cc/150?img=12"
              className="w-9 h-9 rounded-full border border-gray-200"
              alt="user"
            />
          </div>
        </div>

        {viewMode === "table" ? (
          <>
            <div className="flex gap-6 border-b border-gray-100 px-2 mb-3 text-[12px]">
              <button
                onClick={() => setActiveTab("pdf")}
                className={`pb-2 transition-all ${activeTab === "pdf" ? "border-b-2 border-black text-black" : "text-gray-400"}`}
              >
                PDF Letters
              </button>
              <button
                onClick={() => setActiveTab("email")}
                className={`pb-2 transition-all ${activeTab === "email" ? "border-b-2 border-black text-black" : "text-gray-400"}`}
              >
                Email Letters
              </button>
            </div>

            <div className="flex justify-between items-center mb-4 px-2">
              <div className="flex gap-2 bg-gray-50 p-1 rounded-lg border border-gray-100">
                <button
                  onClick={() => setSubTab("my-templates")}
                  className={`px-4 py-1.5 rounded-md text-[11px] transition-all ${subTab === "my-templates" ? "bg-white shadow-sm text-black" : "text-gray-400"}`}
                >
                  My Templates
                </button>
                <button
                  onClick={() => setSubTab("presets")}
                  className={`px-4 py-1.5 rounded-md text-[11px] transition-all ${subTab === "presets" ? "bg-white shadow-sm text-black" : "text-gray-400"}`}
                >
                  System Presets
                </button>
              </div>

              <button
                onClick={() => setIsActionModalOpen(true)}
                className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg text-[12px] font-normal hover:bg-gray-800 transition-all shadow-sm"
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
            </div>

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
        ) : viewMode === "preview" ? (
          <TemplatePreviewView
            data={selectedForPreview}
            subTab={subTab}
            onBack={() => setViewMode("table")}
            onClone={(id) => handleClonePreset(id)}
          />
        ) : (
          <EditEmailTemplateView
            initialData={initialData}
            onBack={() => {
              setViewMode("table");
              loadTemplates();
            }}
            availablePlaceholders={[
              "FirstName",
              "LastName",
              "Designation",
              "Department",
              "Company",
              "JoiningDate",
              "Salary",
              "ReportingManager",
              "CompanyEmail",
              "CompanyLogo",
            ]}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Letter;
