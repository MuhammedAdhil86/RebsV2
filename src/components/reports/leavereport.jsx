import React, { useState, useEffect, useCallback } from "react";
import { Loader2, Download } from "lucide-react";
import { Icon } from "@iconify/react";
import * as XLSX from "xlsx-js-style";
import ReportTable from "../../ui/reporttable";
import { fetchLeaveReport } from "../../service/reportsService";
import {
  titleStyle,
  headerStyle,
  textCellStyle,
  numberCellStyle,
} from "../helpers/exelsheet";

/* Shared look so the date fields and the select are exactly the same size */
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

const APPROVAL_OPTIONS = [
  { label: "All", value: "" },
  { label: "Approved", value: "Approved" },
  { label: "Rejected", value: "Rejected" },
];

export default function LeaveReports() {
  // --- Default Date Range (Past 30 Days) ---
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30))
    .toISOString()
    .split("T")[0];

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState(thirtyDaysAgo);
  const [to, setTo] = useState(today);
  const [managerApproval, setManagerApproval] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const data = await fetchLeaveReport({
        from,
        to,
        manager_approval: managerApproval || undefined,
      });

      setRecords(data);
    } catch (err) {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [from, to, managerApproval]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns = [
    { label: "Date", key: "date" },
    {
      label: "Employee",
      key: "employee_name",
      render: (val) => {
        if (!val) return "—";
        const shortText = val.length > 15 ? val.substring(0, 15) + "..." : val;
        return (
          <span
            title={val}
            className="cursor-help underline decoration-dotted decoration-gray-300"
          >
            {shortText}
          </span>
        );
      },
    },
    { label: "Department", key: "department_name" },
    {
      label: "Designation",
      key: "designation",
      render: (val) => {
        if (!val) return "—";
        const shortText = val.length > 12 ? val.substring(0, 12) + "..." : val;
        return (
          <span
            title={val}
            className="cursor-help underline decoration-dotted decoration-gray-300"
          >
            {shortText}
          </span>
        );
      },
    },
    {
      label: "Reason",
      key: "reason",
      render: (val) => {
        if (!val) return "—";
        const shortText = val.length > 10 ? val.substring(0, 10) + "..." : val;
        return (
          <span
            title={val}
            className="cursor-help underline decoration-dotted decoration-gray-300"
          >
            {shortText}
          </span>
        );
      },
    },
    {
      label: "Leave Policy",
      key: "leave_policy_name",
      render: (val) => (val === "Casual Leave" ? "Casual" : val),
    },
    {
      label: "Status",
      key: "status",
      render: (val) => {
        const displayVal = val
          ? val.charAt(0).toUpperCase() + val.slice(1)
          : "—";
        return (
          <span
            className={`px-2 py-1 rounded-full text-[10px] ${
              displayVal === "Approved"
                ? "bg-green-100 text-green-700"
                : displayVal === "Rejected"
                  ? "bg-red-100 text-red-700"
                  : "bg-orange-100 text-orange-700"
            }`}
          >
            {displayVal}
          </span>
        );
      },
    },
    {
      label: "Approval",
      key: "manager_approval",
      render: (val) => (
        <span
          className={`font-medium ${val === "Approved" ? "text-green-600" : "text-gray-500"}`}
        >
          {val}
        </span>
      ),
    },
  ];

  const handleDownload = () => {
    if (!records.length) return;
    const headerRow = [
      "Date",
      "User ID",
      "Employee",
      "Department",
      "Designation",
      "Reason",
      "Leave Policy",
      "Status",
      "Manager Approval",
    ];
    const dataRows = records.map((r) => [
      r.date ? new Date(r.date).toLocaleDateString() : "",
      r.user_id?.toString() || "",
      r.employee_name || "",
      r.department_name || "",
      r.designation || "",
      r.reason || "",
      r.leave_policy_name || "",
      r.status || "",
      r.manager_approval || "",
    ]);

    const sheetData = [["LEAVE REPORT"], headerRow, ...dataRows];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    const colWidths = headerRow.map((header, i) => {
      const maxLen = Math.max(
        header.length,
        ...dataRows.map((row) => (row[i] ? row[i].toString().length : 0)),
      );
      return { wch: maxLen + 5 };
    });
    ws["!cols"] = colWidths;
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: headerRow.length - 1 } },
    ];

    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
        if (!cell) continue;
        if (R === 0) cell.s = titleStyle;
        else if (R === 1) cell.s = headerStyle;
        else
          cell.s = typeof cell.v === "number" ? numberCellStyle : textCellStyle;
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, "Leave Reports");
    XLSX.writeFile(wb, `leave_report_${from}_to_${to}.xlsx`);
  };

  return (
    <div className="p-1 px-3 bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="mb-2">
        <h2 className="text-[16px] text-gray-800">Leave Reports</h2>
      </div>

      {/* Filters + download in one row, all controls 38px tall and bottom-aligned */}
      <div className="flex flex-wrap gap-4 items-end mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
        <DateInput label="From" value={from} onChange={setFrom} max={to} />

        <DateInput label="To" value={to} onChange={setTo} min={from} />

        <SelectField
          label="Manager Approval"
          value={managerApproval}
          onChange={setManagerApproval}
          options={APPROVAL_OPTIONS}
        />

        <button
          onClick={handleDownload}
          disabled={loading || records.length === 0}
          className="ml-auto flex items-center gap-2 h-[38px] px-4 text-sm rounded-md bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 transition-all"
        >
          <Download className="w-4 h-4" /> Export Excel
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-gray-300" />
          <p className="text-gray-400 text-sm">Fetching report details...</p>
        </div>
      ) : (
        <ReportTable columns={columns} data={records} rowsPerPage={8} />
      )}
    </div>
  );
}
