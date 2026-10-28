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

/* One look for every control in the filter row (38px tall) */
const controlCls =
  "w-full min-w-[170px] h-[38px] border rounded-md bg-white pl-3 pr-9 text-sm outline-none focus:ring-2 focus:ring-black";

const iconCls =
  "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black";

const labelCls = "text-[10px] text-gray-400 uppercase ml-1";

/* ---------- DATE FIELD (calendar icon, whole field opens the picker) ---------- */
function DateInput({ label, value, onChange, min, max }) {
  return (
    <div className="flex flex-col gap-1">
      <label className={labelCls}>{label}</label>

      <div className="relative">
        <input
          type="date"
          value={value}
          min={min}
          max={max}
          onChange={(e) => onChange(e.target.value)}
          className={`${controlCls} relative
            [&::-webkit-calendar-picker-indicator]:absolute
            [&::-webkit-calendar-picker-indicator]:inset-0
            [&::-webkit-calendar-picker-indicator]:h-full
            [&::-webkit-calendar-picker-indicator]:w-full
            [&::-webkit-calendar-picker-indicator]:cursor-pointer
            [&::-webkit-calendar-picker-indicator]:opacity-0`}
        />
        <Icon icon="solar:calendar-outline" className={iconCls} />
      </div>
    </div>
  );
}

// Local-time YYYY-MM-DD (toISOString shifts the day back for IST mornings)
const formatDateString = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default function UnapprovedAbsentReports() {
  const today = new Date();
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
      {/* Filters + search + download in one row, all controls 38px tall and bottom-aligned */}
      <div className="flex flex-wrap gap-4 items-end bg-gray-50 p-4 rounded-lg border border-gray-100">
        <DateInput
          label="From"
          value={fromDate}
          onChange={setFromDate}
          max={toDate}
        />

        <DateInput
          label="To"
          value={toDate}
          onChange={setToDate}
          min={fromDate}
        />

        <div className="relative">
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`${controlCls} min-w-[220px]`}
          />
          <Icon icon="mynaui:search" className={iconCls} />
        </div>

        <button
          onClick={handleDownload}
          disabled={!filteredData.length}
          className="ml-auto flex items-center gap-2 h-[38px] px-4 text-sm rounded-md bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 transition-all whitespace-nowrap"
        >
          <FiDownload className="w-4 h-4" />
          Download
        </button>
      </div>

      {/* RENDER REPORT TABLE */}
      <ReportTable columns={columns} data={filteredData} rowsPerPage={10} />
    </div>
  );
}
