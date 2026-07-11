import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Download } from "lucide-react";
import * as XLSX from "xlsx-js-style";

import CustomSelect from "../../ui/customselect";
import ReportTable from "../../ui/reporttable";

import {
  headerStyle,
  textCellStyle,
  numberCellStyle,
} from "../helpers/exelsheet";

import { fetchPayrollAnalytics } from "../../service/reportsService";

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

export default function PayrollAttendanceReport() {
  const navigate = useNavigate();
  const now = new Date();

  // ================= STATES =================
  const [month, setMonth] = useState(monthNames[now.getMonth()]);
  const [year, setYear] = useState(String(now.getFullYear()));
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  // ================= COMPANY BRANDING =================
  const [companyBranding, setCompanyBranding] = useState({
    name: "",
    address: "",
    logo: "",
    horizontal_logo: "",
  });

  // ================= FETCH DATA =================
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetchPayrollAnalytics(
        monthNames.indexOf(month) + 1,
        Number(year),
      );

      if (response) {
        setCompanyBranding({
          name: response.name || "N/A",
          address: response.address || "N/A",
          logo: response.logo || "",
          horizontal_logo: response.horizontal_logo || "",
        });
      }

      const processedRecords = Array.isArray(response?.employees)
        ? response.employees.map((emp) => {
            const info = emp.bank_info || {};
            const stat = emp.statutory || {};
            const tds = stat.tds || {};

            return {
              ...emp,
              pay_date:
                response?.pay_date ||
                emp.pay_date ||
                emp.payment_date ||
                emp.salary_date ||
                emp.paid_date ||
                "",
              full_name:
                `${info.first_name || ""} ${info.last_name || ""}`.trim() ||
                info.account_holder_name ||
                "N/A",
              bank_name: info.bank_name || "N/A",
              account_no: info.account_number || "N/A",
              ifsc: info.ifsc || "N/A",
              pt: stat.pt || 0,
              epf: stat.epf_employee || 0,
              esi: stat.esi_employee || 0,
              lwf_employee: stat.lwf_employee || 0,
              lwf_employer: stat.lwf_employer || 0,
              // Adding TDS Data
              tds: {
                monthly: tds.monthly_tds || 0,
                annual: tds.annual_tax || 0,
                regime: tds.tax_regime || "N/A",
              },
              total_deductions_monthly: emp.total_deductions || 0,
              attendance_pct: emp.attendance_factor
                ? `${(emp.attendance_factor * 100).toFixed(2)}%`
                : "0%",
              bank_info: info, // Ensure this object is passed properly
              statutory: stat,
            };
          })
        : [];

      setRecords(processedRecords);
    } catch (err) {
      console.error("Payroll analytics fetch failed:", err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month, year]);

  const handleRowClick = (row) => {
    navigate("/payslip", {
      state: {
        employeeData: row,
        name: companyBranding.name,
        address: companyBranding.address,
        logo: companyBranding.logo,
        horizontal_logo: companyBranding.horizontal_logo,
      },
    });
  };

  const columns = [
    { label: "User ID", key: "user_id", align: "center", width: 100 },
    { label: "Employee Name", key: "full_name", align: "center", width: 150 },
    { label: "Attendance", key: "attendance_pct", align: "center", width: 120 },
    { label: "Bank Name", key: "bank_name", align: "center", width: 150 },
    { label: "Account No", key: "account_no", align: "center", width: 150 },
    {
      label: "Gross Monthly",
      key: "gross_monthly",
      align: "center",
      width: 150,
    },
    { label: "PT", key: "pt", align: "center", width: 100 },
    { label: "EPF", key: "epf", align: "center", width: 100 },
    { label: "TDS", key: "tds.monthly", align: "center", width: 100 },
    {
      label: "Total Deductions",
      key: "total_deductions_monthly",
      align: "center",
      width: 180,
    },
    { label: "Net Monthly", key: "net_monthly", align: "center", width: 150 },
  ];

  const handleDownloadSalary = async () => {
    if (!records.length) return;
    try {
      setLoading(true);
      const componentNames = [];
      records.forEach((r) => {
        (r.components || []).forEach((c) => {
          if (!componentNames.includes(c.name)) componentNames.push(c.name);
        });
      });

      const headerRow1 = [
        "User ID",
        "Employee Name",
        "Attendance %",
        "Bank Name",
        "Account Number",
        "IFSC",
      ];
      const headerRow2 = ["", "", "", "", "", ""];

      componentNames.forEach((name) => {
        headerRow1.push(name, "");
        headerRow2.push("Monthly", "Annual");
      });

      headerRow1.push(
        "Gross Monthly",
        "PT",
        "EPF",
        "TDS",
        "Total Deductions",
        "Net Monthly",
      );
      headerRow2.push("", "", "", "", "", "");

      const dataRows = records.map((r) => {
        const row = [
          r.user_id,
          r.full_name,
          r.attendance_pct,
          r.bank_name,
          r.account_no,
          r.ifsc,
        ];
        componentNames.forEach((name) => {
          const comp = (r.components || []).find((c) => c.name === name);
          row.push(
            comp ? comp.monthly_amount : 0,
            comp ? comp.annual_amount : 0,
          );
        });
        row.push(
          r.gross_monthly,
          r.pt,
          r.epf,
          r.tds.monthly,
          r.total_deductions_monthly,
          r.net_monthly,
        );
        return row;
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headerRow1, headerRow2, ...dataRows]);

      const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
      for (let R = range.s.r; R <= range.e.r; R++) {
        for (let C = range.s.c; C <= range.e.c; C++) {
          const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
          if (!cell) continue;
          cell.s =
            R < 2
              ? headerStyle
              : typeof cell.v === "number"
                ? numberCellStyle
                : textCellStyle;
        }
      }

      XLSX.utils.book_append_sheet(wb, ws, "Detailed Payroll");
      XLSX.writeFile(wb, `payroll_report_${month}_${year}.xlsx`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBankExcel = async () => {
    if (!records.length) return;
    try {
      setLoading(true);
      const today = new Date();
      const formattedDate = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`;

      const dataRows = records.map((r) => [
        "AEDEN12",
        "SALPAY",
        "NEFT",
        formattedDate,
        r.account_no,
        r.net_monthly,
        "M",
        r.full_name,
        r.ifsc,
        "SALARY_ACCOUNT_NUMBER", // Ensure this constant exists or replace with actual value
      ]);

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(dataRows);
      XLSX.utils.book_append_sheet(wb, ws, "Bank Sheet");
      XLSX.writeFile(wb, `bank_excel_${month}_${year}.xlsx`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-1 rounded-xl font-poppins text-[12px]">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
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
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadSalary}
            disabled={!records.length || loading}
            className="flex items-center gap-2 px-4 py-2 rounded border bg-black text-white hover:bg-gray-800"
          >
            <Download className="w-4 h-4" /> Download
          </button>
          <button
            onClick={handleDownloadBankExcel}
            disabled={!records.length || loading}
            className="flex items-center gap-2 px-4 py-2 rounded border bg-blue-600 text-white hover:bg-blue-700"
          >
            <Download className="w-4 h-4" /> Bank Download
          </button>
        </div>
      </div>
      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <ReportTable
            columns={columns}
            data={records}
            rowsPerPage={10}
            onRowClick={handleRowClick}
          />
        )}
      </div>
    </div>
  );
}
