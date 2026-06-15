import React, { useState, useEffect, useRef } from "react";
import { DropdownMenuIcon } from "@radix-ui/react-icons";
import useShiftDashboardStore from "../../../store/shiftoverviewStore";

const RegularShiftPolicyCard = ({ className }) => {
  const dropdownRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const { policyDetails, changePolicy } = useShiftDashboardStore();

  const selectedPolicy = policyDetails?.selected_policy;
  const availablePolicies = policyDetails?.available_policies || [];

  /* --- Dismiss Dropdown UI Elements on Outside Frame Clicks --- */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!selectedPolicy) return null;

  return (
    <div
      className={`bg-white rounded-xl p-4 shadow-sm flex-1 relative ${className}`}
    >
      {/* ---------- HEADER WITH INTERNAL RADIX REPLACEMENT ---------- */}
      <div className="flex justify-between items-center mb-4">
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="text-[14px] text-gray-800 font-medium flex items-center gap-1 hover:text-gray-600 transition-colors"
          >
            {selectedPolicy.policy_name || "Regular Shift Policy Details"}
            <DropdownMenuIcon className="w-5 h-5 text-gray-500" />
          </button>

          {/* ---------- ACCORDION SELECT MENU DROPDOWN LIST ---------- */}
          {isOpen && availablePolicies.length > 0 && (
            <div className="absolute top-6 left-0 w-56 bg-white border border-gray-100 rounded-lg shadow-xl z-[999] py-1">
              {availablePolicies.map((policy) => (
                <button
                  key={policy.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation(); // Fixed element click layout bubble cascade leak
                    changePolicy(policy.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-xs hover:bg-gray-50 transition-colors block ${
                    selectedPolicy.policy_name === policy.policy_name
                      ? "bg-blue-50 font-semibold text-blue-600"
                      : "text-gray-700"
                  }`}
                >
                  {policy.policy_name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ---------- DATACELL DETAILS GRID LAYOUT ---------- */}
      <div className="space-y-3 text-sm overflow-auto">
        <div className="flex justify-between">
          <span className="text-gray-500 text-[12px]">Total Work hours</span>
          <span className="font-medium text-gray-800 text-[12px]">
            {selectedPolicy.total_working_hours
              ? selectedPolicy.total_working_hours.substring(0, 5)
              : "--:--"}{" "}
            hrs
          </span>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg space-y-2 border border-gray-100">
          <div className="flex justify-between">
            <span className="text-green-600 font-medium text-[12px]">IN</span>
            <span className="font-medium text-[12px] text-gray-800">
              {selectedPolicy.in_time
                ? selectedPolicy.in_time.substring(0, 5)
                : "--:--"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-red-500 font-medium text-[12px]">OUT</span>
            <span className="font-medium text-gray-800 text-[12px]">
              {selectedPolicy.out_time
                ? selectedPolicy.out_time.substring(0, 5)
                : "--:--"}
            </span>
          </div>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500 text-[12px]">Break</span>
          <span className="font-medium text-gray-800 text-[12px]">
            {selectedPolicy.break_time}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500 text-[12px]">Delay</span>
          <span className="font-medium text-gray-800 text-[12px]">
            {selectedPolicy.delay
              ? selectedPolicy.delay.substring(0, 5)
              : "--:--"}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-yellow-600 font-medium text-[12px]">Late</span>
          <span className="font-medium text-gray-800 text-[12px]">
            {selectedPolicy.late
              ? selectedPolicy.late.substring(0, 5)
              : "--:--"}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-red-500 font-medium text-[12px]">Half Day</span>
          <span className="font-medium text-gray-800 text-[12px]">
            {selectedPolicy.half_day
              ? selectedPolicy.half_day.substring(0, 5)
              : "--:--"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RegularShiftPolicyCard;
