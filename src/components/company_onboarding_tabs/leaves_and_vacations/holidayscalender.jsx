import React from "react";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";

const HolidayCalendar = ({
  holidays,
  currentMonth,
  setCurrentMonth,
  getBranchName,
}) => {
  const handleMonthChange = (offset) => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1),
    );
  };

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0,
  ).getDate();
  const firstDay = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1,
  ).getDay();
  const calendarDays = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-4">
        <span className="text-black font-medium">
          {currentMonth.toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </span>
        <div className="flex gap-2 border border-black/5 rounded-lg p-1">
          <button
            onClick={() => handleMonthChange(-1)}
            className="p-1 hover:bg-black/5 rounded"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => handleMonthChange(1)}
            className="p-1 hover:bg-black/5 rounded"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="border border-gray-400 rounded-xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-7 border-b border-gray-400 bg-black/[0.01]">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              className="py-3 text-center text-xs font-light text-black uppercase"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            const dateStr = day
              ? `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
              : null;
            const holiday = holidays.find((h) => h.date.startsWith(dateStr));
            return (
              <div
                key={idx}
                className={`min-h-[140px] border-r border-b border-gray-400 p-2 ${holiday ? "bg-red-50/30" : ""} ${!day ? "bg-black/[0.01]" : ""}`}
              >
                {day && (
                  <div className="h-full flex flex-col">
                    <span
                      className={`text-sm ${holiday ? "text-red-500 font-bold" : "text-black/60"}`}
                    >
                      {day}
                    </span>
                    {holiday && (
                      <div className="mt-1">
                        {holiday.image && (
                          <img
                            src={holiday.image}
                            className="w-full h-10 object-cover rounded mb-1"
                            alt=""
                          />
                        )}
                        <p className="text-[10px] font-semibold text-black leading-tight line-clamp-2">
                          {holiday.Reason || holiday.title}
                        </p>
                        <div className="flex items-center text-[9px] text-black/40 mt-auto">
                          <MapPin size={8} className="mr-1 text-red-400" />
                          {getBranchName(holiday.branch)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HolidayCalendar;
