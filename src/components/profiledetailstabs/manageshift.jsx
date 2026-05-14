import React, { useState, useEffect } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiCoffee,
  FiPlus,
  FiX,
} from "react-icons/fi";
import { fetchEmployeeShifts } from "../../service/employeeService";
import { fetchShifts, allocateShift } from "../../service/policiesService";
import CustomSelect from "../../ui/customselect";
import toast, { Toaster } from "react-hot-toast";

const ManageShiftTab = ({ employeeUUID }) => {
  // --- States ---
  const [shifts, setShifts] = useState({}); // Calendar data
  const [availableShifts, setAvailableShifts] = useState([]); // Master list for dropdown
  const [loading, setLoading] = useState(true);

  // Logic to handle current month/year view
  const [viewDate, setViewDate] = useState(new Date(2026, 6, 1));

  // --- Modal & Allocation States ---
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [selectedShiftId, setSelectedShiftId] = useState("");
  const [shiftFrom, setShiftFrom] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [shiftTo, setShiftTo] = useState("");

  // --- Load Calendar Data ---
  const loadShifts = async () => {
    if (!employeeUUID) return;
    try {
      setLoading(true);
      // Fetches shifts for the specific employee
      const data = await fetchEmployeeShifts(
        "2026-07-01",
        "2026-09-09",
        employeeUUID,
      );

      const shiftMap = {};
      if (Array.isArray(data)) {
        data.forEach((s) => {
          const dateKey = s.date.split("T")[0];
          shiftMap[dateKey] = s;
        });
      }
      setShifts(shiftMap);
    } catch (error) {
      console.error("Error loading shifts:", error);
      toast.error("Failed to load shift records");
    } finally {
      setLoading(false);
    }
  };

  // --- Load Master Shift List for Dropdown ---
  useEffect(() => {
    const getShiftsList = async () => {
      try {
        const data = await fetchShifts();
        setAvailableShifts(data || []);
      } catch (error) {
        toast.error("Failed to fetch master shifts");
      }
    };
    getShiftsList();
  }, []);

  useEffect(() => {
    loadShifts();
  }, [employeeUUID]);

  // --- Allocation Handler (Fixed for 400 Error) ---
  const handleSaveAllocation = async () => {
    if (!selectedShiftId || !shiftFrom) {
      toast.error("Please select shift and Effective From date.");
      return;
    }

    try {
      // Helper to convert simple date YYYY-MM-DD to Full ISO required by backend
      const toFullISO = (dateStr) => {
        if (!dateStr) return null;
        const d = new Date(dateStr);
        return d.toISOString(); // Returns "2026-08-11T00:00:00.000Z"
      };

      const payload = {
        shift_id: Number(selectedShiftId),
        staff_id: employeeUUID,
        from_date: toFullISO(shiftFrom),
        to_date: shiftTo ? toFullISO(shiftTo) : null,
      };

      await allocateShift(payload);
      toast.success("Shift allocated successfully!");
      setShowShiftModal(false);
      loadShifts(); // Refresh the calendar grid
    } catch (error) {
      const serverMsg =
        error.response?.data?.message || "Failed to update shift";
      toast.error(serverMsg);
      console.error("Allocation Error Details:", error.response?.data);
    }
  };

  // --- Calendar Helper Functions ---
  const shiftOptions = availableShifts.map((s) => ({
    label: s.shift_name,
    value: s.id,
  }));

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth(),
    1,
  ).getDay();

  const prevMonth = () =>
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const nextMonth = () =>
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  const renderCalendarCells = () => {
    const totalDays = daysInMonth(viewDate.getFullYear(), viewDate.getMonth());
    const cells = [];

    // Empty cells for padding
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push(
        <div
          key={`pad-${i}`}
          className="h-36 bg-gray-50/30 border-[0.5px] border-gray-100"
        />,
      );
    }

    // Actual day cells
    for (let day = 1; day <= totalDays; day++) {
      const dateKey = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const shift = shifts[dateKey];

      cells.push(
        <div
          key={day}
          className="h-36 bg-white border-[0.5px] border-gray-100 p-3 hover:bg-gray-50 transition-all flex flex-col font-normal"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          <div className="flex justify-between items-start mb-1">
            <span
              className={`text-[10px] ${shift ? "text-black" : "text-gray-300"}`}
            >
              {day}
            </span>
          </div>

          {shift ? (
            <div className="flex flex-col flex-1 justify-between">
              <div>
                <p className="text-[9px] bg-gray-200 rounded-md px-2 truncate mb-2">
                  {shift.shift_type}
                </p>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] items-center">
                    <span className="text-gray-400 text-[8px]">IN</span>
                    <span className="text-gray-700">{shift.in_time}</span>
                  </div>
                  <div className="flex justify-between text-[10px] items-center">
                    <span className="text-gray-400 text-[8px]">OUT</span>
                    <span className="text-gray-700">{shift.out_time}</span>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-2 border-t border-gray-50 space-y-1">
                <div className="flex flex-col items-center justify-center text-[9px] text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <FiClock size={10} className="text-gray-400" />
                    <span>Work: {shift.work_hours} hrs</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <FiCoffee size={10} className="text-gray-400" />
                    <span>Break: {shift.break_time || "00:00"}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>,
      );
    }
    return cells;
  };

  return (
    <div
      className="bg-white border border-gray-100 shadow-xl overflow-hidden font-normal"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <Toaster position="top-right" />

      {/* --- HEADER --- */}
      <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white">
        <div>
          <h3 className="text-lg text-gray-900 font-normal">Shift Manager</h3>
          <p className="text-[10px] text-gray-400 uppercase tracking-tight font-normal">
            Schedule History
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowShiftModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-[10px] uppercase tracking-[0.15em] hover:bg-gray-800 transition-all active:scale-95 shadow-md"
          >
            <FiPlus size={14} />
            Allocate
          </button>

          <div className="flex items-center border border-gray-100 p-1 shadow-sm">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-gray-50 transition-all text-gray-400 hover:text-black"
            >
              <FiChevronLeft size={20} />
            </button>
            <span className="text-[11px] px-6 min-w-[160px] text-center uppercase tracking-[0.15em] text-gray-800 font-normal">
              {viewDate.toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </span>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-50 transition-all text-gray-400 hover:text-black"
            >
              <FiChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* --- CALENDAR GRID --- */}
      <div className="p-4 relative">
        {loading && (
          <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-md flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <div className="grid grid-cols-7 border-t border-l border-gray-100 shadow-inner">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="py-4 bg-gray-50/50 text-center text-[10px] text-gray-400 uppercase tracking-[0.3em] border-r border-b border-gray-100 font-normal"
            >
              {day}
            </div>
          ))}
          {renderCalendarCells()}
        </div>
      </div>

      {/* --- ALLOCATION MODAL --- */}
      {showShiftModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] backdrop-blur-[2px]">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-[360px] animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-gray-900 text-[16px]">
                Allocate New Shift
              </h3>
              <button
                onClick={() => setShowShiftModal(false)}
                className="text-gray-400 hover:text-black transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] text-gray-400 uppercase tracking-wider block mb-1.5">
                  Select Shift
                </label>
                <CustomSelect
                  value={selectedShiftId}
                  options={shiftOptions}
                  onChange={(val) => setSelectedShiftId(Number(val))}
                  minWidth={312}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-gray-400 uppercase tracking-wider block mb-1.5">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={shiftFrom}
                    onChange={(e) => setShiftFrom(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none bg-gray-50 focus:border-black transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-400 uppercase tracking-wider block mb-1.5">
                    To (Optional)
                  </label>
                  <input
                    type="date"
                    value={shiftTo}
                    onChange={(e) => setShiftTo(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none bg-gray-50 focus:border-black transition-colors"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveAllocation}
                className="bg-black text-white w-full py-3 rounded-lg mt-4 text-[11px] uppercase tracking-widest font-medium hover:bg-gray-800 transition-all shadow-lg active:scale-95"
              >
                Confirm Allocation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageShiftTab;
