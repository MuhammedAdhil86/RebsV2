import React, { useState } from "react";

export default function TabsSwitch({
  tabs = [],
  initialTab,
  renderTabContent,
  extraButtons,
}) {
  const [activeTab, setActiveTab] = useState(
    initialTab || (tabs.length > 0 ? tabs[0].id : ""),
  );

  const tabButtonClasses =
    "px-3 h-[30px] text-xs rounded-md border font-medium transition-all flex items-center justify-center";

  return (
    <div>
      <div className="flex justify-between items-center mb-5 flex-wrap gap-1">
        <div className="flex flex-wrap gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${tabButtonClasses} ${
                activeTab === tab.id
                  ? "bg-black text-white border-black"
                  : "border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {typeof extraButtons === "function" &&
          extraButtons(activeTab, tabButtonClasses)}
      </div>
      <div>{renderTabContent(activeTab)}</div>
    </div>
  );
}
