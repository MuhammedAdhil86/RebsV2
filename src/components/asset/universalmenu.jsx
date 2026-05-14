import React, { useState, useRef, useEffect } from "react";
import { FiMoreHorizontal } from "react-icons/fi";

// FIX: Changed name to UniversalActionMenu to match your other files
const UniversalActionMenu = ({ actions = [], row }) => {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

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

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      // Close on scroll so the fixed menu doesn't "float" away from the button
      const handleScroll = () => setOpen(false);
      window.addEventListener("scroll", handleScroll, { passive: true });

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        window.removeEventListener("scroll", handleScroll);
      };
    }
  }, [open]);

  const toggleMenu = (e) => {
    e.stopPropagation();
    if (!open) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX - 140,
      });
    }
    setOpen(!open);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        ref={buttonRef}
        onClick={toggleMenu}
        className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-all active:scale-90"
      >
        <FiMoreHorizontal size={20} />
      </button>

      {open && (
        <div
          ref={menuRef}
          // Fixed positioning is key for tables
          className="fixed w-44 bg-white border border-gray-100 rounded-xl shadow-2xl z-[9999] py-1 animate-in fade-in zoom-in duration-150"
          style={{
            top: menuPosition.top,
            left: menuPosition.left,
            filter: "drop-shadow(0 20px 13px rgb(0 0 0 / 0.03))",
          }}
        >
          {actions.map((action, index) => (
            <React.Fragment key={index}>
              {action.divider && (
                <div className="h-[1px] bg-gray-100 my-1 mx-2" />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  action.onClick(row);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors
                  ${
                    action.isDelete
                      ? "text-red-500 hover:bg-red-50 font-semibold"
                      : "text-gray-700 hover:bg-gray-50 font-medium"
                  }`}
              >
                {action.icon && (
                  <span className="opacity-70">{action.icon}</span>
                )}
                {action.label}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export default UniversalActionMenu; // FIX: Match the component name
