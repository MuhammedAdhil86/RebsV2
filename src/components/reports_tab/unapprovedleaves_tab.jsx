import React, { useState, useEffect } from "react";
import { FiDownload } from "react-icons/fi";
import { Icon } from "@iconify/react";
import ReportTable from "../../ui/reporttable";
import * as XLSX from "xlsx-js-style";

// ✅ API Service
import { fetchUnapprovedAbsentReport } from "../../service/reportsService";

import {
  titleStyle,
  headerStyle,
  textCellStyle,
  numberCellStyle,
} from "../helpers/exelsheet";

// ✅ REARRANGED COLUMNS (Date first, Name second, UUID completely removed)
const columns = [
  { key: "date", label: "Absent Date", width: 130 },
  { key: "user_name", label: "Name", width: 200 },
  { key: "designation", label: "Designation", width: 200 },
  { key: "department", label: "Department", width: 180 },
  { key: "branch", label: "Branch", width: 150 },
  { key: "leave_ref_no", label: "Leave Ref No", width: 110 },
  { key: "remarks", label: "Remarks", width: 180 },
  { key: "status", label: "Status", width: 110 },
  { key: "manager_status", label: "Manager Status", width: 130 },
  { key: "manager_remarks", label: "Manager Remarks", width: 180 },
  { key: "half_day_type", label: "Half Day Type", width: 110 },
  { key: "violation_count", label: "Violation Count", width: 120 },
];

export default function UnapprovedAbsentReports() {
  const today = new Date();

  const formatDateString = (date) => date.toISOString().split("T")[0];
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [fromDate, setFromDate] = useState(formatDateString(firstDayOfMonth));
  const [toDate, setToDate] = useState(formatDateString(today));
  const [searchTerm, setSearchTerm] = useState("");
  const [apiData, setApiData] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      if (!fromDate || !toDate) return;

      try {
        const data = await fetchUnapprovedAbsentReport(fromDate, toDate);

        if (!data || data.length === 0) {
          setApiData([]);
          return;
        }

        const formattedData = data.map((item) => ({
          user_name: item.name || "—",
          designation: item.designation || "—",
          department: item.department || "—",
          branch: item.branch || "—",
          date: item.date ? item.date.split("T")[0] : "—",
          leave_ref_no:
            item.leave_ref_no !== undefined ? item.leave_ref_no : "—",
          remarks: item.remarks || "—",
          status: item.status || "—",
          manager_status: item.manager_status || "—",
          manager_remarks: item.manager_remarks || "—",
          half_day_type:
            item.half_day_type !== undefined ? item.half_day_type : "—",
          violation_count:
            item.violation_count !== undefined ? item.violation_count : "—",
        }));

        setApiData(formattedData);
      } catch (err) {
        console.error("❌ Error loading unapproved absences report:", err);
        setApiData([]);
      }
    };

    loadData();
  }, [fromDate, toDate]);

  // ✅ SEARCH FILTER
  const filteredData = apiData.filter(
    (item) =>
      item.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.designation?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // ✅ DOWNLOAD EXCEL
  const handleDownload = () => {
    if (!filteredData.length) return;

    const headerRow = columns.map((col) => col.label);

    const dataRows = filteredData.map((row) =>
      columns.map((col) => {
        if (
          col.key === "leave_ref_no" ||
          col.key === "half_day_type" ||
          col.key === "violation_count"
        ) {
          return typeof row[col.key] === "number"
            ? row[col.key]
            : Number(row[col.key]) || 0;
        }
        return row[col.key];
      }),
    );

    const sheetData = [
      [`FULL UNAPPROVED ABSENCES REPORT FROM ${fromDate} TO ${toDate}`],
      headerRow,
      ...dataRows,
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } }];
    ws["!cols"] = columns.map((col) => ({ wch: Math.ceil(col.width / 7) }));

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

    XLSX.utils.book_append_sheet(wb, ws, "Unapproved Absences");
    XLSX.writeFile(
      wb,
      `Full_Unapproved_Absences_${fromDate}_to_${toDate}.xlsx`,
    );
  };

  return (
    <div className="flex flex-col gap-4 text-[13px]">
      {/* HEADER CONTROLS */}
      <div className="flex justify-between items-center mb-4 px-2 flex-wrap gap-4">
        {/* LEFT: DATE RANGE INPUTS */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-medium">From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border border-gray-300 px-3 py-1 rounded outline-none text-gray-700 bg-white focus:border-black transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-medium">To:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border border-gray-300 px-3 py-1 rounded outline-none text-gray-700 bg-white focus:border-black transition-colors"
            />
          </div>
        </div>

        {/* RIGHT: INTERACTION BLOCKS */}
        <div className="flex items-center gap-3">
          <button
            className="flex items-center px-4 py-1 bg-black text-white rounded whitespace-nowrap"
            onClick={handleDownload}
          >
            <FiDownload className="mr-2" />
            Download
          </button>

          <div className="relative w-[220px]">
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border px-3 py-1 rounded w-full outline-none"
            />
            <Icon
              icon="mynaui:search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>
        </div>
      </div>

      {/* RENDER REPORT TABLE */}
      <ReportTable columns={columns} data={filteredData} rowsPerPage={10} />
    </div>
  );
}
