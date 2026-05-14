import React, { useEffect, useState } from "react";
import axiosInstance from "../../service/axiosinstance";
import { X } from "lucide-react";

const LeaveRequest = () => {
  const [leaveData, setLeaveData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Helper function to format dates for display
  const formatLeaveDates = (leaveDates) => {
    if (!leaveDates || leaveDates.length === 0) return "-";
    const options = { day: "2-digit", month: "short" };
    const dates = leaveDates.map((d) => new Date(d.date));
    dates.sort((a, b) => a - b);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (dates.length === 1) {
      const d = dates[0];
      if (d.getTime() === today.getTime()) return "Today";
      if (d.getTime() === tomorrow.getTime()) return "Tomorrow";
      return d.toLocaleDateString("en-GB", options);
    }

    let isConsecutive = true;
    for (let i = 1; i < dates.length; i++) {
      const diff = (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);
      if (Math.round(diff) !== 1) {
        isConsecutive = false;
        break;
      }
    }

    if (isConsecutive) {
      return `${dates[0].toLocaleDateString("en-GB", options)} - ${dates[dates.length - 1].toLocaleDateString("en-GB", options)}`;
    }

    return dates.map((d) => d.toLocaleDateString("en-GB", options)).join(", ");
  };

  const loadLeaves = async () => {
    try {
      console.log("--- API Fetch Started ---");
      const res = await axiosInstance.get(
        "admin/leave/get?page=1&limit=50&from=today&to=future&status=approved",
      );

      // LOG 1: Check the raw response from the backend
      console.log("1. Raw API Response Data:", res.data);

      if (res.data?.data) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // LOG 2: Check total count before filtering
        console.log("2. Total items received:", res.data.data.length);

        const filteredLeaves = res.data.data.filter((leave) => {
          const isApproved = leave.manager_approval_status === "Approved";
          const hasFutureDate = leave.leave_date.some(
            (d) => new Date(d.date) >= today,
          );
          return isApproved && hasFutureDate;
        });

        // LOG 3: Check data after filtering
        console.log(
          "3. Filtered Leaves (Approved & Current/Future):",
          filteredLeaves,
        );

        setLeaveData(filteredLeaves);
      } else {
        console.warn("API Response structure is unexpected or data is empty.");
      }
    } catch (error) {
      // LOG 4: Log any network or code errors
      console.error("Error fetching leaves:", error);
    } finally {
      setLoading(false);
      console.log("--- API Fetch Completed ---");
    }
  };

  useEffect(() => {
    loadLeaves();
  }, []);

  // LOG 5: Log every render to track state changes
  console.log("Component Render - current leaveData count:", leaveData.length);

  const renderLeaveList = (data) => (
    <ul className="space-y-4">
      {data.map((leave, idx) => (
        <li key={idx} className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <img
              src={leave.image || `https://i.pravatar.cc/40?img=${idx + 10}`}
              alt={leave.name}
              className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
            />
            <div className="truncate">
              <p className="font-[400] text-gray-800 text-[13px] font-['Poppins'] truncate">
                {leave.name || "Unknown"}
              </p>
              <p className="text-[10px] font-[400] font-['Poppins'] text-gray-500 truncate">
                {leave.designation || "No designation"}
              </p>
            </div>
          </div>
          <span className="whitespace-nowrap font-[400] text-[11px] font-['Poppins'] text-[#FF000499]">
            {formatLeaveDates(leave.leave_date)}
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <div className="bg-white shadow rounded-lg p-3 w-full">
        <h3 className="text-sm text-gray-500 mb-4 font-['Poppins']">
          Leaves and Vacations
        </h3>

        <div className="mb-4">
          {loading ? (
            <p className="text-[12px] text-gray-500">Loading...</p>
          ) : leaveData.length === 0 ? (
            <p className="text-[12px] text-gray-400">No leaves found</p>
          ) : (
            renderLeaveList(leaveData.slice(0, 5))
          )}
        </div>

        {leaveData.length > 5 && (
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="font-['Poppins'] text-[11px] font-medium text-[#4F4C91] hover:underline"
          >
            View all people
          </button>
        )}
      </div>

      {/* Slider / Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[999] flex justify-end">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setIsDrawerOpen(false)}
          />

          <div className="relative h-full bg-white shadow-2xl w-[400px] max-w-[90vw] flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-5 flex justify-between items-center border-b">
              <h2 className="text-lg font-medium text-gray-800 font-['Poppins']">
                All Leaves
              </h2>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
              {renderLeaveList(leaveData)}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LeaveRequest;
