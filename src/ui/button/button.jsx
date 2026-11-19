import React from "react";

const SIZES = {
  sm: "text-[11px] leading-4 py-1 px-2.5 gap-1.5",
  md: "text-xs leading-4 py-1.5 px-3 gap-2", // medium (default)
  lg: "text-sm leading-5 py-1.5 px-4 gap-2.5",
};

const Button = ({
  children,
  onClick,
  size = "md",
  icon = null, // optional icon shown before the text
  type = "button",
  disabled = false,
  className = "",
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`${SIZES[size]} inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium
      bg-black text-white hover:bg-gray-800 transition-all
      disabled:bg-gray-300 disabled:cursor-not-allowed ${className}`}
  >
    {icon}
    {children}
  </button>
);

export default Button;
