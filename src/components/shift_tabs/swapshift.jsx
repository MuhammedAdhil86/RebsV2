import React, { useState, useEffect, useMemo, useRef } from "react";
import { Icon } from "@iconify/react";
import {
  getEffectiveAllocations,
  executeShiftSwap,
} from "../../service/policiesService";
import { getDepartmentData } from "../../service/staffservice";

// ✅ toast: react-toastify helpers (backend message + data/error)
import {
  showApiToast,
  showApiSuccess,
  showApiError,
  getApiBody,
} from "../../utils/apiToast";

// ✅ badge: full class names so Tailwind can detect them
const SHIFT_BADGE_COLORS = [
  "bg-blue-100 text-blue-800 border-blue-200",
  "bg-green-100 text-green-800 border-green-200",
  "bg-orange-100 text-orange-800 border-orange-200",
  "bg-purple-100 text-purple-800 border-purple-200",
  "bg-pink-100 text-pink-800 border-pink-200",
  "bg-teal-100 text-teal-800 border-teal-200",
  "bg-yellow-100 text-yellow-800 border-yellow-200",
  "bg-indigo-100 text-indigo-800 border-indigo-200",
  "bg-red-100 text-red-800 border-red-200",
  "bg-cyan-100 text-cyan-800 border-cyan-200",
  "bg-lime-100 text-lime-800 border-lime-200",
  "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
];
const OFF_BADGE = "bg-gray-100 text-gray-600 border-gray-200";

export default function SwapShift() {
  const [currentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  // "YYYY-MM" as expected by ?month=
  const monthParam = `${currentMonth.getFullYear()}-${String(
    currentMonth.getMonth() + 1,
  ).padStart(2, "0")}`;

  // All allocation rows (every employee of the effective department, every date)
  const [allRows, setAllRows] = useState([]);

  const [departments, setDepartments] = useState([]);
  // "" = logged-in user's own department (backend default)
  const [selectedDepartment, setSelectedDepartment] = useState("");

  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [notification, setNotification] = useState({ type: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [calendarEmployeeFilter, setCalendarEmployeeFilter] = useState("");

  const dateInputRef = useRef(null);

  const openDatePicker = () => {
    const el = dateInputRef.current;
    if (!el) return;
    if (typeof el.showPicker === "function") el.showPicker();
    else el.focus();
  };

  const [formData, setFormData] = useState({
    fromEmployee: "",
    fromShift: "",
    toEmployee: "",
    toShift: "",
    selectedDate: "",
  });

  // Reusable custom Chevron Down SVG Arrow
  const DropdownArrow = () => (
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-400">
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );

  // Employee dropdown options, derived from the loaded rows
  const allEmployees = useMemo(
    () =>
      Array.from(new Map(allRows.map((r) => [r.user_id, r])).values()).map(
        (emp) => ({
          id: emp.user_id,
          name: emp.employee_name?.trim() || "Unknown Staff",
        }),
      ),
    [allRows],
  );

  // ✅ badge: each distinct shift name gets its own color (stable, sorted by name)
  const shiftColorMap = useMemo(() => {
    const names = Array.from(
      new Set(allRows.map((r) => r.shift_name?.trim()).filter(Boolean)),
    ).sort();
    return Object.fromEntries(
      names.map((n, i) => [
        n,
        SHIFT_BADGE_COLORS[i % SHIFT_BADGE_COLORS.length],
      ]),
    );
  }, [allRows]);

  const getShiftBadgeClass = (name) => shiftColorMap[name?.trim()] || OFF_BADGE;

  // Shift of an employee on a specific date
  const getShiftForDate = (empId, isoDate) => {
    if (!empId) return "";
    if (!isoDate) return "Select a date first";
    const day = isoDate.split("T")[0];
    const row = allRows.find(
      (r) => r.user_id === empId && r.date?.split("T")[0] === day,
    );
    return row?.shift_name ? row.shift_name.trim() : "Unassigned / Off Day";
  };

  // Single place that builds the request: ?month=YYYY-MM[&department=ID]
  const loadAllocations = () =>
    getEffectiveAllocations({
      month: monthParam,
      departmentId: selectedDepartment || undefined,
    });

  // Automatically clear notifications after 6 seconds
  useEffect(() => {
    if (notification.message) {
      const timer = setTimeout(() => {
        setNotification({ type: "", message: "" });
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // 1. Load departments once
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const list = await getDepartmentData();
        if (!ignore) setDepartments(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("Department load error:", err);
        if (!ignore) showApiError(err, "Failed to load departments"); // ✅ toast
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  // 2. Load allocations for the month + department (race-condition safe)
  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const resData = await loadAllocations();
        if (ignore) return;
        if (
          resData &&
          resData.status_code === 200 &&
          Array.isArray(resData.data)
        ) {
          setAllRows(resData.data);
        } else {
          setAllRows([]);
          setNotification({
            type: "error",
            message:
              resData?.message ||
              "Failed to fetch effective shifts parameters.",
          });
          // ✅ toast
          showApiToast(
            "error",
            resData?.message || "Failed to fetch effective shifts parameters.",
            resData?.data,
          );
        }
      } catch (err) {
        if (ignore) return;
        console.error("API error fetching allocations:", err);
        setAllRows([]);
        setNotification({
          type: "error",
          message: err.message || "Something went wrong while loading shifts.",
        });
        showApiError(err, "Something went wrong while loading shifts."); // ✅ toast
      } finally {
        if (!ignore) {
          setLoading(false);
          setHasLoadedOnce(true);
        }
      }
    })();
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthParam, selectedDepartment]);

  // 3. Keep "Assigned Shift" / "Target Shift" in sync with employee + selected date
  useEffect(() => {
    setFormData((prev) => {
      const fromShift = getShiftForDate(prev.fromEmployee, prev.selectedDate);
      const toShift = getShiftForDate(prev.toEmployee, prev.selectedDate);
      if (fromShift === prev.fromShift && toShift === prev.toShift) return prev;
      return { ...prev, fromShift, toShift };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData.fromEmployee,
    formData.toEmployee,
    formData.selectedDate,
    allRows,
  ]);

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0,
  ).getDate();
  const firstDay = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1,
  ).getDay();
  const calendarDays = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Which employee's shifts the calendar displays
  const calendarEmployeeId =
    calendarEmployeeFilter ||
    formData.fromEmployee ||
    allEmployees[0]?.id ||
    "";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDepartmentChange = (e) => {
    setSelectedDepartment(e.target.value);
    setAllRows([]); // drop previous department's staff right away
    // employees belong to the old department, so reset everything tied to them
    setCalendarEmployeeFilter("");
    setFormData({
      fromEmployee: "",
      fromShift: "",
      toEmployee: "",
      toShift: "",
      selectedDate: "",
    });
  };

  const handleDateChange = (e) => {
    const rawDate = e.target.value;
    setFormData((prev) => ({
      ...prev,
      selectedDate: rawDate ? `${rawDate}T00:00:00Z` : "",
    }));
  };

  const handleSwapSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.fromEmployee ||
      !formData.toEmployee ||
      !formData.selectedDate
    ) {
      setNotification({
        type: "error",
        message:
          "Validation Error: Please select an initiator, target employee, and swap date.",
      });
      showApiToast(
        "error",
        "Please select an initiator, target employee, and swap date.",
      ); // ✅ toast
      return;
    }

    if (formData.fromEmployee === formData.toEmployee) {
      setNotification({
        type: "error",
        message: "Validation Error: Can't swap with same user.",
      });
      showApiToast("error", "Can't swap with same user."); // ✅ toast
      return;
    }

    // Swapping identical shifts does nothing (remove this block if not wanted)
    if (formData.fromShift === formData.toShift) {
      setNotification({
        type: "error",
        message:
          "Validation Error: Both employees already have the same shift on this date.",
      });
      showApiToast(
        "error",
        "Both employees already have the same shift on this date.",
      ); // ✅ toast
      return;
    }

    setSubmitting(true);
    setNotification({ type: "", message: "" });

    const payload = {
      employee_1_id: formData.fromEmployee,
      employee_2_id: formData.toEmployee,
      swap_date: formData.selectedDate,
    };

    try {
      const result = await executeShiftSwap(payload);

      if (result && (result.success || result.status_code === 200)) {
        setNotification({
          type: "success",
          message: result.message || "Shift swapped successfully!",
        });
        showApiSuccess(result, "Shift swapped successfully!"); // ✅ toast

        const freshData = await loadAllocations();
        if (freshData?.status_code === 200 && Array.isArray(freshData.data))
          setAllRows(freshData.data);
      } else {
        const combinedErr = result?.data
          ? `${result.message}: ${result.data}`
          : result?.message || "shift swap failed";
        setNotification({
          type: "error",
          message: combinedErr,
        });
        // ✅ toast
        const body = getApiBody(result);
        showApiToast("error", body?.message || "Shift swap failed", body?.data);
      }
    } catch (err) {
      let rawString =
        err.response?.data ||
        err.request?.responseText ||
        err.responseText ||
        "";

      if (rawString && typeof rawString === "object") {
        rawString = JSON.stringify(rawString);
      }

      let finalErrorMessage = "";

      if (typeof rawString === "string" && rawString.includes("message")) {
        try {
          const parsed = JSON.parse(rawString.trim());
          if (parsed?.message && parsed?.data) {
            finalErrorMessage = `${parsed.message}: ${parsed.data}`;
          } else if (parsed?.message) {
            finalErrorMessage = parsed.message;
          }
        } catch (parseErr) {
          const messageMatch = rawString.match(/"message"\s*:\s*"([^"]+)"/);
          const dataMatch = rawString.match(/"data"\s*:\s*"([^"]+)"/);

          if (messageMatch && dataMatch) {
            finalErrorMessage = `${messageMatch[1]}: ${dataMatch[1]}`;
          } else if (messageMatch) {
            finalErrorMessage = messageMatch[1];
          }
        }
      }

      if (!finalErrorMessage) {
        finalErrorMessage =
          err.message ||
          "shift swap failed: Network pipeline exception occurred.";
      }

      showApiError(err, "Shift swap failed"); // ✅ toast

      setNotification({
        type: "error",
        message: finalErrorMessage,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !hasLoadedOnce) {
    return (
      <div className="flex justify-center items-center p-20 bg-white rounded-b-lg text-sm text-gray-500 font-normal">
        Loading active business allocations dashboard array payload...
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-b-lg font-normal">
      {/* Unified Notification View Node showing combined message directly */}
      {notification.message && (
        <div
          className={`mb-4 p-3 rounded-lg text-xs font-normal border transition-all duration-300 ${
            notification.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : notification.type === "error"
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-blue-50 border-blue-200 text-blue-800"
          }`}
        >
          <span className="capitalize font-normal">{notification.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left Section (Form Controls) */}
        <div className="xl:col-span-1 space-y-5 border-r border-gray-100 pr-0 xl:pr-6 font-normal">
          <div>
            <h2 className="text-base font-normal text-gray-800 flex items-center gap-1.5">
              Swap
              <svg
                className="h-4 w-4 text-gray-500 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
              Shift
            </h2>
            <p className="text-xs text-gray-500 font-normal">
              Configure the exchange data allocations framework down below.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSwapSubmit}>
            {/* From Employee Dropdown */}
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50/50 space-y-3 font-normal">
              <div className="flex justify-between items-center border-b pb-1.5">
                <h3 className="text-[12px] font-normal text-gray-700">
                  From (Initiator)
                </h3>
                {formData.fromEmployee && (
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({
                        ...p,
                        fromEmployee: "",
                        fromShift: "",
                        selectedDate: "",
                      }))
                    }
                    className="text-[10px] text-red-500 hover:underline font-normal"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
              <div className="relative">
                <select
                  name="fromEmployee"
                  value={formData.fromEmployee}
                  onChange={handleChange}
                  className="w-full text-xs border border-gray-300 rounded-md p-2 pr-8 bg-white focus:outline-none focus:ring-1 focus:ring-black font-normal appearance-none cursor-pointer"
                >
                  <option value="">-- Choose Employee --</option>
                  {allEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id} className="font-normal">
                      {emp.name} ({emp.id})
                    </option>
                  ))}
                </select>
                <DropdownArrow />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-normal text-gray-500 mb-1">
                  Assigned Shift
                </label>
                {/* ✅ badge */}
                <div className="w-full min-h-[34px] flex items-center border border-gray-200 rounded-md p-2 bg-gray-100">
                  {formData.fromShift ? (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded border ${getShiftBadgeClass(
                        formData.fromShift,
                      )}`}
                    >
                      {formData.fromShift}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">
                      No employee selected
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* To Target Employee Dropdown */}
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50/50 space-y-3 font-normal">
              <h3 className="text-[12px] font-normal text-gray-700 border-b pb-1.5">
                To (Target Swap)
              </h3>
              <div className="relative">
                <select
                  name="toEmployee"
                  value={formData.toEmployee}
                  onChange={handleChange}
                  className="w-full text-xs border border-gray-300 rounded-md p-2 pr-8 bg-white focus:outline-none focus:ring-1 focus:ring-black font-normal appearance-none cursor-pointer"
                >
                  <option value="">-- Choose Employee --</option>
                  {allEmployees
                    .filter((emp) => emp.id !== formData.fromEmployee)
                    .map((emp) => (
                      <option
                        key={emp.id}
                        value={emp.id}
                        className="font-normal"
                      >
                        {emp.name} ({emp.id})
                      </option>
                    ))}
                </select>
                <DropdownArrow />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-normal text-gray-500 mb-1">
                  Target Shift
                </label>
                {/* ✅ badge */}
                <div className="w-full min-h-[34px] flex items-center border border-gray-200 rounded-md p-2 bg-gray-100">
                  {formData.toShift ? (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded border ${getShiftBadgeClass(
                        formData.toShift,
                      )}`}
                    >
                      {formData.toShift}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">
                      No employee selected
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Swap Date Target Dropdown */}
            <div>
              <label className="block text-[10px] uppercase font-normal text-gray-500 mb-1">
                Target Swap Date
              </label>
              <div className="relative">
                <input
                  ref={dateInputRef}
                  type="date"
                  value={
                    formData.selectedDate
                      ? formData.selectedDate.split("T")[0]
                      : ""
                  }
                  onChange={handleDateChange}
                  className="w-full text-xs border border-gray-300 rounded-md p-2 pr-8 bg-white text-gray-700 font-normal outline-none focus:ring-1 focus:ring-black cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden"
                />
                <button
                  type="button"
                  onClick={openDatePicker}
                  aria-label="Open date picker"
                  className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-800 hover:text-black"
                >
                  <Icon icon="solar:calendar-outline" className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-2 text-xs font-normal text-white bg-black rounded-md hover:bg-gray-800 disabled:bg-gray-400 transition-colors shadow-sm"
            >
              {submitting ? "Processing Swap..." : "Approve & Swap"}
            </button>
          </form>
        </div>

        {/* Right Calendar Section */}
        <div className="xl:col-span-3 relative font-normal">
          <div className="flex justify-between items-center mb-3 py-1 gap-4">
            <span className="text-black text-sm font-normal whitespace-nowrap">
              {currentMonth.toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </span>

            {/* Right Side Employee Dropdown Filter */}
            <div className="flex items-center gap-2 max-w-md w-full justify-end">
              {/* Department Dropdown */}
              <div className="relative max-w-[200px] w-full">
                <select
                  value={selectedDepartment}
                  onChange={handleDepartmentChange}
                  className="text-xs border border-gray-300 rounded-md p-1.5 pr-8 bg-white focus:outline-none focus:ring-1 focus:ring-black font-normal w-full appearance-none cursor-pointer"
                >
                  <option value="">-- My Department --</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                <DropdownArrow />
              </div>

              <div className="relative max-w-[200px] w-full">
                <select
                  value={calendarEmployeeFilter}
                  onChange={(e) => setCalendarEmployeeFilter(e.target.value)}
                  className="text-xs border border-gray-300 rounded-md p-1.5 pr-8 bg-white focus:outline-none focus:ring-1 focus:ring-black font-normal w-full appearance-none cursor-pointer"
                >
                  <option value="">
                    {loading
                      ? "Loading staff..."
                      : "-- Filter Calendar By Staff --"}
                  </option>
                  {allEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
                <DropdownArrow />
              </div>
            </div>
          </div>

          <div className="border border-gray-300 rounded-xl overflow-hidden shadow-sm bg-white font-normal">
            <div className="grid grid-cols-7 border-b border-gray-300 bg-black/[0.01]">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div
                  key={d}
                  className="py-2 text-center text-[11px] font-normal text-gray-500 uppercase"
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {calendarDays.map((day, idx) => {
                let shiftDetails = null;
                let targetDateStr = "";

                if (day) {
                  targetDateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  shiftDetails = allRows.find(
                    (item) =>
                      item.date &&
                      item.date.split("T")[0] === targetDateStr &&
                      (!calendarEmployeeId ||
                        item.user_id === calendarEmployeeId),
                  );
                }

                const isSelected =
                  formData.selectedDate.startsWith(targetDateStr) &&
                  targetDateStr !== "";

                return (
                  <div
                    key={idx}
                    className={`min-h-[95px] border-r border-b border-gray-200 p-2 flex flex-col justify-between last:border-r-0 font-normal transition-all ${
                      isSelected
                        ? "bg-black/[0.04] ring-1 ring-inset ring-black/30"
                        : shiftDetails
                          ? "bg-blue-50/20"
                          : "bg-white"
                    } ${!day ? "bg-black/[0.01]" : ""}`}
                  >
                    {day && (
                      <>
                        <span
                          className={`text-xs font-normal ${shiftDetails ? "text-black" : "text-gray-400"}`}
                        >
                          {day}
                        </span>
                        {shiftDetails && (
                          <div className="mt-1 flex-grow flex flex-col justify-between font-normal">
                            <div>
                              {/* ✅ badge */}
                              <span
                                className={`inline-block max-w-full truncate text-[10px] px-1.5 py-0.5 rounded border ${getShiftBadgeClass(
                                  shiftDetails.shift_name,
                                )}`}
                              >
                                {shiftDetails.shift_name
                                  ? shiftDetails.shift_name.trim()
                                  : "Unassigned / Off"}
                              </span>
                              <p className="text-[9px] text-gray-500 font-normal truncate mt-0.5">
                                {shiftDetails.employee_name}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-1 mt-1 font-normal">
                              {shiftDetails.is_cross_shift === true && (
                                <span className="bg-amber-100 text-amber-800 text-[8px] font-normal px-1 rounded">
                                  Cross
                                </span>
                              )}
                              {shiftDetails.is_default === true && (
                                <span className="bg-purple-100 text-purple-800 text-[8px] font-normal px-1 rounded">
                                  Default
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
