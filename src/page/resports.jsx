import React, { useState, useEffect } from "react";
import { FiBell } from "react-icons/fi";
import DashboardLayout from "../ui/pagelayout";

// Reports
import AttendanceReports from "../components/reports_tab/attendance_reports";
import LeaveReports from "../components/reports/leavereport";
import UnapprovedAbsentReports from "../components/reports_tab/unapprovedleaves_tab";
import PayrollAttendanceReport from "../components/reports_tab/payrollattendancereport";
import AttendanceFineRecordsReport from "../components/reports_tab/finereport_tab";

const avatar =
  "https://ui-avatars.com/api/?name=Admin&background=000000&color=ffffff";

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
    <DashboardLayout userName="Admin" onLogout={() => console.log("Logout")}>
      {/* ================= HEADER ================= */}
      <div className="bg-white pt-4 px-4 pb-0 w-full max-w-full">
        <div className="flex justify-between items-center py-1 border-b border-gray-200 mb-5 flex-wrap gap-4">
          <h1 className="text-[15px] font-semibold text-gray-800">Reports</h1>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-300">
              <FiBell className="text-gray-600 text-lg" />
            </div>

            <button className="text-[13px] text-gray-700 border border-gray-300 px-5 py-1 rounded-full">
              Settings
            </button>

            <div className="w-9 h-9 rounded-full border border-gray-200 overflow-hidden">
              <img
                src={avatar}
                alt="User"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* ================= TABS ================= */}
        <div className="flex gap-6 border-b border-gray-200 overflow-x-auto mb-2">
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
              onClick={() => setActiveTab(tab)}
              className={`pb-2 text-sm whitespace-nowrap ${
                activeTab === tab
                  ? "border-b-2 border-black font-regular text-black"
                  : "text-gray-400"
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
    </DashboardLayout>
  );
}
