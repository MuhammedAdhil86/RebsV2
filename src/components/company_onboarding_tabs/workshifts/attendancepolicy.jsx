import React, { useEffect, useState, useRef } from "react";
import { Plus, Search, MoreHorizontal, Trash2 } from "lucide-react";
import PayrollTable from "../../../ui/payrolltable";
import {
  fetchPolicyData,
  fetchPresetAttendanceTemplates,
  deleteattendancepolicy,
} from "../../../service/companyService";

import CreateAttendancePolicyTab from "../../../ui/createattendancepolicy";
import FlexibleUpdateAttendancePolicyTab from "../../../ui/flexibleattendancepolicy";
import PresetFlexibleUpdateTab from "../../../ui/PresetFlexibleUpdateTab";
import EditAttendancePreset from "./editattendanceprset";

import DefaultAttendanceTemplates from "./defaultattendacepolicy";
import DeleteConfirmationModal from "../../../ui/deletemodal";

import toast, { Toaster } from "react-hot-toast";

const AttendancePolicy = () => {
  const [activeTab, setActiveTab] = useState("all_policies");
  const [viewMode, setViewMode] = useState("list");
  const [editData, setEditData] = useState(null);
  const [policyData, setPolicyData] = useState([]);
  const [defaultPolicies, setDefaultPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);

  const menuRef = useRef(null);

  // =========================
  // LOAD DATA (Ensures table stays synced)
  // =========================
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [customRes, defaultRes] = await Promise.all([
        fetchPolicyData(),
        fetchPresetAttendanceTemplates(),
      ]);

      const customArray =
        customRes?.data?.data || customRes?.data || customRes || [];
      const defaultArray =
        defaultRes?.data?.data || defaultRes?.data || defaultRes || [];

      setPolicyData(Array.isArray(customArray) ? customArray : []);
      setDefaultPolicies(Array.isArray(defaultArray) ? defaultArray : []);
    } catch (error) {
      toast.error("Failed to load policies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // =========================
  // CLOSE TABS (CRITICAL FIX)
  // =========================
  const handleCloseTabs = () => {
    setViewMode("list");
    setEditData(null);
    // Refresh the list whenever a child component (like EditAttendancePreset)
    // signals it is done, so the UI reflects the changes.
    loadAllData();
  };

  const handleConfirmDelete = async () => {
    if (!selectedPolicy) return;
    const toastId = toast.loading("Deleting policy...");
    try {
      await deleteattendancepolicy(selectedPolicy.id);
      toast.success("Policy deleted successfully", { id: toastId });
      setIsDeleteModalOpen(false);
      setSelectedPolicy(null);
      loadAllData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Delete failed", {
        id: toastId,
      });
    }
  };

  const toggleMenu = (e, rowId) => {
    e.stopPropagation();
    if (openMenuId === rowId) {
      setOpenMenuId(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY + 5,
        left: rect.left + window.scrollX - 140,
      });
      setOpenMenuId(rowId);
    }
  };

  const formatTime = (timeInput) => {
    if (!timeInput || timeInput.includes("0000-01-01T00:00:00"))
      return "Flexible";
    let timeStr = timeInput.includes("T")
      ? timeInput.split("T")[1].substring(0, 5)
      : timeInput;
    const [hour, minute] = timeStr.split(":");
    const hr = parseInt(hour, 10);
    const ampm = hr >= 12 ? "PM" : "AM";
    const displayHour = hr % 12 === 0 ? 12 : hr % 12;
    return `${displayHour}:${minute} ${ampm}`;
  };

  const columns = [
    { key: "policy_name", label: "Policy Name", align: "left" },
    {
      key: "working_hours",
      label: "Duration",
      render: (val) => `${val || 0} Hrs`,
    },
    {
      key: "start_time",
      label: "Start Time",
      render: (val) => formatTime(val),
    },
    { key: "end_time", label: "End Time", render: (val) => formatTime(val) },
    {
      key: "regularisation",
      label: "Regularization",
      render: (_, row) => (
        <span className="text-[12px] font-medium text-gray-600">
          {row.regularisation_limit ?? 0} / {row.regularisation_type || "N/A"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      align: "center",
      render: (_, row) => {
        const isActive =
          new Date() >= new Date(row.start_date) &&
          new Date() <= new Date(row.end_date);
        return (
          <span
            className={`px-3 py-1 rounded-full border text-[11px] font-medium ${isActive ? "bg-green-50 text-green-500 border-green-100" : "bg-indigo-50 text-indigo-500 border-indigo-100"}`}
          >
            {isActive ? "Active" : "Inactive"}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (_, row) => (
        <div className="relative flex justify-end">
          <button
            onClick={(e) => toggleMenu(e, row.id)}
            className="p-1 text-gray-400 hover:text-gray-900 transition-colors"
          >
            <MoreHorizontal size={18} />
          </button>
          {openMenuId === row.id && (
            <div
              ref={menuRef}
              className="fixed w-40 border border-gray-200 rounded-xl shadow-2xl bg-white z-[9999] py-1 animate-in fade-in zoom-in duration-100"
              style={{ top: menuPosition.top, left: menuPosition.left }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPolicy(row);
                  setIsDeleteModalOpen(true);
                  setOpenMenuId(null);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] text-red-500 hover:bg-red-50 font-semibold transition-colors text-left"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

  // --- RENDERING MODES ---
  if (viewMode === "create")
    return (
      <CreateAttendancePolicyTab isOpen={true} onClose={handleCloseTabs} />
    );
  if (viewMode === "update")
    return (
      <FlexibleUpdateAttendancePolicyTab
        initialData={editData}
        onClose={handleCloseTabs}
      />
    );
  if (viewMode === "preset_flexible_view")
    return (
      <PresetFlexibleUpdateTab
        initialData={editData}
        onClose={handleCloseTabs}
      />
    );
  if (viewMode === "edit_preset")
    return (
      <EditAttendancePreset initialData={editData} onClose={handleCloseTabs} />
    );

  return (
    <div className="w-full bg-white rounded-xl">
      <Toaster position="top-right" />
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={selectedPolicy?.policy_name}
      />

      <div className="flex items-center gap-8 border-b border-gray-100 mb-6 px-2">
        {["all_policies", "presets_templates"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-[14px] font-medium transition-all relative ${activeTab === tab ? "text-black" : "text-gray-400"}`}
          >
            {tab === "all_policies" ? "All Policies" : "Presets Templates"}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-black" />
            )}
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center mb-6 px-2">
        <h2 className="text-[16px] font-semibold font-['Poppins']">
          {activeTab === "all_policies"
            ? "Attendance Policies"
            : "Presets Templates"}
        </h2>
        <div className="flex items-center gap-3">
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
          {activeTab === "all_policies" && (
            <button
              onClick={() => setViewMode("create")}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-[12px] font-medium active:scale-95 transition-transform"
            >
              <Plus size={14} /> Create Policy
            </button>
          )}
        </div>
      </div>

      <div className="w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-[12px]">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin mb-2" />
            <span>Loading policies...</span>
          </div>
        ) : activeTab === "all_policies" ? (
          <PayrollTable
            columns={columns}
            data={policyData.filter((p) =>
              p.policy_name?.toLowerCase().includes(searchTerm.toLowerCase()),
            )}
            rowsPerPage={8}
            rowClickHandler={(row) => {
              setEditData(row);
              setViewMode("update");
            }}
          />
        ) : (
          <DefaultAttendanceTemplates
            data={defaultPolicies.filter((p) =>
              p.policy_name?.toLowerCase().includes(searchTerm.toLowerCase()),
            )}
            loading={loading}
            onEdit={(row) => {
              setEditData(row);
              if (row.is_flexible === true) {
                setViewMode("preset_flexible_view");
              } else {
                setViewMode("edit_preset");
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

export default AttendancePolicy;
