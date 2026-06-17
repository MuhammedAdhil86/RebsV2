import React, { useState, useEffect } from "react";
import DashboardLayout from "../ui/pagelayout";
import HeaderGlobal from "../ui/headerglobal"; // ✅ Integrated the global header component
import AllocateShift from "../components/shift_tabs/allocateshift";
import ShiftOverview from "../components/shift_tabs/shiftoverview";
import SwapShift from "../components/shift_tabs/swapshift";

const TabButton = ({ title, isActive, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`pb-1 text-[13px] font-medium transition-all relative ${
      isActive
        ? "text-black font-semibold after:content-[''] after:absolute after:bottom-[-9px] after:left-0 after:w-full after:h-[2px] after:bg-black"
        : "text-gray-500 hover:text-black"
    }`}
  >
    {title}
  </button>
);

export default function ManageEmployeeShifts() {
  // ✅ Lazy initialize active state from localStorage to persist across refreshes
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("manage_shifts_active_tab") || "overview";
  });

  // ✅ Write updated choice to the local storage whenever activeTab switches
  useEffect(() => {
    localStorage.setItem("manage_shifts_active_tab", activeTab);
  }, [activeTab]);

  return (
    <div className="min-h-screen w-full bg-gray-100 flex flex-col">
      <DashboardLayout>
        <div className="w-full space-y-4">
          {/* ✅ Cleanly replaced the hardcoded header element with your reusable navbar component */}
          <HeaderGlobal userName="Admin" />

          <div className="bg-white shadow-sm w-full rounded-lg">
            {/* Tabs Navigation Bar */}
            <div className="flex gap-5 border-b border-gray-200 px-5 py-2 select-none">
              <TabButton
                title="Shift Overview"
                isActive={activeTab === "overview"}
                onClick={() => setActiveTab("overview")}
              />
              <TabButton
                title="Allocate Shift"
                isActive={activeTab === "allocate"}
                onClick={() => setActiveTab("allocate")}
              />
              <TabButton
                title="Swap Shift"
                isActive={activeTab === "swap"}
                onClick={() => setActiveTab("swap")}
              />
            </div>

            {/* Render Context View Panels */}
            <div className="p-4">
              {activeTab === "overview" && <ShiftOverview />}
              {activeTab === "allocate" && <AllocateShift />}
              {activeTab === "swap" && <SwapShift />}
              {activeTab === "deleted" && (
                <div className="text-center p-10 text-gray-500 text-sm">
                  Deleted Employees UI goes here.
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </div>
  );
}
