import React from "react";

// Shared base: same size and shape for every modal button
const base =
  "px-4 py-2 text-[12px] rounded-lg disabled:opacity-60 transition-colors";

const variants = {
  // Approve / Apply / Submit (black)
  primary: "bg-black text-white hover:bg-gray-900 shadow-sm",
  // Reject (red)
  danger: "bg-red-600 text-white hover:bg-red-700",
  // Close / Cancel (white)
  secondary: "border border-gray-300 text-gray-700 hover:bg-gray-100",
};

const Spinner = () => (
  <span className="inline-block w-3.5 h-3.5 mr-2 align-middle border-2 border-white/30 border-t-white rounded-full animate-spin" />
);

const ModalButton = ({
  variant = "primary",
  loading = false,
  disabled = false,
  type = "button",
  className = "",
  children,
  ...props
}) => (
  <button
    type={type}
    disabled={disabled || loading}
    className={`${base} ${variants[variant]} ${className}`.trim()}
    {...props}
  >
    {loading && <Spinner />}
    {children}
  </button>
);

export default ModalButton;
