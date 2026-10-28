import React, { useState, useEffect } from "react";
import { FiDownload } from "react-icons/fi";
import { Icon } from "@iconify/react";
import ReportTable from "../../ui/reporttable";
import * as XLSX from "xlsx-js-style";

// ✅ API Service
import { fetchHappinessReport } from "../../service/reportsService";

import {
  titleStyle,
  headerStyle,
  textCellStyle,
  numberCellStyle,
} from "../helpers/exelsheet";

const getCurrentMonthWeek = () => {
  const date = new Date();
  const day = date.getDate();
  return Math.min(Math.ceil(day / 7), 5);
};

// Local-time YYYY-MM-DD (toISOString shifts the day back for IST mornings)
const formatDateString = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// ✅ SIMPLE TABLE COLUMNS
const columns = [
  { key: "rating_date", label: "Date", width: 130 },
  { key: "staff_name", label: "Name", width: 220 },
  { key: "department", label: "Department", width: 200 },
  { key: "designation", label: "Designation", width: 200 },
  { key: "rating", label: "Rating", width: 100 },
  { key: "feedback", label: "Feedback / Comment", width: 320 },
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

/* ---------- SELECT FIELD (same box as the date field) ---------- */
function SelectField({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1">
      <label className={labelCls}>{label}</label>

      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${controlCls} appearance-none cursor-pointer`}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Icon icon="solar:alt-arrow-down-outline" className={iconCls} />
      </div>
    </div>
  );
}

const FILTER_TYPE_OPTIONS = [
  { value: "date", label: "Date" },
  { value: "week", label: "Week" },
];

export default function FeedbackReports() {
  const today = new Date();
  const maxAvailableWeek = getCurrentMonthWeek();

  const [filterType, setFilterType] = useState("date");
  const [selectedDate, setSelectedDate] = useState(formatDateString(today));
  const [selectedWeek, setSelectedWeek] = useState(maxAvailableWeek);

  const [searchTerm, setSearchTerm] = useState("");
  const [apiData, setApiData] = useState([]);
  const [loading, setLoading] = useState(false);

  const weekOptions = Array.from({ length: maxAvailableWeek }, (_, i) => ({
    value: i + 1,
    label: `Week ${i + 1}`,
  }));

  useEffect(() => {
    const loadReport = async () => {
      setLoading(true);
      try {
        const payload =
          filterType === "date"
            ? { date: selectedDate }
            : { week: Number(selectedWeek) };

        const data = await fetchHappinessReport(payload);

        if (!data || !Array.isArray(data)) {
          setApiData([]);
          return;
        }

        const formattedData = data.map((item) => ({
          staff_id: item.staff_id || "—",
          staff_name: item.staff_name || "—",
          department: item.department || "—",
          designation: item.designation || "—",
          rating:
            item.rating !== undefined && item.rating !== null
              ? `${item.rating}/5`
              : "0/5",
          feedback: item.feedback
            ? `"${item.feedback}"`
            : "No comment provided",
          rating_date: item.rating_date || "—",
        }));

        setApiData(formattedData);
      } catch (err) {
        console.error("❌ Error loading feedback report:", err);
        setApiData([]);
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [filterType, selectedDate, selectedWeek]);

  // ✅ SEARCH FILTER
  const q = searchTerm.toLowerCase();
  const filteredData = apiData.filter((item) =>
    [
      item.staff_name,
      item.department,
      item.designation,
      item.staff_id,
      item.feedback,
    ].some((v) =>
      String(v ?? "")
        .toLowerCase()
        .includes(q),
    ),
  );

  // ✅ DOWNLOAD EXCEL
  const handleDownload = () => {
    if (!filteredData.length) return;

    const headerRow = [
      "Sl No",
      "Date",
      "Name",
      "Department",
      "Designation",
      "Rating",
      "Feedback",
    ];

    const dataRows = filteredData.map((row, i) => [
      i + 1,
      row.rating_date,
      row.staff_name,
      row.department,
      row.designation,
      row.rating,
      row.feedback,
    ]);

    const titleText =
      filterType === "date"
        ? `HAPPINESS & FEEDBACK REPORT - ${selectedDate}`
        : `HAPPINESS & FEEDBACK REPORT - WEEK ${selectedWeek}`;

    const sheetData = [[titleText], headerRow, ...dataRows];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }];

    ws["!cols"] = [
      { wch: 8 },
      { wch: 15 },
      { wch: 30 },
      { wch: 25 },
      { wch: 25 },
      { wch: 12 },
      { wch: 45 },
    ];

    const range = XLSX.utils.decode_range(ws["!ref"]);

    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });

        if (!ws[cellRef]) continue;

        if (R === 0) {
          ws[cellRef].s = titleStyle;
        } else if (R === 1) {
          ws[cellRef].s = headerStyle;
        } else if (typeof ws[cellRef].v === "number") {
          ws[cellRef].s = numberCellStyle;
        } else {
          ws[cellRef].s = textCellStyle;
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, "Feedback Report");

    const fileName =
      filterType === "date"
        ? `Feedback_Report_${selectedDate}.xlsx`
        : `Feedback_Report_Week_${selectedWeek}.xlsx`;

    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="flex flex-col gap-4 text-[13px]">
      {/* Filters + search + download in one row, all controls 38px tall and bottom-aligned */}
      <div className="flex flex-wrap gap-4 items-end bg-gray-50 p-4 rounded-lg border border-gray-100">
        <SelectField
          label="Filter By"
          value={filterType}
          onChange={setFilterType}
          options={FILTER_TYPE_OPTIONS}
        />

        {filterType === "date" ? (
          <DateInput
            label="Date"
            value={selectedDate}
            onChange={setSelectedDate}
          />
        ) : (
          <SelectField
            label="Week"
            value={selectedWeek}
            onChange={(val) => setSelectedWeek(Number(val))}
            options={weekOptions}
          />
        )}

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
          type="button"
          onClick={handleDownload}
          disabled={loading || !filteredData.length}
          className="ml-auto flex items-center gap-2 h-[38px] px-4 text-sm rounded-md bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 transition-all whitespace-nowrap"
        >
          <FiDownload className="w-4 h-4" />
          Download
        </button>
      </div>

      <ReportTable columns={columns} data={filteredData} rowsPerPage={10} />
    </div>
  );
}
