import React, { useState } from "react";
import DashboardLayout from "../ui/pagelayout";
import PhysicalAssetTab from "../components/asset/physicalassets";
import DigitalAssetTab from "../components/asset/digitalasset";

function AssetManager() {
  const [activeTab, setActiveTab] = useState("physical");

  return (
    <DashboardLayout userName="Admin">
      {/* Shared Tab Navigation */}
      <div className="flex gap-4 border-b px-4 text-[14px] mb-4 bg-white/50 pt-2 shadow-sm rounded-t-lg">
        <button
          onClick={() => setActiveTab("physical")}
          className={`pb-2 px-2 transition-all relative ${
            activeTab === "physical"
              ? "text-black after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-black"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          Asset Manager
        </button>
        <button
          onClick={() => setActiveTab("digital")}
          className={`pb-2 px-2 transition-all relative ${
            activeTab === "digital"
              ? "text-black after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-black"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          Digital Assets
        </button>
      </div>

      {/* Render the specific file based on tab selection */}
      <div className="mt-2">
        {activeTab === "physical" ? <PhysicalAssetTab /> : <DigitalAssetTab />}
      </div>
    </DashboardLayout>
  );
}

export default AssetManager;
