import React from "react";
import useShiftDashboardStore from "../../../store/shiftoverviewStore";

const ShiftDonutChart = ({ className }) => {
  const { shiftDetails } = useShiftDashboardStore();

  const total = shiftDetails.reduce((sum, s) => sum + (s.total_people || 0), 0);

  const donutChartData = shiftDetails.map((shift, index) => ({
    label: shift.shift_name,
    percentage: total ? Math.round((shift.total_people / total) * 100) : 0,
    color: ["#8A79F6", "#FD9589", "#54D1DD", "#FFB067", "#52C41A"][index % 5],
  }));

  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  let accumulatedOffset = 0;

  return (
    <div
      className={`bg-white rounded-xl p-4 pb-4 shadow-sm flex flex-col items-center w-full ${className}`}
    >
      {/* SVG Donut - Same Design */}
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
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[18px] font-bold text-black">{total}</span>
        </div>
      </div>

      {/* HORIZONTAL SCROLLABLE LEGENDS WITH VISIBLE SCROLLBAR */}
      <div className="w-full mt-2">
        <div
          className="flex flex-nowrap items-center gap-5 overflow-x-auto pb-3 custom-scrollbar"
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
              <span className="text-[12px] text-gray-600 whitespace-nowrap font-medium">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Small internal style for the "rarecase" scrollbar appearance */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 4px; /* Thin scrollbar */
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
          background: #8a79f6; /* Color changes to your primary purple on hover */
        }
      `}</style>
    </div>
  );
};

export default ShiftDonutChart;
