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
      <div className="w-full space-y-4">
        {/* Global Navbar Header */}
        <HeaderGlobal userName="Admin" />

        {/* Shared Tab Navigation */}
        <div className="flex gap-4 border-b px-4 text-[14px] bg-white pt-2 shadow-sm rounded-t-lg select-none">
          <button
            type="button"
            onClick={() => setActiveTab("physical")}
            className={`pb-2 px-2 transition-all relative font-medium ${
              activeTab === "physical"
                ? "text-black after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-black font-semibold"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Asset Manager
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("digital")}
            className={`pb-2 px-2 transition-all relative font-medium ${
              activeTab === "digital"
                ? "text-black after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-black font-semibold"
                : "text-gray-400 hover:text-gray-600"
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
