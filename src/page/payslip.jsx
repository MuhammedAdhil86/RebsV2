// src/page/payslip.jsx
import React, { useRef, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiBell } from "react-icons/fi";
import { Download, Lightbulb, AlertCircle } from "lucide-react";
import DashboardLayout from "../ui/pagelayout";
import html2pdf from "html2pdf.js";

// ✅ IMPORT CONFIG FILE
import {
  avatar,
  formatINR,
  formatPayDate,
  getPdfOptions,
} from "../utils/payslipPrintconfig";

const Payslip = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const payslipRef = useRef();

  // State to toggle the professional note banner
  const [showNote, setShowNote] = useState(false);

  useEffect(() => {
    console.log(">>> [STATE RECEIVED]:", location.state);
    console.log(">>> PAY DATE:", location.state?.employeeData?.pay_date);
  }, [location.state]);

  const employee = location.state?.employeeData;
  const companyName = location.state?.name || "N/A";
  const companyAddress = location.state?.address || "N/A";
  const logo = location.state?.logo;
  const hLogo = location.state?.horizontal_logo;
  const activeCompanyLogo = logo || hLogo || avatar;

  // ================= PDF DOWNLOAD =================
  const handleDownloadPDF = () => {
    const element = payslipRef.current;
    const baseOpt = getPdfOptions(employee);

    // Explicitly configure html2pdf to drop classes with 'html2pdf-ignore'
    const opt = {
      ...baseOpt,
      html2canvas: {
        ...baseOpt?.html2canvas,
        useCORS: true,
      },
      pagebreak: { mode: ["avoid-all"] },
      ignoreClass: "html2pdf-ignore",
    };

    html2pdf().set(opt).from(element).save();
  };

  const renderContent = () => {
    // Fallback UI to re-run / go back if structural data is not proper
    if (!employee || !employee.components) {
      return (
        <div className="p-20 text-center bg-white rounded-2xl border border-dashed border-gray-300 my-6 max-w-xl mx-auto shadow-sm">
          <p className="text-gray-500 mb-2 font-medium">
            Incomplete or Missing Payslip Data Structure.
          </p>
          <p className="text-xs text-gray-400 mb-6">
            Please go back and re-run the action to process properly.
          </p>

          <button
            onClick={() => navigate(-1)}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 mx-auto hover:bg-indigo-700 transition-colors"
          >
            <FiArrowLeft />
            Re-run / Go Back
          </button>
        </div>
      );
    }

    const { bank_info, consolidated_summary, statutory, components } = employee;

    // ================= EARNINGS =================
    const earnings =
      components?.filter((c) => c.component_type === "earning") || [];

    // ================= DEDUCTIONS =================
    const deductions =
      components?.filter((c) => c.component_type === "deduction") || [];

    // ================= MONTH NAME =================
    const monthName = new Date(
      consolidated_summary?.year,
      consolidated_summary?.month - 1,
    ).toLocaleString("default", {
      month: "long",
    });

    // ================= PAY DATE =================
    const formattedPayDate = formatPayDate(employee?.pay_date);

    // ================= ALL DEDUCTIONS =================
    const allDeductions = [
      ...(deductions || []),
      {
        name: "Professional Tax (PT)",
        monthly_amount: employee.pt || statutory?.pt || 0,
      },
      {
        name: "EPF",
        monthly_amount: employee.epf || statutory?.epf_employee || 0,
      },
      {
        name: "ESI",
        monthly_amount: employee.esi || statutory?.esi_employee || 0,
      },
    ].filter((d) => Number(d.monthly_amount) > 0);

    // ================= MAX ROWS =================
    const maxRows = Math.max(earnings.length, allDeductions.length);

    // ================= GENERATE PRINTED TIMESTAMP =================
    const currentTimestamp = new Date().toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return (
      <div className="min-h-screen flex flex-col items-center bg-gray-100 py-6">
        <div
          ref={payslipRef}
          className="w-full max-w-5xl bg-white px-8 py-6 shadow-lg border border-gray-200"
        >
          {/* ================= HEADER ================= */}
          <div className="flex justify-between items-start border-b border-gray-200 pb-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 overflow-hidden flex items-center justify-center">
                <img
                  src={activeCompanyLogo}
                  alt="Company Logo"
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    e.target.src = avatar;
                  }}
                />
              </div>

              <div>
                <h1 className="text-2xl  text-gray-800">{companyName}</h1>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed max-w-md">
                  {companyAddress}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs uppercase tracking-widest text-gray-400">
                Payslip For The Month
              </p>
              <h2 className="text-2xl  text-gray-800 mt-1">
                {monthName} {consolidated_summary?.year}
              </h2>
            </div>
          </div>

          {/* ================= EMPLOYEE SUMMARY ================= */}
          <div className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs uppercase tracking-[0.2em] text-gray-400">
                Employee Summary
              </h2>
              {/* ✅ Bulb icon removed from this content row heading block */}
            </div>

            {/* Custom Professional Notice Banner - Stripped from PDF rendering loop via html2pdf-ignore class */}
            {showNote && (
              <div
                data-html2pdf-ignore="true"
                className="mb-5 flex items-center gap-2.5 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-xs font-medium animate-fadeIn html2pdf-ignore"
              >
                <AlertCircle size={15} className="text-amber-600 shrink-0" />
                <p>
                  <span className="font-semibold">Important Note:</span> If data
                  attributes appear incorrect or out of sync, please re-run the
                  payroll processing system to update configurations.
                </p>
              </div>
            )}

            <div className="flex flex-col lg:flex-row gap-8">
              {/* LEFT */}
              <div className="flex-1 grid grid-cols-2 gap-y-3 text-sm">
                <span className="text-gray-500">Employee Name</span>
                <span className=" text-gray-800">
                  : {employee.full_name || "N/A"}
                </span>

                <span className="text-gray-500">Employee ID</span>
                <span className=" text-gray-800">: {employee.user_id}</span>

                <span className="text-gray-500">Designation</span>
                <span className=" text-gray-800">
                  : {bank_info?.designation || "N/A"}
                </span>

                <span className="text-gray-500">Department</span>
                <span className=" text-gray-800">
                  : {bank_info?.department || "N/A"}
                </span>

                <span className="text-gray-500">Pay Period</span>
                <span className=" text-gray-800">
                  : {monthName} {consolidated_summary?.year}
                </span>

                <span className="text-gray-500">Pay Date</span>
                <span className=" text-gray-800">: {formattedPayDate}</span>
              </div>

              {/* RIGHT */}
              <div className="w-full lg:w-80 bg-green-50 border border-green-200 rounded-2xl p-6">
                <p className="text-3xl  text-gray-800">
                  {formatINR(employee.net_monthly)}
                </p>
                <p className="text-xs uppercase tracking-widest text-green-700 mt-1">
                  Total Net Pay
                </p>

                <div className="mt-5 pt-5 border-t border-green-200 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Paid Days</span>
                    <span className="">{consolidated_summary?.paid_days}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">LOP Days</span>
                    <span className="">{consolidated_summary?.lop_days}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Attendance Factor</span>
                    <span className="">{employee.attendance_pct || "0%"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================= EXTRA DETAILS ================= */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 border-y border-dashed py-8 mb-8 text-sm">
            <div>
              <p className="text-gray-400 uppercase text-[10px] mb-1">
                Bank Name
              </p>
              <p className=" text-gray-800">{employee.bank_name || "N/A"}</p>
            </div>

            <div>
              <p className="text-gray-400 uppercase text-[10px] mb-1">
                Account Number
              </p>
              <p className=" text-gray-800">{employee.account_no || "N/A"}</p>
            </div>

            <div>
              <p className="text-gray-400 uppercase text-[10px] mb-1">IFSC</p>
              <p className=" text-gray-800">{employee.ifsc || "N/A"}</p>
            </div>

            <div>
              <p className="text-gray-400 uppercase text-[10px] mb-1">UAN</p>
              <p className=" text-gray-800">{bank_info?.uan_number || "N/A"}</p>
            </div>

            <div>
              <p className="text-gray-400 uppercase text-[10px] mb-1">PAN</p>
              <p className=" text-gray-800">{bank_info?.pan_number || "N/A"}</p>
            </div>

            <div>
              <p className="text-gray-400 uppercase text-[10px] mb-1">
                ESI Number
              </p>
              <p className=" text-gray-800">{bank_info?.esi_number || "N/A"}</p>
            </div>
          </div>

          {/* ================= TABLE ================= */}
          <div className="border border-gray-200 rounded-xl overflow-hidden mb-10">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-4 text-center  text-gray-700 uppercase">
                    Earnings
                  </th>
                  <th className="px-5 py-4 text-center  text-gray-700 uppercase">
                    Amount
                  </th>
                  <th className="px-5 py-4 text-center  text-gray-700 uppercase border-l">
                    Deductions
                  </th>
                  <th className="px-5 py-4 text-center  text-gray-700 uppercase">
                    Amount
                  </th>
                </tr>
              </thead>

              <tbody>
                {[...Array(maxRows)].map((_, idx) => {
                  const earning = earnings[idx];
                  const deduction = allDeductions[idx];

                  return (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="px-5 py-3 text-center text-gray-700">
                        {earning?.name || ""}
                      </td>
                      <td className="px-5 py-3 text-center  text-gray-800">
                        {earning ? formatINR(earning.monthly_amount) : ""}
                      </td>
                      <td className="px-5 py-3 text-center border-l text-gray-700">
                        {deduction?.name || ""}
                      </td>
                      <td className="px-5 py-3 text-center text-red-500">
                        {deduction ? formatINR(deduction.monthly_amount) : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              <tfoot className="bg-gray-50  border-t border-gray-200">
                <tr>
                  <td className="px-5 py-4 text-center">Gross Earnings</td>
                  <td className="px-5 py-4 text-center text-indigo-700">
                    {formatINR(employee.gross_monthly)}
                  </td>
                  <td className="px-5 py-4 text-center border-l">
                    Total Deductions
                  </td>
                  <td className="px-5 py-4 text-center text-red-600">
                    {formatINR(employee.total_deductions)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* ================= NET PAY ================= */}
          <div className="bg-green-50 border border-green-200 rounded-2xl px-6 py-5 flex justify-between items-center">
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-500">
                Total Net Payable
              </p>
              <p className="text-xs text-gray-400 italic mt-1">
                Gross Earnings - Total Deductions
              </p>
            </div>

            <h2 className="text-3xl text-gray-800">
              {formatINR(employee.net_monthly)}
            </h2>
          </div>

          {/* ================= FOOTER / TIMESTAMPS ================= */}
          <div className="flex justify-between items-center mt-10 text-[11px] text-gray-400 italic">
            <p>This is a system generated payslip.</p>
            <p>Printed on: {currentTimestamp}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout userName="Admin" onLogout={() => {}}>
      <style>
        {`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-4px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.2s ease-out forwards;
          }

          /* Global Printing Optimization Layer */
          @media print {
            body {
              background: white;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            tr {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            thead {
              display: table-header-group !important;
            }
            tfoot {
              display: table-footer-group !important;
            }
            .bg-green-50, .grid, table {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }

            /* Explicit print mode rule hiding target view objects inside the layout container */
            .html2pdf-ignore {
              display: none !important;
              visibility: hidden !important;
              opacity: 0 !important;
              height: 0 !important;
            }
          }
        `}
      </style>

      {/* ================= TOPBAR ================= */}
      <div className="bg-white pt-4 px-4 pb-0 w-full print:hidden">
        <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-5 flex-wrap gap-4">
          {/* LEFT SIDE HEADER WITH ARROW BACK BUTTON */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition-colors"
              title="Go Back"
            >
              <FiArrowLeft size={16} className="text-gray-600" />
            </button>
            <h1 className="text-lg text-gray-800 font-medium">Payslip</h1>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-full text-sm font-medium"
            >
              <Download size={15} />
              Download PDF
            </button>

            <div className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center">
              <FiBell className="text-gray-600" />
            </div>

            {/* ✅ Toggleable Bulb Icon safely maintained inside Top Bar Row Actions */}
            <button
              onClick={() => setShowNote(!showNote)}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                showNote
                  ? "bg-amber-100 border-amber-300"
                  : "border-gray-300 hover:bg-gray-50"
              }`}
              title="Toggle System Alert Configuration Notice"
            >
              <Lightbulb
                size={18}
                className={`text-amber-500 ${showNote ? "fill-amber-300" : ""}`}
              />
            </button>

            <button className="border border-gray-300 px-5 py-2 rounded-full text-sm text-gray-700">
              Settings
            </button>

            <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-300">
              <img
                src={avatar}
                alt="User"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="w-full overflow-auto no-scrollbar">{renderContent()}</div>
    </DashboardLayout>
  );
};

export default Payslip;
