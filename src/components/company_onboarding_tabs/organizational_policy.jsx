import React, { useState } from "react";

/* Sub-Tab Components */
import Shifts from "./workshifts/shifts";
import ShiftBulkAllocation from "./workshifts/shiftbulkallocation";
import AttendancePolicy from "./workshifts/attendancepolicy";
import LeavesAndVacations from "./leaves_and_vacations/leavepolicy";
import WeekendsAndOffDays from "./leaves_and_vacations/weeklyoff";
import EmailTemplates from "./email_template/emailtemplate";
// Assuming you have a Holidays component or want to render a placeholder

/* Reusable TabsSwitch Component */
import TabsSwitch from "../../ui/tabswitch";
import Holidays from "./leaves_and_vacations/holidays";

const OrganizationalPolicy = () => {
  /* ----------------- Main Tabs ----------------- */
  const tabs = [
    { id: "work-shift", label: "Work Shift" },
    { id: "leaves-holidays", label: "Leaves & Holidays" },
    { id: "letter-templates", label: "Letter Templates" },
    { id: "email-templates", label: "Email Templates" },
    { id: "staff-onboarding", label: "Staff Onboarding" },
    { id: "employee-code", label: "Employee Code" },
    // Removed "Holidays" from here since it's now a sub-tab
  ];

  /* ----------------- Sub-Tabs States ----------------- */
  const [activeWorkShiftTab, setActiveWorkShiftTab] = useState("Shifts");
  const [activeLeaveTab, setActiveLeaveTab] = useState("Leave Policy");
  const [activeEmailTab, setActiveEmailTab] = useState("Email Template");

  /* ----------------- Render Content for Active Tab ----------------- */
  const renderTabContent = (activeTab) => (
    <div className="rounded-2xl p-1">
      {/* ===== WORK SHIFT ===== */}
      {activeTab === "work-shift" && (
        <>
          <div className="flex gap-4 border-b border-gray-200 mb-4">
            {["Shifts", "Shift Bulk Allocation", "Attendance Policy"].map(
              (subTab) => (
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
              ),
            )}
          </div>
          <div>
            {activeWorkShiftTab === "Shifts" && <Shifts />}
            {activeWorkShiftTab === "Shift Bulk Allocation" && (
              <ShiftBulkAllocation />
            )}
            {activeWorkShiftTab === "Attendance Policy" && <AttendancePolicy />}
          </div>
        </>
      )}

      {/* ===== LEAVES & HOLIDAYS ===== */}
      {activeTab === "leaves-holidays" && (
        <>
          <div className="flex gap-4 border-b border-gray-200 mb-4">
            {/* Added "Holidays" to this array */}
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
            {/* Logic to render Holidays content */}
            {activeLeaveTab === "Holidays" && <Holidays />}
          </div>
        </>
      )}

      {/* ===== EMAIL TEMPLATES ===== */}
      {activeTab === "email-templates" && (
        <>
          <div className="flex gap-4 border-b border-gray-200 mb-4">
            {["Email Template"].map((subTab) => (
              <button
                key={subTab}
                onClick={() => setActiveEmailTab(subTab)}
                className={`pb-2 text-sm font-medium transition-all relative ${
                  activeEmailTab === subTab
                    ? "text-gray-900"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {subTab}
                {activeEmailTab === subTab && (
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-red-500" />
                )}
              </button>
            ))}
          </div>
          <div>{activeEmailTab === "Email Template" && <EmailTemplates />}</div>
        </>
      )}

      {/* ===== OTHER PLACEHOLDERS ===== */}
      {!["work-shift", "leaves-holidays", "email-templates"].includes(
        activeTab,
      ) && (
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
