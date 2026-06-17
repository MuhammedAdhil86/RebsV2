import React from "react";
import DashboardLayout from "../ui/pagelayout";
import HeaderGlobal from "../ui/headerglobal"; // ✅ Imported global navbar layout component
import PayrollRunning from "../components/reports/runpayroll";

function Payroll() {
  return (
    <DashboardLayout>
      <div className="w-full ">
        {/* ✅ Global Shared Navbar Header */}
        <HeaderGlobal userName="Admin" />

        {/* Content wrapper with padding */}
        <div className="px-4 bg-gray-50 rounded-lg">
          <PayrollRunning />
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Payroll;
