import React from "react";
import useShiftDashboardStore from "../../../store/shiftoverviewStore";

const ShiftSummaryCard = ({ className }) => {
  const { shiftDetails, allShiftsMaster } = useShiftDashboardStore();

  // ✅ GLOBAL SYSTEM SYNC: source shifts list from master repository to safeguard layout from clearing out
  const masterSource =
    allShiftsMaster.length > 0 ? allShiftsMaster : shiftDetails;

  // Logic: Only show the first 4 shifts in the summary display panel
  const visibleShifts = masterSource?.slice(0, 4) || [];
  const hasMoreThanFour = masterSource?.length > 4;

  return (
    <div
      className={`bg-white rounded-xl p-3 shadow-sm h-[275px] flex flex-col overflow-hidden ${className}`}
    >
      {/* ---------- HEADER ---------- */}
      <div className="flex justify-between items-center mb-4 shrink-0">
        <div className="text-[14px] font-medium text-gray-800">
          Total Shifts
        </div>
        <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
          {masterSource?.length || 0}
        </div>
      </div>

      {/* ---------- SHIFTS LIST AREA ---------- */}
      <div
        // Added uniform scroll styling matching your layout system parameters perfectly
        className="space-y-4 flex-1 overflow-y-auto pr-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-[#f1f1f1] [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#ccc] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#8a79f6]"
      >
        {visibleShifts.map((shift) => {
          // Look up if there's a dynamic filtered workforce footprint matching this specific loop index node
          const liveShiftMatch = shiftDetails?.find(
            (s) => s.shift_name === shift.shift_name,
          );
          const totalPeopleCount = liveShiftMatch
            ? liveShiftMatch.total_people
            : shift.total_people;

          return (
            <div
              key={shift.shift_name}
              className="flex justify-between items-center border-b border-gray-50 pb-2 last:border-0"
            >
              <div>
                <div className="text-gray-800 font-medium text-[12px]">
                  {shift.shift_name}
                </div>
                <div className="text-gray-400 text-[11px]">
                  {shift.in_time && shift.out_time
                    ? `${shift.in_time.substring(0, 5)} - ${shift.out_time.substring(0, 5)}`
                    : "Time not set"}
                </div>
              </div>
              <div className="text-red-500 text-[12px] font-medium shrink-0">
                {totalPeopleCount || 0} Staffs
              </div>
            </div>
          );
        })}

        {visibleShifts.length === 0 && (
          <div className="text-center text-gray-400 text-xs mt-10 italic">
            No shifts available
          </div>
        )}
      </div>

      {/* ---------- FOOTER ---------- */}
      {hasMoreThanFour && (
        <div className="mt-auto pt-2 text-right shrink-0 border-t border-gray-100">
          <a
            href="/shifts"
            className="text-[11px] text-blue-600 hover:underline font-bold uppercase tracking-wide"
          >
            View all {masterSource.length} Shifts
          </a>
        </div>
      )}
    </div>
  );
};

export default ShiftSummaryCard;
