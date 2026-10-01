import React, { useState, useEffect } from "react";
import { fetchTeamTimesheets } from "../../service/timesheetservice";
import useEmployeeStore from "../../store/employeeStore";

import EmployeeTimeSheetFilter from "./employeetimesheetfilter";
import EmployeeTimeSheetSummary from "./employeetimesheetsummary";
import EmployeeTimeSheetEntriesList from "./employeetimesheetentries";

// Local-time YYYY-MM-DD (no UTC shift)
const getTodayFormatted = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function EmployeeTimeSheet() {
  // Employee dropdown data (GET /staff/get-active-users-light)
  const lightUsers = useEmployeeStore((s) => s.lightUsers);
  const lightLoading = useEmployeeStore((s) => s.lightLoading);
  const fetchLightUsers = useEmployeeStore((s) => s.fetchLightUsers);

  // Filter States
  const [viewBy, setViewBy] = useState("Date");
  const [selectedDate, setSelectedDate] = useState(getTodayFormatted());
  const [selectedMonth, setSelectedMonth] = useState(
    String(new Date().getMonth() + 1),
  );
  const [selectedWeek, setSelectedWeek] = useState("1");
  const [selectedEmployee, setSelectedEmployee] = useState("all"); // "all" or a user uuid

  // API Data States
  const [timesheetData, setTimesheetData] = useState([]);
  const [summary, setSummary] = useState({
    fromDate: "—",
    toDate: "—",
    totalEmployees: 0,
    totalHours: "0h 0m",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Accordion Expand/Collapse State
  const [openSections, setOpenSections] = useState({});

  // 1. Fetch the employee list once on mount
  useEffect(() => {
    fetchLightUsers();
  }, [fetchLightUsers]);

  // 2. Fetch timesheet data
  const loadTimesheetData = async (overrideParams = null) => {
    setLoading(true);
    setError(null);

    let params = {};
    const activeView = (overrideParams?.viewBy || viewBy).toLowerCase();
    const emp = overrideParams?.selectedEmployee || selectedEmployee;

    params.view = activeView;

    if (activeView === "month") {
      params.month = overrideParams?.selectedMonth || selectedMonth;
    } else if (activeView === "week") {
      params.month = overrideParams?.selectedMonth || selectedMonth;
      params.week = overrideParams?.selectedWeek || selectedWeek;
    } else if (activeView === "date") {
      params.date = overrideParams?.selectedDate || selectedDate;
    }

    // Selected employee's uuid from the light users list
    if (emp && emp !== "all") {
      params.employee_id = emp; // change the key if your API expects another name
    }

    console.log("📤 Team timesheet params:", params);

    try {
      const data = await fetchTeamTimesheets(params);
      console.log("📥 Team timesheet response:", data);

      setSummary({
        fromDate: data.from_date || "—",
        toDate: data.to_date || "—",
        totalEmployees: data.total_employees || 0,
        totalHours: data.total_hours || "0h 0m",
      });

      const datesList = data.dates || [];
      setTimesheetData(datesList);

      const initialOpenState = {};
      datesList.forEach((group) => {
        initialOpenState[group.work_date] = true;
      });
      setOpenSections(initialOpenState);
    } catch (err) {
      console.error("Error loading team timesheet data:", err);
      setTimesheetData([]);
      setError("Failed to fetch employee timesheets. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimesheetData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyFilters = () => {
    loadTimesheetData();
  };

  const handleResetFilters = () => {
    const defaults = {
      viewBy: "Date",
      selectedDate: getTodayFormatted(),
      selectedMonth: String(new Date().getMonth() + 1),
      selectedWeek: "1",
      selectedEmployee: "all",
    };

    setViewBy(defaults.viewBy);
    setSelectedDate(defaults.selectedDate);
    setSelectedMonth(defaults.selectedMonth);
    setSelectedWeek(defaults.selectedWeek);
    setSelectedEmployee(defaults.selectedEmployee);

    loadTimesheetData(defaults);
  };

  const toggleSection = (date) => {
    setOpenSections((prev) => ({ ...prev, [date]: !prev[date] }));
  };

  // Convert UTC ISO string to 24-Hour HH:MM:SS format
  const formatIsoTime = (isoString) => {
    if (!isoString) return "—";
    try {
      const date = new Date(isoString);
      const hours = String(date.getUTCHours()).padStart(2, "0");
      const minutes = String(date.getUTCMinutes()).padStart(2, "0");
      const seconds = String(date.getUTCSeconds()).padStart(2, "0");
      return `${hours}:${minutes}:${seconds}`;
    } catch {
      return "—";
    }
  };

  return (
    <div className="w-full space-y-4 font-poppins font-normal text-gray-700 text-sm">
      <EmployeeTimeSheetFilter
        selectedEmployee={selectedEmployee}
        setSelectedEmployee={setSelectedEmployee}
        employeeOptions={lightUsers || []}
        employeesLoading={lightLoading}
        viewBy={viewBy}
        setViewBy={setViewBy}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedWeek={selectedWeek}
        setSelectedWeek={setSelectedWeek}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      <EmployeeTimeSheetSummary summary={summary} />

      <EmployeeTimeSheetEntriesList
        timesheetData={timesheetData}
        loading={loading}
        error={error}
        openSections={openSections}
        toggleSection={toggleSection}
        formatIsoTime={formatIsoTime}
        summary={summary}
        viewBy={viewBy}
        selectedDate={selectedDate}
        selectedMonth={selectedMonth}
        selectedWeek={selectedWeek}
        selectedEmployee={selectedEmployee}
      />
    </div>
  );
}
