import React, { useState, useEffect } from "react";
import DashboardLayout from "../ui/pagelayout";
import HeaderGlobal from "../ui/headerglobal";
import PhysicalAssetTab from "../components/asset/physicalassets";
import DigitalAssetTab from "../components/asset/digitalasset";

function AssetManager() {
  // Initialize state directly from localStorage, fallback to "physical" if empty
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("asset_manager_active_tab") || "physical";
  });

  // Save the tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("asset_manager_active_tab", activeTab);
  }, [activeTab]);

  return (
    <DashboardLayout>
      <div className="w-full space-y-4 font-['Poppins',sans-serif] font-normal">
        {/* Global Navbar Header */}
        <HeaderGlobal userName="Admin" />

        {/* Shared Tab Navigation */}
        <div className="flex gap-2 border-b border-gray-100 px-4 pt-2 text-[14px] bg-white shadow-sm rounded-t-xl select-none font-['Poppins',sans-serif] font-normal">
          <button
            type="button"
            onClick={() => setActiveTab("physical")}
            className={`relative px-4 pt-2 pb-3 rounded-t-lg font-['Poppins',sans-serif] font-normal tracking-wide transition-all duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 ${
              activeTab === "physical"
                ? "text-indigo-600 bg-indigo-50/70 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:rounded-full after:bg-indigo-600"
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
            }`}
          >
            Asset Manager
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("digital")}
            className={`relative px-4 pt-2 pb-3 rounded-t-lg font-['Poppins',sans-serif] font-normal tracking-wide transition-all duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 ${
              activeTab === "digital"
                ? "text-indigo-600 bg-indigo-50/70 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:rounded-full after:bg-indigo-600"
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
            }`}
          >
            Digital Assets
          </button>
        </div>

        {/* Render Tab Contents */}
        <div className="mt-2">
          {activeTab === "physical" ? (
            <PhysicalAssetTab />
          ) : (
            <DigitalAssetTab />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default AssetManager;
