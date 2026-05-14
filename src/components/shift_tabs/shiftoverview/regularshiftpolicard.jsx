// src/components/shifts/RegularShiftPolicyCard.jsx
import React from "react";
import { FiMenu } from "react-icons/fi";
import useShiftDashboardStore from "../../../store/shiftoverviewStore";

const RegularShiftPolicyCard = ({ className }) => {
  const { policyDetails } = useShiftDashboardStore();
  const p = policyDetails?.selected_policy;

  if (!p) return null;

  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm flex-1 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <div className="text-[14px] text-gray-800">
          Regular Shift Policy Details
        </div>
        <button className="text-gray-400">
          <FiMenu size={20} />
        </button>
      </div>

      <div className="space-y-3 text-sm overflow-auto">
        <div className="flex justify-between">
          <span className="text-gray-500">Total Work hours</span>
          <span className="font-medium text-gray-800">
            {p.total_working_hours} hrs
          </span>
        </div>

        <div className="bg-gray-100 p-3 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="text-green-600 font-medium text-[12px]">IN</span>
            <span className="font-medium text-[12px] text-gray-800">
              {p.in_time}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-red-500 font-medium text-[12px]">OUT</span>
            <span className="font-medium text-gray-800 text-[12px]">
              {p.out_time}
            </span>
          </div>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500 text-[12px]">Break</span>
          <span className="font-medium text-gray-800 text-[12px]">
            {p.break_time}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500 text-[12px]">Delay</span>
          <span className="font-medium text-gray-800 text-[12px]">
            {p.delay}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-yellow-600 font-medium text-[12px]">Late</span>
          <span className="font-medium text-gray-800 text-[12px]">
            {p.late}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-red-500 font-medium text-[12px]">Half Day</span>
          <span className="font-medium text-gray-800 text-[12px]">
            {p.half_day}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RegularShiftPolicyCard;
