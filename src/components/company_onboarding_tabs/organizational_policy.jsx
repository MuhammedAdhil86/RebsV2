import React, { useState } from "react";

/* Sub-Tab Components */
import Shifts from "./workshifts/shifts";
import AttendancePolicy from "./workshifts/attendancepolicy";
import LeavesAndVacations from "./leaves_and_vacations/leavepolicy";
import LeaveConfiguration from "./leaves_and_vacations/leaveconfiguration";
import WeekendsAndOffDays from "./leaves_and_vacations/weeklyoff";
import Holidays from "./leaves_and_vacations/holidays";

/* Employee Code Sub-Component */
import EmployeeCodeConfig from "./leaves_and_vacations/employeecodeconfig";

/* Layout Setup Sub-Component */
import LayoutSetup from "./email_layout/layoutsetup";

/* KPI Configuration Sub-Component */
import KpiConfiguration from "./kpi/kpiconfiguration";

/* Payroll Configuration Sub-Component */
import PayrollConfiguration from "./payrollpolicy_tabs/payrollconfiguration";

/* Reusable TabsSwitch Component */
import TabsSwitch from "../../ui/tabswitch";

/* Reusable Tab Button Group */
import TabButtonGroup from "../../ui/button/tab_button";

const OrganizationalPolicy = () => {
  /* ----------------- API Data Payload ----------------- */
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
    { id: "leave-configuration", label: "Leave Configuration" },
    { id: "payroll-configuration", label: "Payroll Configuration" },
  ];

  /* ----------------- Sub-Tabs States ----------------- */
  const [activeWorkShiftTab, setActiveWorkShiftTab] = useState("Shifts");
  const [activeLeaveTab, setActiveLeaveTab] = useState("Leave Policy");
  const [activeLayoutTab, setActiveLayoutTab] = useState("Email Layout");

  /* ----------------- Render Content for Active Tab ----------------- */
  const renderTabContent = (activeTab) => (
    <div className="rounded-2xl p-1">
      {/* ===== WORK SHIFT ===== */}
      {activeTab === "work-shift" && (
        <>
          <TabButtonGroup
            tabs={["Shifts", "Attendance Policy"]}
            activeTab={activeWorkShiftTab}
            onChange={setActiveWorkShiftTab}
          />

          <div>
            {activeWorkShiftTab === "Shifts" && <Shifts />}
            {activeWorkShiftTab === "Attendance Policy" && <AttendancePolicy />}
          </div>
        </>
      )}

      {/* ===== LEAVES & HOLIDAYS ===== */}
      {activeTab === "leaves-holidays" && (
        <>
          <TabButtonGroup
            tabs={["Leave Policy", "WeeklyOff", "Holidays"]}
            activeTab={activeLeaveTab}
            onChange={setActiveLeaveTab}
          />

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
        <LayoutSetup activeSubTab={activeLayoutTab} />
      )}

      {/* ===== KPI CONFIGURATION ===== */}
      {activeTab === "kpi-configuration" && <KpiConfiguration />}

      {/* ===== LEAVE CONFIGURATION ===== */}
      {activeTab === "leave-configuration" && <LeaveConfiguration />}

      {/* ===== PAYROLL CONFIGURATION ===== */}
      {activeTab === "payroll-configuration" && <PayrollConfiguration />}

      {/* ===== OTHER PLACEHOLDERS ===== */}
      {![
        "work-shift",
        "leaves-holidays",
        "employee-code",
        "layout-setup",
        "kpi-configuration",
        "leave-configuration",
        "payroll-configuration",
      ].includes(activeTab) && (
        <div className="py-10 text-center text-gray-400 italic">
          {tabs.find((t) => t.id === activeTab)?.label} content is under
          development.
        </div>
      )}
    </div>
  );

  /* ----------------- Main Render ----------------- */
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
