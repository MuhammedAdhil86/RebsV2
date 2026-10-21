import React, { useState } from "react";
import {
  MapPin,
  MoreVertical,
  Trash2,
  Edit,
  AlertTriangle,
} from "lucide-react";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import { removeHoliday } from "../../../service/holidayservices";
import HolidayModal from "../../../ui/addholiday";

// "2027-01-26" or "2027-01-26T00:00:00Z" -> local Date (no timezone shift)
const parseDate = (value) => {
  if (!value) return null;
  const [y, m, d] = String(value).slice(0, 10).split("-").map(Number);
  if (y && m && d) return new Date(y, m - 1, d);
  const fallback = new Date(value);
  return isNaN(fallback) ? null : fallback;
};

const HolidayList = ({
  holidays,
  getBranchName,
  onRefresh,
  onSubmitAction,
}) => {
  const [activeMenu, setActiveMenu] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: null,
    name: "",
  });

  const sorted = [...holidays].sort(
    (a, b) => (parseDate(a.date) ?? 0) - (parseDate(b.date) ?? 0),
  );

  const closeDeleteModal = () =>
    setDeleteModal({ isOpen: false, id: null, name: "" });

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedHoliday(null);
  };

  const handleEdit = (holiday) => {
    setSelectedHoliday(holiday);
    setIsEditModalOpen(true);
    setActiveMenu(null);
  };

  const openDeleteConfirm = (id, name) => {
    setActiveMenu(null);
    setDeleteModal({ isOpen: true, id, name });
  };

  // The modal needs a submit handler. This one calls the parent's handler
  // (add / update + toasts) and closes the edit modal only on success.
  const handleEditSubmit = async (formData, isEditMode, editId) => {
    await onSubmitAction(formData, isEditMode, editId);
    closeEditModal();
  };

  const handleDelete = () => {
    const { id } = deleteModal;
    closeDeleteModal();

    // Look, position and duration come from the global <Toaster /> in App.jsx
    toast.promise(removeHoliday(id), {
      loading: "Deleting holiday...",
      success: (res) => {
        if (onRefresh) onRefresh();
        return res?.message || "Holiday deleted successfully!";
      },
      // removeHoliday already throws an Error carrying the backend text
      error: (err) => err?.message || "Failed to delete holiday.",
    });
  };

  return (
    <div className="w-full">
      {/* --- DELETE MODAL --- */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeDeleteModal}
          />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle size={28} />
              </div>
              <h3 className="text-xl font-semibold text-black">
                Are you sure?
              </h3>
              <p className="text-sm text-black/50 mt-2">
                Delete{" "}
                <span className="text-black font-semibold">
                  "{deleteModal.name}"
                </span>
                ? This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={closeDeleteModal}
                className="flex-1 px-4 py-3 text-sm font-medium border border-black/10 text-black rounded-2xl hover:bg-black/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-3 text-sm font-semibold bg-red-500 text-white rounded-2xl shadow-lg shadow-red-200 hover:bg-red-600 transition-colors"
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
        onClose={closeEditModal}
        onSubmitAction={handleEditSubmit}
        editData={selectedHoliday}
      />

      {/* --- EMPTY STATE --- */}
      {sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-black/[0.04] flex items-center justify-center mb-4">
            <Icon
              icon="solar:calendar-outline"
              className="w-7 h-7 text-black/40"
            />
          </div>
          <p className="text-sm font-medium text-black">No holidays yet</p>
          <p className="text-xs text-black/40 mt-1">
            Add a holiday or bulk upload a CSV to see it here.
          </p>
        </div>
      )}

      {/* --- CARD GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
        {sorted.map((h) => {
          const title = h.Reason || h.title;
          const date = parseDate(h.date);

          return (
            <div
              key={h.id}
              className="group relative bg-white border border-black/10 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              style={{ zIndex: activeMenu === h.id ? 50 : 1 }}
            >
              {/* SQUARE IMAGE CONTAINER */}
              <div className="relative aspect-square w-full overflow-hidden rounded-t-2xl bg-gradient-to-br from-zinc-50 to-zinc-100">
                {h.image ? (
                  <>
                    <img
                      src={h.image}
                      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                      alt={title || "Holiday"}
                    />
                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/25 to-transparent pointer-events-none" />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Icon
                      icon="solar:calendar-outline"
                      className="w-14 h-14 text-black/15"
                    />
                  </div>
                )}

                {/* ACTION MENU BUTTON */}
                <div className="absolute top-3 right-3">
                  <button
                    aria-label="Holiday actions"
                    onClick={() =>
                      setActiveMenu(activeMenu === h.id ? null : h.id)
                    }
                    className="p-2 bg-white/90 backdrop-blur-md hover:bg-white rounded-full text-black shadow-sm border border-black/5 transition-colors"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {activeMenu === h.id && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setActiveMenu(null)}
                      />
                      <div className="absolute right-0 mt-2 w-40 bg-white border border-black/10 rounded-xl shadow-xl z-40 p-1 animate-in fade-in slide-in-from-top-2">
                        <button
                          onClick={() => handleEdit(h)}
                          className="w-full px-3 py-2 text-left text-sm flex items-center gap-2.5 rounded-lg text-black hover:bg-black/5 transition-colors"
                        >
                          <Edit size={14} className="text-black" /> Edit
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(h.id, title)}
                          className="w-full px-3 py-2 text-left text-sm flex items-center gap-2.5 rounded-lg text-black hover:bg-black/5 transition-colors"
                        >
                          <Trash2 size={14} className="text-black" /> Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* CARD CONTENT */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-black font-semibold leading-tight truncate"
                      title={title}
                    >
                      {title}
                    </h3>

                    <div className="flex items-center gap-1.5 text-black/60 mt-2">
                      <Icon
                        icon="solar:calendar-outline"
                        className="w-4 h-4 text-black shrink-0"
                      />
                      <span className="text-xs font-medium truncate">
                        {date
                          ? date.toLocaleDateString("en-IN", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-black/60 mt-1.5">
                      <MapPin size={14} className="text-black shrink-0" />
                      <span className="text-xs font-medium truncate">
                        {getBranchName(h.branch)}
                      </span>
                    </div>
                  </div>

                  {/* DATE BADGE */}
                  <div className="flex flex-col items-center justify-center bg-black text-white px-2.5 py-1.5 rounded-xl min-w-[48px] shadow-sm">
                    <span className="text-[10px] uppercase tracking-wider text-white/60">
                      {date
                        ? date.toLocaleDateString("en-US", { month: "short" })
                        : "—"}
                    </span>
                    <span className="text-lg font-bold leading-none mt-0.5">
                      {date ? date.getDate() : "--"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HolidayList;
