import React, { useEffect, useState, useRef } from "react";
import { DropdownMenuIcon } from "@radix-ui/react-icons";
import useShiftDashboardStore from "../../../store/shiftoverviewStore";

const ShiftCard = ({ className }) => {
  const dropdownRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const { shiftDetails, selectedShiftName, changeShift } =
    useShiftDashboardStore();

  const selectedShift = shiftDetails.find(
    (s) => s.shift_name === selectedShiftName,
  );
  const peopleList = selectedShift?.users || [];

  /* ---------------- OUTSIDE CLICK ---------------- */
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
    /* We set a fixed height of 52px for each row to calculate the container height exactly */
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
      /* Locked Card Height */
      className={`bg-white rounded-xl p-4 shadow-sm w-full h-[300px] max-h-[360px] flex flex-col overflow-hidden ${className}`}
    >
      {/* ---------------- HEADER ---------------- */}
      <div className="flex justify-between items-start mb-2 shrink-0">
        <div
          ref={dropdownRef}
          className="relative flex items-center gap-1 text-[14px] text-gray-800 cursor-pointer font-medium"
          onClick={() => setOpen(!open)}
        >
          {selectedShiftName || "Select Shift"}
          <DropdownMenuIcon className="w-5 h-5 text-gray-500" />

          {open && (
            <div className="absolute top-7 left-0 w-52 bg-white border rounded-lg shadow-lg z-[9999] py-1">
              {shiftDetails.map((shift) => (
                <div
                  key={shift.shift_name}
                  onClick={() => {
                    changeShift(shift.shift_name);
                    setShowAll(false);
                    setOpen(false);
                  }}
                  className={`px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer ${
                    selectedShiftName === shift.shift_name
                      ? "bg-gray-50 font-medium text-blue-600"
                      : ""
                  }`}
                >
                  {shift.shift_name}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-green-100 text-green-600 rounded-full px-3 py-1 text-xs font-medium shrink-0">
          {peopleList.length} Staffs
        </div>
      </div>

      {/* ---------------- LIST AREA ---------------- */}
      <div
        /* 1. We always provide the full 'peopleList'.
           2. If showAll is FALSE: we set a max-height that only fits 4 rows (~210px).
           3. If showAll is TRUE: we allow it to fill the card and scroll.
        */
        className={`flex-1 min-h-0 pr-1 transition-all duration-300 ${
          showAll ? "overflow-y-auto" : "max-h-[210px] overflow-hidden"
        }`}
      >
        {peopleList.map((p, index) => (
          <PersonRow key={index} person={p} />
        ))}
      </div>

      {/* ---------------- FOOTER ---------------- */}
      {peopleList.length > 4 && (
        <div className="mt-auto  border-t border-gray-100 shrink-0 text-right">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-[11px] text-blue-600 hover:text-blue-800 uppercase"
          >
            {showAll ? "Show Less" : "View All (Scroll)"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ShiftCard;
