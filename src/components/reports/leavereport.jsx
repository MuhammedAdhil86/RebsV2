import React, { useState, useEffect, useCallback, useMemo } from "react";
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

      const apiStatus =
        mainFilter === "status" && dynamicValue
          ? dynamicValue.toLowerCase()
          : undefined;
      const apiApproval =
        mainFilter === "managerApproval" && dynamicValue
          ? dynamicValue
          : undefined;

      const data = await fetchLeaveReport({
        from,
        to,
        status: apiStatus,
        manager_approval: apiApproval,
      });

      setRecords(data);
    } catch (err) {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [from, to, mainFilter, dynamicValue]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Search Filter Logic ---
  const filteredRecords = useMemo(() => {
    if (!searchUser.trim()) return records;
    const search = searchUser.toLowerCase();

    return records.filter(
      (r) =>
        r.employee_name?.toLowerCase().includes(search) ||
        r.department_name?.toLowerCase().includes(search) ||
        r.designation?.toLowerCase().includes(search) ||
        r.user_id?.toString().toLowerCase().includes(search),
    );
  }, [records, searchUser]);

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
    if (!filteredRecords.length) return;
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
    const dataRows = filteredRecords.map((r) => [
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
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-[16px] text-gray-800">Leave Reports</h2>
        <button
          onClick={handleDownload}
          disabled={loading || filteredRecords.length === 0}
          className="flex items-center gap-2 px-4 py-1 text-[12px] font-medium rounded bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 transition-all"
        >
          <Download className="w-3 h-3" /> Export Excel
        </button>
      </div>

      {/* ✅ Updated: Structured flex layout with items-stretch ensuring uniform element heights */}
      <div className="flex flex-wrap gap-4 items-stretch mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
            From
          </label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border rounded-md px-3 h-[38px] text-sm focus:ring-2 focus:ring-black outline-none bg-white"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
            To
          </label>
          <input
            type="date"
            value={to}
            onChange={(e) => setToDate(e.target.value)}
            className="border rounded-md px-3 h-[38px] text-sm focus:ring-2 focus:ring-black outline-none bg-white"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
            Filter By
          </label>
          <CustomSelect
            placeholder="Filter"
            value={mainFilter}
            onChange={(val) => {
              setMainFilter(val === "Filter" ? "" : val);
              setDynamicValue(val === "managerApproval" ? "Approved" : "");
            }}
            options={[
              { label: "Filter", value: "Filter" },
              { label: "Manager Approval", value: "managerApproval" },
            ]}
            minWidth={150}
          />
        </div>

        {/* ✅ Dynamic Value Select Field is structured to preserve layout heights seamlessly */}
        {mainFilter ? (
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
              Select Value
            </label>
            <CustomSelect
              placeholder="Select Value"
              value={dynamicValue}
              onChange={setDynamicValue}
              options={[
                { label: "Approved", value: "Approved" },
                { label: "Pending", value: "Pending" },
                { label: "Rejected", value: "Rejected" },
              ]}
              minWidth={150}
            />
          </div>
        ) : null}

        <div className="flex flex-col gap-1 flex-1 min-w-[200px] justify-end">
          <div className="relative w-full h-[38px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search Staff..."
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              className="w-full h-full border rounded-md pl-10 pr-3 text-sm focus:ring-2 focus:ring-black outline-none bg-white"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-gray-300" />
          <p className="text-gray-400 text-sm">Fetching report details...</p>
        </div>
      ) : (
        <ReportTable columns={columns} data={filteredRecords} rowsPerPage={8} />
      )}
    </div>
  );
}
