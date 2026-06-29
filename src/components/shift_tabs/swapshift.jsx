import React, { useState, useEffect } from "react";
import {
  fetchShiftAllocationsforSwap,
  executeShiftSwap,
} from "../../service/policiesService";

export default function SwapShift() {
  const [currentMonth] = useState(new Date("2026-06-01"));
  const [apiShiftData, setApiShiftData] = useState([]);

  // Master list of employees to keep dropdowns functional at all times
  const [allEmployees, setAllEmployees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Simplified unified notification state string to eliminate object parsing friction
  const [notification, setNotification] = useState({ type: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [calendarEmployeeFilter, setCalendarEmployeeFilter] = useState("");

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

  // Automatically clear notifications after 6 seconds
  useEffect(() => {
    if (notification.message) {
      const timer = setTimeout(() => {
        setNotification({ type: "", message: "" });
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // 1. Initial Load: Fetch full company payload to establish stable dropdown options
  useEffect(() => {
    const initializeStaffList = async () => {
      try {
        const resData = await fetchShiftAllocationsforSwap(null);
        if (
          resData &&
          resData.status_code === 200 &&
          Array.isArray(resData.data)
        ) {
          // Extract unique employees and map their structures
          const uniqueMap = Array.from(
            new Map(resData.data.map((item) => [item.user_id, item])).values(),
          ).map((emp) => ({
            id: emp.user_id,
            name: emp.employee_name || "Unknown Staff",
            currentShift: emp.shift_name
              ? emp.shift_name.trim()
              : "Unassigned / Off Day",
          }));
          setAllEmployees(uniqueMap);
        }
      } catch (err) {
        console.error("Initialization error:", err);
      }
    };
    initializeStaffList();
  }, []);

  // 2. Calendar Logic Sync: Runs on every component filter adjustment safely
  useEffect(() => {
    const getEffectiveShifts = async () => {
      setLoading(true);
      setError(null);
      try {
        const targetUuid =
          calendarEmployeeFilter || formData.fromEmployee || null;
        const resData = await fetchShiftAllocationsforSwap(targetUuid);

        if (resData && resData.status_code === 200) {
          setApiShiftData(resData.data || []);
        } else {
          setError("Failed to fetch effective shifts parameters.");
        }
      } catch (err) {
        console.error("API error fetching allocations:", err);
        setError(err.message || "Something went wrong while loading shifts.");
      } finally {
        setLoading(false);
      }
    };

    getEffectiveShifts();
  }, [formData.fromEmployee, calendarEmployeeFilter]);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "fromEmployee") {
        const emp = allEmployees.find((e) => e.id === value);
        updated.fromShift = emp ? emp.currentShift : "";
      }
      if (name === "toEmployee") {
        const emp = allEmployees.find((e) => e.id === value);
        updated.toShift = emp ? emp.currentShift : "";
      }
      return updated;
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
      return;
    }

    if (formData.fromEmployee === formData.toEmployee) {
      setNotification({
        type: "error",
        message: "Validation Error: Can't swap with same user.",
      });
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

        const freshData = await fetchShiftAllocationsforSwap(
          calendarEmployeeFilter || formData.fromEmployee || null,
        );
        if (freshData?.status_code === 200)
          setApiShiftData(freshData.data || []);
      } else {
        const combinedErr = result?.data
          ? `${result.message}: ${result.data}`
          : result?.message || "shift swap failed";
        setNotification({
          type: "error",
          message: combinedErr,
        });
      }
    } catch (err) {
      // 1. Gather all potential text locations from your Axios Error Stack log
      let rawString =
        err.response?.data ||
        err.request?.responseText ||
        err.responseText ||
        "";

      // If it's inside an object layout due to interceptors
      if (rawString && typeof rawString === "object") {
        rawString = JSON.stringify(rawString);
      }

      let finalErrorMessage = "";

      if (typeof rawString === "string" && rawString.includes("message")) {
        try {
          // Try standard JSON recovery mapping
          const parsed = JSON.parse(rawString.trim());
          if (parsed?.message && parsed?.data) {
            finalErrorMessage = `${parsed.message}: ${parsed.data}`;
          } else if (parsed?.message) {
            finalErrorMessage = parsed.message;
          }
        } catch (e) {
          // Regex extraction safety fallback directly out of the Postman string format block if parsing hiccups
          const messageMatch = rawString.match(/"message"\s*:\s*"([^"]+)"/);
          const dataMatch = rawString.match(/"data"\s*:\s*"([^"]+)"/);

          if (messageMatch && dataMatch) {
            finalErrorMessage = `${messageMatch[1]}: ${dataMatch[1]}`;
          } else if (messageMatch) {
            finalErrorMessage = messageMatch[1];
          }
        }
      }

      // Final display assignment fallback guard
      if (!finalErrorMessage) {
        finalErrorMessage =
          err.message ||
          "shift swap failed: Network pipeline exception occurred.";
      }

      setNotification({
        type: "error",
        message: finalErrorMessage,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && apiShiftData.length === 0) {
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
                <input
                  type="text"
                  value={formData.fromShift}
                  readOnly
                  placeholder="No employee selected"
                  className="w-full text-xs border border-gray-200 rounded-md p-2 bg-gray-100 text-gray-600 cursor-not-allowed font-normal"
                />
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
                <input
                  type="text"
                  value={formData.toShift}
                  readOnly
                  placeholder="No employee selected"
                  className="w-full text-xs border border-gray-200 rounded-md p-2 bg-gray-100 text-gray-600 cursor-not-allowed font-normal"
                />
              </div>
            </div>

            {/* Swap Date Target Dropdown */}
            <div>
              <label className="block text-[10px] uppercase font-normal text-gray-500 mb-1">
                Target Swap Date
              </label>
              <input
                type="date"
                value={
                  formData.selectedDate
                    ? formData.selectedDate.split("T")[0]
                    : ""
                }
                onChange={handleDateChange}
                className="w-full text-xs border border-gray-300 rounded-md p-2 bg-white text-gray-700 font-normal outline-none focus:ring-1 focus:ring-black cursor-pointer"
              />
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
            <div className="flex items-center gap-2 max-w-xs w-full justify-end">
              <div className="relative max-w-[200px] w-full">
                <select
                  value={calendarEmployeeFilter}
                  onChange={(e) => setCalendarEmployeeFilter(e.target.value)}
                  className="text-xs border border-gray-300 rounded-md p-1.5 pr-8 bg-white focus:outline-none focus:ring-1 focus:ring-black font-normal w-full appearance-none cursor-pointer"
                >
                  <option value="">-- Filter Calendar By Staff --</option>
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
                  shiftDetails = apiShiftData.find(
                    (item) =>
                      item.date && item.date.split("T")[0] === targetDateStr,
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
                              <p className="text-[10px] font-normal text-gray-800 leading-tight line-clamp-2">
                                {shiftDetails.shift_name
                                  ? shiftDetails.shift_name.trim()
                                  : "Unassigned / Off"}
                              </p>
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
