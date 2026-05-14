import React, { useState } from "react";
import {
  MapPin,
  Calendar as CalendarIcon,
  MoreVertical,
  Trash2,
  Edit,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import { removeHoliday } from "../../../service/holidayservices";
import HolidayModal from "../../../ui/addholiday";

const HolidayList = ({ holidays, getBranchName, onRefresh }) => {
  const [activeMenu, setActiveMenu] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: null,
    name: "",
  });

  const sorted = [...holidays].sort(
    (a, b) => new Date(a.date) - new Date(b.date),
  );

  const handleEdit = (holiday) => {
    setSelectedHoliday(holiday);
    setIsEditModalOpen(true);
    setActiveMenu(null);
  };

  const openDeleteConfirm = (id, name) => {
    setActiveMenu(null);
    setDeleteModal({ isOpen: true, id, name });
  };

  const handleDelete = async () => {
    const { id } = deleteModal;
    setDeleteModal({ isOpen: false, id: null, name: "" });

    toast.promise(
      removeHoliday(id),
      {
        loading: "Deleting holiday...",
        success: (res) => {
          if (onRefresh) onRefresh();
          return res?.message || "Holiday deleted successfully!";
        },
        error: (err) =>
          err?.response?.data?.message || "Failed to delete holiday.",
      },
      {
        style: {
          minWidth: "250px",
          borderRadius: "8px",
          background: "#333",
          color: "#fff",
        },
      },
    );
  };

  return (
    <div className="w-full">
      {/* --- DELETE MODAL --- */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDeleteModal({ isOpen: false })}
          />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle size={28} />
              </div>
              <h3 className="text-xl text-gray-900">Are you sure?</h3>
              <p className="text-sm text-gray-500 mt-2">
                Delete{" "}
                <span className="text-gray-900 font-bold">
                  "{deleteModal.name}"
                </span>
                ?
              </p>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setDeleteModal({ isOpen: false })}
                className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-2xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-2xl shadow-lg shadow-red-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- UNIVERSAL MODAL --- */}
      <HolidayModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedHoliday(null);
        }}
        onRefresh={onRefresh}
        editData={selectedHoliday}
      />

      {/* --- CARD GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
        {sorted.map((h) => (
          <div
            key={h.id}
            className="group relative bg-white border border-black/5 shadow-sm hover:shadow-md transition-all duration-300"
            style={{ zIndex: activeMenu === h.id ? 50 : 1 }}
          >
            {/* SQUARE IMAGE CONTAINER */}
            <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
              {h.image ? (
                <img
                  src={h.image}
                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                  alt=""
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-black/5">
                  <CalendarIcon size={48} />
                </div>
              )}

              {/* ACTION MENU BUTTON */}
              <div className="absolute top-3 right-3">
                <button
                  onClick={() =>
                    setActiveMenu(activeMenu === h.id ? null : h.id)
                  }
                  className="p-1.5 bg-white/80 backdrop-blur-md hover:bg-white rounded-full text-black shadow-sm"
                >
                  <MoreVertical size={16} />
                </button>
                {activeMenu === h.id && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setActiveMenu(null)}
                    />
                    <div className="absolute right-0 mt-2 w-36 bg-white border border-black/10 rounded-xl shadow-xl z-40 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2">
                      <button
                        onClick={() => handleEdit(h)}
                        className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 text-gray-700"
                      >
                        <Edit size={14} className="text-blue-500" /> Edit
                      </button>
                      <button
                        onClick={() =>
                          openDeleteConfirm(h.id, h.Reason || h.title)
                        }
                        className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-red-50 text-red-600 font-medium"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* CARD CONTENT */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 truncate">
                  <h3 className="text-gray-900 font-medium leading-tight truncate">
                    {h.Reason || h.title}
                  </h3>
                  <div className="flex items-center gap-1 text-gray-400 mt-1">
                    <MapPin size={12} className="text-red-400" />
                    <span className="text-xs font-medium truncate">
                      {getBranchName(h.branch)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-center bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 min-w-[45px]">
                  <span className="text-[12px] text-gray-400 uppercase">
                    {new Date(h.date).toLocaleDateString("en-US", {
                      month: "short",
                    })}
                  </span>
                  <span className="text-[16px] font-black text-gray-800">
                    {new Date(h.date).getDate()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HolidayList;
