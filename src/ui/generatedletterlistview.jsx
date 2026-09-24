import React, { useState, useEffect } from "react";
import PayrollTable from "./payrolltable";
import DeleteConfirmationModal from "./deletemodal";
import {
  ArrowLeft,
  Search,
  ExternalLink,
  FileText,
  Trash2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getGeneratedLettersService,
  deleteGeneratedLetterService,
} from "../service/mainServices";

export default function GeneratedLetterListView({ onBack }) {
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Delete modal state
  const [targetLetter, setTargetLetter] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Fetch letters from GET /letter/generated
  const loadGeneratedLetters = async () => {
    setLoading(true);
    try {
      const res = await getGeneratedLettersService();
      const list = Array.isArray(res) ? res : res?.data || [];
      setLetters(list);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to load generated letters",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGeneratedLetters();
  }, []);

  // Open modal with selected letter details
  const handleOpenDeleteModal = (row) => {
    setTargetLetter(row);
    setIsDeleteModalOpen(true);
  };

  // Close modal and reset selection
  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setTargetLetter(null);
  };

  // Execute DELETE /letter/generated/{id}
  const handleConfirmDelete = async () => {
    if (!targetLetter?.id) return;

    const idToDelete = targetLetter.id;
    handleCloseDeleteModal();

    setDeletingId(idToDelete);
    const toastId = toast.loading("Deleting letter...");

    try {
      await deleteGeneratedLetterService(idToDelete);
      toast.success("Letter deleted successfully", { id: toastId });
      // Optimistically update list
      setLetters((prev) => prev.filter((item) => item.id !== idToDelete));
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete letter", {
        id: toastId,
      });
    } finally {
      setDeletingId(null);
    }
  };

  const columns = [
    {
      key: "employee_id",
      label: "Employee ID",
      align: "left",
      width: 130,
      render: (val) => (
        <span className="font-mono text-gray-700 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded text-[11px] font-medium">
          #{val || "N/A"}
        </span>
      ),
    },
    {
      key: "type",
      label: "Letter Category / Purpose",
      align: "left",
      render: (val) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-red-50 text-red-600 rounded-md">
            <FileText size={14} />
          </div>
          <span className="capitalize font-medium text-gray-800 text-[12px]">
            {String(val || "Letter").replace(/_/g, " ")}
          </span>
        </div>
      ),
    },
    {
      key: "employee_name",
      label: "Employee",
      align: "left",
      render: (val) => (
        <span className="font-medium text-gray-900 text-[12px]">
          {val || "N/A"}
        </span>
      ),
    },
    {
      key: "created_at",
      label: "Generated At",
      align: "center",
      width: 170,
      render: (val) => {
        if (!val) return <span className="text-gray-400 text-[11px]">-</span>;
        const d = new Date(val);
        return (
          <span className="text-gray-500 text-[11px] font-sans">
            {d.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}{" "}
            {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "Document Actions",
      align: "center",
      width: 160,
      render: (_, row) => (
        <div className="flex items-center justify-center gap-2">
          {row.file ? (
            <a
              href={row.file}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-black text-white hover:bg-gray-800 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
              title="Open PDF Document"
            >
              <ExternalLink size={12} />
              <span>View</span>
            </a>
          ) : (
            <span className="text-gray-400 text-[11px]">No File</span>
          )}

          <button
            type="button"
            onClick={() => handleOpenDeleteModal(row)}
            disabled={deletingId === row.id}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
            title="Delete Letter"
          >
            {deletingId === row.id ? (
              <Loader2 size={13} className="animate-spin text-red-500" />
            ) : (
              <Trash2 size={13} />
            )}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full flex flex-col gap-4 font-poppins text-[12px]">
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        itemName={
          targetLetter
            ? `${String(targetLetter.type || "Letter").replace(/_/g, " ")} (${targetLetter.employee_name || targetLetter.employee_id})`
            : "this letter"
        }
      />

      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-black transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to templates</span>
          </button>
          <span className="text-gray-300">|</span>
          <h2 className="text-[14px] font-semibold text-gray-800">
            Generated PDF Letters
          </h2>
          <span className="text-[11px] bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full font-medium">
            {letters.length} Total
          </span>
        </div>

        {/* Search & Refresh Controls */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, ID, or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[12px] outline-none focus:border-black transition-all w-full sm:w-64"
            />
          </div>

          <button
            type="button"
            onClick={loadGeneratedLetters}
            disabled={loading}
            className="p-2 border border-gray-200 hover:bg-gray-50 rounded-lg text-gray-600 transition-colors cursor-pointer disabled:opacity-40"
            title="Refresh List"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
            <Loader2 className="animate-spin text-black" size={24} />
            <span className="text-xs">Loading generated letters...</span>
          </div>
        ) : (
          <PayrollTable
            columns={columns}
            data={letters}
            rowsPerPage={8}
            searchTerm={searchTerm}
          />
        )}
      </div>
    </div>
  );
}
