import React from "react";
import useShiftDashboardStore from "../../../store/shiftoverviewStore";

const ShiftSummaryCard = ({ className }) => {
  const { shiftDetails } = useShiftDashboardStore();

  // Logic: Only show the first 4 shifts in the summary
  const visibleShifts = shiftDetails?.slice(0, 4) || [];
  const hasMoreThanFour = shiftDetails?.length > 4;

  return (
    <div
      /* Changed h-[360px] to match your ShiftCard height for a balanced dashboard */
      className={`bg-white rounded-xl p-3 shadow-sm h-[275px] flex flex-col ${className}`}
    >
      {/* ---------- HEADER ---------- */}
      <div className="flex justify-between items-center mb-4 shrink-0">
        <div className="text-[14px] font-medium text-gray-800">
          Total Shifts
        </div>
        <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
          {shiftDetails?.length || 0}
        </div>
      </div>

      {/* ---------- SHIFTS LIST ---------- */}
      <div className="space-y-4 flex-1 overflow-hidden">
        {visibleShifts.map((shift) => (
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
                  ? `${shift.in_time} - ${shift.out_time}`
                  : "Time not set"}
              </div>
            </div>
            <div className="text-red-500 text-[12px] font-medium">
              {shift.total_people || 0} Staffs
            </div>
          </div>
        ))}

        {visibleShifts.length === 0 && (
          <div className="text-center text-gray-400 text-xs mt-10 italic">
            No shifts available
          </div>
        )}
      </div>

      {/* ---------- FOOTER ---------- */}
      {/* This link only renders if there are more than 4 items */}
      {hasMoreThanFour && (
        <div className="mt-auto pt-2 text-right shrink-0 border-t border-gray-100">
          <a
            href="/shifts"
            className="text-[11px] text-blue-600 hover:underline font-bold uppercase"
          >
            View all {shiftDetails.length} Shifts
          </a>
        </div>
      )}
    </div>
  );
};

export default ShiftSummaryCard;
