import React from "react";

function EmployeeModal({ data, employee, onClose }) {
  if (!employee) return null;
  if (!Array.isArray(data)) return null;

  // Header data points from the latest entry
  const latestDay = data[0] || {};
  const totalWorkTime = latestDay.total_work_time || "00:00:00";
  const status = latestDay.status || "On time";

  /**
   * FIX: Timezone Offset Issue
   * Instead of using new Date().toLocaleTimeString (which adds +5:30 IST),
   * we split the string to get the exact hours/minutes sent by the server.
   */
  const formatTimeManual = (timeStr) => {
    if (!timeStr || !timeStr.includes("T")) return "N/A";

    // Extracts "10:10" from "0000-01-01T10:10:52Z"
    const timePart = timeStr.split("T")[1].substring(0, 5);
    let [hours, minutes] = timePart.split(":");

    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    const displayHours = h % 12 || 12;

    return `${displayHours}:${minutes} ${ampm}`;
  };

  /**
   * Helper for Date display (e.g., "Feb 28")
   */
  const formatDateManual = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  /**
   * Helper for Weekday display (e.g., "Saturday")
   */
  const formatDayManual = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", { weekday: "long" });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-[480px] bg-white z-50 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
        <div className="p-8 relative">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                <img
                  src={employee.image || "https://via.placeholder.com/150"}
                  alt={employee.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/150";
                  }}
                />
              </div>
              <div>
                <h2 className="text-lg font-normal text-gray-900 leading-tight">
                  {employee.name || "Unknown"}
                </h2>
                <p className="text-xs font-normal text-gray-400">
                  {employee.designationname?.String || "N/A"}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <div className="bg-[#F8F9FA] px-4 py-2 rounded-xl text-center min-w-[100px]">
                <p className="text-lg font-normal text-gray-800 tabular-nums">
                  {totalWorkTime}
                </p>
                <p className="text-[9px] font-normal text-gray-400 uppercase tracking-tighter">
                  Working hours
                </p>
              </div>
              <span
                className={`mt-2 px-4 py-1 text-white text-[10px] font-normal rounded-full ${
                  status === "On time" ? "bg-[#00C582]" : "bg-orange-500"
                }`}
              >
                {status}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-300 hover:text-gray-600 transition-colors font-normal"
          >
            ✕
          </button>

          {/* Activity Log Section */}
          <h3 className="text-[11px] font-normal text-gray-400 mb-6 uppercase tracking-[0.2em]">
            Activity Log
          </h3>

          <div className="flex flex-col gap-4 mb-8">
            {data.map((day) => (
              <div key={day.date} className="flex gap-4">
                {/* Left Date Box */}
                <div className="w-24 flex flex-col justify-start bg-[#F8F9FA] rounded-xl">
                  <div className="relative w-full h-44 rounded-2xl border border-gray-50 flex flex-col items-center justify-center px-2">
                    {/* Day Status Badge */}
                    <span
                      className={`absolute top-1 right-1 px-2 py-0.5 text-[8px] font-normal rounded-full ${
                        day.status === "On time"
                          ? "bg-[#00C582] text-white"
                          : "bg-orange-500 text-white"
                      }`}
                    >
                      {day.status}
                    </span>

                    {/* Centered Date Info */}
                    <div className="flex flex-col items-center justify-center gap-1">
                      <p className="text-[10px] font-normal text-gray-700 tabular-nums">
                        {day.total_work_time || "00:00:00"}
                      </p>
                      <p className="text-sm font-normal text-gray-800">
                        {formatDateManual(day.date)}
                      </p>
                      <p className="text-[10px] font-normal text-gray-400">
                        {formatDayManual(day.date)}
                      </p>

                      {/* Checkout Badge */}
                      {day.checkout_status && (
                        <span
                          className={`px-2 py-0.5 text-[9px] font-normal rounded ${
                            day.checkout_status === "Full Day"
                              ? "bg-green-100 text-green-600"
                              : "bg-orange-100 text-orange-500"
                          }`}
                        >
                          {day.checkout_status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side Punch Cards */}
                <div className="flex-1 flex flex-col gap-3">
                  {day.attendance.map((att) => {
                    const isCheckOut = att.status
                      ?.toLowerCase()
                      .includes("out");
                    const deviceName =
                      att.location_info?.device || "Unknown device";

                    return (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex gap-4 items-center">
                          <div
                            className={`w-1 h-10 rounded-full ${
                              isCheckOut ? "bg-[#FF8A8A]" : "bg-[#00C582]"
                            }`}
                          />
                          <div>
                            <p className="text-sm font-normal text-gray-800">
                              {formatTimeManual(att.time)}
                            </p>
                            <p className="text-[10px] font-normal text-gray-400 uppercase tracking-wide">
                              {att.status || "Check in"}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-[11px] font-normal text-gray-600">
                            {deviceName.split(" (")[0]}
                          </p>
                          <p className="text-[9px] font-normal text-gray-300 uppercase tracking-widest">
                            Device
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Previous Days Label */}
          <h3 className="text-[11px] font-normal text-gray-400 mb-6 uppercase tracking-[0.2em]">
            Previous Days
          </h3>
        </div>
      </div>
    </>
  );
}

export default EmployeeModal;
