import React, { useEffect, useMemo, useRef } from "react";
import useShiftDashboardStore from "../../store/shiftoverviewStore";

const ShiftRatioCard = ({ className = "" }) => {
  const { shiftRatios, fetchShiftRatios, selectedShiftName, changeShift } =
    useShiftDashboardStore();

  const scrollContainerRef = useRef(null);

  useEffect(() => {
    fetchShiftRatios();
  }, [fetchShiftRatios]);

  const shifts = useMemo(
    () => shiftRatios.map((s) => s.shift_name),
    [shiftRatios],
  );
  const activeShift = selectedShiftName || shifts[0];

  // AUTO-SCROLL LOGIC:
  // This ensures the selected shift moves into the viewable area automatically
  useEffect(() => {
    const activeTab =
      scrollContainerRef.current?.querySelector(".active-shift-tab");
    if (activeTab) {
      activeTab.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center", // This centers the selected shift in the scroll area
      });
    }
  }, [activeShift]);

  /* ---------- DATA CALCULATIONS ---------- */
  const shiftData = shiftRatios.find((s) => s.shift_name === activeShift);
  const total = shiftData?.total_attendance ?? 0;
  const online = shiftData?.ontime ?? 0;
  const delay = shiftData?.delay ?? 0;
  const late = shiftData?.late ?? 0;
  const absent = shiftData?.absent ?? 0;
  const early = 0;

  const safeTotal = total || 1;
  const getPerc = (val) => (val / safeTotal) * 100;

  return (
    <div
      className={`bg-white rounded-xl p-4 shadow-sm flex flex-col h-full ${className}`}
    >
      <div className="text-sm font-semibold text-gray-800 mb-4">
        Shift Ratio
      </div>

      {/* ---------- SCROLLABLE SHIFT TABS ---------- */}
      <div className="w-full mb-6">
        <div
          ref={scrollContainerRef}
          className="flex flex-nowrap items-center gap-6 overflow-x-auto pb-2 custom-scrollbar"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {shifts.map((shift) => (
            <button
              key={shift}
              onClick={() => changeShift?.(shift)}
              // Added "active-shift-tab" class for the querySelector
              className={`flex-shrink-0 pb-2 text-[12px] font-medium whitespace-nowrap transition-all relative ${
                shift === activeShift
                  ? "text-black active-shift-tab"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {shift}
              {shift === activeShift && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Attendance Stats */}
      <div className="mb-4">
        <div className="text-2xl font-bold text-gray-900 leading-none">
          {total.toLocaleString()}{" "}
          <span className="text-xs font-normal text-gray-400">Attendance</span>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex h-3 w-full bg-gray-100 rounded-full overflow-hidden mb-14">
        <div
          className="h-full bg-green-400 transition-all duration-500"
          style={{ width: `${getPerc(online)}%` }}
        />
        <div
          className="h-full bg-yellow-400 transition-all duration-500"
          style={{ width: `${getPerc(delay)}%` }}
        />
        <div
          className="h-full bg-orange-400 transition-all duration-500"
          style={{ width: `${getPerc(late)}%` }}
        />
        <div
          className="h-full bg-red-500 transition-all duration-500"
          style={{ width: `${getPerc(absent)}%` }}
        />
        <div
          className="h-full bg-purple-600 transition-all duration-500"
          style={{ width: `${getPerc(early)}%` }}
        />
      </div>

      {/* ---------- LEGENDS ---------- */}
      <div className="mt-auto">
        <div
          className="flex flex-nowrap items-center gap-5 overflow-x-auto pb-3 custom-scrollbar"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <LegendItem color="bg-green-400" label="Online" value={online} />
          <LegendItem color="bg-yellow-400" label="Delay" value={delay} />
          <LegendItem color="bg-orange-400" label="Late" value={late} />
          <LegendItem color="bg-red-500" label="Absent" value={absent} />
          <LegendItem color="bg-purple-600" label="Early" value={early} />
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #8a79f6;
        }
      `}</style>
    </div>
  );
};

const LegendItem = ({ color, label, value }) => (
  <div className="flex items-center gap-2 flex-shrink-0">
    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${color}`} />
    <span className="text-[12px] text-gray-600 whitespace-nowrap">
      {label} <span className="font-bold text-gray-900 ml-0.5">{value}</span>
    </span>
  </div>
);

export default ShiftRatioCard;
