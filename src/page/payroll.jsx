import React from "react";
import { FiBell } from "react-icons/fi";
import DashboardLayout from "../ui/pagelayout";
import PayrollRunning from "../components/reports/runpayroll";

function Payroll() {
  return (
    <DashboardLayout userName="Admin" onLogout={() => {}}>
      {/* Header */}
      <div className="bg-white flex justify-between items-center  p-4 shadow-sm rounded-lg">
        <h1 className="text-lg font-medium text-gray-800">Payroll</h1>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-300">
            <FiBell className="text-gray-600 text-lg" />
          </div>

          <button className="text-sm text-gray-700 border border-gray-300 px-4 py-1 rounded-full">
            Settings
          </button>

          <div className="w-9 h-9 rounded-full border border-gray-200 overflow-hidden">
            <img
              src="https://i.pravatar.cc/150?img=12"
              alt="User"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Content wrapper with padding */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <PayrollRunning />
      </div>
    </DashboardLayout>
  );
}

export default Payroll;
