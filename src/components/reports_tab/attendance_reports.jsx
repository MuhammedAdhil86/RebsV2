import React, { useState, useEffect } from "react";
import { FiDownload } from "react-icons/fi";
import { Icon } from "@iconify/react";
import ReportTable from "../../ui/reporttable";
import CustomSelect from "../../ui/customselect";
import * as XLSX from "xlsx-js-style";

// ✅ API
import { fetchConsolidatedData } from "../../service/employeeService";

import {
  titleStyle,
  headerStyle,
  textCellStyle,
  numberCellStyle,
} from "../helpers/exelsheet";

// ✅ TABLE COLUMNS
const columns = [
  {
    key: "user_id",
    label: "User ID",
    width: 120,
  },

  {
    key: "user_name",
    label: "Name",
    width: 250,
  },

  {
    key: "designation",
    label: "Designation",
    width: 250,
  },

  {
    key: "department",
    label: "Department",
    width: 220,
  },

  {
    key: "on_time",
    label: "On Time",
    width: 120,
  },

  {
    key: "late_days",
    label: "Late Days",
    width: 120,
  },

  {
    key: "delay_days",
    label: "Delay Days",
    width: 120,
  },

  {
    key: "absent_days",
    label: "Absent Days",
    width: 120,
  },

  {
    key: "half_days",
    label: "Half Days",
    width: 120,
  },

  {
    key: "leave_days",
    label: "Leave Days",
    width: 120,
  },

  {
    key: "holidays",
    label: "Holidays",
    width: 120,
  },

  {
    key: "weekly_off_days",
    label: "Weekly Off",
    width: 130,
  },

  {
    key: "total_work_days",
    label: "Total Work Days",
    width: 170,
  },

  {
    key: "total_worked_days",
    label: "Worked Days",
    width: 150,
  },

  {
    key: "total_days",
    label: "Total Days",
    width: 120,
  },
];

export default function AttendanceReports() {
  const today = new Date();

  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);

  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  const [searchTerm, setSearchTerm] = useState("");

  const [apiData, setApiData] = useState([]);

  const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleString(
    "default",
    {
      month: "long",
    },
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchConsolidatedData(selectedMonth, selectedYear);

        console.log("✅ Consolidated Data:", data);

        if (!data || data.length === 0) {
          setApiData([]);
          return;
        }

        const formattedData = data.map((item) => ({
          user_id: item.user_id || "—",

          user_name: item.user_name || "—",

          designation: item.designation || "—",

          department: item.department || "—",

          on_time: item.on_time || "0",

          late_days: item.late_days || "0",

          delay_days: item.delay_days || "0",

          absent_days: item.absent_days || "0",

          half_days: item.half_days || "0",

          leave_days: item.leave_days || "0",

          holidays: item.holidays || "0",

          weekly_off_days: item.weekly_off_days || "0",

          total_work_days: item.total_work_days || "0",

          total_worked_days: item.total_worked_days || "0",

          total_days: item.total_days || "0",
        }));

        setApiData(formattedData);
      } catch (err) {
        console.error("❌ Error loading report:", err);

        setApiData([]);
      }
    };

    loadData();
  }, [selectedMonth, selectedYear]);

  // ✅ SEARCH FILTER
  const filteredData = apiData.filter(
    (item) =>
      item.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user_id?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // ✅ DOWNLOAD EXCEL
  const handleDownload = () => {
    if (!filteredData.length) return;

    const headerRow = [
      "Sl No",
      "User ID",
      "Name",
      "Designation",
      "Department",
      "On Time",
      "Late Days",
      "Delay Days",
      "Absent Days",
      "Half Days",
      "Leave Days",
      "Holidays",
      "Weekly Off",
      "Total Work Days",
      "Worked Days",
      "Total Days",
    ];

    const dataRows = filteredData.map((row, i) => [
      i + 1,
      row.user_id,
      row.user_name,
      row.designation,
      row.department,
      row.on_time,
      row.late_days,
      row.delay_days,
      row.absent_days,
      row.half_days,
      row.leave_days,
      row.holidays,
      row.weekly_off_days,
      row.total_work_days,
      row.total_worked_days,
      row.total_days,
    ]);

    const sheetData = [
      [`MONTH OF ${monthName.toUpperCase()} ${selectedYear}`],

      headerRow,

      ...dataRows,
    ];

    const wb = XLSX.utils.book_new();

    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    ws["!merges"] = [
      {
        s: { r: 0, c: 0 },
        e: { r: 0, c: 15 },
      },
    ];

    ws["!cols"] = [
      { wch: 8 },
      { wch: 15 },
      { wch: 35 },
      { wch: 35 },
      { wch: 30 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 14 },
      { wch: 18 },
      { wch: 18 },
      { wch: 12 },
    ];

    const range = XLSX.utils.decode_range(ws["!ref"]);

    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cellRef = XLSX.utils.encode_cell({
          r: R,
          c: C,
        });

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

    XLSX.utils.book_append_sheet(wb, ws, "Attendance");

    XLSX.writeFile(wb, `Attendance_${monthName}_${selectedYear}.xlsx`);
  };

  return (
    <div className="flex flex-col gap-4 text-[13px]">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4 px-2">
        {/* LEFT */}
        <div className="flex items-center gap-4">
          <div className="text-[16px] font-medium min-w-fit">
            {monthName} {selectedYear}
          </div>

          <CustomSelect
            value={selectedYear}
            onChange={(val) => setSelectedYear(Number(val))}
            options={Array.from({ length: 5 }, (_, i) => {
              const yr = today.getFullYear() - 2 + i;

              return {
                value: yr,
                label: yr,
              };
            })}
          />

          <CustomSelect
            value={selectedMonth}
            onChange={(val) => setSelectedMonth(Number(val))}
            options={Array.from({ length: 12 }, (_, i) => ({
              value: i + 1,
              label: new Date(0, i).toLocaleString("default", {
                month: "long",
              }),
            }))}
          />
        </div>

        {/* RIGHT */}
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

      {/* TABLE */}
      <ReportTable columns={columns} data={filteredData} rowsPerPage={10} />
    </div>
  );
}
