import React from "react";

const SIZES = {
  sm: "text-xs pb-1.5 gap-1.5",
  md: "text-sm pb-2 gap-2", // medium (default), same as Tab
  lg: "text-base pb-2.5 gap-2.5",
};

const Button = ({
  children,
  onClick,
  size = "md",
  icon = null, // optional icon shown before the text
  underline = true, // red bottom line, same as the active tab
  type = "button",
  disabled = false,
  className = "",
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`${SIZES[size]} inline-flex items-center font-medium transition-all relative
      text-gray-900 hover:text-gray-600
      disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    {icon}
    {children}
    {underline && (
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-red-500" />
    )}
  </button>
);

export default Button;
