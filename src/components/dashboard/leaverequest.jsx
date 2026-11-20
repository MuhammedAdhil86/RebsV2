import React, { useEffect, useMemo, useState, useCallback } from "react";
import axiosInstance from "../../service/axiosinstance";
import { X } from "lucide-react";

const PREVIEW_COUNT = 5;
const DRAWER_PAGE_SIZE = 20;
const DATE_OPTIONS = { day: "2-digit", month: "short" };

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

// Returns { label, full } so long lists can be shortened visually
// while the complete text stays available in a tooltip.
const formatLeaveDates = (leaveDates) => {
  if (!Array.isArray(leaveDates) || leaveDates.length === 0) {
    return { label: "-", full: "-" };
  }

  const dates = leaveDates
    .map((d) => new Date(d?.date))
    .filter((d) => !isNaN(d.getTime()))
    .sort((a, b) => a - b);

  if (dates.length === 0) return { label: "-", full: "-" };

  const fmt = (d) => d.toLocaleDateString("en-GB", DATE_OPTIONS);
  const today = startOfDay(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (dates.length === 1) {
    const d = startOfDay(dates[0]);
    const label =
      d.getTime() === today.getTime()
        ? "Today"
        : d.getTime() === tomorrow.getTime()
          ? "Tomorrow"
          : fmt(d);
    return { label, full: label };
  }

  const isConsecutive = dates.every(
    (d, i) =>
      i === 0 || Math.round((d - dates[i - 1]) / (1000 * 60 * 60 * 24)) === 1,
  );

  if (isConsecutive) {
    const label = `${fmt(dates[0])} - ${fmt(dates[dates.length - 1])}`;
    return { label, full: label };
  }

  const full = dates.map(fmt).join(", ");
  // Collapse long non-consecutive lists: "12 Nov, 15 Nov +4"
  const label =
    dates.length > 2
      ? `${dates.slice(0, 2).map(fmt).join(", ")} +${dates.length - 2}`
      : full;
  return { label, full };
};

const LeaveItem = ({ leave, idx }) => {
  const { label, full } = formatLeaveDates(leave.leave_date);

  return (
    <li className="flex items-center justify-between gap-3 min-w-0">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <img
          src={leave.image || `https://i.pravatar.cc/40?img=${(idx % 70) + 1}`}
          alt={leave.name || "Employee"}
          loading="lazy"
          className="w-8 h-8 rounded-full shrink-0 object-cover bg-gray-100"
        />
        <div className="min-w-0 flex-1">
          <p
            title={leave.name}
            className="font-normal text-gray-800 text-[13px] font-['Poppins'] truncate"
          >
            {leave.name || "Unknown"}
          </p>
          <p
            title={leave.designation}
            className="text-[10px] font-normal font-['Poppins'] text-gray-500 truncate"
          >
            {leave.designation || "No designation"}
          </p>
        </div>
      </div>

      <span
        title={full}
        className="shrink-0 max-w-[45%] text-right truncate whitespace-nowrap font-normal text-[11px] font-['Poppins'] text-[#FF000499]"
      >
        {label}
      </span>
    </li>
  );
};

const LeaveList = ({ data }) => (
  <ul className="space-y-4 min-w-0">
    {data.map((leave, idx) => (
      <LeaveItem key={leave.id ?? leave._id ?? idx} leave={leave} idx={idx} />
    ))}
  </ul>
);

const LeaveRequest = () => {
  const [leaveData, setLeaveData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(DRAWER_PAGE_SIZE);

  const loadLeaves = useCallback(async () => {
    try {
      const res = await axiosInstance.get(
        "admin/leave/get?page=1&limit=50&from=today&to=future&status=approved",
      );

      if (Array.isArray(res.data?.data)) {
        const today = startOfDay(new Date());
        const filtered = res.data.data.filter((leave) => {
          const isApproved = leave.manager_approval_status === "Approved";
          const hasFutureDate = (leave.leave_date || []).some(
            (d) => new Date(d.date) >= today,
          );
          return isApproved && hasFutureDate;
        });
        setLeaveData(filtered);
      }
    } catch (error) {
      console.error("Error fetching leaves:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeaves();
  }, [loadLeaves]);

  // Lock body scroll + close on Escape while drawer is open
  useEffect(() => {
    if (!isDrawerOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && setIsDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isDrawerOpen]);

  const openDrawer = () => {
    setVisibleCount(DRAWER_PAGE_SIZE);
    setIsDrawerOpen(true);
  };

  const preview = useMemo(() => leaveData.slice(0, PREVIEW_COUNT), [leaveData]);
  const drawerItems = useMemo(
    () => leaveData.slice(0, visibleCount),
    [leaveData, visibleCount],
  );

  return (
    <>
      <div className="bg-white shadow rounded-lg p-3 w-full min-w-0 overflow-hidden">
        <h3 className="text-sm text-gray-500 mb-4 font-['Poppins'] truncate">
          Leaves and Vacations
        </h3>

        <div className="mb-4 min-w-0">
          {loading ? (
            <p className="text-[12px] text-gray-500">Loading...</p>
          ) : leaveData.length === 0 ? (
            <p className="text-[12px] text-gray-400">No leaves found</p>
          ) : (
            <LeaveList data={preview} />
          )}
        </div>

        {leaveData.length > PREVIEW_COUNT && (
          <button
            onClick={openDrawer}
            className="font-['Poppins'] text-[11px] font-medium text-[#4F4C91] hover:underline"
          >
            View all people ({leaveData.length})
          </button>
        )}
      </div>

      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-[999] flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-label="All leaves"
        >
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setIsDrawerOpen(false)}
          />

          <div className="relative h-[100dvh] w-full sm:w-[400px] max-w-full bg-white shadow-2xl flex flex-col overflow-hidden">
            <div className="shrink-0 p-4 sm:p-5 flex justify-between items-center border-b gap-3">
              <h2 className="text-lg font-medium text-gray-800 font-['Poppins'] truncate">
                All Leaves
              </h2>
              <button
                onClick={() => setIsDrawerOpen(false)}
                aria-label="Close"
                className="p-1 shrink-0 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain p-4 sm:p-5">
              <LeaveList data={drawerItems} />

              {visibleCount < leaveData.length && (
                <button
                  onClick={() => setVisibleCount((c) => c + DRAWER_PAGE_SIZE)}
                  className="mt-5 w-full py-2 rounded-md border border-gray-200 text-[12px] font-['Poppins'] text-[#4F4C91] hover:bg-gray-50"
                >
                  Load more ({leaveData.length - visibleCount} remaining)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LeaveRequest;
