import React, { useEffect, useState, useCallback } from "react";
import { Search, Loader2, Download } from "lucide-react";
import * as XLSX from "xlsx-js-style";
import CustomSelect from "../../ui/customselect";
import ReportTable from "../../ui/reporttable";
import { fetchLeaveReport } from "../../service/reportsService";
import {
  titleStyle,
  headerStyle,
  textCellStyle,
  numberCellStyle,
} from "../helpers/exelsheet";

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
  const [searchUser, setSearchUser] = useState("");
  const [mainFilter, setMainFilter] = useState("");
  const [dynamicValue, setDynamicValue] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchLeaveReport({
        user_id: searchUser || undefined,
        from,
        to,
        status: mainFilter === "status" ? dynamicValue : undefined,
        manager_approval:
          mainFilter === "managerApproval" ? dynamicValue : undefined,
      });

      setRecords(data);
    } catch (err) {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [searchUser, from, to, mainFilter, dynamicValue]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Table Column Definitions with Hover Logic ---
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
      render: (val) => (
        <span
          className={`px-2 py-1 rounded-full text-[10px]  ${
            val === "Approved"
              ? "bg-green-100 text-green-700"
              : val === "Rejected"
                ? "bg-red-100 text-red-700"
                : "bg-orange-100 text-orange-700"
          }`}
        >
          {val}
        </span>
      ),
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

    // --- Dynamic Auto-Width Calculation ---
    const colWidths = headerRow.map((header, i) => {
      const maxLen = Math.max(
        header.length,
        ...dataRows.map((row) => (row[i] ? row[i].toString().length : 0)),
      );
      return { wch: maxLen + 5 }; // Content length + padding
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
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-[16px]  text-gray-800">Leave Reports</h2>
        <button
          onClick={handleDownload}
          disabled={loading || records.length === 0}
          className="flex items-center gap-2 px-4 py-2 text-[12px] font-medium rounded-lg bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 transition-all"
        >
          <Download className="w-3 h-3" /> Export Excel
        </button>
      </div>

      <div className="flex flex-wrap gap-4 items-end mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
            From
          </label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
            To
          </label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none"
          />
        </div>

        <CustomSelect
          placeholder="Filter By"
          value={mainFilter}
          onChange={(val) => {
            setMainFilter(val);
            setDynamicValue("");
          }}
          options={[
            { label: "Status", value: "status" },
            { label: "Manager Approval", value: "managerApproval" },
          ]}
          minWidth={150}
        />

        {mainFilter && (
          <CustomSelect
            placeholder="Select Value"
            value={dynamicValue}
            onChange={setDynamicValue}
            options={["Approved", "Pending", "Rejected"]}
            minWidth={150}
          />
        )}

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search Staff..."
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            className="w-full border rounded-md pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none"
          />
        </div>
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
