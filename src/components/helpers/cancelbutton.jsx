import React from "react";

const CancelButton = ({ children = "Cancel", onClick, type = "button" }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        padding: "10px 35px",
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        fontWeight: 100,
        fontFamily: "Poppins, sans-serif",
        fontSize: "12px",
        background: "white",
        color: "black",
        cursor: "pointer",
        transition: "transform 180ms cubic-bezier(.22, .61, .36, 1)",
      }}
    >
      {children}
    </button>
  );
};

export default CancelButton;
