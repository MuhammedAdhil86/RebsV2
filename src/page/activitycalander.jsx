// FILE: src/pages/EmployeeCalendar.jsx
import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import axiosInstance from "../service/axiosinstance";

// --- Status Color Mapping ---
const statusColors = {
  "weekly-off": "bg-black",
  "on-time": "bg-green-500",
  "delay": "bg-yellow-400",
  "late": "bg-orange-500",
  "absent": "bg-red-500",
  "leave": "bg-purple-500",
  "on-duty": "bg-blue-500",
};

// Map API record_type and in/out fields to status
const mapRecordTypeToStatus = (record_type, apiDay) => {
  if (!record_type && apiDay) {
    if (apiDay.in && apiDay.out) return "on-time";
    if (!apiDay.in) return "absent";
    return null;
  }
  const t = (record_type || "").toLowerCase();
  if (t.includes("weekly")) return "weekly-off";
  if (t.includes("holiday") || t.includes("leave")) return "leave";
  if (t.includes("wfh") || t.includes("on-duty")) return "on-duty";
  if (t.includes("absent")) return "absent";
  if (t.includes("late")) return "late";
  return "on-time";
};

// Extract HH:MM:SS from ISO string
const extractTime = (isoString) => {
  if (!isoString) return null;
  const m = isoString.match(/T(\d{2}):(\d{2}):(\d{2})/);
  if (m) return `${m[1]}:${m[2]}:${m[3]}`;
  return isoString; // fallback if already HH:MM:SS
};

const EmployeeCalendar = ({ UUID }) => {
  const [month, setMonth] = useState(new Date()); // Current month
  const [attendanceData, setAttendanceData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- Fetch attendance data from API ---
  const fetchAttendance = async () => {
    if (!UUID) return;
    setIsLoading(true);
    setError(null);
    try {
      const year = month.getFullYear();
      const monthNum = String(month.getMonth() + 1).padStart(2, "0");
      const res = await axiosInstance.get(`/admin/staff/workhours/${monthNum}/${year}/${UUID}`);
      setAttendanceData(res.data.data || []);
    } catch (err) {
      console.error("Attendance fetch error:", err);
      setError("Failed to load attendance data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [month, UUID]);

  // --- Generate calendar days dynamically ---
  const generateCalendarDays = () => {
    const days = [];
    const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
    const totalDays = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();

    // Empty cells for days before the 1st
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);

    // Fill days with API data
    for (let i = 1; i <= totalDays; i++) {
      const apiDay = attendanceData.find(d => new Date(d.date).getDate() === i);
      const status = apiDay ? mapRecordTypeToStatus(apiDay.record_type, apiDay) : null;
      const time = apiDay ? extractTime(apiDay.in) || extractTime(apiDay.first_in_time) : null;
      days.push({ day: i, status, time });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  const goPrev = () => setMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const goNext = () => setMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  const goToday = () => setMonth(new Date());

  return (
    <div className="p-8 w-full bg-white" style={{ minWidth: '400px' }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">
          {month.toLocaleString("default", { month: "long" }).toUpperCase()}
          <span className="text-red-500 ml-2">{month.getFullYear()}</span>
        </h2>
        <div className="flex space-x-2 text-gray-700">
          <button onClick={goPrev} className="p-2 border rounded-full hover:bg-gray-100"><ChevronLeft size={24} /></button>
          <button onClick={goNext} className="p-2 border rounded-full hover:bg-gray-100"><ChevronRight size={24} /></button>
          <button onClick={goToday} className="px-3 py-1 border rounded-md text-sm">Today</button>
        </div>
      </div>

      {/* Day of week headers */}
      <div className="grid grid-cols-7 text-center mb-1 text-xs text-gray-600 font-semibold">
        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(d => (
          <div key={d} className="py-2">{d}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 border-t border-l border-gray-200">
        {calendarDays.map((day, idx) => (
          <div key={idx} className="h-24 border-r border-b border-gray-200 p-1 flex flex-col items-start relative">
            {day ? (
              <>
                <div className="w-full flex justify-between items-start pt-1 px-1">
                  <span className="text-sm font-medium">{day.day}</span>
                  <div className="h-4 w-4 flex justify-center items-center">
                    <div className="space-y-0.5">
                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    </div>
                  </div>
                </div>
                {day.status && <div className={`absolute bottom-2 left-2 w-3 h-3 rounded-full ${statusColors[day.status]}`}></div>}
                {day.time && (
                  <div className="absolute bottom-2 right-2 text-xs text-gray-600 font-mono">
                    {day.time === "00:00:00" ? "00:00:00" : day.time}
                  </div>
                )}
              </>
            ) : <div className="h-full"></div>}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center py-4 text-xs mt-4 border-t">
        {Object.entries(statusColors).map(([key, colorClass]) => (
          <div key={key} className="flex items-center mx-2 my-1">
            <span className={`w-3 h-3 rounded-full mr-1 ${colorClass}`}></span>
            <span className="uppercase text-gray-700 font-medium">{key.replace(/-/g, " ")}</span>
          </div>
        ))}
      </div>

      {isLoading && <div className="fixed bottom-4 left-4 bg-white px-3 py-2 rounded shadow text-sm text-gray-600">Loading attendance...</div>}
      {error && <div className="fixed bottom-4 left-4 bg-red-50 px-3 py-2 rounded shadow text-sm text-red-600">{error}</div>}
    </div>
  );
};

export default EmployeeCalendar;
