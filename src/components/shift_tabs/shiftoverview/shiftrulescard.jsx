// src/components/shifts/ShiftRulesCard.jsx
import React from "react";
import { FiEdit } from "react-icons/fi";
import useShiftDashboardStore from "../../../store/shiftoverviewStore";

const ShiftRulesCard = ({ className }) => {
  const { shiftRules } = useShiftDashboardStore();

  if (!shiftRules) return null;

  const {
    heading,
    effective_date,
    regularisation,
    policy_count,
    conditions = [],
  } = shiftRules;

  return (
    <div
      className={`bg-white rounded-xl p-4 pb-16 shadow-sm font-[Poppins] flex-1 ${className}`}
    >
      {/* ---------- HEADER ---------- */}
      <div className="flex justify-between items-center pb-3 mb-3 border-b border-gray-200">
        <div className="text-base font-medium text-gray-800">
          {heading || "Shift Rules and Conditions"}
        </div>
        <button className="text-gray-700 flex items-center gap-2 text-sm">
          <FiEdit size={18} /> Edit
        </button>
      </div>

      <div className="space-y-4 overflow-auto">
        {/* ---------- META INFO ---------- */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] font-normal pb-3 border-b border-gray-200 pt-5">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
            <span className="text-gray-600">Effective Date :</span>
            <span className="text-gray-800">{effective_date || "-"}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
            <span className="text-gray-600">Regularization :</span>
            <span className="text-gray-800">{regularisation || "-"}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
            <span className="text-gray-600">Attendance Policy Count :</span>
            <span className="text-gray-800">{policy_count ?? 0} Policy</span>
          </div>
        </div>

        {/* ---------- CONDITIONS ---------- */}
        <div className="space-y-2 pt-1 text-sm font-medium ">
          {conditions.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-3 items-center text-[12px]"
            >
              <span className="text-green-500">{item.count}</span>
              <span className="text-green-500">{item.type}</span>
              <span className="text-red-500">{item.considered_as}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShiftRulesCard;
