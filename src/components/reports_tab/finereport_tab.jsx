import React, { useEffect, useState } from "react";
import { Loader2, Download, Search } from "lucide-react";
import * as XLSX from "xlsx-js-style";

import CustomSelect from "../../ui/customselect";
import ReportTable from "../../ui/reporttable";

import {
  headerStyle,
  textCellStyle,
  numberCellStyle,
} from "../helpers/exelsheet";

import { fetchAttendanceFineRecords } from "../../service/reportsService";

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

export default function AttendanceFineRecordsReport() {
  const now = new Date();

  // ================= STATES =================
  const [month, setMonth] = useState(monthNames[now.getMonth()]);
  const [year, setYear] = useState(String(now.getFullYear()));
  const [nameSearch, setNameSearch] = useState(""); // Dynamic name string filter state
  const [rawRecords, setRawRecords] = useState([]); // Keeps full structural dataset intact
  const [filteredRecords, setFilteredRecords] = useState([]); // Filtered array sent to UI Table
  const [loading, setLoading] = useState(false);

  // ================= FETCH DATA =================
  const fetchData = async () => {
    try {
      setLoading(true);
      const monthNum = monthNames.indexOf(month) + 1;

      // Fetch data for the entire selected month and year segment block
      const response = await fetchAttendanceFineRecords(monthNum, Number(year));

      const flattenedRecords = [];

      if (response && Array.isArray(response.data)) {
        response.data.forEach((group) => {
          const summary = group.summary || {};
          const innerRecords = group.records || [];

          innerRecords.forEach((rec) => {
            const fineAmount =
              rec.delay_fine_amount !== undefined
                ? rec.delay_fine_amount
                : rec.late_fine_amount !== undefined
                  ? rec.late_fine_amount
                  : 0;

            const fineSource =
              rec.delay_fine_source || rec.late_fine_source || "N/A";

            flattenedRecords.push({
              ...rec,
              user_id: rec.user_id || summary.user_id || "N/A",
              fine_amount: fineAmount,
              fine_source: fineSource,
              total_fine_from_payroll: summary.total_fine_from_payroll || 0,
              total_fine_from_hand: summary.total_fine_from_hand || 0,
            });
          });
        });
      }

      setRawRecords(flattenedRecords);
    } catch (err) {
      console.error("Fine records fetch failed:", err);
      setRawRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch data automatically from DB whenever date windows move
  useEffect(() => {
    fetchData();
  }, [month, year]);

  // Handle instant fuzzy name-matching filtration routines locally over state streams
  useEffect(() => {
    if (!nameSearch.trim()) {
      setFilteredRecords(rawRecords);
    } else {
      const query = nameSearch.toLowerCase().trim();
      const filtered = rawRecords.filter((rec) =>
        (rec.user_name || "").toLowerCase().includes(query),
      );
      setFilteredRecords(filtered);
    }
  }, [nameSearch, rawRecords]);

  // ================= TABLE COLUMNS WITH DYNAMIC ROW HOVER POPUPS =================
  const columns = [
    {
      label: "User ID",
      key: "user_id",
      align: "center",
      width: 100,
      render: (value) => (
        <span className="font-medium text-gray-800">{value}</span>
      ),
    },
    {
      label: "Employee Name",
      key: "user_name",
      align: "center",
      width: 180,
      render: (value, row) => (
        <div className="relative w-full h-full flex items-center justify-center py-1 group select-none">
          <span className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
            {value}
          </span>

          {/* FLOATING ROW HOVER CARD */}
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col gap-1.5 p-3.5 bg-white text-black rounded-xl shadow-2xl border border-gray-200 min-w-[220px] text-left pointer-events-none z-[999999]">
            <div className="text-[11px] font-bold tracking-wider text-gray-500 uppercase border-b border-gray-100 pb-1.5 mb-1">
              Employee Fine Summary
            </div>
            <div className="flex justify-between text-[12px] py-0.5">
              <span className="text-gray-500 font-medium">User ID:</span>
              <span className="font-mono font-bold text-gray-900">
                {row.user_id}
              </span>
            </div>
            <div className="flex justify-between text-[12px] py-0.5">
              <span className="text-gray-500 font-medium">
                Total via Payroll:
              </span>
              <span className="font-bold text-green-600">
                ₹{row.total_fine_from_payroll}
              </span>
            </div>
            <div className="flex justify-between text-[12px] py-0.5">
              <span className="text-gray-500 font-medium">Total via Hand:</span>
              <span className="font-bold text-yellow-600">
                ₹{row.total_fine_from_hand}
              </span>
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.1)]" />
          </div>
        </div>
      ),
    },
    { label: "Department", key: "department", align: "center", width: 140 },
    { label: "Designation", key: "designation", align: "center", width: 140 },
    { label: "Date", key: "date", align: "center", width: 110 },
    { label: "Shift Name", key: "shift_name", align: "center", width: 150 },
    { label: "Status", key: "status", align: "center", width: 100 },
    { label: "Fine Amount", key: "fine_amount", align: "center", width: 120 },
    { label: "Fine Source", key: "fine_source", align: "center", width: 120 },
  ];

  // ================= DOWNLOAD EXCEL =================
  const handleDownloadExcel = () => {
    if (!filteredRecords.length) return;

    try {
      setLoading(true);

      const headerRow = [
        "User ID",
        "Employee Name",
        "Department",
        "Designation",
        "Date",
        "Shift Name",
        "Status",
        "Fine Amount",
        "Fine Source",
        "Total Fine (Payroll)",
        "Total Fine (Hand)",
      ];
      const dataRows = filteredRecords.map((r) => [
        r.user_id,
        r.user_name || "N/A",
        r.department || "N/A",
        r.designation || "N/A",
        r.date || "N/A",
        r.shift_name || "N/A",
        r.status || "N/A",
        r.fine_amount,
        r.fine_source,
        r.total_fine_from_payroll,
        r.total_fine_from_hand,
      ]);

      const sheetData = [headerRow, ...dataRows];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(sheetData);

      const range = XLSX.utils.decode_range(ws["!ref"]);
      for (let R = range.s.r; R <= range.e.r; R++) {
        for (let C = range.s.c; C <= range.e.c; C++) {
          const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[cellRef]) continue;

          if (R === 0) {
            ws[cellRef].s = headerStyle;
          } else if (typeof ws[cellRef].v === "number") {
            ws[cellRef].s = numberCellStyle;
          } else {
            ws[cellRef].s = textCellStyle;
          }
        }
      }

      XLSX.utils.book_append_sheet(wb, ws, "Fine Records");
      XLSX.writeFile(wb, `attendance_fine_report_${month}_${year}.xlsx`);
    } catch (err) {
      console.error("Excel generation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-1 rounded-xl font-poppins text-[12px] fine-report-main-wrapper">
      {/* OVERFLOW EXTRACTION OVERRIDES */}
      <style>{`
        .fine-report-main-wrapper section,
        .fine-report-main-wrapper div {
          overflow: visible !important;
        }
        .fine-report-main-wrapper table {
          border-collapse: separate !important;
        }
        .fine-report-main-wrapper tbody tr:hover td {
          z-index: 50 !important;
          background-color: #f8fafc !important;
        }
        .fine-report-main-wrapper tbody td {
          overflow: visible !important;
          position: relative !important;
        }
      `}</style>

      {/* Filters Bar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <CustomSelect
            label="Month"
            value={month}
            onChange={setMonth}
            options={monthNames}
          />
          <CustomSelect
            label="Year"
            value={year}
            onChange={setYear}
            options={[2024, 2025, 2026]}
            minWidth={80}
          />

          {/* 
            ─── IDENTICAL NAME SEARCH CONTAINER ───
            Matches all spatial sizes, labels, internal text padding dimensions,
            font sizing, text structures, and the '6px' border-radius signature from CustomSelect.
          */}
          <div className="flex items-center gap-2">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Name"
                value={nameSearch}
                onChange={(e) => setNameSearch(e.target.value)}
                className="border px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-black bg-white placeholder:text-gray-400 text-gray-800"
                style={{
                  width: "18ch",
                  minWidth: "160px",
                  borderRadius: "6px",
                  height: "34px", // Matches standard heights of CustomSelect blocks safely
                }}
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        <button
          onClick={handleDownloadExcel}
          disabled={!filteredRecords.length || loading}
          className="flex items-center gap-2 h-[34px] px-5 text-[12px] rounded-lg border bg-black text-white disabled:opacity-50 hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Download Report
        </button>
      </div>

      {/* Table Wrapper Block */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="mt-2 text-[12px] text-blue-500">
              Fetching fine records data...
            </p>
          </div>
        ) : (
          <div className="w-full scrollbar-none">
            {filteredRecords.length === 0 ? (
              <div className="text-center py-16 text-gray-400 font-medium">
                No matching fine records found.
              </div>
            ) : (
              <ReportTable
                columns={columns}
                data={filteredRecords}
                rowsPerPage={10}
                onRowClick={(row) => console.log("Row clicked:", row)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
