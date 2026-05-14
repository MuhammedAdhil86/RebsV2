import React, { useEffect, useState } from "react";
import { Search, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchEmployeeCalendar } from "../../service/employeeService";
import CustomSelect from "../../ui/customselect";

function MusterRoll() {
  const navigate = useNavigate();

  // -------------------- STATES --------------------
  const [attendanceData, setAttendanceData] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState("");

  // -------------------- STATIC LABELS --------------------
  const monthNames = [
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
  const years = [2024, 2025, 2026];

  useEffect(() => {
    loadAttendance();
  }, [month, year]);

  // -------------------- HELPER FUNCTIONS --------------------
  const convertToTime = (value) => {
    if (!value || value.startsWith("0000") || value.startsWith("0001"))
      return "--";
    const date = new Date(value);
    return isNaN(date)
      ? "--"
      : `${date.getUTCHours().toString().padStart(2, "0")}:${date.getUTCMinutes().toString().padStart(2, "0")}`;
  };

  const convertToTimeWithSeconds = (value) => {
    if (!value || value.startsWith("0000") || value.startsWith("0001"))
      return "00:00:00";
    const date = new Date(value);
    return isNaN(date)
      ? "00:00:00"
      : `${date.getUTCHours().toString().padStart(2, "0")}:${date.getUTCMinutes().toString().padStart(2, "0")}:${date.getUTCSeconds().toString().padStart(2, "0")}`;
  };

  const getStatusClasses = (status) => {
    if (!status || status === "--")
      return "bg-gray-100 text-gray-400 border border-gray-200";

    switch (status.toUpperCase()) {
      case "ON TIME":
      case "PRESENT":
        return "bg-[#00AB2E1F] text-[#00AB2E]";
      case "EARLY CHECK-IN":
        return "bg-yellow-100 text-yellow-700";
      case "ABSENT":
        return "bg-[#FF666833] text-[#FF6668]";
      case "SICK LEAVE":
        return "outline outline-1 outline-red-600 text-red-600";
      case "LATE":
        return "bg-[#4F4C9133] text-[#4F4C91]";
      default:
        return "bg-gray-100 text-gray-500";
    }
  };

  // -------------------- DATA LOADING --------------------
  const loadAttendance = async () => {
    try {
      const data = await fetchEmployeeCalendar(month, year);

      const formatted = data.map((emp) => {
        const attendanceMap = {};

        emp.attendance?.forEach((record) => {
          const day = new Date(record.date).getUTCDate();
          attendanceMap[day] = {
            ...record,
            in_time: convertToTime(record.in),
            out_time: convertToTime(record.out),
            total_hour: convertToTimeWithSeconds(record.total_hour),
            // Logic: Only show string if Valid is true, else explicitly null
            display_checkout:
              record.checkout_status?.Valid &&
              record.checkout_status.String !== ""
                ? record.checkout_status.String
                : null,
          };
        });

        const filledAttendance = Array.from({ length: 31 }, (_, i) => {
          const day = i + 1;
          return (
            attendanceMap[day] || {
              status: "--",
              total_hour: "00:00:00",
              display_checkout: null,
            }
          );
        });

        return { ...emp, attendance: filledAttendance };
      });

      setAttendanceData(formatted);
    } catch (error) {
      console.error("Error loading attendance:", error);
    }
  };

  const filteredEmployees = attendanceData.filter((emp) =>
    emp.user_name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="bg-[#f9fafb] rounded-lg pt-0 px-4 pb-4 w-full font-poppins text-[12px]">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-3">
        <h2 className="text-base font-medium text-gray-800">Muster Roll</h2>
        <div className="flex flex-wrap items-center gap-1.5">
          <CustomSelect
            value={month}
            onChange={(val) => setMonth(Number(val))}
            options={monthNames.map((name, index) => ({
              label: name,
              value: index + 1,
            }))}
            minWidth={120}
          />
          <CustomSelect
            value={year}
            onChange={(val) => setYear(Number(val))}
            options={years.map((y) => ({ label: y, value: y }))}
            minWidth={100}
          />
          <button className="bg-black text-white px-3 py-1.5 rounded-md text-xs flex items-center gap-1">
            <Download className="w-4 h-4" /> Download
          </button>
          <button
            onClick={() => navigate("/consoildate")}
            className="border bg-black text-white px-3 py-1.5 rounded-md text-xs"
          >
            Consolidated Data
          </button>
          <div className="flex items-center gap-1 border border-gray-200 px-2 py-1.5 rounded-md bg-gray-50 text-xs w-36 sm:w-40">
            <input
              type="text"
              placeholder="Search"
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent w-full focus:outline-none text-xs text-gray-700 placeholder:text-gray-400"
            />
            <Search className="w-3.5 h-3.5 text-gray-500" />
          </div>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="w-full overflow-x-auto scrollbar-none">
          <table className="min-w-full text-sm border-collapse table-fixed">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="sticky left-0 z-20 bg-gray-50 px-4 py-3 text-left font-medium border-b border-r w-[200px] min-w-[200px]">
                  Employee Name
                </th>
                {Array.from({ length: 31 }, (_, i) => (
                  <th
                    key={i}
                    className="px-3 py-3 text-center text-xs font-medium text-gray-700 border-b border-r min-w-[120px]"
                  >
                    {i + 1}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredEmployees.map((emp, idx) => (
                <tr key={emp.user_id || idx} className="hover:bg-gray-50 group">
                  <td className="sticky left-0 z-10 bg-white group-hover:bg-gray-50 px-4 py-3 border-r h-[120px] w-[200px] min-w-[200px]">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          emp.image ||
                          `https://ui-avatars.com/api/?name=${emp.user_name}&background=random`
                        }
                        className="w-10 h-10 rounded-full border border-gray-200 object-cover"
                        alt=""
                      />
                      <p className="font-medium text-gray-900 truncate">
                        {emp.user_name}
                      </p>
                    </div>
                  </td>

                  {emp.attendance.map((d, i) => (
                    <td
                      key={i}
                      className="px-2 py-3 border-r min-w-[120px] h-[120px] text-center"
                    >
                      <div className="flex flex-col items-center justify-center space-y-2">
                        {/* Attendance Status */}
                        <span
                          className={`px-2 py-0.5 rounded text-[9px]  uppercase ${getStatusClasses(d.status)}`}
                        >
                          {!d.status || d.status === "--"
                            ? "NO STATUS"
                            : d.status}
                        </span>

                        <div className="flex flex-col items-center gap-1">
                          {/* Working Hours */}
                          <p className="text-[11px] bg-gray-100 text-gray-700 rounded px-2 py-0.5 font-medium">
                            {d.total_hour}
                          </p>

                          {/* Checkout Status Logic */}
                          {d.display_checkout ? (
                            <span className="text-[9px]  text-orange-500 ">
                              {d.display_checkout}
                            </span>
                          ) : (
                            <span className="text-[8px] font-medium text-gray-300 uppercase tracking-tighter">
                              No Checkout Status
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default MusterRoll;
