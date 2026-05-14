import React, { useState } from "react";
import { FiBell } from "react-icons/fi";
import DashboardLayout from "../ui/pagelayout";
import AllocateShift from "../components/shift_tabs/allocateshift";
import ShiftOverview from "../components/shift_tabs/shiftoverview"; // ✅ Added import

// ✅ Online avatar
const avatar = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

const TabButton = ({ title, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`pb-1 text-[13px] font-medium transition-all ${
      isActive
        ? "border-b-2 border-black text-black"
        : "text-gray-500 hover:text-black"
    }`}
  >
    {title}
  </button>
);

export default function ManageEmployeeShifts() {
  const [activeTab, setActiveTab] = useState("overview"); // ✅ Default = Shift Overview

  return (
    <div className="min-h-screen w-full bg-gray-100 flex flex-col">
      <DashboardLayout>
        <div className="w-full">
          <div className="bg-white shadow-sm w-full rounded-lg">
            {/* Header */}
            <div className="flex justify-between items-center px-5 py-3 border-b border-gray-200">
              <h1 className="text-[15px] font-medium text-gray-800">
                Manage Employee Shift
              </h1>
              <div className="flex items-center gap-3">
                <FiBell className="text-gray-500 text-lg" />
                <button className="text-[13px] text-gray-700">Settings</button>
                <div className="w-8 h-8 rounded-full overflow-hidden border">
                  <img
                    src={avatar}
                    alt="User"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-5   border-b border-gray-200 px-5 py-2">
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
              <TabButton
                title="Deleted Employees"
                isActive={activeTab === "deleted"}
                onClick={() => setActiveTab("deleted")}
              />
            </div>

            {/* Content */}
            <div className="">
              {activeTab === "overview" && <ShiftOverview />} {/* ✅ Imported component */}
              {activeTab === "allocate" && <AllocateShift />}
              {activeTab === "swap" && (
                <div className="text-center p-10 text-gray-500 text-sm">
                  Swap Shift UI goes here.
                </div>
              )}
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
