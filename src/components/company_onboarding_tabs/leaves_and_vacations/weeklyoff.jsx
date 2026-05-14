import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { createWeeklyOff } from "../../../service/eventservice";
import { getBranchData } from "../../../service/staffservice";
import { fetchWeeklyOffShifts } from "../../../service/mainServices";

// -------------------- GlowButton Component --------------------
function GlowButton({ children = "Edit in Chat", onClick }) {
  return (
    <>
      <button className="chat-btn" onClick={onClick} type="button">
        <span className="label">{children}</span>
        <span className="glow" />
      </button>

      <style>{`
        .chat-btn {
          position: relative;
          padding: 10px 35px;
          border: none;
          border-radius: 8px;
          font-weight: 100;
          font-family: "Poppins", sans-serif;
          font-size: 12px;
          background: linear-gradient(180deg, #14161c, #0d0f14);
          color: white;
          overflow: visible;
          cursor: pointer;
          transition: transform 180ms cubic-bezier(.22, .61, .36, 1);
        }
        .chat-btn::before {
          content: "";
          position: absolute;
          inset: 0;
          padding: 0px 0px 3px 0px;
          border-radius: inherit;
          background: linear-gradient(90deg, #6d7cff, #a855f7, #ec4899, #6d7cff);
          background-size: 300% 100%;
          animation: slide 3s linear infinite;
          transition: padding 180ms cubic-bezier(.22, .61, .36, 1);
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
        }
        .chat-btn:hover::before { padding: 1px 1px 5px 1px; }
        .chat-btn:hover .glow { opacity: 0.8; filter: blur(18px); }
        .glow {
          position: absolute;
          left: 12%; right: 12%; bottom: -8px;
          height: 10px; border-radius: 9999px;
          background: linear-gradient(90deg, #6d7cff, #a855f7, #ec4899, #6d7cff);
          background-size: 300% 100%;
          animation: slide 3s linear infinite;
          filter: blur(16px); opacity: 0.55;
          transition: opacity 180ms ease, filter 180ms ease;
        }
        @keyframes slide {
          from { background-position: 0% 0; }
          to { background-position: 300% 0; }
        }
        .label { position: relative; z-index: 2; }
      `}</style>
    </>
  );
}

// -------------------- Main Component --------------------
const WeekendsAndOffDays = () => {
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear, currentYear + 1, currentYear + 2];

  const fullDayNames = {
    Sun: "Sunday",
    Mon: "Monday",
    Tue: "Tuesday",
    Wed: "Wednesday",
    Thu: "Thursday",
    Fri: "Friday",
    Sat: "Saturday",
  };

  const initialWeeks = [
    {
      label: "Week 01",
      days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      full: [],
      half1: [],
      half2: [],
    },
    {
      label: "Week 02",
      days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      full: [],
      half1: [],
      half2: [],
    },
    {
      label: "Week 03",
      days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      full: [],
      half1: [],
      half2: [],
    },
    {
      label: "Week 04",
      days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      full: [],
      half1: [],
      half2: [],
    },
  ];

  const [weeks, setWeeks] = useState(initialWeeks);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [shifts, setShifts] = useState([]);
  const [selectedShift, setSelectedShift] = useState("");
  const [selectedPolicyId, setSelectedPolicyId] = useState("");
  const [selectedYear, setSelectedYear] = useState(currentYear);

  useEffect(() => {
    fetchBranches();
    fetchShifts();
  }, []);

  const fetchBranches = async () => {
    try {
      const data = await getBranchData();
      setBranches(data);
      if (data && data.length > 0) {
        setSelectedBranch(data[0].id || "");
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  const fetchShifts = async () => {
    try {
      const [firstHalfData, secondHalfData] = await Promise.all([
        fetchWeeklyOffShifts("First Half"),
        fetchWeeklyOffShifts("Second Half"),
      ]);

      // We add a unique identifier to each shift object to avoid duplicate key errors
      const combinedShifts = [
        ...(firstHalfData || []),
        ...(secondHalfData || []),
      ];

      setShifts(combinedShifts);

      if (combinedShifts.length > 0) {
        setSelectedShift(combinedShifts[0].id);
        setSelectedPolicyId(combinedShifts[0].policy_id || "");
      }
    } catch (error) {
      console.error("Error fetching shifts:", error);
    }
  };

  const handleClear = () => {
    setWeeks(initialWeeks);
  };

  const handleDayClick = (weekIndex, dayIndex) => {
    setWeeks((prevWeeks) => {
      const newWeeks = [...prevWeeks];
      const week = { ...newWeeks[weekIndex] };
      const isFull = week.full.includes(dayIndex);
      const isHalf1 = week.half1.includes(dayIndex);
      const isHalf2 = week.half2.includes(dayIndex);

      week.full = week.full.filter((d) => d !== dayIndex);
      week.half1 = week.half1.filter((d) => d !== dayIndex);
      week.half2 = week.half2.filter((d) => d !== dayIndex);

      if (!isFull && !isHalf1 && !isHalf2) {
        week.full.push(dayIndex);
      } else if (isFull) {
        week.half1.push(dayIndex);
      } else if (isHalf1) {
        week.half2.push(dayIndex);
      }
      newWeeks[weekIndex] = week;
      return newWeeks;
    });
  };

  const handleCreate = async () => {
    if (!selectedBranch) {
      toast.error("Please select a branch");
      return;
    }
    if (!selectedShift) {
      toast.error("Please select a shift");
      return;
    }

    const payloadWeeklyOffs = [];
    weeks.forEach((week, weekIndex) => {
      const weekNumber = weekIndex + 1;

      week.full.forEach((dayIndex) => {
        payloadWeeklyOffs.push({
          day: fullDayNames[week.days[dayIndex]],
          type: "Specific",
          weeks: [weekNumber],
          is_half_day: false,
          shift_id: parseInt(selectedShift),
          policy_id: selectedPolicyId,
        });
      });

      week.half1.forEach((dayIndex) => {
        payloadWeeklyOffs.push({
          day: fullDayNames[week.days[dayIndex]],
          type: "Specific",
          weeks: [weekNumber],
          is_half_day: true,
          half_day_type: "First Half",
          shift_id: parseInt(selectedShift),
          policy_id: selectedPolicyId,
        });
      });

      week.half2.forEach((dayIndex) => {
        payloadWeeklyOffs.push({
          day: fullDayNames[week.days[dayIndex]],
          type: "Specific",
          weeks: [weekNumber],
          is_half_day: true,
          half_day_type: "Second Half",
          shift_id: parseInt(selectedShift),
          policy_id: selectedPolicyId,
        });
      });
    });

    if (payloadWeeklyOffs.length === 0) {
      toast.error("Please select at least one day on the calendar");
      return;
    }

    const payload = {
      year: parseInt(selectedYear),
      branch: selectedBranch.toString(),
      weeklyOffs: payloadWeeklyOffs,
    };

    try {
      const response = await createWeeklyOff(payload);
      toast.success(response?.message || "Weekly off created successfully!");
      setWeeks(initialWeeks);
    } catch (error) {
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to create weekly off";
      toast.error(errorMsg);
    }
  };

  const labelClass = "text-[12px] font-medium text-gray-700 mb-2 block ml-1";
  const selectClass =
    "w-full py-2 bg-white border border-gray-200 rounded-xl text-[13px] appearance-none focus:outline-none text-gray-600 h-[45px] font-poppins shadow-sm px-4";

  return (
    <div className="w-full bg-[#F4F7F9] p-6 font-poppins">
      <Toaster position="top-right" reverseOrder={false} />
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[20px] text-gray-900">Weekends and Off days</h2>
      </div>

      <div className="flex flex-col lg:flex-row gap-2">
        <div className="w-full lg:w-[45%] flex flex-col">
          <div className="bg-[#F8FAFB] p-8 rounded-3xl border border-gray-100 flex-grow">
            <h3 className="text-[18px] text-gray-900 mb-1">Select the days</h3>
            <p className="text-[13px] text-gray-400 mb-8 leading-snug max-w-[300px]">
              The selected weekly off days apply to all weeks throughout the
              year.
            </p>

            <div className="grid grid-cols-2 gap-6">
              <div className="relative col-span-1">
                <label className={labelClass}>Select Branch</label>
                <select
                  className={selectClass}
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                >
                  <option value="" disabled>
                    Select Branch
                  </option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.branch_name || b.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-4 top-[42px] text-gray-400 pointer-events-none"
                  size={16}
                />
              </div>

              <div className="relative col-span-1">
                <label className={labelClass}>Select Year</label>
                <select
                  className={selectClass}
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-4 top-[42px] text-gray-400 pointer-events-none"
                  size={16}
                />
              </div>

              <div className="relative col-span-2">
                <label className={labelClass}>Select Shift</label>
                <select
                  className={selectClass}
                  value={selectedShift}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedShift(val);
                    const shiftObj = shifts.find(
                      (s) => s.id.toString() === val.toString(),
                    );
                    setSelectedPolicyId(shiftObj?.policy_id || "");
                  }}
                >
                  <option value="" disabled>
                    Select Shift
                  </option>
                  {shifts.map((s, idx) => (
                    <option key={`${s.id}-${idx}`} value={s.id}>
                      {/* Use a fallback if half_day_type is missing */}
                      {s.shift_name}{" "}
                      {s.half_day_type ? `(${s.half_day_type})` : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-4 top-[42px] text-gray-400 pointer-events-none"
                  size={16}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-7 items-center">
              <button
                onClick={handleClear}
                className="px-10 py-2.5 border border-gray-300 rounded-xl text-[14px] font-semibold text-gray-900 bg-white hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
              <GlowButton onClick={handleCreate}>Create</GlowButton>
            </div>
          </div>

          <div className="mt-4 space-y-2 px-2">
            <p className="text-[12px] font-medium text-gray-900 mb-3">Info:</p>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-[#96E0BC] rounded-[4px]"></div>
              <span className="text-[12px] text-gray-500">
                1st Click: Full Day
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="w-5 h-5 rounded-[4px]"
                style={{
                  background:
                    "linear-gradient(to bottom, #C6EBF4 50%, #F4F7F8 50%)",
                }}
              ></div>
              <span className="text-[12px] text-gray-500">
                2nd Click: 1st Half Day
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="w-5 h-5 rounded-[4px]"
                style={{
                  background:
                    "linear-gradient(to top, #C6EBF4 50%, #F4F7F8 50%)",
                }}
              ></div>
              <span className="text-[12px] text-gray-500">
                3rd Click: 2nd Half Day
              </span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[55%] bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between min-h-[550px]">
          <div className="space-y-8">
            {weeks.map((week, wIdx) => (
              <div key={wIdx}>
                <label className="text-[13px] text-gray-900 mb-3 block">
                  {week.label}
                </label>
                <div className="flex justify-between items-center">
                  {week.days.map((day, dIdx) => {
                    let style = {};
                    let className = "bg-[#F4F7F8]";
                    if (week.full.includes(dIdx)) className = "bg-[#96E0BC]";
                    else if (week.half1.includes(dIdx))
                      style = {
                        background:
                          "linear-gradient(to bottom, #C6EBF4 50%, #F4F7F8 50%)",
                      };
                    else if (week.half2.includes(dIdx))
                      style = {
                        background:
                          "linear-gradient(to top, #C6EBF4 50%, #F4F7F8 50%)",
                      };

                    return (
                      <div
                        key={dIdx}
                        onClick={() => handleDayClick(wIdx, dIdx)}
                        style={style}
                        className={`w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-xl text-[13px] font-medium text-gray-700 cursor-pointer transition-all ${className}`}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeekendsAndOffDays;
