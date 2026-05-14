import React, { useEffect, useState } from "react";
import {
  Download,
  Search,
  ArrowLeft,
  Bell,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../ui/pagelayout";
import avatar from "../../assets/img/avatar.svg";
import { fetchConsolidatedData } from "../../service/employeeService";

// IMPORT EXCEL LOGIC AND STYLES
import * as XLSX from "xlsx-js-style";
import {
  titleStyle,
  headerStyle,
  textCellStyle,
  numberCellStyle,
} from "../helpers/exelsheet";

const ConsolidatedData = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [month, setMonth] = useState("10"); // Default October
  const [year, setYear] = useState("2025");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const getConsolidatedData = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchConsolidatedData(month, year);
      setData(result);
      setCurrentPage(1);
    } catch (err) {
      console.error("❌ Error fetching consolidated data:", err);
      setError(
        "Failed to load consolidated data. Please check your token or network.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getConsolidatedData();
  }, [month, year]);

  const filteredData = data.filter((item) =>
    item.user_name?.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handlePrev = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNext = () =>
    currentPage < totalPages && setCurrentPage(currentPage + 1);

  const getBadgeColor = (key) => {
    switch (key) {
      case "on_time":
        return "bg-[#d6f6e5] text-[#2c7744]";
      case "delay_days":
        return "bg-[#ffede2] text-[#f75402]";
      case "late_days":
        return "bg-[#e8f1ff] text-[#0062ff]";
      case "absent_days":
        return "bg-[#fde2e2] text-[#d92c2c]";
      default:
        return "bg-gray-100 text-gray-500";
    }
  };

  // NEW STYLED EXCEL DOWNLOAD LOGIC
  const handleDownload = () => {
    if (!data.length) return;

    const headerRow = [
      "Employee Name",
      "On Time",
      "Delay Days",
      "Late Days",
      "Absent Days",
      "Worked Days",
      "Total Work Days",
      "Total Days",
    ];

    const dataRows = data.map((item) => [
      item.user_name || "",
      item.on_time || 0,
      item.delay_days || 0,
      item.late_days || 0,
      item.absent_days || 0,
      item.total_worked_days || 0,
      item.total_work_days || 0,
      item.total_days || 0,
    ]);

    const sheetData = [
      ["CONSOLIDATED ATTENDANCE REPORT"],
      headerRow,
      ...dataRows,
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    // Merging the Title Row
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: headerRow.length - 1 } },
    ];

    // Column Widths
    ws["!cols"] = [
      { wch: 30 }, // Name
      { wch: 12 }, // On Time
      { wch: 12 }, // Delay
      { wch: 12 }, // Late
      { wch: 12 }, // Absent
      { wch: 15 }, // Worked
      { wch: 15 }, // Work Days
      { wch: 15 }, // Total Days
    ];

    // Applying Styles loop
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellRef]) continue;

        if (R === 0) ws[cellRef].s = titleStyle;
        else if (R === 1) ws[cellRef].s = headerStyle;
        else if (typeof ws[cellRef].v === "number")
          ws[cellRef].s = numberCellStyle;
        else ws[cellRef].s = textCellStyle;
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, "Consolidated Report");
    XLSX.writeFile(wb, `consolidated_report_${month}_${year}.xlsx`);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen w-full bg-[#f9fafb] p-3">
        {/* Header */}
        <header className="flex items-center justify-between bg-white px-6 py-3 border rounded-xl mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-sm text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft size={16} className="mr-1" />
              Back
            </button>
            <h1 className="text-lg font-medium text-gray-800 font-[Poppins]">
              Consolidated Data
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full hover:bg-gray-100">
              <Bell size={20} className="text-gray-600" />
            </button>
            <img
              src={avatar}
              alt="User Avatar"
              className="w-8 h-8 rounded-full border object-cover"
            />
          </div>
        </header>

        {/* Filters */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1.5 h-8 text-xs bg-white font-medium text-gray-700 cursor-pointer"
            >
              {[
                "01",
                "02",
                "03",
                "04",
                "05",
                "06",
                "07",
                "08",
                "09",
                "10",
                "11",
                "12",
              ].map((m, idx) => (
                <option key={m} value={m}>
                  {new Date(0, idx).toLocaleString("default", {
                    month: "long",
                  })}
                </option>
              ))}
            </select>

            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1.5 h-8 text-xs bg-white font-medium text-gray-700 cursor-pointer"
            >
              {[2023, 2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <button
              onClick={handleDownload}
              className="bg-black text-white px-3 py-1.5 h-8 rounded-md text-xs flex items-center gap-1 hover:bg-gray-800 transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5" /> Download
            </button>
          </div>

          {/* Search */}
          <div className="flex items-center gap-1 border px-2 py-1.5 h-8 rounded-md bg-gray-50 text-xs w-36 sm:w-48">
            <input
              type="text"
              placeholder="Search by name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent w-full focus:outline-none text-xs"
            />
            <Search className="w-3.5 h-3.5 text-gray-400" />
          </div>
        </div>

        {/* Table Section */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
            <table
              className="min-w-full text-[12px] font-[Poppins] border-separate"
              style={{ borderSpacing: "0 10px" }}
            >
              <thead className="text-black text-[12px] font-normal">
                <tr className="bg-white shadow-sm">
                  <th className="text-left px-4 py-3 rounded-tl-lg">Name</th>
                  <th className="text-center px-4 py-3">On Time</th>
                  <th className="text-center px-4 py-3">Delay</th>
                  <th className="text-center px-4 py-3">Late</th>
                  <th className="text-center px-4 py-3">Absent</th>
                  <th className="text-center px-4 py-3">Worked</th>
                  <th className="text-center px-4 py-3">Work Days</th>
                  <th className="text-center px-4 py-3 rounded-tr-lg">
                    Total Days
                  </th>
                </tr>
              </thead>
              <tbody className="text-gray-700 font-normal">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-gray-500">
                      No records found
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 transition bg-white shadow-sm"
                    >
                      <td className="px-4 py-3 text-left text-gray-900 rounded-l-lg font-medium">
                        {item.user_name}
                      </td>
                      {[
                        "on_time",
                        "delay_days",
                        "late_days",
                        "absent_days",
                      ].map((key) => (
                        <td key={key} className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center justify-center ${getBadgeColor(
                              key,
                            )} w-7 h-7 rounded-full`}
                          >
                            {item[key]}
                          </span>
                        </td>
                      ))}
                      <td className="px-4 py-3 text-center">
                        {item.total_worked_days}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.total_work_days}
                      </td>
                      <td className="px-4 py-3 text-center rounded-r-lg">
                        {item.total_days}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {filteredData.length > itemsPerPage && (
              <div className="flex justify-end items-center gap-3 px-6 py-4 border-t">
                <button
                  onClick={handlePrev}
                  disabled={currentPage === 1}
                  className="disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={handleNext}
                  disabled={currentPage === totalPages}
                  className="disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ConsolidatedData;
