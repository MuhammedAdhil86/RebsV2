import React, { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Eye, Pencil, Trash2, Copy } from "lucide-react";
import UpdateEmailTemplateModal from "./updateemailmodal";
import { cloneDefaultEmailTemplate } from "../service/mainServices";
import toast from "react-hot-toast";

const ActionMenu = ({ row, refreshTemplates, isPresetTab, onDeleteClick }) => {
  const [open, setOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClone = async () => {
    setOpen(false);
    try {
      await cloneDefaultEmailTemplate(row.id);
      toast.success("Template cloned successfully!");
      if (refreshTemplates) refreshTemplates();
    } catch (err) {
      toast.error("Failed to clone template");
    }
  };

  const toggleMenu = () => {
    if (!open) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY + 5,
        left: rect.left + window.scrollX - 150,
      });
    }
    setOpen(!open);
  };

  return (
    <div className="relative text-left">
      <button
        ref={buttonRef}
        onClick={toggleMenu}
        className="p-1 text-gray-400 hover:text-gray-900 transition-colors"
      >
        <MoreHorizontal size={18} />
      </button>

      {open && (
        <div
          ref={menuRef}
          className="fixed w-48 border border-gray-200 rounded-xl shadow-2xl bg-white z-[9999] py-1 animate-in fade-in zoom-in duration-100"
          style={{ top: menuPosition.top, left: menuPosition.left }}
        >
          {isPresetTab ? (
            /* PRESET TAB: ONLY CLONE */
            <button
              onClick={handleClone}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-medium transition-colors"
            >
              <Copy size={14} /> Clone
            </button>
          ) : (
            /* REGULAR TAB: VIEW, EDIT, DELETE */
            <>
              <button
                onClick={() => {
                  setOpen(false);
                  // Add your View Logic or Modal here if needed
                  console.log("View:", row.name);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Eye size={14} /> View
              </button>

              <button
                onClick={() => {
                  setOpen(false);
                  setEditModalOpen(true);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Pencil size={14} /> Edit
              </button>

              <div className="h-[1px] bg-gray-100 my-1" />

              <button
                onClick={() => {
                  setOpen(false);
                  onDeleteClick(); // Triggers the modal in EmailTemplates.jsx
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={14} /> Delete
              </button>
            </>
          )}
        </div>
      )}

      {editModalOpen && (
        <UpdateEmailTemplateModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          templateData={row}
          refresh={refreshTemplates}
        />
      )}
    </div>
  );
};

export default ActionMenu;
