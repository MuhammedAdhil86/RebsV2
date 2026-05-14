import React, { useState, useEffect } from "react";
import EmployeeTableWrapper from "../../ui/employeetablewrapper";
import DatePicker from "../../ui/datepicker";
import { fetchBarAttendance } from "../../service/employeeService";
import LeaveRequest from "./leaverequest";// ✅ import new component

function DashboardOverview({ ATTENDANCE_DATA, getWidth, CALENDAR_DAYS }) {
  const [selectedDate, setSelectedDate] = useState(CALENDAR_DAYS[0] || new Date());
  const [attendanceData, setAttendanceData] = useState([]);
  const [totalAttendance, setTotalAttendance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadBarData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetchBarAttendance(selectedDate);
        if (response && response.data) {
          const rawData = response.data.splits || [];
          const statusColors = {
            "On time": "bg-green-500",
            Delay: "bg-blue-500",
            Late: "bg-purple-500",
            Absent: "bg-red-500",
            "Early Check-in": "bg-gray-400",
          };
          const normalized = Object.keys(statusColors).map((status) => ({
            status,
            count: rawData.find((item) => item.status === status)?.count || 0,
            color: statusColors[status],
          }));
          const total = response.data.total || normalized.reduce((sum, item) => sum + item.count, 0);
          setAttendanceData(normalized);
          setTotalAttendance(total);
        }
      } catch (err) {
        console.error("Error fetching attendance data:", err);
        setError("Failed to load attendance data");
      } finally {
        setIsLoading(false);
      }
    };
    loadBarData();
  }, [selectedDate]);

  const getBarWidth = (count) => {
    if (totalAttendance === 0) return "0%";
    return `${(count / totalAttendance) * 100}%`;
  };

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-2 px-3 bg-gray-50">

      {/* Left Section */}
      <div className="lg:col-span-9 flex flex-col gap-1 w-full">
        <DatePicker
          CALENDAR_DAYS={CALENDAR_DAYS}
          selectedDate={selectedDate}
          onChange={setSelectedDate}
        />
        <EmployeeTableWrapper />
      </div>

      {/* Right Section */}
      <div className="lg:col-span-3 flex flex-col gap-3 w-full">

        {/* Attendance Summary */}
        <div className="bg-white shadow rounded-xl p-4 border border-gray-100 w-full">
          <div className="flex items-baseline gap-1 mb-4">
            <p className="text-2xl font-medium text-[#1E2734]">{totalAttendance}</p>
            <span className="text-sm text-gray-500">Attendance</span>
          </div>

          {isLoading ? (
            <p className="text-gray-500 text-sm mb-3">Loading attendance data...</p>
          ) : error ? (
            <p className="text-red-500 text-sm mb-3">{error}</p>
          ) : (
            <>
              <div className="relative w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mb-6">
                <div className="flex w-full h-full">
                  {attendanceData.map((item, idx) => (
                    <div
                      key={idx}
                      className={`${item.color} h-full`}
                      style={{ width: getBarWidth(item.count) }}
                    ></div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-sm ">
                {attendanceData
                  .filter((item) =>
                    ["On time", "Delay", "Late", "Absent", "Early Check-in"].includes(item.status)
                  )
                  .map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <span className="text-[11px] font-[400] font-['Poppins'] text-gray-600">
                        {item.status === "On time"
                          ? "Ontime"
                          : item.status === "Early Check-in"
                          ? "Early"
                          : item.status}
                      </span>
                      <div className="flex items-center gap-1 ">
                        <span className={`h-2.5 w-2.5 rounded-full ${item.color}`}></span>
                        <span className="font-medium text-[#1E2734]">{item.count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </>
          )}
        </div>

        {/* ✅ Leaves & Vacations */}
        <LeaveRequest />

      </div>
    </div>
  );
}

export default DashboardOverview;
