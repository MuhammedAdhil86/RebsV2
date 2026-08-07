import React, { useState, useEffect } from "react";
import { FiDownload } from "react-icons/fi";
import { Icon } from "@iconify/react";
import ReportTable from "../../ui/reporttable";
import CustomSelect from "../../ui/customselect";
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

// ✅ SIMPLE TABLE COLUMNS
const columns = [
  {
    key: "rating_date",
    label: "Date",
    width: 130,
  },
  {
    key: "staff_name",
    label: "Name",
    width: 220,
  },
  {
    key: "department",
    label: "Department",
    width: 200,
  },
  {
    key: "designation",
    label: "Designation",
    width: 200,
  },
  {
    key: "rating",
    label: "Rating",
    width: 100,
  },
  {
    key: "feedback",
    label: "Feedback / Comment",
    width: 320,
  },
];

export default function FeedbackReports() {
  const today = new Date();
  const maxAvailableWeek = getCurrentMonthWeek();

  const [filterType, setFilterType] = useState("date");
  const [selectedDate, setSelectedDate] = useState(
    today.toISOString().split("T")[0],
  );
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
  const filteredData = apiData.filter(
    (item) =>
      item.staff_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.staff_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.feedback?.toLowerCase().includes(searchTerm.toLowerCase()),
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

    ws["!merges"] = [
      {
        s: { r: 0, c: 0 },
        e: { r: 0, c: 6 },
      },
    ];

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
      {/* HEADER CONTROLS */}
      <div className="flex justify-between items-center mb-4 px-2">
        <div className="flex items-center gap-4">
          <div className="text-[16px] font-medium min-w-fit">
            Feedback Report
          </div>

          <CustomSelect
            value={filterType}
            onChange={(val) => setFilterType(val)}
            options={[
              { value: "date", label: "Date Filter" },
              { value: "week", label: "Week Filter" },
            ]}
          />

          {filterType === "date" ? (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border px-3 py-1 rounded outline-none text-[13px]"
            />
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-gray-500 font-medium">Week:</span>
              <CustomSelect
                value={selectedWeek}
                onChange={(val) => setSelectedWeek(Number(val))}
                options={weekOptions}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex items-center px-4 py-1 bg-black text-white rounded whitespace-nowrap disabled:opacity-50"
            onClick={handleDownload}
            disabled={loading || !filteredData.length}
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

      <ReportTable columns={columns} data={filteredData} rowsPerPage={10} />
    </div>
  );
}
