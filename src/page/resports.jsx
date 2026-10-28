import React, { useState, useMemo } from "react";
import {
  CalendarCheck,
  CalendarOff,
  UserX,
  Wallet,
  Receipt,
  MessageSquare,
  MapPinOff,
  Users,
  Search,
  LayoutGrid,
  ChevronRight,
  X,
} from "lucide-react";

import DashboardLayout from "../ui/pagelayout";
import HeaderGlobal from "../ui/headerglobal";

// Reports
import AttendanceReports from "../components/reports_tab/attendance_reports";
import LeaveReports from "../components/reports/leavereport";
import UnapprovedAbsentReports from "../components/reports_tab/unapprovedleaves_tab";
import PayrollAttendanceReport from "../components/reports_tab/payrollattendancereport";
import AttendanceFineRecordsReport from "../components/reports_tab/finereport_tab";
import FeedbackReports from "../components/reports_tab/feedbacksreports";
import DistanceViolationReport from "../components/reports_tab/distanceviolationreport";
import StaffReport from "../components/reports_tab/staff_report";

/* ------------------------------------------------------------------ */
/* Report catalogue – add / remove reports here only                   */
/* ------------------------------------------------------------------ */
const REPORTS = [
  {
    id: "staff",
    title: "Staff",
    description: "Employee details, roles, departments and contact info.",
    icon: Users,
    tone: "bg-indigo-50 text-indigo-600",
    component: StaffReport,
  },
  {
    id: "attendance",
    title: "Attendance",
    description: "Daily check-in and check-out records for all employees.",
    icon: CalendarCheck,
    tone: "bg-emerald-50 text-emerald-600",
    component: AttendanceReports,
  },
  {
    id: "leave",
    title: "Leave",
    description: "Leave requests, balances and approval history.",
    icon: CalendarOff,
    tone: "bg-sky-50 text-sky-600",
    component: LeaveReports,
  },
  {
    id: "unapproved",
    title: "Unapproved Leaves",
    description: "Absences taken without an approved leave request.",
    icon: UserX,
    tone: "bg-rose-50 text-rose-600",
    component: UnapprovedAbsentReports,
  },
  {
    id: "payroll",
    title: "Payroll Complains",
    description: "Attendance disputes raised against payroll.",
    icon: Wallet,
    tone: "bg-amber-50 text-amber-600",
    component: PayrollAttendanceReport,
  },
  {
    id: "fine",
    title: "Fine",
    description: "Fines applied for late arrival and attendance issues.",
    icon: Receipt,
    tone: "bg-violet-50 text-violet-600",
    component: AttendanceFineRecordsReport,
  },
  {
    id: "feedback",
    title: "Feedback",
    description: "Feedback submitted by employees and customers.",
    icon: MessageSquare,
    tone: "bg-teal-50 text-teal-600",
    component: FeedbackReports,
  },
  {
    id: "distance",
    title: "Distance Violation",
    description: "Check-ins made outside the allowed location radius.",
    icon: MapPinOff,
    tone: "bg-orange-50 text-orange-600",
    component: DistanceViolationReport,
  },
];

/* Poppins Regular only – weight is locked to 400 for every element */
const FONT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400&display=swap');
.reports-root,
.reports-root * {
  font-family: 'Poppins', sans-serif !important;
  font-weight: 400 !important;
}
`;

export default function Reports() {
  const [activeId, setActiveId] = useState(null); // null = grid view
  const [query, setQuery] = useState("");

  const activeReport = REPORTS.find((r) => r.id === activeId);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return REPORTS;
    return REPORTS.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q),
    );
  }, [query]);

  const openReport = (id) => setActiveId(id);
  const backToGrid = () => setActiveId(null);

  return (
    <DashboardLayout>
      <style>{FONT_CSS}</style>

      <div className="reports-root w-full">
        <HeaderGlobal userName="Admin" />

        {/* ======================= TABLE VIEW ======================= */}
        {activeReport ? (
          <div className="w-full max-w-[1800px] mx-auto">
            <nav
              aria-label="Breadcrumb"
              className="bg-white rounded-lg shadow-sm px-4 py-3 flex items-center gap-3"
            >
              <button
                type="button"
                onClick={backToGrid}
                title="Back to all reports"
                className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-black transition-colors"
              >
                <LayoutGrid size={16} strokeWidth={1.5} />
                Reports
              </button>

              <span className="text-gray-300 select-none">/</span>

              <span className="text-sm text-black truncate">
                {activeReport.title}
              </span>
            </nav>

            <div className="rounded-2xl p-2 overflow-auto min-h-[567px] w-full">
              <activeReport.component />
            </div>
          </div>
        ) : (
          /* ======================= GRID VIEW ======================= */
          <div className="w-full max-w-[1800px] mx-auto">
            {/* Title + search */}
            <div className="bg-white rounded-lg shadow-sm px-5 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-lg text-gray-900">Reports</h1>
                <p className="text-sm text-gray-400">
                  Select a report to view its data.
                </p>
              </div>

              <div className="relative w-full sm:w-80">
                <Search
                  size={16}
                  strokeWidth={1.5}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search reports"
                  className="w-full rounded-md border border-gray-200 bg-white py-2 pl-9 pr-9 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition-colors focus:border-gray-400"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-black"
                  >
                    <X size={14} strokeWidth={1.5} />
                  </button>
                )}
              </div>
            </div>

            {/* Grid */}
            <div className="p-2 mt-2 min-h-[567px]">
              {filtered.length > 0 ? (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filtered.map((report) => {
                    const Icon = report.icon;
                    return (
                      <button
                        key={report.id}
                        type="button"
                        onClick={() => openReport(report.id)}
                        className="group text-left bg-white rounded-xl border border-gray-100 p-5 shadow-sm transition-all hover:border-gray-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                      >
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-lg ${report.tone}`}
                        >
                          <Icon size={22} strokeWidth={1.5} />
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-2">
                          <span className="text-[15px] text-gray-900">
                            {report.title}
                          </span>
                          <ChevronRight
                            size={16}
                            strokeWidth={1.5}
                            className="text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-700"
                          />
                        </div>

                        <p className="mt-1 text-sm leading-relaxed text-gray-400">
                          {report.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                    <Search size={20} strokeWidth={1.5} />
                  </div>
                  <p className="mt-4 text-gray-800">No reports found</p>
                  <p className="mt-1 text-sm text-gray-400">
                    Nothing matches “{query}”. Try a different name.
                  </p>
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="mt-4 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-black transition-colors"
                  >
                    Clear search
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
