import React from "react";
import useShiftDashboardStore from "../../../store/shiftoverviewStore";

const ShiftDonutChart = ({ className }) => {
  const { shiftDetails, allShiftsMaster } = useShiftDashboardStore();

  // 1. MASTER Headcount Anchor (Keeps the donut visual sizes completely static)
  const masterSource =
    allShiftsMaster.length > 0 ? allShiftsMaster : shiftDetails;
  const masterStaticTotal =
    masterSource.reduce((sum, s) => sum + (s.total_people || 0), 0) || 20;

  // 2. Map fixed visual segments based on permanent shift capacities
  const donutChartData = masterSource.map((masterShift, index) => {
    // Check if this shift exists in the current active payload
    const activeFilteredShift = shiftDetails.find(
      (s) => s.shift_name === masterShift.shift_name,
    );

    // Live display staff population count to toggle opacity filters
    const liveStaffCount = activeFilteredShift
      ? activeFilteredShift.total_people
      : 0;

    // Calculate static visual slice widths against the baseline master headcount
    const staticPercentage = masterStaticTotal
      ? Math.round((masterShift.total_people / masterStaticTotal) * 100)
      : 0;

    return {
      label: masterShift.shift_name,
      liveStaff: liveStaffCount,
      percentage: staticPercentage,
      color: ["#8A79F6", "#FD9589", "#54D1DD", "#FFB067", "#52C41A"][index % 5],
    };
  });

  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  let accumulatedOffset = 0;

  return (
    <div
      className={`bg-white rounded-xl p-4 pb-4 shadow-sm flex flex-col items-center w-full ${className}`}
    >
      {/* SVG Donut Ring */}
      <div className="relative w-[180px] h-[180px] mb-4">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full transform -rotate-90"
        >
          {donutChartData.map((item, index) => {
            const arc = (item.percentage / 100) * circumference;
            const dash = `${arc} ${circumference}`;
            const dashOffset = -accumulatedOffset;
            accumulatedOffset += arc;

            if (item.percentage === 0) return null;

            return (
              <circle
                key={index}
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth="14"
                strokeDasharray={dash}
                strokeDashoffset={dashOffset}
                className="transition-all duration-300 ease-in-out"
                opacity={
                  item.liveStaff > 0 || shiftDetails.length > 1 ? 1 : 0.25
                }
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[18px] font-bold text-black">
            {masterStaticTotal}
          </span>
        </div>
      </div>

      {/* ---------- HORIZONTAL SCROLLABLE LEGENDS ---------- */}
      <div className="w-full mt-2">
        <div
          // Added identical tailwind arbitrary scroll styling matching your ShiftRatioCard
          className="flex flex-nowrap items-center gap-5 overflow-x-auto pb-3 [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-[#f1f1f1] [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#ccc] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#8a79f6]"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {donutChartData.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 flex-shrink-0"
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              {/* ✅ REMOVED COUNT FROM BOTTOM LABELS: Renders pure text context now */}
              <span className="text-[12px] text-gray-600 whitespace-nowrap font-medium">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShiftDonutChart;
