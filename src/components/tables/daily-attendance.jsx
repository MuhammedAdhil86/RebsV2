import React, { useEffect, useState, useMemo } from "react";
import { Search } from "lucide-react";
import UniversalTable from "../../ui/universal_table";
import { fetchDailyAttendance } from "../../service/employeeService";
import DatePicker from "../../ui/datepicker";
import useEmployeeStore from "../../store/employeeStore";

function DailyAttendance() {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { selectedDay } = useEmployeeStore(); // get selected date from store
  const selectedDate = selectedDay; // rename for clarity

  // Fetch attendance data
  const fetchAttendance = async (date) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDailyAttendance(date);
      const transformed = data.map((item) => ({
        id: item.user_id,
        name: item.user_name || "N/A",
        designation: item.designation || "N/A",
        check: item.checkin && item.checkout
          ? `${item.checkin} - ${item.checkout}`
          : "00:00 AM - 00:00 PM",
        device: item.device || "Samsung(SM-S355B)",
        workingHours: item.working_hours || "00:00:00",
        status: item.status || "Absent",
        avatar: item.image || `https://i.pravatar.cc/40?u=${item.user_id}`,
      }));
      setAttendanceData(transformed);
    } catch (err) {
      setError("Failed to load attendance data");
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance(selectedDate);
  }, [selectedDate]);

  const getStatusColor = (status) => {
    switch (status) {
      case "On Time": return "bg-green-100 text-green-600";
      case "Late": return "bg-blue-100 text-blue-600";
      case "Half Day": return "bg-purple-100 text-purple-600";
      case "Check In Missed": return "bg-red-100 text-red-600";
      case "Absent": return "bg-red-200 text-red-700";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const columns = [
    {
      key: "name",
      label: "Name",
      width: 160,
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <img
            src={row.avatar}
            alt={val}
            className="w-7 h-7 rounded-full object-cover"
          />
          <span className="whitespace-nowrap">{val}</span>
        </div>
      ),
    },
    {
      key: "designation",
      label: "Designation",
      width: 140,
      render: (val) => {
        const shortDes = val.length > 12 ? val.substring(0, 12) + "…" : val;
        return (
          <span className="truncate block max-w-[120px]" title={val}>
            {shortDes}
          </span>
        );
      },
    },
    { key: "check", label: "Check In - Out", width: 140 },
    { key: "device", label: "Device", width: 140 },
    { key: "workingHours", label: "Working Hours", width: 120 },
  {
  key: "status",
  label: "Status",
  width: 120,
  render: (val) => (
    <span
      className={`px-3 py-1 rounded-full text-[12px] font-normal font-poppins text-center inline-block ${getStatusColor(val)}`}
    >
      {val}
    </span>
  ),
},

  ];

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return attendanceData;
    const q = searchTerm.toLowerCase();
    return attendanceData.filter((row) =>
      row.name.toLowerCase().includes(q) ||
      row.designation.toLowerCase().includes(q) ||
      row.device.toLowerCase().includes(q)
    );
  }, [attendanceData, searchTerm]);

  return (
    <div className="flex-1 grid grid-cols-1 gap-4 px-4 pb-4 bg-[#f9fafb] rounded-xl w-full mx-auto">
      
      {/* 30-day Date Picker Strip */}
      <div className="w-full">
        <DatePicker />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 className="text-base font-medium text-gray-800">Daily Attendance</h3>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="flex items-center gap-2 border px-3 py-2 rounded-lg bg-white text-sm w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-gray-600 w-full focus:outline-none text-sm placeholder:text-[12px]"
            />
            <Search className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="text-center py-2 text-red-600">{error}</div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-4 border-blue-500 border-dashed rounded-full animate-spin" />
        </div>
      ) : (
        <UniversalTable
          columns={columns}
          data={filteredData}
          rowsPerPage={10}
        />
      )}
    </div>
  );
}

export default DailyAttendance;
