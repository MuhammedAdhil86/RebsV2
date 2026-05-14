import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import DatePickerLib from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function DateStripPicker({ selectedDate, onChange }) {
  const [calendarDays, setCalendarDays] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);
  const scrollRef = useRef(null);

  const CARD_WIDTH = 75; // fixed width of each card
  const CARD_GAP = 8;    // gap between cards
  const VISIBLE_COUNT = 11; // default visible cards

  const updateContainerWidth = () => {
    const screenWidth = window.innerWidth;
    if (screenWidth < 768) {
      // on small screens, reduce visible cards
      return Math.min(VISIBLE_COUNT, Math.floor(screenWidth / (CARD_WIDTH + CARD_GAP))) * CARD_WIDTH +
             (Math.min(VISIBLE_COUNT, Math.floor(screenWidth / (CARD_WIDTH + CARD_GAP))) - 1) * CARD_GAP;
    }
    return VISIBLE_COUNT * CARD_WIDTH + CARD_GAP * (VISIBLE_COUNT - 1);
  };

  const [containerWidth, setContainerWidth] = useState(updateContainerWidth());

  useEffect(() => {
    const handleResize = () => setContainerWidth(updateContainerWidth());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const today = new Date();
    const days = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      days.push({
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        date: d.getDate(),
        fullDate: d,
      });
    }
    setCalendarDays(days);

    const idx = days.findIndex(
      (d) => d.fullDate.toISOString().split("T")[0] === selectedDate
    );
    if (idx !== -1) setSelectedIndex(idx);
  }, [selectedDate]);

  const handleDateClick = (item, idx) => {
    setSelectedIndex(idx);
    const formatted = item.fullDate.toISOString().split("T")[0];
    onChange(formatted);
  };

  const handleCalendarIconClick = () => setShowCalendar((prev) => !prev);

  const handleCalendarChange = (date) => {
    if (!date) return;
    const formatted = date.toISOString().split("T")[0];
    onChange(formatted);

    const idx = calendarDays.findIndex(
      (d) => d.fullDate.toISOString().split("T")[0] === formatted
    );
    if (idx !== -1) setSelectedIndex(idx);

    setShowCalendar(false);
    scrollToIndex(idx);
  };

  const scrollToIndex = (idx) => {
    const button = scrollRef.current?.querySelectorAll("button")[idx];
    if (button) {
      button.scrollIntoView({ behavior: "smooth", inline: "start" });
    }
  };

  const scrollLeft = () => {
    scrollRef.current.scrollBy({
      left: -(CARD_WIDTH + CARD_GAP) * VISIBLE_COUNT,
      behavior: "smooth",
    });
  };

  const scrollRight = () => {
    scrollRef.current.scrollBy({
      left: (CARD_WIDTH + CARD_GAP) * VISIBLE_COUNT,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative flex items-center bg-white rounded-xl overflow-hidden py-1 px-2">
      {/* Calendar Icon */}
      <div
        onClick={handleCalendarIconClick}
        className="flex items-center justify-center w-8 h-8 rounded-full cursor-pointer flex-shrink-0 mr-2"
      >
        <Icon icon="solar:calendar-linear" className="w-5 h-5 text-black" />
      </div>

      {/* Left Chevron */}
      <button
        onClick={scrollLeft}
        className="flex items-center justify-center flex-shrink-0 px-2"
      >
        <ChevronLeft className="w-5 h-5 text-gray-600" />
      </button>

      {/* Date Strip Container */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-hide"
        style={{
          width: `${containerWidth}px`,
          gap: `${CARD_GAP}px`,
        }}
      >
        {calendarDays.map((item, idx) => (
          <button
            key={idx}
            onClick={() => handleDateClick(item, idx)}
            className={`flex flex-col items-center justify-center text-center rounded-lg transition-colors duration-200 flex-shrink-0
              ${idx === selectedIndex
                ? "bg-black text-white"
                : "bg-white text-gray-800 border border-gray-200 hover:border-gray-300"
              }`}
            style={{
              width: `${CARD_WIDTH}px`,
              height: "60px",
            }}
          >
            <span className="font-poppins font-normal text-[10px] leading-none">
              {item.day}
            </span>
            <span className="font-semibold text-[16px] mt-1">{item.date}</span>
          </button>
        ))}
      </div>

      {/* Right Chevron */}
      <button
        onClick={scrollRight}
        className="flex items-center justify-center flex-shrink-0 px-2"
      >
        <ChevronRight className="w-5 h-5 text-gray-600" />
      </button>

      {/* Calendar Popup */}
      {showCalendar && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-white shadow-lg rounded-lg p-2">
          <DatePickerLib
            selected={
              calendarDays[selectedIndex]?.fullDate
                ? new Date(calendarDays[selectedIndex].fullDate)
                : new Date()
            }
            onChange={handleCalendarChange}
            maxDate={new Date()}
            minDate={new Date(new Date().setDate(new Date().getDate() - 29))}
            inline
            calendarClassName="bg-white text-black border border-gray-300 rounded-lg"
            dayClassName={() =>
              "hover:bg-black hover:text-white transition-colors rounded"
            }
          />
        </div>
      )}
    </div>
  );
}

export default DateStripPicker;
