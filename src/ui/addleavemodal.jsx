import React, { useState, useEffect, useMemo } from "react";
import { X, Search, Loader2 } from "lucide-react";
import { Icon } from "@iconify/react";
import { getAllStaff } from "../service/staffservice";
import useLeaveStore from "../store/useleaveStore";
import GlowButton from "../components/helpers/glowbutton";
import { toast } from "react-toastify";

/* ---------- date helpers (local time, no timezone shifts) ---------- */
const pad = (n) => String(n).padStart(2, "0");
const toKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const keyFromDate = (dt) =>
  toKey(dt.getFullYear(), dt.getMonth(), dt.getDate());
const parseKey = (k) => {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const formatKey = (k) =>
  parseKey(k).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const emptyForm = {
  employeeUuid: "",
  leave_policy: "",
  reason: "",
  leave_date: [], // [{ date, half_day, half_day_type }]
  cc: [],
};

const AdminLeaveModal = ({ isOpen, onClose }) => {
  const {
    applyLeaveAdmin,
    fetchEmployeeLeavePolicies,
    employeeLeavePolicies = [],
    loading,
  } = useLeaveStore();

  const [staffList, setStaffList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [fetchingPolicies, setFetchingPolicies] = useState(false);

  // Calendar state
  const today = new Date();
  const todayKey = keyFromDate(today);
  const [view, setView] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });
  const [rangeMode, setRangeMode] = useState(false);
  const [skipWeekends, setSkipWeekends] = useState(true);
  const [anchor, setAnchor] = useState(null);

  const [formData, setFormData] = useState(emptyForm);

  // Fetch staff list when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchStaff = async () => {
        try {
          const staff = await getAllStaff();
          setStaffList(Array.isArray(staff) ? staff : []);
        } catch (err) {
          setStaffList([]);
        }
      };
      fetchStaff();
    }
  }, [isOpen]);

  // Handle employee selection and fetch their leave policies
  const handleEmployeeChange = async (employeeId) => {
    setFormData((prev) => ({
      ...prev,
      employeeUuid: employeeId,
      leave_policy: "",
    }));

    if (!employeeId) return;

    setFetchingPolicies(true);
    try {
      const policies = await fetchEmployeeLeavePolicies(employeeId);
      if (Array.isArray(policies) && policies.length > 0) {
        setFormData((prev) => ({
          ...prev,
          leave_policy: policies[0].id,
        }));
      }
    } catch (err) {
      toast.error("Failed to load leave policies for selected employee");
    } finally {
      setFetchingPolicies(false);
    }
  };

  /* ---------- calendar selection logic ---------- */
  const selectedMap = useMemo(() => {
    const map = {};
    formData.leave_date.forEach((r) => (map[r.date] = r));
    return map;
  }, [formData.leave_date]);

  const sortedDates = useMemo(
    () => [...formData.leave_date].sort((a, b) => (a.date < b.date ? -1 : 1)),
    [formData.leave_date],
  );

  const totalDays = useMemo(
    () =>
      formData.leave_date.reduce((sum, r) => sum + (r.half_day ? 0.5 : 1), 0),
    [formData.leave_date],
  );

  // Add many dates at once, keeping existing rows (and their half-day flags)
  const addDates = (keys) => {
    setFormData((prev) => {
      const existing = new Set(prev.leave_date.map((r) => r.date));
      const added = keys
        .filter((k) => !existing.has(k))
        .map((k) => ({ date: k, half_day: false, half_day_type: 0 }));
      return { ...prev, leave_date: [...prev.leave_date, ...added] };
    });
  };

  const removeDate = (key) => {
    setFormData((prev) => ({
      ...prev,
      leave_date: prev.leave_date.filter((r) => r.date !== key),
    }));
  };

  const updateDateRow = (key, changes) => {
    setFormData((prev) => ({
      ...prev,
      leave_date: prev.leave_date.map((row) =>
        row.date === key ? { ...row, ...changes } : row,
      ),
    }));
  };

  const clearDates = () => {
    setFormData((prev) => ({ ...prev, leave_date: [] }));
    setAnchor(null);
  };

  const handleDayClick = (key) => {
    if (!rangeMode) {
      if (selectedMap[key]) removeDate(key);
      else addDates([key]);
      return;
    }

    // Range mode: first click = start, second click = end
    if (!anchor) {
      setAnchor(key);
      return;
    }
    const start = parseKey(anchor < key ? anchor : key);
    const end = parseKey(anchor < key ? key : anchor);
    const keys = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      if (skipWeekends && isWeekend) continue;
      keys.push(keyFromDate(d));
    }
    addDates(keys);
    setAnchor(null);
  };

  const changeMonth = (delta) => {
    setView((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const calendarCells = useMemo(() => {
    const first = new Date(view.year, view.month, 1).getDay();
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    const cells = Array(first).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [view]);

  /* ---------- CC ---------- */
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const fullName = (s.full_name || s.name || "").toLowerCase();
      return fullName.includes(searchTerm.toLowerCase());
    });
  }, [staffList, searchTerm]);

  const toggleCcEmployee = (uuid) => {
    setFormData((prev) => ({
      ...prev,
      cc: prev.cc.includes(uuid)
        ? prev.cc.filter((id) => id !== uuid)
        : [...prev.cc, uuid],
    }));
  };

  const handleClose = () => {
    setFormData(emptyForm);
    setSearchTerm("");
    setAnchor(null);
    setRangeMode(false);
    onClose();
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.employeeUuid)
      return toast.error("Please select an employee", {
        toastId: "leave-employee",
      });
    if (!formData.leave_policy)
      return toast.error("Please select a leave policy", {
        toastId: "leave-policy",
      });
    if (formData.leave_date.length === 0)
      return toast.error("Please select at least one leave date", {
        toastId: "leave-dates",
      });

    try {
      await applyLeaveAdmin(formData.employeeUuid, {
        leave_date: sortedDates,
        reason: formData.reason,
        leave_policy: Number(formData.leave_policy),
        cc: formData.cc,
      });

      toast.success("Leave applied successfully!");
      handleClose();
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || "Failed to apply leave";
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm font-poppins text-[12px]">
      <div className="bg-white w-[95%] max-w-[980px] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20">
        {/* Header */}
        <div className="px-8 py-5 flex items-center justify-between border-b border-gray-50 bg-white">
          <div>
            <h2 className="text-gray-900 text-[16px] font-medium uppercase">
              Apply Admin Leave
            </h2>
            <p className="text-gray-400 text-[10px]">
              Record staff absence manually
            </p>
          </div>
          <button type="button" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto">
          {/* Two columns: inputs on the left, calendar on the right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* ================= LEFT: inputs ================= */}
            <div className="space-y-5 min-w-0">
              {/* Employee Selection */}
              <div>
                <label className="block mb-1 font-medium text-gray-700">
                  Employee
                </label>
                <select
                  value={formData.employeeUuid}
                  onChange={(e) => handleEmployeeChange(e.target.value)}
                  className="w-full border p-3 rounded-2xl"
                >
                  <option value="">Select Staff Member</option>
                  {staffList.map((s) => (
                    <option key={s.uuid} value={s.uuid}>
                      {s.full_name || s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Leave Policy Selection */}
              <div>
                <label className="block mb-1 font-medium text-gray-700">
                  Leave Policy / Type
                </label>
                <select
                  value={formData.leave_policy}
                  disabled={!formData.employeeUuid || fetchingPolicies}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      leave_policy: Number(e.target.value),
                    }))
                  }
                  className="w-full border p-3 rounded-2xl disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="">
                    {fetchingPolicies
                      ? "Loading policies..."
                      : !formData.employeeUuid
                        ? "Select an employee first"
                        : !employeeLeavePolicies ||
                            employeeLeavePolicies.length === 0
                          ? "No policies found"
                          : "Select Leave Policy"}
                  </option>
                  {Array.isArray(employeeLeavePolicies) &&
                    employeeLeavePolicies.map((policy) => (
                      <option key={policy.id} value={policy.id}>
                        {policy.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* CC Notification Search */}
              <div className="space-y-2">
                <label className="block mb-1 font-medium text-gray-700">
                  CC (Notify Staff)
                </label>
                <div className="relative">
                  <Search
                    className="absolute left-3 top-3 text-gray-400"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="Search staff..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 border p-2.5 rounded-2xl"
                  />
                </div>

                <div className="max-h-[180px] overflow-y-auto border rounded-2xl p-2 space-y-1">
                  {filteredStaff.length === 0 ? (
                    <div className="p-3 text-center text-gray-400">
                      No staff found
                    </div>
                  ) : (
                    filteredStaff.map((s) => (
                      <label
                        key={s.uuid}
                        className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                      >
                        <span className="font-medium text-gray-800">
                          {s.full_name || s.name}
                        </span>
                        <input
                          type="checkbox"
                          checked={formData.cc.includes(s.uuid)}
                          onChange={() => toggleCcEmployee(s.uuid)}
                          className="rounded border-gray-300"
                        />
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Reason Section */}
              <div>
                <label className="block mb-1 font-medium text-gray-700">
                  Reason
                </label>
                <textarea
                  rows="3"
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, reason: e.target.value }))
                  }
                  placeholder="Personal work..."
                  className="w-full border p-3 rounded-2xl"
                />
              </div>
            </div>

            {/* ================= RIGHT: calendar ================= */}
            <div className="min-w-0">
              <div className="flex items-center justify-between mb-1">
                <label className="font-medium text-gray-700">Leave Dates</label>
                {formData.leave_date.length > 0 && (
                  <button
                    type="button"
                    onClick={clearDates}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="border rounded-2xl p-4">
                {/* Mode switch */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex bg-gray-100 rounded-full p-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setRangeMode(false);
                        setAnchor(null);
                      }}
                      className={`px-3 py-1 rounded-full transition-colors ${
                        !rangeMode
                          ? "bg-black text-white"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Pick days
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRangeMode(true);
                        setAnchor(null);
                      }}
                      className={`px-3 py-1 rounded-full transition-colors ${
                        rangeMode
                          ? "bg-black text-white"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Select range
                    </button>
                  </div>

                  {rangeMode && (
                    <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        className="accent-black w-4 h-4 rounded"
                        checked={skipWeekends}
                        onChange={(e) => setSkipWeekends(e.target.checked)}
                      />
                      Skip weekends
                    </label>
                  )}
                </div>

                {/* Month navigation */}
                <div className="flex items-center justify-between mb-2">
                  <button
                    type="button"
                    onClick={() => changeMonth(-1)}
                    aria-label="Previous month"
                    className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <Icon
                      icon="solar:alt-arrow-left-outline"
                      className="w-4 h-4"
                    />
                  </button>
                  <span className="font-medium text-gray-900 text-[13px]">
                    {MONTHS[view.month]} {view.year}
                  </span>
                  <button
                    type="button"
                    onClick={() => changeMonth(1)}
                    aria-label="Next month"
                    className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <Icon
                      icon="solar:alt-arrow-right-outline"
                      className="w-4 h-4"
                    />
                  </button>
                </div>

                {/* Weekday header */}
                <div className="grid grid-cols-7 mb-1">
                  {WEEKDAYS.map((w) => (
                    <div
                      key={w}
                      className="text-center text-[10px] text-gray-400 py-1"
                    >
                      {w}
                    </div>
                  ))}
                </div>

                {/* Day grid */}
                <div className="grid grid-cols-7 gap-y-1">
                  {calendarCells.map((day, i) => {
                    if (day === null) return <div key={`b-${i}`} />;
                    const key = toKey(view.year, view.month, day);
                    const row = selectedMap[key];
                    const isSelected = !!row;
                    const isToday = key === todayKey;
                    const isAnchor = key === anchor;
                    const isWeekend = i % 7 === 0 || i % 7 === 6;

                    return (
                      <div key={key} className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => handleDayClick(key)}
                          title={row?.half_day ? "Half day" : undefined}
                          className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                            isSelected
                              ? "bg-black text-white font-medium"
                              : isAnchor
                                ? "bg-gray-200 text-gray-900 font-medium"
                                : isWeekend
                                  ? "text-gray-400 hover:bg-gray-100"
                                  : "text-gray-800 hover:bg-gray-100"
                          } ${
                            isToday && !isSelected
                              ? "ring-1 ring-black ring-inset"
                              : ""
                          }`}
                        >
                          {day}
                          {isSelected && row.half_day && (
                            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-white" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>

                <p className="mt-3 text-[10px] text-gray-400">
                  {rangeMode
                    ? anchor
                      ? `Start: ${formatKey(anchor)}. Now tap the end date.`
                      : "Tap a start date, then an end date to add the whole range."
                    : "Tap any day to select or unselect it."}
                </p>
              </div>

              {/* Selected dates */}
              {sortedDates.length > 0 && (
                <div className="mt-3">
                  <p className="mb-2 text-gray-500">
                    {sortedDates.length} date
                    {sortedDates.length > 1 ? "s" : ""} selected · {totalDays}{" "}
                    day{totalDays !== 1 ? "s" : ""} of leave
                  </p>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    {sortedDates.map((row) => (
                      <div
                        key={row.date}
                        className="flex items-center justify-between gap-3 border px-3 py-2 rounded-2xl"
                      >
                        <span className="font-medium text-gray-800">
                          {formatKey(row.date)}
                        </span>

                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                            <input
                              type="checkbox"
                              className="accent-black w-4 h-4 rounded"
                              checked={row.half_day}
                              onChange={(e) =>
                                updateDateRow(row.date, {
                                  half_day: e.target.checked,
                                  half_day_type: e.target.checked ? 1 : 0,
                                })
                              }
                            />
                            Half Day
                          </label>

                          <button
                            type="button"
                            onClick={() => removeDate(row.date)}
                            aria-label="Remove date"
                            title="Remove"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Icon
                              icon="solar:trash-bin-trash-outline"
                              className="w-4 h-4"
                            />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Footer: Cancel / Confirm under the calendar */}
              <div className="flex justify-end gap-3 pt-5">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>

                <GlowButton
                  onClick={handleSubmit}
                  disabled={loading || fetchingPolicies}
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    "Confirm Leave"
                  )}
                </GlowButton>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLeaveModal;
