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

const SALARY_ACCOUNT_NUMBER = "7049968193";

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

      console.log("FULL PAYROLL RESPONSE =>", response);

      // ================= COMPANY INFO =================
      if (response) {
        setCompanyBranding({
          name: response.name || "N/A",

          address: response.address || "N/A",

          logo: response.logo || "",

          horizontal_logo: response.horizontal_logo || "",
        });
      }

      // ================= EMPLOYEE PROCESS =================
      const processedRecords = Array.isArray(response?.employees)
        ? response.employees.map((emp) => {
            const info = emp.bank_info || {};

            const stat = emp.statutory || {};

            console.log("RAW EMPLOYEE =>", emp);

            console.log("TOP LEVEL PAY DATE =>", response?.pay_date);

            return {
              ...emp,

              // ================= PAY DATE FIX =================
              pay_date:
                response?.pay_date ||
                emp.pay_date ||
                emp.payment_date ||
                emp.salary_date ||
                emp.paid_date ||
                "",

              // ================= EMPLOYEE NAME =================
              full_name:
                `${info.first_name || ""} ${info.last_name || ""}`.trim() ||
                info.account_holder_name ||
                "N/A",

              // ================= BANK =================
              bank_name: info.bank_name || "N/A",

              account_no: info.account_number || "N/A",

              ifsc: info.ifsc || "N/A",

              // ================= STATUTORY =================
              pt: stat.pt || 0,

              epf: stat.epf_employee || 0,

              esi: stat.esi_employee || 0,

              // ================= DEDUCTIONS =================
              total_deductions_monthly: emp.total_deductions || 0,

              // ================= ATTENDANCE =================
              attendance_pct: emp.attendance_factor
                ? `${(emp.attendance_factor * 100).toFixed(2)}%`
                : "0%",

              // ================= KEEP RAW OBJECTS =================
              bank_info: info,

              statutory: stat,
            };
          })
        : [];

      console.log("PROCESSED RECORDS =>", processedRecords);

      setRecords(processedRecords);
    } catch (err) {
      console.error("Payroll analytics fetch failed:", err);

      console.log("FULL ERROR =>", err?.response?.data);

      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // ================= LOAD =================
  useEffect(() => {
    fetchData();
  }, [month, year]);

  // ================= ROW CLICK =================
  const handleRowClick = (row) => {
    console.log("PAYSLIP ROW =>", row);

    console.log("PAYSLIP PAY DATE =>", row?.pay_date);

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

  // ================= TABLE COLUMNS =================
  const columns = [
    {
      label: "User ID",
      key: "user_id",
      align: "center",
      width: 100,
    },

    {
      label: "Employee Name",
      key: "full_name",
      align: "center",
      width: 150,
    },

    {
      label: "Attendance",
      key: "attendance_pct",
      align: "center",
      width: 120,
    },

    {
      label: "Bank Name",
      key: "bank_name",
      align: "center",
      width: 150,
    },

    {
      label: "Account No",
      key: "account_no",
      align: "center",
      width: 150,
    },

    {
      label: "IFSC",
      key: "ifsc",
      align: "center",
      width: 120,
    },

    {
      label: "Gross Monthly",
      key: "gross_monthly",
      align: "center",
      width: 150,
    },

    {
      label: "PT",
      key: "pt",
      align: "center",
      width: 100,
    },

    {
      label: "EPF",
      key: "epf",
      align: "center",
      width: 100,
    },

    {
      label: "Total Deductions",
      key: "total_deductions_monthly",
      align: "center",
      width: 180,
    },

    {
      label: "Net Monthly",
      key: "net_monthly",
      align: "center",
      width: 150,
    },

    {
      label: "Net Annual",
      key: "net_annual",
      align: "center",
      width: 150,
    },
  ];

  // ================= DOWNLOAD SALARY =================
  const handleDownloadSalary = async () => {
    if (!records.length) return;

    try {
      setLoading(true);

      const componentNames = [];

      records.forEach((r) => {
        (r.components || []).forEach((c) => {
          if (!componentNames.includes(c.name)) {
            componentNames.push(c.name);
          }
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
        "Total Deductions",
        "Net Monthly",
      );

      headerRow2.push("", "", "", "", "");

      const dataRows = records.map((r) => {
        const row = [
          r.user_id || "N/A",

          r.full_name || "N/A",

          r.attendance_pct || "0%",

          r.bank_name || "N/A",

          r.account_no || "N/A",

          r.ifsc || "N/A",
        ];

        componentNames.forEach((name) => {
          const comp = (r.components || []).find((c) => c.name === name);

          row.push(comp ? comp.monthly_amount : 0);

          row.push(comp ? comp.annual_amount : 0);
        });

        row.push(
          r.gross_monthly || 0,

          r.pt || 0,

          r.epf || 0,

          r.total_deductions_monthly || 0,

          r.net_monthly || 0,
        );

        return row;
      });

      const sheetData = [headerRow1, headerRow2, ...dataRows];

      const wb = XLSX.utils.book_new();

      const ws = XLSX.utils.aoa_to_sheet(sheetData);

      const merges = [];

      let colIdx = 6;

      componentNames.forEach(() => {
        merges.push({
          s: {
            r: 0,
            c: colIdx,
          },

          e: {
            r: 0,
            c: colIdx + 1,
          },
        });

        colIdx += 2;
      });

      ws["!merges"] = merges;

      const range = XLSX.utils.decode_range(ws["!ref"]);

      for (let R = range.s.r; R <= range.e.r; R++) {
        for (let C = range.s.c; C <= range.e.c; C++) {
          const cellRef = XLSX.utils.encode_cell({
            r: R,
            c: C,
          });

          if (!ws[cellRef]) continue;

          if (R < 2) {
            ws[cellRef].s = headerStyle;
          } else if (typeof ws[cellRef].v === "number") {
            ws[cellRef].s = numberCellStyle;
          } else {
            ws[cellRef].s = textCellStyle;
          }
        }
      }

      XLSX.utils.book_append_sheet(wb, ws, "Detailed Payroll");

      XLSX.writeFile(wb, `payroll_report_${month}_${year}.xlsx`);
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // ================= BANK EXCEL =================
  const handleDownloadBankExcel = async () => {
    if (!records.length) return;

    try {
      setLoading(true);

      const today = new Date();

      const formattedDate = `${String(today.getDate()).padStart(
        2,
        "0",
      )}/${String(today.getMonth() + 1).padStart(
        2,
        "0",
      )}/${today.getFullYear()}`;

      const dataRows = records.map((r) => {
        const bank = r.bank_info || {};

        return [
          "AEDEN12",
          "SALPAY",
          "NEFT",
          formattedDate,
          bank.account_number || "",
          r.net_monthly || 0,
          "M",
          r.full_name || "",
          bank.ifsc || "",
          SALARY_ACCOUNT_NUMBER,
        ];
      });

      const wb = XLSX.utils.book_new();

      const ws = XLSX.utils.aoa_to_sheet(dataRows);

      XLSX.utils.book_append_sheet(wb, ws, "Bank Sheet");

      XLSX.writeFile(wb, `bank_excel_${month}_${year}.xlsx`);
    } catch (err) {
      console.error("Bank Excel download failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // ================= UI =================
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
            className="flex items-center gap-2 px-4 py-2 text-[12px] rounded border bg-black text-white disabled:opacity-50 hover:bg-gray-800 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </button>

          <button
            onClick={handleDownloadBankExcel}
            disabled={!records.length || loading}
            className="flex items-center gap-2 px-4 py-2 text-[12px] rounded border bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download for Bank
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />

            <p className="mt-2 text-[12px] text-blue-500">
              Fetching payroll data...
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto scrollbar-none">
            <ReportTable
              columns={columns}
              data={records}
              rowsPerPage={10}
              onRowClick={handleRowClick}
            />
          </div>
        )}
      </div>
    </div>
  );
}
