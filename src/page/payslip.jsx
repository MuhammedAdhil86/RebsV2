import React, { useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiBell } from "react-icons/fi";
import { Printer, Download } from "lucide-react";
import DashboardLayout from "../ui/pagelayout";
import html2pdf from "html2pdf.js";

const avatar =
  "https://ui-avatars.com/api/?name=Admin&background=000000&color=ffffff";

const Payslip = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const payslipRef = useRef();

  useEffect(() => {
    console.log(">>> [STATE RECEIVED]:", location.state);
  }, [location.state]);

  const employee = location.state?.employeeData;

  const companyName = location.state?.name || "N/A";
  const companyAddress = location.state?.address || "N/A";

  const logo = location.state?.logo;
  const hLogo = location.state?.horizontal_logo;

  const activeCompanyLogo = logo || hLogo || avatar;

  const formatINR = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const handleDownloadPDF = () => {
    const element = payslipRef.current;

    const opt = {
      margin: 0.2,
      filename: `Payslip_${employee?.full_name || "Employee"}.pdf`,
      image: { type: "jpeg", quality: 1 },
      html2canvas: {
        scale: 3,
        useCORS: true,
        letterRendering: true,
      },
      jsPDF: {
        unit: "in",
        format: "a4",
        orientation: "portrait",
      },
    };

    html2pdf().set(opt).from(element).save();
  };

  const renderContent = () => {
    if (!employee) {
      return (
        <div className="p-20 text-center bg-white rounded-2xl border border-dashed border-gray-300">
          <p className="text-gray-500 mb-4">No employee data found.</p>

          <button
            onClick={() => navigate(-1)}
            className="text-indigo-600 flex items-center gap-2 mx-auto"
          >
            <FiArrowLeft />
            Go Back
          </button>
        </div>
      );
    }

    const { bank_info, consolidated_summary, statutory, components } = employee;

    const earnings =
      components?.filter((c) => c.component_type === "earning") || [];

    const deductions =
      components?.filter((c) => c.component_type === "deduction") || [];

    const monthName = new Date(
      consolidated_summary?.year,
      consolidated_summary?.month - 1,
    ).toLocaleString("default", {
      month: "long",
    });

    const payDateStr = employee.pay_date || "2026-04-21T06:54:04.92377Z";

    // ===== ALL DEDUCTIONS =====
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

    // ===== ROWS ALIGNMENT =====
    const maxRows = Math.max(earnings.length, allDeductions.length);

    return (
      <div className="min-h-screen flex flex-col items-center bg-gray-100 py-6">
        <div
          ref={payslipRef}
          className="w-full max-w-5xl bg-white px-8 py-6 shadow-lg border border-gray-200"
        >
          {/* HEADER */}
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
                <h1 className="text-2xl font-bold text-gray-800">
                  {companyName}
                </h1>

                <p className="text-sm text-gray-500 mt-1 leading-relaxed max-w-md">
                  {companyAddress}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold">
                Payslip For The Month
              </p>

              <h2 className="text-2xl font-bold text-gray-800 mt-1">
                {monthName} {consolidated_summary?.year}
              </h2>
            </div>
          </div>

          {/* EMPLOYEE SUMMARY */}
          <div className="mb-10">
            <h2 className="text-xs uppercase tracking-[0.2em] text-gray-400 font-bold mb-4">
              Employee Summary
            </h2>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* LEFT */}
              <div className="flex-1 grid grid-cols-2 gap-y-3 text-sm">
                <span className="text-gray-500">Employee Name</span>
                <span className="font-semibold text-gray-800">
                  : {employee.full_name || "N/A"}
                </span>

                <span className="text-gray-500">Employee ID</span>
                <span className="font-semibold text-gray-800">
                  : {employee.user_id}
                </span>

                <span className="text-gray-500">Designation</span>
                <span className="font-semibold text-gray-800">
                  : {bank_info?.designation || "N/A"}
                </span>

                <span className="text-gray-500">Department</span>
                <span className="font-semibold text-gray-800">
                  : {bank_info?.department || "N/A"}
                </span>

                <span className="text-gray-500">Pay Period</span>
                <span className="font-semibold text-gray-800">
                  : {monthName} {consolidated_summary?.year}
                </span>

                <span className="text-gray-500">Pay Date</span>
                <span className="font-semibold text-gray-800">
                  : {new Date(payDateStr).toLocaleDateString("en-GB")}
                </span>
              </div>

              {/* RIGHT */}
              <div className="w-full lg:w-80 bg-green-50 border border-green-200 rounded-2xl p-6">
                <p className="text-3xl font-bold text-gray-800">
                  {formatINR(employee.net_monthly)}
                </p>

                <p className="text-xs uppercase tracking-widest text-green-700 font-semibold mt-1">
                  Total Net Pay
                </p>

                <div className="mt-5 pt-5 border-t border-green-200 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Paid Days</span>

                    <span className="font-bold">
                      {consolidated_summary?.paid_days}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">LOP Days</span>

                    <span className="font-bold">
                      {consolidated_summary?.lop_days}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Attendance %</span>

                    <span className="font-bold">
                      {employee.attendance_pct || "0%"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* EXTRA DETAILS */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 border-y border-dashed py-8 mb-8 text-sm">
            <div>
              <p className="text-gray-400 uppercase text-[10px] font-bold mb-1">
                Bank Name
              </p>

              <p className="font-semibold text-gray-800">
                {employee.bank_name || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-gray-400 uppercase text-[10px] font-bold mb-1">
                Account Number
              </p>

              <p className="font-semibold text-gray-800">
                {employee.account_no || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-gray-400 uppercase text-[10px] font-bold mb-1">
                IFSC
              </p>

              <p className="font-semibold text-gray-800">
                {employee.ifsc || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-gray-400 uppercase text-[10px] font-bold mb-1">
                UAN
              </p>

              <p className="font-semibold text-gray-800">
                {bank_info?.uan_number || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-gray-400 uppercase text-[10px] font-bold mb-1">
                PAN
              </p>

              <p className="font-semibold text-gray-800">
                {bank_info?.pan_number || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-gray-400 uppercase text-[10px] font-bold mb-1">
                ESI Number
              </p>

              <p className="font-semibold text-gray-800">
                {bank_info?.esi_number || "N/A"}
              </p>
            </div>
          </div>

          {/* EARNINGS & DEDUCTIONS */}
          <div className="border border-gray-200 rounded-xl overflow-hidden mb-10">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-4 text-center font-bold text-gray-700 uppercase">
                    Earnings
                  </th>

                  <th className="px-5 py-4 text-center font-bold text-gray-700 uppercase">
                    Amount
                  </th>

                  <th className="px-5 py-4 text-center font-bold text-gray-700 uppercase border-l">
                    Deductions
                  </th>

                  <th className="px-5 py-4 text-center font-bold text-gray-700 uppercase">
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
                      {/* EARNINGS */}
                      <td className="px-5 py-3 text-center text-gray-700">
                        {earning?.name || ""}
                      </td>

                      <td className="px-5 py-3 text-center font-semibold text-gray-800">
                        {earning ? formatINR(earning.monthly_amount) : ""}
                      </td>

                      {/* DEDUCTIONS */}
                      <td className="px-5 py-3 text-center border-l text-gray-700">
                        {deduction?.name || ""}
                      </td>

                      <td className="px-5 py-3 text-center font-semibold text-red-500">
                        {deduction ? formatINR(deduction.monthly_amount) : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              <tfoot className="bg-gray-50 font-bold border-t border-gray-200">
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

          {/* NET PAY */}
          <div className="bg-green-50 border border-green-200 rounded-2xl px-6 py-5 flex justify-between items-center">
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-500 font-bold">
                Total Net Payable
              </p>

              <p className="text-xs text-gray-400 italic mt-1">
                Gross Earnings - Total Deductions
              </p>
            </div>

            <h2 className="text-3xl font-bold text-gray-800">
              {formatINR(employee.net_monthly)}
            </h2>
          </div>

          {/* FOOTER */}
          <p className="text-center text-[11px] text-gray-400 italic mt-10">
            This is a system generated payslip.
          </p>
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

          @media print {
            body {
              background: white;
            }
          }
        `}
      </style>

      {/* TOPBAR */}
      <div className="bg-white pt-4 px-4 pb-0 w-full print:hidden">
        <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-5 flex-wrap gap-4">
          <h1 className="text-lg font-bold text-gray-800">Payslip</h1>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-full text-sm font-medium"
            >
              <Download size={15} />
              Download PDF
            </button>

            <button
              onClick={() => window.print()}
              className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center"
            >
              <Printer size={18} className="text-gray-600" />
            </button>

            <div className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center">
              <FiBell className="text-gray-600" />
            </div>

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

      {/* CONTENT */}
      <div className="w-full overflow-auto no-scrollbar">{renderContent()}</div>
    </DashboardLayout>
  );
};

export default Payslip;
