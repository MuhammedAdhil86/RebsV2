import React, { useEffect, useState } from "react";
import { Search, Download, ChevronLeft, ChevronRight } from "lucide-react";
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

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // -------------------- HELPER FUNCTIONS --------------------

  // Converts "0000-01-01T08:16:21Z" or "0001-01-01T00:00:00Z" to "08:16"
  const convertToTime = (value) => {
    if (
      !value ||
      value.startsWith("0000-01-01T00:00:00") ||
      value.startsWith("0001")
    )
      return "--";

    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return "--";
      // Using UTC to avoid local timezone shifts on the raw duration string
      const hours = date.getUTCHours().toString().padStart(2, "0");
      const minutes = date.getUTCMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}`;
    } catch {
      return "--";
    }
  };

  // Specifically for the Work Hour display (Total Hours)
  const formatWorkHours = (value) => {
    if (
      !value ||
      value.startsWith("0000-01-01T00:00:00") ||
      value.startsWith("0001")
    )
      return "00:00:00";

    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return "00:00:00";
      const h = date.getUTCHours().toString().padStart(2, "0");
      const m = date.getUTCMinutes().toString().padStart(2, "0");
      const s = date.getUTCSeconds().toString().padStart(2, "0");
      return `${h}:${m}:${s}`;
    } catch {
      return "00:00:00";
    }
  };

  const getStatusClasses = (status) => {
    if (!status || status === "--")
      return "bg-gray-100 text-gray-400 border border-gray-200";
    const s = status.toUpperCase();
    if (s === "PRESENT" || s === "ON TIME")
      return "bg-[#00AB2E1F] text-[#00AB2E]";
    if (s === "DELAY" || s === "EARLY CHECK-IN")
      return "bg-yellow-100 text-yellow-700";
    if (s === "ABSENT") return "bg-[#FF666833] text-[#FF6668]";
    if (s === "SICK LEAVE")
      return "outline outline-1 outline-red-600 text-red-600";
    if (s === "LATE") return "bg-[#4F4C9133] text-[#4F4C91]";
    if (
      s === "HOLIDAY" ||
      s === "WEEKLY OFF" ||
      s === "SATURDAY" ||
      s === "SUNDAY"
    )
      return "bg-blue-50 text-blue-500 border border-blue-100";
    return "bg-gray-100 text-gray-500";
  };

  const loadAttendance = async () => {
    try {
      const response = await fetchEmployeeCalendar(month, year);
      // Handle array vs object response based on your service
      const apiData = Array.isArray(response) ? response : response?.data || [];

      const formatted = apiData.map((emp) => {
        const attendanceMap = {};
        emp.attendance?.forEach((record) => {
          // Extract day from date "2026-05-01T00:00:00Z"
          const day = new Date(record.date).getUTCDate();
          attendanceMap[day] = {
            ...record,
            in_time: convertToTime(record.in),
            out_time: convertToTime(record.out),
            work_hour: formatWorkHours(record.total_hour), // Mapping total_hour to work_hour
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
              work_hour: "00:00:00",
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

  const totalPages = Math.ceil(filteredEmployees.length / rowsPerPage);
  const startIdx = (currentPage - 1) * rowsPerPage;
  const endIdx = startIdx + rowsPerPage;
  const paginatedEmployees = filteredEmployees.slice(startIdx, endIdx);

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
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col">
        <div className="w-full overflow-x-auto custom-scrollbar">
          <table className="min-w-full text-sm border-collapse table-fixed border-spacing-0">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="sticky left-0 z-30 bg-gray-50 px-4 py-3 text-left font-medium border-b border-r w-[200px] min-w-[200px]">
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
              {paginatedEmployees.map((emp, idx) => (
                <tr key={emp.user_id || idx} className="hover:bg-gray-50 group">
                  <td className="sticky left-0 z-20 bg-white group-hover:bg-gray-50 px-4 py-3 border-r h-[120px] w-[200px] min-w-[200px]">
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
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] uppercase ${getStatusClasses(d.status)}`}
                        >
                          {!d.status || d.status === "--"
                            ? "NO STATUS"
                            : d.status}
                        </span>
                        <div className="flex flex-col items-center gap-1">
                          {/* Displaying the Work Hour (total_hour from JSON) */}
                          <p className="text-[11px] bg-gray-100 text-gray-700 rounded px-2 py-0.5 font-medium">
                            {d.work_hour}
                          </p>
                          {d.display_checkout ? (
                            <span className="text-[9px] text-orange-500 font-medium">
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

        {/* PAGINATION */}
        {filteredEmployees.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 px-4 py-3 text-[12.5px] border-t border-gray-100 bg-white">
            <span className="text-gray-500">
              Showing {startIdx + 1}-
              {Math.min(endIdx, filteredEmployees.length)} of{" "}
              {filteredEmployees.length}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded disabled:opacity-50 hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="p-2 rounded disabled:opacity-50 hover:bg-gray-100 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar { height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #ccc; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #999; }
      `,
        }}
      />
    </div>
  );
}

export default MusterRoll;
