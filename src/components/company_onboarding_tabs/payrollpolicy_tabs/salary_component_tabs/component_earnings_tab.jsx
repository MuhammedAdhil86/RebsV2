import React, { useState } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, Trash2, AlertTriangle, X } from "lucide-react";
import PayrollTable from "../../../../ui/payrolltable";
import toast, { Toaster } from "react-hot-toast";
import payrollService from "../../../../service/payrollService";

const Earnings = ({ data, onEdit, onRefresh }) => {
  const [menuPosition, setMenuPosition] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // --- MENU HANDLERS ---
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

  // --- DELETE MODAL HANDLERS ---
  const openDeleteModal = () => {
    setIsDeleteModalOpen(true);
    setMenuPosition(null); // Close the small action menu
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedRow(null);
  };

  const confirmDelete = async () => {
    if (!selectedRow) return;
    const toastId = "delete-component";
    toast.loading("Deleting component...", { id: toastId });

    try {
      await payrollService.deleteComponent(selectedRow.id);
      toast.success("Component deleted successfully", { id: toastId });
      closeDeleteModal();
      if (onRefresh) onRefresh();
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to delete";
      toast.error(errorMsg, { id: toastId });
    }
  };

  const columns = [
    {
      key: "name",
      label: "Component Name",
      align: "left",
      render: (value) => (
        <span className="font-poppins text-black">{value}</span>
      ),
    },
    {
      key: "payslip_name",
      label: "Payslip Name",
      align: "left",
      render: (value) => (
        <span className="font-poppins text-black">{value}</span>
      ),
    },
    {
      key: "calculation_type",
      label: "Calculation Type",
      align: "left",
      render: (value, row) => {
        let text = "-";
        if (value === "percentage_ctc") text = `${row.value}% of CTC`;
        else if (value === "percentage_basic") text = `${row.value}% of Basic`;
        else if (value === "flat") text = `Flat ${row.value}`;
        return (
          <div className="font-poppins text-black text-[13px]">{text}</div>
        );
      },
    },
    {
      key: "active",
      label: "Status",
      align: "center",
      render: (v) => (
        <span
          className={`font-poppins text-[12px] ${v ? "text-green-600" : "text-red-600"}`}
        >
          {v ? "Active" : "Inactive"}
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
          className="text-gray-400 hover:text-gray-900 p-1"
        >
          <MoreHorizontal size={18} />
        </button>
      ),
    },
  ];

  return (
    <div className="w-full">
      <Toaster position="top-right" />

      <PayrollTable
        columns={columns}
        data={data}
        rowsPerPage={10}
        rowClickHandler={(row) => onEdit && onEdit(row)}
      />

      {/* --- ACTION MENU PORTAL --- */}
      {menuPosition &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[9999]" onClick={closeMenu} />
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
                <Trash2 size={14} />
                Delete Component
              </button>
            </div>
          </>,
          document.body,
        )}

      {/* --- ARE YOU SURE MODAL --- */}
      {isDeleteModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
              onClick={closeDeleteModal}
            />

            {/* Modal Card */}
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

              <h3 className="text-[16px] font-semibold text-gray-900 font-['Poppins'] mb-2">
                Delete Component?
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
                  onClick={confirmDelete}
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
};

export default Earnings;
