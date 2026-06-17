import React, { useState, useEffect } from "react";
import DashboardLayout from "../ui/pagelayout";
import HeaderGlobal from "../ui/headerglobal"; // ✅ Imported global navbar layout component

// Reports
import AttendanceReports from "../components/reports_tab/attendance_reports";
import LeaveReports from "../components/reports/leavereport";
import UnapprovedAbsentReports from "../components/reports_tab/unapprovedleaves_tab";
import PayrollAttendanceReport from "../components/reports_tab/payrollattendancereport";
import AttendanceFineRecordsReport from "../components/reports_tab/finereport_tab";

export default function Reports() {
  // ✅ Lazy-initialize state from localStorage to prevent flash of wrong default tab on reload
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("activeReportTab") || "Attendance Reports";
  });

  // ✅ Write active tab transformations natively back to localStorage cache memory
  useEffect(() => {
    localStorage.setItem("activeReportTab", activeTab);
  }, [activeTab]);

  const renderTab = () => {
    switch (activeTab) {
      case "Attendance Reports":
        return <AttendanceReports />;

      case "Leave Reports":
        return <LeaveReports />;

      case "Unapproved Leaves":
        return <UnapprovedAbsentReports />;

      case "Payroll Attendance Report":
        return <PayrollAttendanceReport />;

      case "Fine Reports":
        return <AttendanceFineRecordsReport />;

      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="w-full ">
        {/* ✅ Replaced raw header structure with global shared navbar element */}
        <HeaderGlobal userName="Admin" />

        {/* ================= TABS ================= */}
        <div className="bg-white pt-4 px-4 rounded-lg shadow-sm">
          <div className="flex gap-6 border-b border-gray-200 overflow-x-auto pb-1 select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[
              "Attendance Reports",
              "Leave Reports",
              "Unapproved Leaves",
              "Payroll Attendance Report",
              "Fine Reports",
              "Compliance Reports",
              "Miscellaneous Reports",
            ].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`pb-2 text-sm whitespace-nowrap transition-all relative ${
                  activeTab === tab
                    ? "text-black after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-black"
                    : "text-gray-400 hover:text-black"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* ================= CONTENT ================= */}
        <div className="rounded-2xl p-2 overflow-auto min-h-[567px] w-full max-w-[1800px] mx-auto">
          {renderTab()}
        </div>
      </div>
    </DashboardLayout>
  );
}
