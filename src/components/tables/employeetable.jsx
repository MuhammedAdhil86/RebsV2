import React, { useState, useEffect, useRef } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchEmployeeAttendanceByMonth } from "../../service/totalEmployeeService";
import useEmployeeStore from "../../store/employeeStore";
import EmployeeModal from "../../ui/employeemodal";

function EmployeeTable({ employees, loading }) {
  const rowsPerPage = 6;
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [colWidths, setColWidths] = useState([]);
  const headerRef = useRef(null);
  const [hoverText, setHoverText] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Updated state to hold both employee info and attendance data
  const [selectedEmployeeData, setSelectedEmployeeData] = useState({
    employee: null,
    attendance: [],
  });

  const { selectedDay } = useEmployeeStore();

  const isTruncated = (el) => el && el.scrollWidth > el.clientWidth;

  const filteredEmployees = employees.filter((emp) => {
    const term = searchTerm.toLowerCase();
    return (
      emp.name?.toLowerCase().includes(term) ||
      emp.designationname?.String?.toLowerCase().includes(term) ||
      emp.branch?.String?.toLowerCase().includes(term) ||
      emp.shift?.toLowerCase().includes(term) ||
      emp.ph_no?.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredEmployees.length / rowsPerPage);
  const startIdx = (currentPage - 1) * rowsPerPage;
  const endIdx = startIdx + rowsPerPage;
  const currentEmployees = filteredEmployees.slice(startIdx, endIdx);

  const handlePrev = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNext = () =>
    currentPage < totalPages && setCurrentPage(currentPage + 1);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Sync header & body column widths
  useEffect(() => {
    if (headerRef.current) {
      const widths = Array.from(headerRef.current.querySelectorAll("th")).map(
        (th) => th.offsetWidth,
      );
      setColWidths(widths);
    }
  }, [employees, searchTerm]);

  // Row click handler: fetch attendance and store employee + data
  const handleRowClick = async (emp) => {
    try {
      const response = await fetchEmployeeAttendanceByMonth(
        emp.uuid,
        selectedDay,
      );
      setSelectedEmployeeData({
        employee: emp,
        attendance: response.data || [],
      });
    } catch (error) {
      console.error("Error fetching modal data:", error);
      setSelectedEmployeeData({
        employee: emp,
        attendance: [],
      });
    }
  };

  return (
    <section className="p-2 rounded-2xl overflow-x-auto relative w-full">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2">
        <h3 className="text-base font-medium text-gray-800">Employee List</h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 border border-gray-200 px-2 py-1.5 rounded-md bg-gray-50 text-xs w-full sm:w-40 mt-2 sm:mt-0">
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={handleSearchChange}
              className="bg-transparent text-gray-700 w-full focus:outline-none text-xs placeholder:text-gray-400"
            />
            <Search className="w-3.5 h-3.5 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Loader */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-4 border-blue-500 border-dashed rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Header Table */}
          <div className="overflow-x-auto w-full">
            <table
              className="w-full min-w-[600px] text-[12px] bg-white border-separate border-spacing-0 rounded-2xl"
              ref={headerRef}
            >
              <thead className="bg-white text-gray-600 text-[12.5px] rounded-xl">
                <tr>
                  {[
                    "Employee",
                    "Designation",
                    "Mobile",
                    "Branch",
                    "Shift",
                    "Status",
                  ].map((col, idx) => (
                    <th
                      key={col}
                      className="px-8 py-3 font-medium text-gray-700 whitespace-nowrap text-left align-middle rounded-xl"
                      style={{
                        width: colWidths[idx] ? `${colWidths[idx]}px` : "auto",
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
            </table>
          </div>

          <div className="h-2" />

          {/* Body Table */}
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[600px] text-[12px] bg-white border-separate border-spacing-0 rounded-2xl">
              <tbody className="text-gray-800 font-poppins text-[12px]">
                {currentEmployees.length === 0 ? (
                  <tr className="border-b border-gray-300">
                    <td colSpan={6} className="text-center py-4 text-gray-500">
                      No data available
                    </td>
                  </tr>
                ) : (
                  currentEmployees.map((emp, idx) => (
                    <tr
                      key={idx}
                      onClick={() => handleRowClick(emp)}
                      className="hover:bg-gray-50 align-middle border-b border-gray-300 cursor-pointer"
                    >
                      {/* Name */}
                      <td
                        data-label="Employee"
                        className="px-4 py-3 relative group border-b border-[#f9fafb]"
                        style={{
                          width: colWidths[0] ? `${colWidths[0]}px` : "auto",
                        }}
                        onMouseEnter={(e) => {
                          if (isTruncated(emp._nameRef)) {
                            const rect = e.target.getBoundingClientRect();
                            setTooltipPos({ x: rect.left, y: rect.top - 28 });
                            setHoverText(emp.name);
                          }
                        }}
                        onMouseLeave={() => setHoverText(null)}
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={
                              emp.image ||
                              `https://i.pravatar.cc/40?img=${startIdx + idx + 1}`
                            }
                            alt={emp.name}
                            className="w-7 h-7 rounded-full"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://i.pravatar.cc/40?img=${startIdx + idx + 1}`;
                            }}
                          />
                          <span
                            className="block truncate max-w-[120px]"
                            ref={(el) => (emp._nameRef = el)}
                          >
                            {emp.name}
                          </span>
                        </div>
                      </td>

                      {/* Designation */}
                      <td
                        data-label="Designation"
                        className="px-4 py-3 relative group border-b border-[#f9fafb]"
                        style={{
                          width: colWidths[1] ? `${colWidths[1]}px` : "auto",
                        }}
                        onMouseEnter={(e) => {
                          if (isTruncated(emp._desigRef)) {
                            const rect = e.target.getBoundingClientRect();
                            setTooltipPos({ x: rect.left, y: rect.top - 28 });
                            setHoverText(emp.designationname?.String);
                          }
                        }}
                        onMouseLeave={() => setHoverText(null)}
                      >
                        <span
                          className="truncate block max-w-[120px]"
                          ref={(el) => (emp._desigRef = el)}
                        >
                          {emp.designationname?.String}
                        </span>
                      </td>

                      {/* Mobile */}
                      <td
                        className="px-4 py-3 truncate max-w-[120px] border-b border-[#f9fafb]"
                        style={{ width: colWidths[2] }}
                      >
                        {emp.ph_no}
                      </td>

                      {/* Branch */}
                      <td
                        className="px-4 py-3 truncate max-w-[120px] border-b border-[#f9fafb]"
                        style={{ width: colWidths[3] }}
                      >
                        {emp.branch?.String || "Head Office"}
                      </td>

                      {/* Shift */}
                      <td
                        className="px-4 py-3 border-b border-[#f9fafb]"
                        style={{ width: colWidths[4] }}
                      >
                        {emp.shift || "Day Shift"}
                      </td>

                      {/* Status */}
                      <td
                        className="px-4 py-3 border-b border-[#f9fafb] relative"
                        style={{ width: colWidths[5] }}
                        onMouseEnter={(e) => {
                          if (emp.status === "Early Check-in") {
                            const rect = e.target.getBoundingClientRect();
                            setTooltipPos({ x: rect.left, y: rect.top - 28 });
                            setHoverText(emp.status);
                          }
                        }}
                        onMouseLeave={() => setHoverText(null)}
                      >
                        <span
                          className={`px-3 py-1 w-[85px] text-center rounded-full text-[12px] font-poppins truncate cursor-default ${
                            emp.status === "Online"
                              ? "bg-green-100 text-green-600"
                              : emp.status === "Absent"
                                ? "bg-red-100 text-red-600"
                                : emp.status === "Late"
                                  ? "bg-purple-100 text-purple-600"
                                  : "bg-blue-100 text-blue-600"
                          }`}
                        >
                          {emp.status === "Early Check-in"
                            ? "Early..."
                            : emp.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}

                {/* Pagination */}
                {filteredEmployees.length > 0 && (
                  <tr>
                    <td colSpan={6}>
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-2 px-4 py-3 text-[12px] rounded-b-2xl">
                        <span className="text-gray-500">
                          Showing {startIdx + 1}-
                          {Math.min(endIdx, filteredEmployees.length)} of{" "}
                          {filteredEmployees.length}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={handlePrev}
                            disabled={currentPage === 1}
                            className="p-2 rounded disabled:opacity-50 hover:bg-gray-300 transition"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleNext}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded disabled:opacity-50 hover:bg-gray-300 transition"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Tooltip */}
      {hoverText && (
        <div
          className="fixed px-2 py-1 bg-black text-white text-xs rounded shadow-lg z-[999999]"
          style={{ top: tooltipPos.y, left: tooltipPos.x }}
        >
          {hoverText}
        </div>
      )}

      {/* Mobile View */}
      <style>
        {`
          @media (max-width: 640px) {
            table, thead, tbody, th, td, tr { display: block; }
            thead tr { display: none; }
            tbody tr { margin-bottom: 1rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 0.5rem; }
            tbody td { display: flex; justify-content: space-between; padding: 0.25rem 0.5rem; }
            tbody td::before { content: attr(data-label); font-weight: 500; color: #6b7280; }
          }
        `}
      </style>

      {/* Modal */}
      <EmployeeModal
        data={selectedEmployeeData.attendance}
        employee={selectedEmployeeData.employee}
        onClose={() =>
          setSelectedEmployeeData({ employee: null, attendance: [] })
        }
      />
    </section>
  );
}

export default EmployeeTable;
