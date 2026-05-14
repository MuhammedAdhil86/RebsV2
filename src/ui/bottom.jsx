import React from "react";
import { Icon } from "@iconify/react";

function CommonButton({ onClick, text, icon, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-1 px-3 h-[28px] bg-black text-white text-xs rounded-md hover:bg-gray-800 transition font-medium ${className}`}
    >
      {icon && <Icon icon={icon} className="text-sm" />}
      {text}
    </button>
  );
}

export default CommonButton;
