import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import axiosInstance from "../../service/axiosinstance";
import EmployeeTimeline from "../activity/timelineactivity";
import PieChartComponent from "../activity/piechart";

const statusColors = {
  "On time": "bg-green-500",
  Delay: "bg-yellow-400",
  Late: "bg-orange-500",
  "Half day": "bg-pink-500",
  "Early Check-in": "bg-indigo-500",
  Absent: "bg-red-500",
  "Weekly off": "bg-black",
  Leave: "bg-purple-500",
  "On duty": "bg-blue-500",
  "Check in missed": "bg-gray-500",
};

const formatTime = (timeString) => {
  if (!timeString || timeString.includes("00:00:00")) return null;
  try {
    const parts = timeString.split("T");
    if (parts.length > 1) return parts[1].replace("Z", "");
    return "00:00:00";
  } catch {
    return "00:00:00";
  }
};

const ActivityTab = ({ employee }) => {
  const UUID = employee?.uuid;
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  };

  useEffect(() => {
    if (!UUID) return;
    const fetchAttendance = async () => {
      const month = String(currentMonth.getMonth() + 1).padStart(2, "0");
      const year = currentMonth.getFullYear();
      try {
        const res = await axiosInstance.get(
          `/admin/staff/workhours/${month}/${year}/${UUID}`,
        );
        console.log("Attendance API Result:", res.data.data);
        setAttendanceData(res.data.data || []);
      } catch (err) {
        console.error("Fetch error:", err.response || err.message);
      }
    };
    fetchAttendance();
  }, [UUID, currentMonth]);

  const generateCalendarDays = () => {
    const days = [];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) days.push(null);

    for (let i = 1; i <= daysInMonth; i++) {
      const dayData =
        attendanceData.find((d) => {
          const recordDate = new Date(d.date);
          return recordDate.getUTCDate() === i;
        }) || {};

      days.push({
        day: i,
        status: (dayData.status || "").trim(),
        // Accessing the checkout_status.String from your response
        checkoutStatus: dayData.checkout_status?.String || "",
        totalHours: formatTime(dayData.total_hour),
        rawData: dayData,
      });
    }
    return days;
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className="p-8 w-full bg-white" style={{ minWidth: "400px" }}>
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[16px]  uppercase">
          {currentMonth.toLocaleString("default", { month: "long" })}
          <span className="text-red-500 ml-2">
            {currentMonth.getFullYear()}
          </span>
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 border rounded-full hover:bg-gray-100"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 border rounded-full hover:bg-gray-100"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      {/* WEEK DAYS */}
      <div className="grid grid-cols-7 text-center mb-1 text-xs text-gray-600 font-semibold uppercase">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>

      {/* CALENDAR GRID */}
      <div className="grid grid-cols-7 border-t border-l border-gray-200">
        {calendarDays.map((day, idx) => (
          <div
            key={idx}
            className={`h-24 border-r border-b border-gray-200 p-1 flex flex-col relative cursor-pointer hover:bg-gray-50 ${
              selectedDay?.day === day?.day ? "bg-blue-50" : ""
            }`}
            onClick={() => day && setSelectedDay(day)}
          >
            {day && (
              <>
                <div className="pt-1 px-1">
                  <span className="text-sm font-medium">{day.day}</span>
                </div>

                {/* NEW: Checkout Status in Top Right Corner */}
                {day.checkoutStatus && (
                  <div className="absolute top-1 right-1 text-[9px]  text-black bg-blue-50 px-1 rounded">
                    {day.checkoutStatus}
                  </div>
                )}

                {/* Status Dot (Bottom Left) */}
                {day.status && (
                  <div
                    className={`absolute bottom-2 left-2 w-3 h-3 rounded-full ${statusColors[day.status] || "bg-gray-200"}`}
                    title={day.status}
                  />
                )}

                {/* Total Hours (Bottom Right) */}
                {day.totalHours && (
                  <div className="absolute bottom-2 right-2 text-gray-600 text-[10px]">
                    {day.totalHours}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* LEGEND */}
      <div className="flex flex-wrap py-4 text-xs mt-4 border-t">
        {Object.entries(statusColors).map(([key, colorClass]) => (
          <div key={key} className="flex items-center mx-2 my-1">
            <span className={`w-3 h-3 rounded-full mr-1 ${colorClass}`} />
            <span className="uppercase text-gray-700 font-medium">{key}</span>
          </div>
        ))}
      </div>

      {/* ANALYTICS */}
      <div className="mt-8 border-t pt-6 space-y-10">
        <EmployeeTimeline
          month={currentMonth.getMonth() + 1}
          year={currentMonth.getFullYear()}
          employeeId={UUID}
        />
        <PieChartComponent
          month={currentMonth.getMonth() + 1}
          year={currentMonth.getFullYear()}
          employeeId={UUID}
        />
      </div>
    </div>
  );
};

export default ActivityTab;
