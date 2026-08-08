import React, { useState, useEffect } from "react";
import DashboardLayout from "../ui/pagelayout";
import HeaderGlobal from "../ui/headerglobal";
import MyTimeSheet from "../components/timesheet/mytimesheet";
import EmployeeTimeSheet from "../components/timesheet/employeetimesheet";

const TABS = [
  { id: "employees_timesheets", label: "Employees TimeSheets" },
  { id: "my_timesheet", label: "My TimeSheet" },
];

export default function TimeSheet() {
  const [activeTab, setActiveTab] = useState(() => {
    return (
      localStorage.getItem("timesheet_active_tab") || "employees_timesheets"
    );
  });

  useEffect(() => {
    localStorage.setItem("timesheet_active_tab", activeTab);
  }, [activeTab]);

  return (
    <DashboardLayout userName="Admin" onLogout={() => {}}>
      <div className="w-full space-y-4 font-poppins font-normal text-gray-700 text-sm">
        {/* Global Header */}
        <HeaderGlobal userName="Admin" />

        {/* Navigation Tab Links Header Layout */}
        <div
          role="tablist"
          className="flex gap-4 border-b px-4 text-[14px] bg-white pt-2 shadow-sm rounded-t-lg select-none overflow-x-auto"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-2 px-1 transition-all relative font-normal whitespace-nowrap ${
                  isActive
                    ? "text-black font-normal after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-black"
                    : "text-gray-500 hover:text-black"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Display */}
        <div className="mt-2">
          {activeTab === "employees_timesheets" && <EmployeeTimeSheet />}
          {activeTab === "my_timesheet" && <MyTimeSheet />}
        </div>
      </div>
    </DashboardLayout>
  );
}
