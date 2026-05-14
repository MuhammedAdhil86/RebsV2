import React from "react";
import { MdTaskAlt } from "react-icons/md";

const EnableESI = ({ onEnable }) => {
  return (
    <div className="flex items-center justify-center min-h-[70vh] w-full bg-[#F7F9FB] px-4">
      <div className="text-center max-w-xl mx-auto">
        
        <h2 className="text-[20px] sm:text-[22px] font-medium text-gray-900 mb-3">
          Is Your Organization ESI Compliant?
        </h2>

        <p className="text-[13px] sm:text-[14px] text-gray-600 leading-relaxed mb-6 mt-6">
          If you have 10 or more employees, registering for ESI is mandatory.
          It ensures your team gets access to essential medical care and
          financial support when needed — especially those earning under
          ₹21,000/month.
        </p>

        <button
          onClick={onEnable}
          className="inline-flex items-center gap-2 bg-[#0B162B] hover:bg-[#0d1e3a] text-white px-5 py-2.5 rounded-md transition-all text-sm font-medium"
        >
          <MdTaskAlt size={18} className="text-green-400" />
          Enable ESI
        </button>
      </div>
    </div>
  );
};

export default EnableESI;
