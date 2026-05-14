import React, { useState } from "react";
import { Info } from "lucide-react"; // Optional, you can use any icon

const InfoTooltip = ({ text }) => {
  const [show, setShow] = useState(false);

  return (
    <span className="relative inline-block ml-1">
      {/* Info icon */}
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="text-gray-500 hover:text-gray-700 focus:outline-none"
      >
        <Info size={14} />
      </button>

      {/* Tooltip */}
      {show && (
        <div className="absolute z-10 w-64 p-2 -top-1 left-6 bg-black text-white text-[12px] rounded-md shadow-lg">
          {text}
          <div className="absolute -top-1 left-2 w-2 h-2 rotate-45 bg-black"></div>{" "}
          {/* small triangle */}
        </div>
      )}
    </span>
  );
};

export default InfoTooltip;
