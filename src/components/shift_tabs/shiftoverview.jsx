import React, { useEffect, useState } from "react";
import { FiPlus, FiUsers, FiClock, FiUserX, FiArrowLeft } from "react-icons/fi";

// ---------------- IMPORT STORE ----------------
import useShiftDashboardStore from "../../store/shiftoverviewStore";

// ---------------- IMPORT SEPARATE COMPONENTS ----------------
import ShiftCard from "./shiftoverview/shiftcard";
import ShiftSummaryCard from "./shiftoverview/shiftsummarycard";
import ShiftDonutChart from "./shiftoverview/shiftdonutcard";
import RegularShiftPolicyCard from "./shiftoverview/regularshiftpolicard";
import ShiftRulesCard from "./shiftoverview/shiftrulescard";
import ShiftRatioCard from "../graphs/shiftratio";

// ---------------- IMPORT MODAL CREATION FORMS ----------------
import CreateShiftModal from "../../ui/createshiftmodal";
import CreateAttendancePolicyTab from "../../ui/createattendancepolicy";

// ---------------- SUB COMPONENT ----------------
const StatCard = ({ title, value, icon, bg }) => (
  <div
    className={`flex items-center gap-4 px-4 py-3 rounded-md shadow-sm ${bg} w-[215px]`}
  >
    <div className="p-2 rounded-full bg-black shrink-0">
      {React.cloneElement(icon, { className: "w-6 h-6 text-white" })}
    </div>
    <div className="min-w-0">
      <div className="text-[13px] text-gray-500 font-normal font-[Poppins] truncate">
        {title}
      </div>
      <div className="text-xl font-medium text-gray-900">{value}</div>
    </div>
  </div>
);

// ---------------- MAIN COMPONENT ----------------
export default function ShiftOverview() {
  const {
    stats,
    shiftDetails,
    policyDetails,
    shiftRules,
    selectedShiftName,
    fetchDashboard,
  } = useShiftDashboardStore();

  // --- TAB NAVIGATION STATE ---
  // "dashboard" | "create-shift" | "create-policy"
  const [activeTab, setActiveTab] = useState("dashboard");

  // Load baseline metrics on layout mount safely
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // ✅ PAGE LOAD LOG (STATE DATA MONITORING)
  useEffect(() => {
    console.log("📦 ShiftOverview Store State Updated:", {
      stats,
      selectedShiftName,
      shiftDetails,
      policyDetails,
      shiftRules,
    });
  }, [stats, shiftDetails, policyDetails, shiftRules, selectedShiftName]);

  return (
    <div className="min-h-screen bg-[#f9fafb] p-6 font-['Poppins']">
      {/* ----------------- CASE 1: MAIN DASHBOARD TAB ----------------- */}
      {activeTab === "dashboard" && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Top Stats & Action Buttons */}
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex flex-wrap gap-4 justify-start w-full md:w-auto">
              <StatCard
                title="Total Employees"
                value={stats?.totalEmployees ?? 0}
                icon={<FiUsers />}
                bg="bg-[#EBFDEF]"
              />
              <StatCard
                title="Total Shifts"
                value={String(stats?.totalShifts ?? 0).padStart(2, "0")}
                icon={<FiClock />}
                bg="bg-[#E8EFF9]"
              />
              <StatCard
                title="Unallocated"
                value={stats?.unallocatedShifts ?? 0}
                icon={<FiUserX />}
                bg="bg-[#FFEFE7]"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("create-shift")}
                className="bg-white text-black px-2.5 py-1.5 rounded-full text-[12px] font-medium flex items-center gap-1.5 shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <FiPlus size={14} /> Create Shift
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("create-policy")}
                className="bg-black text-white px-3 py-1.5 rounded-full text-[12px] font-medium flex items-center gap-1.5 shadow-sm hover:bg-gray-800 transition-colors"
              >
                <FiPlus size={14} /> Create Attendance Policy
              </button>
            </div>
          </div>

          {/* Main Grid Layout Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
            {/* Column 1 */}
            <div className="space-y-5 flex flex-col w-full">
              <ShiftSummaryCard />
              <ShiftCard />
            </div>

            {/* Column 2 */}
            <div className="space-y-5 flex flex-col w-full">
              <ShiftRatioCard />
              <RegularShiftPolicyCard />
            </div>

            {/* Column 3 */}
            <div className="space-y-5 flex flex-col w-full">
              <ShiftDonutChart />
              <ShiftRulesCard />
            </div>
          </div>
        </div>
      )}

      {/* ----------------- CASE 2: CREATE SHIFT TAB view ----------------- */}
      {activeTab === "create-shift" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-in slide-in-from-bottom-2 duration-300">
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setActiveTab("dashboard")}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-black font-medium transition-colors group"
            >
              <FiArrowLeft className="group-hover:-translate-x-0.5 transition-transform" />
              Back to Dashboard
            </button>
          </div>
          <CreateShiftModal
            onClose={() => {
              setActiveTab("dashboard");
              fetchDashboard(); // Instantly synchronizes metrics baseline
            }}
            refreshData={() => fetchDashboard()}
          />
        </div>
      )}

      {/* ----------------- CASE 3: CREATE ATTENDANCE POLICY TAB view ----------------- */}
      {activeTab === "create-policy" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-in slide-in-from-bottom-2 duration-300">
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setActiveTab("dashboard")}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-black font-medium transition-colors group"
            >
              <FiArrowLeft className="group-hover:-translate-x-0.5 transition-transform" />
              Back to Dashboard
            </button>
          </div>
          <div className="[scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-[#f1f1f1] [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#ccc] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#8a79f6]">
            <CreateAttendancePolicyTab
              onClose={() => {
                setActiveTab("dashboard");
                fetchDashboard(); // Triggers store data reload on submission
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
