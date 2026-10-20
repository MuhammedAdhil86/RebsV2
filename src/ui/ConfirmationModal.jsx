import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiInfo,
  FiTrash2,
  FiX,
} from "react-icons/fi";

// ---------------------------------------------------------------------------
// GLOBAL CONFIRMATION MODAL  (single file, no provider, no hook)
//
//   import { confirm } from "../../../ui/ConfirmationModal";
//
//   const ok = await confirm({
//     title: "Delete layout?",
//     message: "This cannot be undone.",
//     confirmText: "Delete",
//     cancelText: "Cancel",          // optional
//     variant: "danger",             // "danger" | "warning" | "success" | "info"
//   });
//   if (!ok) return;                 // user cancelled
//   ...do the work
//
// `confirm()` returns a Promise: true = confirmed, false = cancelled
// (Cancel button, X, backdrop click or Escape). Works from any file,
// inside or outside React components. Requires React 18+ (createRoot).
// ---------------------------------------------------------------------------

// Look of each variant: icon + colours
const VARIANTS = {
  danger: {
    Icon: FiTrash2,
    iconBox: "bg-red-50 text-red-600",
    button: "bg-red-600 hover:bg-red-700",
  },
  warning: {
    Icon: FiAlertTriangle,
    iconBox: "bg-orange-50 text-orange-600",
    button: "bg-orange-600 hover:bg-orange-700",
  },
  success: {
    Icon: FiCheckCircle,
    iconBox: "bg-green-50 text-green-600",
    button: "bg-green-600 hover:bg-green-700",
  },
  info: {
    Icon: FiInfo,
    iconBox: "bg-blue-50 text-blue-600",
    button: "bg-blue-600 hover:bg-blue-700",
  },
};

// The modal UI. You can also render it directly with isOpen / onClose /
// onConfirm if you ever need to, but `confirm()` below is the normal way.
const ConfirmationModal = ({
  isOpen = true,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "warning",
  loading = false,
}) => {
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && !loading && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const { Icon, iconBox, button } = VARIANTS[variant] || VARIANTS.warning;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => !loading && onClose?.()}
      />

      {/* Modal Card */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBox}`}
            >
              <Icon size={24} />
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-60"
            >
              <FiX size={20} />
            </button>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>

          {message && (
            <p className="text-gray-500 text-sm leading-relaxed">{message}</p>
          )}
        </div>

        <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-60"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm transition-colors disabled:opacity-60 ${button}`}
          >
            {loading ? "Please wait..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Global function: mounts the modal on document.body, resolves a Promise,
// then removes it again. No provider or hook needed.
export const confirm = (options = {}) =>
  new Promise((resolve) => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    const finish = (result) => {
      resolve(result);
      // unmount after the current event finishes
      setTimeout(() => {
        root.unmount();
        container.remove();
      }, 0);
    };

    root.render(
      <ConfirmationModal
        {...options}
        isOpen
        onClose={() => finish(false)}
        onConfirm={() => finish(true)}
      />,
    );
  });

export default ConfirmationModal;
