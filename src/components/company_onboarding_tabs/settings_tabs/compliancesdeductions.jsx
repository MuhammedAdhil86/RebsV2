import React, { useState } from "react";
import { Icon } from "@iconify/react";

// Toggle component
const Toggle = ({ enabled, onToggle, disabled }) => (
  <div
    onClick={() => !disabled && onToggle()}
    className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer ${
      enabled ? "bg-[#2c2b2f]" : "bg-gray-300"
    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
  >
    <div
      className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform duration-200 ${
        enabled ? "translate-x-5" : "translate-x-0"
      }`}
    ></div>
  </div>
);

export default function CompliancesSection() {
  const complianceItems = [
    "Employee Provident Fund",
    "ESI",
    "Professional Tax",
    "TDS",
    "Labour Welfare Fund",
  ];

  const [toggles, setToggles] = useState(
    complianceItems.reduce((acc, item) => ({ ...acc, [item]: true }), {}),
  );
  const [isEditing, setIsEditing] = useState(false);

  const handleToggle = (item) => {
    setToggles((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  const handleSave = () => {
    console.log("Saved compliances:", toggles);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-800 text-[14px]">
          Compliances & Deductions
        </h3>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <button
              onClick={handleSave}
              className="text-sm text-blue-600 font-medium hover:underline"
            >
              Save
            </button>
          ) : (
            <Icon
              icon="basil:edit-outline"
              className="w-5 h-5 text-gray-400 cursor-pointer"
              onClick={() => setIsEditing(true)}
            />
          )}
        </div>
      </div>

      {/* Compliances List */}
      <div className="text-sm space-y-2">
        {complianceItems.map((item) => (
          <div
            key={item}
            className="flex justify-between items-center border-b border-gray-100 py-2"
          >
            <span className="text-gray-500 text-[12px]">{item}</span>
            <Toggle
              enabled={toggles[item]}
              onToggle={() => handleToggle(item)}
              disabled={!isEditing}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
