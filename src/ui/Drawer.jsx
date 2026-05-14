import React from "react";
import { X } from "lucide-react"; // for close icon (optional)

export default function SimpleDrawerUI({ open, onClose, children }) {
  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ${
        open ? "visible opacity-100" : "invisible opacity-0"
      }`}
    >
      {/* Background overlay */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
      ></div>

      {/* Drawer panel */}
      <div
        className={`absolute top-0 right-0 h-full bg-white shadow-2xl rounded-l-2xl w-[500px] max-w-[90vw] transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-black transition"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Drawer Content */}
        <div className="p-6 h-full overflow-y-auto">
          {children ? (
            children
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-600">
              <h2 className="text-lg font-semibold mb-2">Drawer Title</h2>
              <p className="text-sm text-gray-500 text-center">
                Add your content or component here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
