import React from "react";

const SIZES = {
  sm: "text-xs pb-1.5",
  md: "text-sm pb-2", // default, same as your current buttons
  lg: "text-base pb-2.5",
};

/* Single tab button */
export const TabButton = ({ label, isActive, onClick, size = "md" }) => (
  <button
    type="button"
    onClick={onClick}
    className={`${SIZES[size]} font-medium transition-all relative ${
      isActive ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
    }`}
  >
    {label}
    {isActive && (
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-red-500" />
    )}
  </button>
);

/* Group of tab buttons */
const TabButtonGroup = ({
  tabs,
  activeTab,
  onChange,
  size = "md",
  className = "",
}) => (
  <div className={`flex gap-4 border-b border-gray-200 mb-4 ${className}`}>
    {tabs.map((tab) => {
      // Supports ["Shifts"] and [{ id: "shifts", label: "Shifts" }]
      const id = typeof tab === "string" ? tab : tab.id;
      const label = typeof tab === "string" ? tab : tab.label;

      return (
        <TabButton
          key={id}
          label={label}
          size={size}
          isActive={activeTab === id}
          onClick={() => onChange(id)}
        />
      );
    })}
  </div>
);

export default TabButtonGroup;
