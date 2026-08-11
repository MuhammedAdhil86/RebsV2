import React, { useState, useEffect } from "react";
import { fetchTeamTimesheets } from "../../service/timesheetservice";
import useEmployeeStore from "../../store/employeeStore";

import EmployeeTimeSheetFilter from "./employeetimesheetfilter";
import EmployeeTimeSheetSummary from "./employeetimesheetsummary";
import EmployeeTimeSheetEntriesList from "./employeetimesheetentries";

export default function EmployeeTimeSheet() {
  const getTodayFormatted = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Zustand Store Integration
  const { employees, fetchEmployees } = useEmployeeStore();

  // Filter States
  const [viewBy, setViewBy] = useState("Date");
  const [selectedDate, setSelectedDate] = useState(getTodayFormatted());
  const [selectedMonth, setSelectedMonth] = useState(
    String(new Date().getMonth() + 1),
  );
  const [selectedWeek, setSelectedWeek] = useState("1");
  const [selectedEmployee, setSelectedEmployee] = useState("all");

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

  // 1. Fetch Employee List from Zustand Store if empty
  useEffect(() => {
    if (!employees || employees.length === 0) {
      fetchEmployees();
    }
  }, [employees, fetchEmployees]);

  // 2. Fetch Timesheet Data with URL query parameters
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

    if (emp !== "all") {
      params.employee_id = emp;
    }

    try {
      const data = await fetchTeamTimesheets(params);

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
      setError("Failed to fetch employee timesheets. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimesheetData();
  }, []);

  const handleApplyFilters = () => {
    loadTimesheetData();
  };

  const handleResetFilters = () => {
    const today = getTodayFormatted();
    const currentMonth = String(new Date().getMonth() + 1);

    const defaults = {
      viewBy: "Date",
      selectedDate: today,
      selectedMonth: currentMonth,
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
        employeeOptions={employees || []}
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
