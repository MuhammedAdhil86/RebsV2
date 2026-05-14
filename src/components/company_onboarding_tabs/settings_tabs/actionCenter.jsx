import React from "react";
import { Icon } from "@iconify/react";

export default function ActionCenterSection() {
  // Define actions with their specific icons and colors from the image
  const actionList = [
    { label: "Share Profile", icon: "oui:share", bgColor: "bg-[#E0F7FA]" }, // Light Blue
    { label: "Chat", icon: "hugeicons:chat", bgColor: "bg-[#FFE0B2]" },      // Light Orange
    { label: "Resume", icon: "qlementine-icons:resume-16", bgColor: "bg-[#E1E0FF]" }, // Light Purple
    { label: "Terminate", icon: "proicons:checkbox-indeterminate", bgColor: "bg-[#FFABBC]" }, // Light Pink
  ];

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border w-full">
      {/* Header - Icons removed to match the static UI */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-medium text-gray-800 text-[16px]">Action Center</h3>
      </div>

      {/* Actions Grid */}
      <div className="grid grid-cols-4 gap-4 text-center">
        {actionList.map((action) => (
          <div
            key={action.label}
            className="flex flex-col items-center justify-center group cursor-pointer"
          >
            {/* Icon Container: Matching the square-rounded shape and pastel colors */}
            <div
              className={`w-14 h-14 ${action.bgColor} rounded-[18px] flex items-center justify-center transition-transform duration-200 active:scale-95 shadow-sm`}
            >
              <Icon 
                icon={action.icon} 
                className="w-6 h-6 text-gray-700" 
              />
            </div>
            
            {/* Label: Matching the font size and muted gray color */}
            <p className="text-[12px] mt-3 text-gray-500 font-medium leading-tight whitespace-nowrap">
              {action.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}