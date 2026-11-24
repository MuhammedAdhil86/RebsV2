import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import DashboardLayout from "../ui/pagelayout";
import HeaderGlobal from "../ui/headerglobal";
import { getDepartmentData } from "../service/companyService";
import CustomSelect from "../ui/customselect"; // adjust path/file name if different
import CompanyOverview from "../components/kpi/CompanyOverview";
import TeamKpi from "../components/kpi/TeamKpi";
import IndividualKpi from "../components/kpi/IndividualKpi";

const MONTHS = [
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

const TABS = [
  { id: "company", label: "Company" },
  { id: "team", label: "Team" },
  { id: "individual", label: "Individual" },
];

const TAB_KEY = "kpi_active_tab";

function Kpi() {
  const now = new Date();

  const [activeTab, setActiveTab] = useState(
    () => localStorage.getItem(TAB_KEY) || "company",
  );
  const [period, setPeriod] = useState({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });
  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState(""); // "" = all departments
  const [employeeId, setEmployeeId] = useState("");

  useEffect(() => {
    localStorage.setItem(TAB_KEY, activeTab);
  }, [activeTab]);

  const isCurrentPeriod =
    period.month === now.getMonth() + 1 && period.year === now.getFullYear();

  const changeMonth = (offset) =>
    setPeriod((p) => {
      const d = new Date(p.year, p.month - 1 + offset, 1);
      return { month: d.getMonth() + 1, year: d.getFullYear() };
    });

  const goToCurrent = () =>
    setPeriod({ month: now.getMonth() + 1, year: now.getFullYear() });

  // Department dropdown options (loaded once)
  useEffect(() => {
    getDepartmentData()
      .then((list) => setDepartments(Array.isArray(list) ? list : []))
      .catch((e) => console.error("Failed to load departments:", e));
  }, []);

  const { month, year } = period;

  // Clicking a name in Company / Team opens that person's Individual tab.
  // The employee list itself is loaded inside IndividualKpi
  // (getStafffilteredLight for the logged-in user's department).
  const openEmployee = (id) => {
    setEmployeeId(id);
    setActiveTab("individual");
  };

  // Options in the { value, label } shape CustomSelect expects
  const departmentSelectOptions = [
    { value: "", label: "All departments" },
    ...departments.map((d) => ({
      value: String(d.id),
      label: String(d.name || d.department_name || "").trim(),
    })),
  ];

  const tabButtonClass = (id) =>
    `pb-2 px-1 transition-all relative whitespace-nowrap ${
      activeTab === id
        ? "text-black after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-black"
        : "text-gray-500 hover:text-black"
    }`;

  return (
    <DashboardLayout userName="Admin" onLogout={() => {}}>
      <div className="w-full space-y-4">
        <HeaderGlobal userName="Admin" />

        {/* Tab navigation */}
        <div
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          className="flex gap-4 border-b px-4 text-[14px] bg-white pt-2 shadow-sm rounded-t-lg select-none overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={tabButtonClass(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-4 bg-white rounded-lg shadow-sm space-y-6">
          {/* HEADER: month + filters */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl text-black tracking-tight">
                {MONTHS[period.month - 1]}{" "}
                <span className="text-black/30">{period.year}</span>
              </h2>
              <p className="text-xs text-black/40 mt-0.5">
                {activeTab === "company" && "Company KPI dashboard"}
                {activeTab === "team" && "Team KPI dashboard"}
                {activeTab === "individual" && "Individual KPI dashboard"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {activeTab === "company" && (
                <CustomSelect
                  label="Department"
                  value={departmentId}
                  onChange={setDepartmentId}
                  minWidth={170}
                  options={departmentSelectOptions}
                />
              )}

              <button
                onClick={goToCurrent}
                disabled={isCurrentPeriod}
                className="px-3.5 py-2 text-xs text-black border border-black/10 rounded-lg hover:bg-black/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                This month
              </button>
              <div className="flex items-center border border-black/10 rounded-lg overflow-hidden">
                <button
                  aria-label="Previous month"
                  onClick={() => changeMonth(-1)}
                  className="p-2 text-black hover:bg-black/5 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="w-px h-5 bg-black/10" />
                <button
                  aria-label="Next month"
                  onClick={() => changeMonth(1)}
                  disabled={isCurrentPeriod}
                  className="p-2 text-black hover:bg-black/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* TAB PANELS */}
          {activeTab === "company" && (
            <CompanyOverview
              month={month}
              year={year}
              departmentId={departmentId}
              onOpenEmployee={openEmployee}
            />
          )}

          {activeTab === "team" && (
            <TeamKpi month={month} year={year} onOpenEmployee={openEmployee} />
          )}

          {activeTab === "individual" && (
            <IndividualKpi
              employeeId={employeeId}
              onEmployeeChange={setEmployeeId}
              month={month}
              year={year}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Kpi;
