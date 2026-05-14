// src/components/reports_tab/PayrollReportTab.jsx
import React, { useEffect, useState } from "react";
import { FiDownload } from "react-icons/fi";
import { Icon } from "@iconify/react";
import * as XLSX from "xlsx-js-style";
import UniversalTable from "../../ui/universal_table";

import {
  fetchEmployeeBankInfo,
  fetchPayrollAnalytics,
} from "../../service/reportsService";

import {
  headerStyle,
  textCellStyle,
  numberCellStyle,
} from "../helpers/exelsheet";

const PayrollReportTab = () => {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [month, setMonth] = useState(2);
  const [year, setYear] = useState(2026);

  // ===== helper: truncate text =====
  const truncateText = (text, length = 10) => {
    if (!text) return "N/A";
    return text.length > length ? text.slice(0, length) + "..." : text;
  };

  // ================= FETCH DATA =================
  useEffect(() => {
    const loadData = async () => {
      try {
        const [bankRes, payrollRes] = await Promise.all([
          fetchEmployeeBankInfo(),
          fetchPayrollAnalytics(month, year),
        ]);

        // Combine payroll + bank info
        const combined = (payrollRes?.employees || []).map((emp) => {
          // Match bank info by uuid or id
          const bankEmp =
            bankRes.find(
              (b) => b.uuid === String(emp.user_id) || b.id === emp.user_id,
            ) || {};

          return {
            user_id: emp.user_id,
            name: bankEmp.first_name
              ? `${bankEmp.first_name} ${bankEmp.last_name || ""}`.trim()
              : "N/A",
            designation: bankEmp.designation || "N/A",
            department: bankEmp.department || "N/A",
            gross_monthly: emp.gross_monthly ?? 0,
            net_monthly: emp.net_monthly ?? 0,
            total_deductions: emp.total_deductions ?? 0,
          };
        });

        setData(combined);
      } catch (error) {
        console.error("Error fetching payroll report:", error);
        setData([]);
      }
    };

    loadData();
  }, [month, year]);

  // ================= DOWNLOAD EXCEL =================
  const handleDownload = () => {
    if (!data.length) return;

    const columns = [
      "Employee ID",
      "Name",
      "Designation",
      "Department",
      "Gross Monthly",
      "Net Monthly",
      "Total Deductions",
    ];

    const rows = data.map((emp) => [
      emp.user_id,
      emp.name,
      emp.designation,
      emp.department,
      emp.gross_monthly,
      emp.net_monthly,
      emp.total_deductions,
    ]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([columns, ...rows]);

    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellRef]) continue;

        if (R === 0) ws[cellRef].s = headerStyle;
        else if (typeof ws[cellRef].v === "number")
          ws[cellRef].s = numberCellStyle;
        else ws[cellRef].s = textCellStyle;
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, `Payroll_${month}_${year}`);
    XLSX.writeFile(wb, `Payroll_${month}_${year}.xlsx`);
  };

  // ================= TABLE COLUMNS =================
  const columns = [
    { key: "user_id", label: "Employee ID" },
    { key: "name", label: "Name" },
    {
      key: "designation",
      label: "Designation",
      render: (row) => (
        <span title={row.designation}>{truncateText(row.designation, 15)}</span>
      ),
    },
    {
      key: "department",
      label: "Department",
      render: (row) => (
        <span title={row.department}>{truncateText(row.department, 15)}</span>
      ),
    },
    { key: "gross_monthly", label: "Gross Monthly" },
    { key: "net_monthly", label: "Net Monthly" },
    { key: "total_deductions", label: "Total Deductions" },
  ];

  // ================= UI =================
  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-2">
        <h1 className="text-lg font-medium">
          Payroll Report - {month}/{year}
        </h1>

        <div className="flex gap-2 items-center">
          {/* Month selector */}
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="border px-2 py-1 rounded"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* Year selector */}
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border px-2 py-1 rounded"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* Search */}
          <div className="relative w-[200px]">
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border px-3 py-1 rounded w-full"
            />
            <Icon
              icon="mynaui:search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>

          {/* Download */}
          <button
            onClick={handleDownload}
            className="flex items-center px-4 py-1 bg-black text-white rounded"
          >
            <FiDownload className="mr-2" /> Download
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto border rounded">
        <div className="min-w-[1000px] p-2">
          <UniversalTable
            columns={columns}
            data={data}
            rowsPerPage={10}
            searchTerm={searchTerm}
          />
        </div>
      </div>
    </div>
  );
};

export default PayrollReportTab;
