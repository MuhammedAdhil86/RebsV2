import React, { useState, useEffect } from "react";
import { fetchEmployeeTimesheets } from "../../service/timesheetService";
import toast from "react-hot-toast";

import TimeSheetFilter from "./timesheetfilters";
import TimeSheetSummary from "./timesheetsummmary";
import TimeSheetEntriesList from "./timesheetentrieslist";
import CreateTimeSheet from "../../ui/createtimesheet";
import UpdateTimeSheet from "./../../ui/updatetimesheet";

export default function MyTimeSheet() {
  const getTodayFormatted = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // View sub-tab state: "list" | "create" | "update"
  const [activeSubTab, setActiveSubTab] = useState("list");

  // Data holder for Update view
  const [editGroupData, setEditGroupData] = useState(null);

  // Filter States
  const [viewBy, setViewBy] = useState("Date");
  const [selectedDate, setSelectedDate] = useState(getTodayFormatted());
  const [selectedMonth, setSelectedMonth] = useState(
    String(new Date().getMonth() + 1),
  );
  const [selectedWeek, setSelectedWeek] = useState("1");

  // API Data States
  const [timesheetData, setTimesheetData] = useState([]);
  const [summary, setSummary] = useState({
    fromDate: "—",
    toDate: "—",
    totalMinutes: 0,
    totalHours: "0h 0m",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Accordion Expand/Collapse State
  const [openSections, setOpenSections] = useState({});

  const loadTimesheetData = async (overrideParams = null) => {
    setLoading(true);
    setError(null);

    let params = {};
    const activeView = (overrideParams?.viewBy || viewBy).toLowerCase();

    if (activeView === "year") {
      params = { view: "year" };
    } else if (activeView === "month") {
      params = {
        view: "month",
        month: overrideParams?.selectedMonth || selectedMonth,
      };
    } else if (activeView === "week") {
      params = {
        view: "week",
        month: overrideParams?.selectedMonth || selectedMonth,
        week: overrideParams?.selectedWeek || selectedWeek,
      };
    } else if (activeView === "date") {
      params = {
        view: "date",
        date: overrideParams?.selectedDate || selectedDate,
      };
    }

    try {
      const data = await fetchEmployeeTimesheets(params);

      setSummary({
        fromDate: data.from_date || "—",
        toDate: data.to_date || "—",
        totalMinutes: data.total_minutes || 0,
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
      console.error("Error loading timesheet data:", err);
      setError("Failed to fetch timesheet entries. Please try again.");
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
    };

    setViewBy(defaults.viewBy);
    setSelectedDate(defaults.selectedDate);
    setSelectedMonth(defaults.selectedMonth);
    setSelectedWeek(defaults.selectedWeek);

    loadTimesheetData(defaults);
  };

  const toggleSection = (date) => {
    setOpenSections((prev) => ({ ...prev, [date]: !prev[date] }));
  };

  // Formats UTC ISO time directly into 24-Hour HH:MM:SS format
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

  // Pencil Click Handler with Present Day Guard
  const handleEditClick = (entry, workDate) => {
    const today = getTodayFormatted();

    if (workDate !== today) {
      toast.error("You can only edit today's timesheet entries.");
      return;
    }

    // Pass the date group to the update view
    const group = timesheetData.find((g) => g.work_date === workDate);
    setEditGroupData({
      workDate,
      entries: group ? group.entries : [entry],
    });

    // Switch to Update component view
    setActiveSubTab("update");
  };

  return (
    <div className="w-full font-poppins font-normal text-gray-700 text-sm">
      {/* 1. LIST VIEW */}
      {activeSubTab === "list" && (
        <div className="space-y-4">
          <TimeSheetFilter
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

          <TimeSheetSummary summary={summary} />

          <TimeSheetEntriesList
            timesheetData={timesheetData}
            loading={loading}
            error={error}
            openSections={openSections}
            toggleSection={toggleSection}
            formatIsoTime={formatIsoTime}
            onEditClick={handleEditClick}
            onCreateClick={() => {
              setEditGroupData(null);
              setActiveSubTab("create");
            }}
          />
        </div>
      )}

      {/* 2. CREATE VIEW */}
      {activeSubTab === "create" && (
        <CreateTimeSheet
          onBack={() => setActiveSubTab("list")}
          onSuccess={() => {
            setActiveSubTab("list");
            loadTimesheetData();
          }}
        />
      )}

      {/* 3. UPDATE VIEW */}
      {activeSubTab === "update" && (
        <UpdateTimeSheet
          initialData={editGroupData}
          onBack={() => {
            setEditGroupData(null);
            setActiveSubTab("list");
          }}
          onSuccess={() => {
            setEditGroupData(null);
            setActiveSubTab("list");
            loadTimesheetData();
          }}
        />
      )}
    </div>
  );
}
