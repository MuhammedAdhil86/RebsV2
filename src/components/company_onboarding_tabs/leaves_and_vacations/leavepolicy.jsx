import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  Search,
  MoreHorizontal,
  Power,
  Copy,
  Trash2,
  AlertTriangle,
  X,
} from "lucide-react";
import PayrollTable from "../../../ui/payrolltable";
import { fetchAllLeavePolicy } from "../../../service/companyService";
import payrollService from "../../../service/payrollService";
import CreateLeavePolicyTab from "../leaves_and_vacations/createleavepolicymodal";
import UpdateLeavePolicyTab from "./updateleavepolicy";
import DefaultTemplatesTable from "./leavepolicy/defaultleave";
import BulkAllocationTab from "./leavepolicy/bulkallocationtab";
import toast, { Toaster } from "react-hot-toast";

const LeavesAndVacations = () => {
  const [activeTab, setActiveTab] = useState("all_leaves");
  const [showCreateTab, setShowCreateTab] = useState(false);
  const [showUpdateTab, setShowUpdateTab] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [leaveData, setLeaveData] = useState([]);
  const [defaultLeaves, setDefaultLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedIds, setSelectedIds] = useState([]);
  const [menuPosition, setMenuPosition] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [customRes, defaultRes] = await Promise.all([
        fetchAllLeavePolicy(),
        payrollService.getDefaultLeavePolicies(),
      ]);
      setLeaveData(customRes?.data || customRes || []);
      setDefaultLeaves(defaultRes?.data || defaultRes || []);
    } catch (error) {
      console.error("Error fetching leave data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    setSelectedIds([]);
  }, [activeTab]);

  const handleCloneTemplate = async (ids) => {
    if (!ids || ids.length === 0) return;
    const toastId = "clone-proc";
    toast.loading("Cloning selected policies...", { id: toastId });

    try {
      await payrollService.cloneLeavePolicy(ids);
      toast.success("Templates cloned successfully!", { id: toastId });
      setSelectedIds([]);
      setActiveTab("all_leaves");
      loadAllData();
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to clone";
      toast.error(msg, { id: toastId });
    }
  };

  const filteredData = (
    activeTab === "all_leaves" ? leaveData : defaultLeaves
  ).filter(
    (leave) =>
      leave.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      leave.leave_type?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleToggleStatus = async () => {
    if (!selectedRow) return;
    try {
      const newStatusValue = selectedRow.status !== "active";
      await payrollService.updatePolicyStatus(selectedRow.id, newStatusValue);
      toast.success(
        `Policy ${newStatusValue ? "Activated" : "Deactivated"} successfully`,
      );
      closeMenu();
      loadAllData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const confirmDeleteAction = async () => {
    if (!selectedRow) return;
    const toastId = toast.loading("Deleting policy...");
    try {
      await payrollService.deleteLeavePolicy(selectedRow.id);
      toast.success("Policy deleted successfully", { id: toastId });
      setShowDeleteModal(false);
      setSelectedRow(null);
      loadAllData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete policy", {
        id: toastId,
      });
    }
  };

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
  };

  const handleCloseCreate = () => {
    setShowCreateTab(false);
    loadAllData();
  };

  const handleRowClick = (row) => {
    setSelectedPolicy(row);
    setShowUpdateTab(true);
  };

  const handleCloseUpdate = () => {
    setShowUpdateTab(false);
    setSelectedPolicy(null);
    loadAllData();
  };

  const columns = [
    { key: "name", label: "Leave Name", align: "left" },
    {
      key: "leave_type",
      label: "Type",
      align: "left",
      render: (value) => (
        <span className="capitalize">{value?.toLowerCase()}</span>
      ),
    },
    {
      key: "created_at",
      label: "Effective From",
      align: "left",
      render: (value) =>
        new Date(value).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
    },
    {
      key: "count",
      label: "Accrual Count",
      align: "center",
      render: (_, row) => (
        <span className="font-medium text-gray-700">
          {row.employee_accrues}/{row.accrual_method}
        </span>
      ),
    },
    {
      key: "description",
      label: "Description",
      align: "left",
      render: (value) => (
        <div className="max-w-[180px] truncate text-gray-400" title={value}>
          {value || "No description"}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      align: "center",
      render: (value) => (
        <span
          className={`px-3 py-1 rounded-full border text-[11px] font-medium ${
            value === "active"
              ? "bg-green-50 text-green-500 border-green-100"
              : "bg-gray-50 text-gray-400 border-gray-100"
          }`}
        >
          {value === "active" ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "action",
      label: "Action",
      align: "center",
      render: (_, row) => (
        <button
          onClick={(e) => openMenu(e, row)}
          className="text-gray-400 hover:text-gray-900 transition-colors p-1"
        >
          <MoreHorizontal size={18} />
        </button>
      ),
    },
  ];

  if (showCreateTab)
    return <CreateLeavePolicyTab isOpen={true} onClose={handleCloseCreate} />;
  if (showUpdateTab)
    return (
      <UpdateLeavePolicyTab
        policyData={selectedPolicy}
        onClose={handleCloseUpdate}
      />
    );

  return (
    <div className="w-full bg-white rounded-xl">
      <Toaster position="top-right" />

      {/* Tabs Header */}
      <div className="flex items-center gap-8 border-b border-gray-100 mb-6">
        <button
          onClick={() => setActiveTab("all_leaves")}
          className={`pb-3 text-[14px] font-medium transition-all relative ${
            activeTab === "all_leaves"
              ? "text-black"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          All Leaves
          {activeTab === "all_leaves" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-black" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("presets_templates")}
          className={`pb-3 text-[14px] font-medium transition-all relative ${
            activeTab === "presets_templates"
              ? "text-black"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          Presets Templates
          {activeTab === "presets_templates" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-black" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("bulk_allocation")}
          className={`pb-3 text-[14px] font-medium transition-all relative ${
            activeTab === "bulk_allocation"
              ? "text-black"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          Leave Bulk Allocation
          {activeTab === "bulk_allocation" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-black" />
          )}
        </button>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-[16px] text-gray-900 font-['Poppins']">
          {activeTab === "all_leaves"
            ? "Leave Policies"
            : activeTab === "bulk_allocation"
              ? "Bulk Allocation"
              : "Presets Templates"}
        </h2>

        <div className="flex items-center gap-3">
          {/* Hide search bar for bulk allocation if preferred, or keep it visible */}
          {activeTab !== "bulk_allocation" && (
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={14}
              />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 border border-gray-200 bg-[#f9f9f9] rounded-lg text-[12px] w-64 focus:outline-none focus:ring-1 focus:ring-black font-['Poppins'] transition-all"
              />
            </div>
          )}

          {activeTab === "presets_templates" && selectedIds.length > 0 && (
            <button
              onClick={() => handleCloneTemplate(selectedIds)}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-[12px] font-medium hover:bg-zinc-800 transition-all font-['Poppins']"
            >
              <Copy size={14} /> Clone ({selectedIds.length})
            </button>
          )}

          {activeTab === "all_leaves" && (
            <button
              onClick={() => setShowCreateTab(true)}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-[12px] font-medium hover:bg-zinc-800 transition-all font-['Poppins']"
            >
              <Plus size={14} /> Create Policy
            </button>
          )}
        </div>
      </div>

      {/* Table Section - UPDATED LOGIC HERE */}
      <div className="w-full">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 text-[12px] font-['Poppins']">
            <span className="animate-pulse">Loading leave policies...</span>
          </div>
        ) : activeTab === "all_leaves" ? (
          <PayrollTable
            columns={columns}
            data={filteredData}
            rowsPerPage={8}
            searchTerm={searchQuery}
            rowClickHandler={handleRowClick}
          />
        ) : activeTab === "presets_templates" ? (
          <DefaultTemplatesTable
            data={filteredData || []}
            loading={loading}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            onUseTemplate={handleCloneTemplate}
          />
        ) : activeTab === "bulk_allocation" ? (
          <BulkAllocationTab policies={leaveData} />
        ) : null}
      </div>

      {/* Action Menu Portal */}
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
              className="w-44 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden p-1.5 flex flex-col gap-0.5"
            >
              <button
                className={`w-full text-left px-3 py-2 text-[11px] font-medium font-['Poppins'] transition-colors flex items-center gap-2 rounded-lg ${
                  selectedRow?.status === "active"
                    ? "text-red-500 hover:bg-red-50"
                    : "text-green-600 hover:bg-green-50"
                }`}
                onClick={handleToggleStatus}
              >
                <Power size={14} />
                {selectedRow?.status === "active"
                  ? "Deactivate Policy"
                  : "Activate Policy"}
              </button>

              <button
                className="w-full text-left px-3 py-2 text-[11px] font-medium font-['Poppins'] transition-colors flex items-center gap-2 rounded-lg text-red-600 hover:bg-red-50"
                onClick={() => {
                  setShowDeleteModal(true);
                  closeMenu();
                }}
              >
                <Trash2 size={14} />
                Delete Policy
              </button>
            </div>
          </>,
          document.body,
        )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal &&
        createPortal(
          <div className="fixed inset-0 z-[10001] flex items-center justify-center px-4">
            <div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm"
              onClick={() => setShowDeleteModal(false)}
            />
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden z-[10002] animate-in fade-in zoom-in duration-200">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-red-600">
                    <AlertTriangle size={20} />
                  </div>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2 font-['Poppins']">
                  Delete Policy?
                </h3>
                <p className="text-sm text-gray-500 font-['Poppins'] leading-relaxed">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-gray-800">
                    "{selectedRow?.name}"
                  </span>
                  ? This action is permanent and cannot be reversed.
                </p>
              </div>

              <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors font-['Poppins']"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteAction}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-all font-['Poppins'] shadow-sm shadow-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default LeavesAndVacations;
