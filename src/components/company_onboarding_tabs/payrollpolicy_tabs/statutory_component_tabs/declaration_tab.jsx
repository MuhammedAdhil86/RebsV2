import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import payrollService from "../../../../service/payrollService";
import { deleteDeclaration } from "../../../../service/payrollother"; // Ensure this matches your service file location
import PayrollTable from "../../../../ui/payrolltable";
import UpdateDeclarationModal from "../../../../ui/updatedelarationmodal";
import DeleteConfirmationModal from "../../../../ui/deletemodal";

const EmployeeDeclarationList = ({ financialYearId, onBack }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuPosition, setMenuPosition] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    approved_amount: 0,
    status: "pending",
    remarks: "",
    section_code_id: "",
    financial_year_id: "",
    declared_amount: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await payrollService.getDeclarationList({
        financial_year_id: financialYearId,
      });
      setData(response?.data || []);
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (financialYearId) fetchData();
  }, [financialYearId]);

  const handleUpdate = async (payload) => {
    try {
      const response = await payrollService.approveOrRejectDeclaration(payload);
      if (response && response.ok === false) {
        throw new Error(response.error || "Operation Failed");
      }
      toast.success("Updated successfully");
      setIsUpdateModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || "An unexpected error occurred");
    }
  };

  const handleDelete = async () => {
    if (!selectedRow) return;

    const payload = {
      financial_year_id: Number(financialYearId),
      section_code_id: Number(selectedRow.section_id),
    };

    try {
      // Using the updated service method requiring user_id and payload
      await deleteDeclaration(selectedRow.user_id, payload);
      toast.success("Deleted successfully");
      setIsDeleteModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
  };

  const columns = [
    { label: "User ID", key: "user_id" },
    { label: "Financial Year", key: "financial_year" },
    { label: "Section", key: "section_code" },
    { label: "Declared Amount", key: "declared_amount" },
    { label: "Status", key: "status" },
    {
      key: "action",
      label: "Action",
      render: (_, row) => (
        <button
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setMenuPosition({
              top: rect.bottom + window.scrollY + 5,
              left: rect.right + window.scrollX - 150,
            });
            setSelectedRow(row);
          }}
        >
          <MoreHorizontal size={18} />
        </button>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-lg border p-6">
      <Toaster />
      <div className="flex justify-between mb-6">
        <h2 className="text-sm font-medium">Employee Declarations</h2>
        <button onClick={onBack} className="text-xs text-blue-600 underline">
          Back
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-xs">Loading data...</div>
      ) : (
        <PayrollTable columns={columns} data={data} />
      )}

      {menuPosition &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999]"
            onClick={() => setMenuPosition(null)}
          >
            <div
              style={{
                position: "absolute",
                top: menuPosition.top,
                left: menuPosition.left,
              }}
              className="w-32 bg-white border border-gray-200 rounded-lg shadow-xl py-1 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="w-full text-center px-4 py-2 text-[12px] text-gray-700 hover:bg-blue-50 transition-colors"
                onClick={() => {
                  setIsUpdateModalOpen(true);
                  setMenuPosition(null);
                }}
              >
                Update
              </button>
              <button
                className="w-full text-center px-2 py-2 text-[12px] text-red-600 hover:bg-red-50 transition-colors font-medium"
                onClick={() => {
                  setIsDeleteModalOpen(true);
                  setMenuPosition(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>,
          document.body,
        )}

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        itemName={selectedRow?.section_code || "this declaration"}
      />

      <UpdateDeclarationModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        formData={formData}
        setFormData={setFormData}
        onSave={handleUpdate}
        selectedRow={selectedRow}
      />
    </div>
  );
};

export default EmployeeDeclarationList;
