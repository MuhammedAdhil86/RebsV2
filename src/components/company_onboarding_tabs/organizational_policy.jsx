import React, { useState } from "react";

/* Sub-Tab Components */
import Shifts from "./workshifts/shifts";
import AttendancePolicy from "./workshifts/attendancepolicy";
import LeavesAndVacations from "./leaves_and_vacations/leavepolicy";
import WeekendsAndOffDays from "./leaves_and_vacations/weeklyoff";

import Holidays from "./leaves_and_vacations/holidays";

/* Imported Employee Code Sub-Component */
import EmployeeCodeConfig from "./leaves_and_vacations/employeecodeconfig";

/* Layout Setup Sub-Component */
import LayoutSetup from "./email_layout/layoutsetup";

/* KPI Configuration Sub-Component */
import KpiConfiguration from "./kpi/kpiconfiguration";

/* Reusable TabsSwitch Component */
import TabsSwitch from "../../ui/tabswitch";

const OrganizationalPolicy = () => {
  /* API Data Payload */
  const employeeCodeData = {
    id: 6,
    rule_name: "Employee Code",
    code: "EMP",
    color: "#3B82F6",
    starting_number: 1,
    placeholder_digits: 4,
    prefixes: ["EMP", "STAFF"],
    suffixes: ["2026", "IND"],
    reuse_starting_number: false,
    created_at: "2026-08-12T10:16:54.501616Z",
  };

  /* ----------------- Main Tabs ----------------- */
  const tabs = [
    { id: "work-shift", label: "Work Shift" },
    { id: "leaves-holidays", label: "Leaves & Holidays" },
    { id: "employee-code", label: "Employee Code" },
    { id: "layout-setup", label: "Layout Setup" },
    { id: "kpi-configuration", label: "KPI Configuration" },
  ];

  /* ----------------- Sub-Tabs States ----------------- */
  const [activeWorkShiftTab, setActiveWorkShiftTab] = useState("Shifts");
  const [activeLeaveTab, setActiveLeaveTab] = useState("Leave Policy");
  const [activeEmailTab, setActiveEmailTab] = useState("Email Template");
  const [activeLayoutTab, setActiveLayoutTab] = useState("Email Layout");

  /* ----------------- Render Content for Active Tab ----------------- */
  const renderTabContent = (activeTab) => (
    <div className="rounded-2xl p-1">
      {/* ===== WORK SHIFT ===== */}
      {activeTab === "work-shift" && (
        <>
          <div className="flex gap-4 border-b border-gray-200 mb-4">
            {["Shifts", "Attendance Policy"].map((subTab) => (
              <button
                key={subTab}
                onClick={() => setActiveWorkShiftTab(subTab)}
                className={`pb-2 text-sm font-medium transition-all relative ${
                  activeWorkShiftTab === subTab
                    ? "text-gray-900"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {subTab}
                {activeWorkShiftTab === subTab && (
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-red-500" />
                )}
              </button>
            ))}
          </div>
          <div>
            {activeWorkShiftTab === "Shifts" && <Shifts />}
            {activeWorkShiftTab === "Attendance Policy" && <AttendancePolicy />}
          </div>
        </>
      )}

      {/* ===== LEAVES & HOLIDAYS ===== */}
      {activeTab === "leaves-holidays" && (
        <>
          <div className="flex gap-4 border-b border-gray-200 mb-4">
            {["Leave Policy", "WeeklyOff", "Holidays"].map((subTab) => (
              <button
                key={subTab}
                onClick={() => setActiveLeaveTab(subTab)}
                className={`pb-2 text-sm font-medium transition-all relative ${
                  activeLeaveTab === subTab
                    ? "text-gray-900"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {subTab}
                {activeLeaveTab === subTab && (
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-red-500" />
                )}
              </button>
            ))}
          </div>
          <div>
            {activeLeaveTab === "Leave Policy" && <LeavesAndVacations />}
            {activeLeaveTab === "WeeklyOff" && <WeekendsAndOffDays />}
            {activeLeaveTab === "Holidays" && <Holidays />}
          </div>
        </>
      )}

      {/* ===== EMPLOYEE CODE ===== */}
      {activeTab === "employee-code" && (
        <EmployeeCodeConfig initialData={employeeCodeData} />
      )}

      {/* ===== LAYOUT SETUP ===== */}
      {activeTab === "layout-setup" && (
        <>
          <LayoutSetup activeSubTab={activeLayoutTab} />
        </>
      )}

      {/* ===== KPI CONFIGURATION ===== */}
      {activeTab === "kpi-configuration" && <KpiConfiguration />}

      {/* ===== OTHER PLACEHOLDERS ===== */}
      {![
        "work-shift",
        "leaves-holidays",
        "employee-code",
        "layout-setup",
        "kpi-configuration",
      ].includes(activeTab) && (
        <div className="py-10 text-center text-gray-400 italic">
          {tabs.find((t) => t.id === activeTab)?.label} content is under
          development.
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full bg-[#fcfcfc] min-h-screen p-2">
      <TabsSwitch
        tabs={tabs}
        initialTab="work-shift"
        renderTabContent={renderTabContent}
      />
    </div>
  );
};

export default OrganizationalPolicy;
