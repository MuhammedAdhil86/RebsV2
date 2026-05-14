import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  MoreHorizontal,
  X,
  Eye,
  CheckCircle,
  XCircle,
  Settings2,
} from "lucide-react";
import PayrollTable from "../../../../ui/payrolltable";
import toast, { Toaster } from "react-hot-toast";
import payrollService from "../../../../service/payrollService";

const Reimbursements = ({ data, onEdit, onRefresh }) => {
  const [menuPosition, setMenuPosition] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

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
    if (!isStatusModalOpen) setSelectedRow(null);
  };

  // --- ACTION HANDLERS ---
  const handleStatusUpdate = async (statusType) => {
    if (!selectedRow) return;

    const toastId = "status-update";
    // API requires "approved" or "rejected"
    const apiStatus = statusType === "approve" ? "approved" : "rejected";

    toast.loading(
      `${statusType === "approve" ? "Approving" : "Rejecting"}...`,
      { id: toastId },
    );

    try {
      const payload = {
        id: selectedRow.id.toString(),
        status: apiStatus,
      };

      await payrollService.updateReimbursementStatus(payload);

      toast.success(`Claim ${apiStatus} successfully`, { id: toastId });
      setIsStatusModalOpen(false);

      if (onRefresh) onRefresh();
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || error.message || "Action failed";
      toast.error(errorMsg, { id: toastId });
    } finally {
      closeMenu();
    }
  };

  const columns = [
    {
      key: "user_name",
      label: "Employee",
      align: "left",
      render: (value, row) => (
        <div className="flex flex-col font-poppins">
          <span className="font-medium text-black text-[13px]">{value}</span>
          <span className="text-gray-400 text-[11px]">{row.user_id}</span>
        </div>
      ),
    },
    {
      key: "designation",
      label: "Designation",
      align: "left",
      render: (value) => (
        <span className="font-poppins text-gray-600 text-[12px]">
          {value || "N/A"}
        </span>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      align: "left",
      render: (value) => (
        <span className="font-poppins text-black font-semibold text-[13px]">
          ₹{parseFloat(value).toLocaleString()}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      align: "center",
      render: (v) => (
        <span
          className={`font-poppins text-[11px] px-2 py-0.5 rounded-full capitalize ${
            v === "pending"
              ? "bg-amber-50 text-amber-600"
              : v === "approved"
                ? "bg-green-50 text-green-600"
                : "bg-red-50 text-red-600"
          }`}
        >
          {v}
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

      <PayrollTable columns={columns} data={data} rowsPerPage={10} />

      {/* --- ACTION MENU --- */}
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
              className="w-48 bg-white border border-gray-100 rounded-xl shadow-xl p-1.5 flex flex-col gap-1"
            >
              <a
                href={selectedRow?.attachment}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-3 py-2 text-[11px] font-medium text-gray-700 hover:bg-gray-50 rounded-lg font-poppins"
              >
                <Eye size={14} className="text-blue-500" /> View Receipt
              </a>

              {/* DYNAMIC ACTION BUTTONS */}
              {selectedRow?.status === "pending" && (
                <button
                  onClick={() => setIsStatusModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 text-[11px] font-medium text-gray-700 hover:bg-gray-50 rounded-lg font-poppins"
                >
                  <Settings2 size={14} className="text-pink-500" /> Update
                  Status
                </button>
              )}

              {selectedRow?.status === "approved" && (
                <button
                  onClick={() => handleStatusUpdate("reject")}
                  className="flex items-center gap-2 px-3 py-2 text-[11px] font-medium text-red-500 hover:bg-red-50 rounded-lg font-poppins"
                >
                  <XCircle size={14} /> Reject Claim
                </button>
              )}

              {selectedRow?.status === "rejected" && (
                <button
                  onClick={() => handleStatusUpdate("approve")}
                  className="flex items-center gap-2 px-3 py-2 text-[11px] font-medium text-green-600 hover:bg-green-50 rounded-lg font-poppins"
                >
                  <CheckCircle size={14} /> Approve Claim
                </button>
              )}
            </div>
          </>,
          document.body,
        )}

      {/* --- PENDING STATUS MODAL --- */}
      {isStatusModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 font-poppins">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
              onClick={() => setIsStatusModalOpen(false)}
            />
            <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[15px] font-semibold text-gray-900">
                  Process Reimbursement
                </h3>
                <button
                  onClick={() => setIsStatusModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-[13px] text-gray-500 mb-6 leading-relaxed">
                Reviewing claim for{" "}
                <span className="font-semibold text-gray-800">
                  "{selectedRow?.user_name}"
                </span>
                . Please choose an action.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => handleStatusUpdate("reject")}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 rounded-xl text-[12px] font-medium hover:bg-red-50 transition-all"
                >
                  <XCircle size={14} /> Reject
                </button>
                <button
                  onClick={() => handleStatusUpdate("approve")}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl text-[12px] font-medium hover:bg-green-700 transition-all shadow-sm shadow-green-100"
                >
                  <CheckCircle size={14} /> Approve
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default Reimbursements;
