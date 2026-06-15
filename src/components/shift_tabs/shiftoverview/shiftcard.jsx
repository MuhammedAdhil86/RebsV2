import React, { useEffect, useState, useRef } from "react";
import { DropdownMenuIcon } from "@radix-ui/react-icons";
import useShiftDashboardStore from "../../../store/shiftoverviewStore";

const ShiftCard = ({ className }) => {
  const dropdownRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const { shiftDetails, allShiftsMaster, selectedShiftName, changeShift } =
    useShiftDashboardStore();

  // ✅ FIX: Fallback to allShiftsMaster if the active filtered shiftDetails array doesn't contain the chosen shift
  const selectedShift =
    shiftDetails.find((s) => s.shift_name === selectedShiftName) ||
    allShiftsMaster.find((s) => s.shift_name === selectedShiftName);

  const peopleList = selectedShift?.users || [];

  // Explicitly fallback to total_people metadata parameters safely
  const staffCountDisplay = selectedShift?.total_people ?? peopleList.length;

  // Dropdown safe options fallback container array
  const dropDownOptions =
    allShiftsMaster.length > 0 ? allShiftsMaster : shiftDetails;

  /* ---------------- OUTSIDE MOUSE CLICK DISMISS ---------------- */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const PersonRow = ({ person }) => (
    <div className="flex items-center justify-between h-[52px] py-2 border-b border-gray-50 last:border-b-0 shrink-0">
      <div className="flex items-center gap-3">
        <img
          src={
            person.image ||
            "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
          }
          alt={person.full_name}
          className="w-8 h-8 rounded-full object-cover shrink-0"
        />
        <div className="min-w-0">
          <div className="text-[12px] font-medium text-gray-800 truncate">
            {person.full_name}
          </div>
          <div className="text-[10px] text-gray-500 truncate">
            {person.designation || "-"}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`bg-white rounded-xl p-4 shadow-sm w-full h-[300px] max-h-[360px] flex flex-col overflow-hidden ${className}`}
    >
      {/* ---------------- HEADER ---------------- */}
      <div className="flex justify-between items-start mb-2 shrink-0">
        <div
          ref={dropdownRef}
          className="relative flex items-center gap-1 text-[14px] text-gray-800 font-medium select-none"
        >
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1 hover:text-gray-600 transition-colors"
          >
            {selectedShiftName || "Select Shift"}
            <DropdownMenuIcon className="w-5 h-5 text-gray-500" />
          </button>

          {open && (
            <div className="absolute top-7 left-0 w-52 bg-white border border-gray-100 rounded-lg shadow-lg z-[9999] py-1">
              {dropDownOptions.map((shift) => (
                <button
                  key={shift.shift_name}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Passes down full shift node maps context cleanly
                    changeShift(shift);
                    setShowAll(false);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                    selectedShiftName === shift.shift_name
                      ? "bg-gray-50 font-medium text-blue-600"
                      : "text-gray-700"
                  }`}
                >
                  {shift.shift_name}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="bg-green-100 text-green-600 rounded-full px-3 py-1 text-xs font-medium shrink-0">
          {staffCountDisplay} Staffs
        </div>
      </div>

      {/* ---------------- EMPLOYEE SCROLL ROW VIEW LIST AREA ---------------- */}
      <div
        className={`flex-1 min-h-0 pr-1 transition-all duration-300 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-[#f1f1f1] [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#ccc] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#8a79f6] ${
          showAll ? "overflow-y-auto" : "max-h-[210px] overflow-hidden"
        }`}
      >
        {peopleList.map((p, index) => (
          <PersonRow key={index} person={p} />
        ))}
        {peopleList.length === 0 && (
          <div className="text-center text-gray-400 text-xs mt-16 italic">
            No employees assigned to this shift view
          </div>
        )}
      </div>

      {/* ---------------- FOOTER CONTROLS ---------------- */}
      {peopleList.length > 4 && (
        <div className="mt-auto border-t border-gray-100 shrink-0 text-right pt-2">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="text-[11px] text-blue-600 hover:text-blue-800 font-medium uppercase tracking-wide"
          >
            {showAll ? "Show Less" : "View All (Scroll)"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ShiftCard;
