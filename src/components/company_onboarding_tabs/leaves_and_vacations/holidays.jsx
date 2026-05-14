import React, { useState, useEffect } from "react";
import { Plus, Calendar as CalendarIcon, List as ListIcon } from "lucide-react";
import HolidayCalendar from "./holidayscalender";
import HolidayList from "./holidayslist";
import {
  fetchHolidaysByDate,
  fetchAllHolidays,
} from "../../../service/holidayservices";
import { getBranchData } from "../../../service/companyService";
import HolidayModal from "../../../ui/addholiday";

const Holidays = () => {
  const [activeTab, setActiveTab] = useState("calendar");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [monthHolidays, setMonthHolidays] = useState([]); // Specifically for Calendar
  const [allHolidays, setAllHolidays] = useState([]); // For the Full List
  const [branchOptions, setBranchOptions] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );

  const loadData = async () => {
    try {
      // Parallel fetch for efficiency
      const [rawMonthData, rawAllData, rawBranches] = await Promise.all([
        fetchHolidaysByDate(
          currentMonth.getMonth() + 1,
          currentMonth.getFullYear(),
        ),
        fetchAllHolidays(),
        getBranchData(),
      ]);

      setMonthHolidays(rawMonthData || []);
      setAllHolidays(rawAllData || []);

      if (rawBranches) {
        setBranchOptions(
          rawBranches.map((b) => ({
            label: b.name.trim(),
            value: b.id.toString(),
          })),
        );
      }
    } catch (e) {
      console.error("Error loading holiday data:", e);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentMonth]);

  const getBranchName = (id) => {
    if (id === "0" || !id) return "General";
    return (
      branchOptions.find((o) => o.value === id.toString())?.label ||
      `Branch ${id}`
    );
  };

  return (
    <div className="p-4 w-full bg-white min-h-screen">
      {/* TABS & ACTIONS SECTION - Button moved to right end */}
      <div className="flex justify-between items-end border-b border-gray-300 mb-6">
        {/* Left Side: Tab Navigation */}
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab("calendar")}
            className={`flex items-center gap-2 pb-3 text-sm font-medium transition-all relative ${
              activeTab === "calendar" ? "text-black" : "text-black/30"
            }`}
          >
            <CalendarIcon size={16} /> Calendar View
            {activeTab === "calendar" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("list")}
            className={`flex items-center gap-2 pb-3 text-sm font-medium transition-all relative ${
              activeTab === "list" ? "text-black" : "text-black/30"
            }`}
          >
            <ListIcon size={16} /> Holiday List
            {activeTab === "list" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-full" />
            )}
          </button>
        </div>

        {/* Right Side: Action Button */}
        <div className="pb-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-black rounded-lg text-white text-[12px] font-light hover:bg-zinc-800 transition-colors"
          >
            <Plus size={14} strokeWidth={1.5} /> Add Holiday
          </button>
        </div>
      </div>

      {/* CONTENT SECTION */}
      <div className="w-full">
        {activeTab === "calendar" ? (
          <HolidayCalendar
            holidays={monthHolidays}
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            getBranchName={getBranchName}
          />
        ) : (
          <HolidayList
            holidays={allHolidays}
            getBranchName={getBranchName}
            onRefresh={loadData}
          />
        )}
      </div>

      {/* MODAL */}
      <HolidayModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRefresh={loadData}
      />
    </div>
  );
};

export default Holidays;
