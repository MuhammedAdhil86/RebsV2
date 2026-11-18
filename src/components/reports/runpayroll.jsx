import React, { useState, useEffect, useCallback, useRef } from "react";
import { Icon } from "@iconify/react";
import axiosInstance from "../../service/axiosinstance";
import UniversalTable from "../../ui/universal_table";
import { Loader2, Download, Play, PlusCircle, CheckCircle } from "lucide-react";
import * as XLSX from "xlsx-js-style";
import { postPayrollAttendance } from "../../api/api";
import CustomSelect from "../../ui/customselect";
import AllocatePayrollModal from "../../ui/payrollallocatemodal";
import InfoTooltip, { PAYROLL_PERIOD_INFO } from "../../ui/infotooltip"; // adjust path
import payrollService from "../../service/payrollService";
import {
  filterStaff,
  getDepartmentData,
  getBranchData,
  getDesignationData,
  getAllStaff,
} from "../../service/staffservice";
// <ToastContainer /> is mounted once in App.jsx (react-toastify)
import { toast } from "react-toastify";
import {
  callNatsApi,
  assertNatsOk,
  showNatsError,
} from "../../utils/natsApiToest";
// Same excel styles as the fine records report
import {
  headerStyle,
  textCellStyle,
  numberCellStyle,
} from "../helpers/exelsheet"; // adjust path if needed

import FinalizePayroll from "./payrollfinalize";

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

const shortMonths = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const pad2 = (n) => String(n).padStart(2, "0");

// Today as YYYY-MM-DD in local time (for date input min / validation)
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

// "2026-11-17" -> "17-11-2026"
const formatInputDate = (value) => {
  if (!value) return "";
  const [y, m, d] = value.split("-");
  return `${d}-${m}-${y}`;
};

/* ---------------- PAY CYCLE HELPERS ---------------- */

// "2026-04-04" -> "4 Apr 2026"
const formatCycleDate = (value) => {
  if (!value) return "";
  const [y, m, d] = value.split("-");
  return `${Number(d)} ${shortMonths[Number(m) - 1]} ${y}`;
};

// "2026-04-04" + 27 days -> "2026-05-01" (28-day cycle, UTC so no day shift)
const addDays = (value, days) => {
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(
    dt.getUTCDate(),
  )}`;
};

// True when the backend says two cycles end in the selected month
const isMultiplePeriodsError = (err) =>
  /multiple salary periods/i.test(err?.message || "");

// Builds [{ start, end }] from the error: structured list first, then dates in the text
const parsePeriodOptions = (err) => {
  const body = err?.body || {};
  const list = body.periods || body.data?.periods || body.salary_periods;

  if (Array.isArray(list) && list.length > 0) {
    const fromList = list
      .map((item) => {
        if (typeof item === "string") {
          const start = item.slice(0, 10);
          return { start, end: addDays(start, 27) };
        }
        const start = String(item.start || item.period_start || "").slice(
          0,
          10,
        );
        const end = String(item.end || item.period_end || "").slice(0, 10);
        return start ? { start, end: end || addDays(start, 27) } : null;
      })
      .filter(Boolean);
    if (fromList.length > 0) return fromList;
  }

  // Fallback: read YYYY-MM-DD dates from the error text
  const dates = (err?.message || "").match(/\d{4}-\d{2}-\d{2}/g) || [];

  if (dates.length >= 4 && dates.length % 2 === 0) {
    const pairs = [];
    for (let i = 0; i < dates.length; i += 2) {
      pairs.push({ start: dates[i], end: dates[i + 1] });
    }
    return pairs;
  }

  return dates.map((start) => ({ start, end: addDays(start, 27) }));
};

/* ---------------- CHOOSE CYCLE POPUP ---------------- */

const PeriodChoiceModal = ({
  options,
  monthLabel,
  selected,
  onSelect,
  onCancel,
  onConfirm,
}) => {
  const countWord = options.length === 2 ? "Two" : options.length;

  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center bg-black/40 p-4 font-poppins">
      <div className="w-full max-w-[440px] bg-white rounded-lg border border-gray-200 shadow-lg p-5">
        <h3 className="text-sm font-medium text-gray-800 mb-1">
          {countWord} pay cycles end in {monthLabel}
        </h3>

        <p className="text-[12px] text-gray-500 mb-4">
          Choose the cycle you want to run payroll for:
        </p>

        <div className="space-y-2">
          {options.map((opt) => {
            const active = selected === opt.start;
            return (
              <button
                key={opt.start}
                type="button"
                onClick={() => onSelect(opt.start)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md border text-left text-[12px] transition ${
                  active
                    ? "border-black bg-gray-50 text-black"
                    : "border-gray-200 text-gray-700 hover:border-gray-400"
                }`}
              >
                <span
                  className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                    active ? "border-black" : "border-gray-300"
                  }`}
                >
                  {active && <span className="h-2 w-2 rounded-full bg-black" />}
                </span>

                <span>
                  {formatCycleDate(opt.start)} to {formatCycleDate(opt.end)}
                </span>
              </button>
            );
          })}
        </div>

        <p className="text-[11px] text-gray-400 mt-4">
          Run each cycle separately. Payroll for one cycle doesn’t include the
          other.
        </p>

        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="h-8 px-4 border border-gray-300 rounded text-[12px] hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={!selected}
            className="h-8 px-4 rounded text-[12px] bg-black text-white disabled:opacity-50"
          >
            Run selected cycle
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------------- MAIN COMPONENT ---------------- */

export default function PayrollRunning() {
  const now = new Date();

  // --- Main View States ---
  const [activeTab, setActiveTab] = useState("draft");
  const [finalizingEmployee, setFinalizingEmployee] = useState(null);
  const [month, setMonth] = useState(monthNames[now.getMonth()]);
  const [year, setYear] = useState(String(now.getFullYear()));
  const [records, setRecords] = useState([]);

  // Separate loading states so only the clicked button spins
  const [loading, setLoading] = useState(false); // table fetch only
  const [running, setRunning] = useState(false); // Run button
  const [finalizing, setFinalizing] = useState(false); // Finalize button

  // --- Optional Period Start (sent with Run when picked) ---
  const [periodStart, setPeriodStart] = useState("");
  const periodStartRef = useRef(null);

  // Open the native calendar popup
  const openPeriodCalendar = () => {
    const input = periodStartRef.current;
    if (!input) return;
    if (typeof input.showPicker === "function") {
      try {
        input.showPicker();
        return;
      } catch (e) {
        // fall through
      }
    }
    input.focus();
    input.click();
  };

  // --- Choose-cycle popup (only when the API says two cycles end in the month) ---
  const [periodOptions, setPeriodOptions] = useState(null);
  const [selectedPeriodStart, setSelectedPeriodStart] = useState("");

  // --- Allocate Modal States ---
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [bulkStep, setBulkStep] = useState(1);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkStaffList, setBulkStaffList] = useState([]);
  const [bulkTemplates, setBulkTemplates] = useState([]);
  const [bulkFilters, setBulkFilters] = useState({
    departments: [],
    branches: [],
    designations: [],
  });
  const [selectedStaffUuids, setSelectedStaffUuids] = useState([]);
  const [bulkSearchQuery, setBulkSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("employee");
  const [bulkActiveFilters, setBulkActiveFilters] = useState({
    dept: "",
    branch: "",
    desig: "",
  });
  const [bulkFormData, setBulkFormData] = useState({
    template_id: "",
    from_date: "",
    to_date: "",
  });

  // ================= 1. FETCH MAIN DATA =================
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await payrollService.getPayrollAnalyticsRuns(
        monthNames.indexOf(month) + 1,
        year,
        activeTab,
      );
      assertNatsOk(res);
      const runs = res?.data?.runs || [];
      const rawEmployees = runs.length > 0 ? runs[0].employees || [] : [];

      const processedEmployees = rawEmployees.map((emp) => {
        const b = emp.bank_info;
        const fullName = `${b?.first_name || ""} ${b?.last_name || ""}`.trim();
        return {
          ...emp,
          full_name:
            fullName || b?.account_holder_name || `Staff ${emp.user_id}`,
        };
      });

      setRecords(processedEmployees);
    } catch (err) {
      setRecords([]);
      showNatsError(err, { fallback: "Failed to load payroll data" });
    } finally {
      setLoading(false);
    }
  }, [month, year, activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ================= 2. LOCAL UPDATE LOGIC (NO API) =================
  const handleLocalUpdate = (updatedStaff) => {
    setRecords((prev) =>
      prev.map((r) => (r.user_id === updatedStaff.user_id ? updatedStaff : r)),
    );
    setFinalizingEmployee(null); // Return to main table
    toast.success(`Changes for ${updatedStaff.full_name} staged locally.`);
  };

  // ================= 3. ALLOCATE MODAL LOGIC =================
  useEffect(() => {
    if (isAllocateModalOpen) {
      (async () => {
        setBulkLoading(true);
        try {
          const [depts, branches, desigs, staff, templates] = await Promise.all(
            [
              getDepartmentData(),
              getBranchData(),
              getDesignationData(),
              getAllStaff(),
              payrollService.getSalaryTemplates(),
            ],
          );
          setBulkFilters({
            departments: depts?.data || depts || [],
            branches: branches?.data || branches || [],
            designations: desigs?.data || desigs || [],
          });
          setBulkTemplates(templates || []);
          setBulkStaffList(staff?.data || staff || []);
        } catch (err) {
          showNatsError(err, { fallback: "Failed to load allocation details" });
        } finally {
          setBulkLoading(false);
        }
      })();
    }
  }, [isAllocateModalOpen]);

  const handleFilterSelect = async (type, id) => {
    setFilterType(type);
    setBulkActiveFilters((prev) => ({
      ...prev,
      [type === "department" ? "dept" : "branch"]: id,
    }));
    setBulkLoading(true);
    try {
      let staffData = [];
      if (type === "employee" || !id) {
        const res = await getAllStaff();
        staffData = res?.data || res || [];
      } else {
        const params =
          type === "department" ? { department_id: id } : { branch_id: id };
        const res = await filterStaff(params);
        staffData = res?.data || res || [];
      }
      setBulkStaffList(staffData);
    } catch (err) {
      showNatsError(err, { fallback: "Failed to filter staff" });
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkSubmit = async () => {
    if (selectedStaffUuids.length === 0) {
      return toast.error("Please select at least one employee");
    }
    if (!bulkFormData.template_id) {
      return toast.error("Please select a salary template");
    }
    if (!bulkFormData.from_date) {
      return toast.error("Please select a start date");
    }
    if (bulkFormData.from_date < todayStr()) {
      return toast.error("Start date cannot be before today");
    }
    if (
      bulkFormData.to_date &&
      new Date(bulkFormData.to_date) < new Date(bulkFormData.from_date)
    ) {
      return toast.error("End date cannot be before start date");
    }

    setBulkLoading(true);

    const payload = {
      template_id: Number(bulkFormData.template_id),
      user_ids: selectedStaffUuids,
      effective_from: `${bulkFormData.from_date}T00:00:00Z`,
      effective_to: bulkFormData.to_date
        ? `${bulkFormData.to_date}T00:00:00Z`
        : "2099-12-31T00:00:00Z",
    };

    const res = await callNatsApi(
      () => payrollService.bulkAllocatePayroll(payload),
      {
        loading: "Allocating payroll...",
        success: "Allocated Successfully!",
        errorFallback: "Allocation failed",
      },
    );

    setBulkLoading(false);

    if (res) {
      setIsAllocateModalOpen(false);
      setBulkStep(1); // RESET STEPS
      setBulkFormData({ template_id: "", from_date: "", to_date: "" });
      setSelectedStaffUuids([]);
      fetchData();
    }
  };

  // ================= 4. RUN & FINALIZE LOGIC =================

  // period_start is optional. It is sent when the user picks a Period Start,
  // or after they choose a cycle in the popup (when the API says
  // "multiple salary periods end in the selected month").
  // Format: YYYY-MM-DD
  const runPayroll = async (chosenStart) => {
    if (running) return; // block double runs
    setRunning(true);

    // popup choice wins, otherwise use the Period Start field
    const start = chosenStart || periodStart;

    const body = {
      month: monthNames.indexOf(month) + 1,
      year: Number(year),
    };
    if (start) body.period_start = start; // "YYYY-MM-DD"

    const res = await callNatsApi(
      () =>
        axiosInstance.post(postPayrollAttendance, body, {
          timeout: 180000, // 3 minutes for this call only
        }),
      {
        loading: "Calculating payroll... this can take a while",
        success: "Payroll calculated!",
        errorFallback: "Failed to run payroll",
        onError: (err) => {
          // Request timed out in the browser; the server may still be working
          if (err?.code === "ECONNABORTED") {
            toast.warn(
              "Payroll is taking longer than expected. It may still be processing. Please wait a minute, then refresh before running again.",
              { autoClose: 8000 },
            );
            return true;
          }

          // Two cycles end this month: ask which one to run
          if (!start && isMultiplePeriodsError(err)) {
            const options = parsePeriodOptions(err);
            if (options.length > 0) {
              setPeriodOptions(options);
              setSelectedPeriodStart("");
              return true; // handled: no error toast
            }
          }
          return false;
        },
      },
    );

    setRunning(false);
    if (res) fetchData();
  };

  const handleRunButton = () => runPayroll();

  const handleConfirmPeriod = () => {
    if (!selectedPeriodStart) {
      return toast.error("Please select a pay cycle");
    }
    const start = selectedPeriodStart;
    setPeriodOptions(null);
    setSelectedPeriodStart("");
    runPayroll(start);
  };

  const handleBulkFinalize = async () => {
    if (!records.length) {
      return toast.error("No payroll records to finalize");
    }
    setFinalizing(true);

    const payload = {
      month: monthNames.indexOf(month) + 1,
      year: Number(year),
      employees: records.map((emp) => ({
        user_id: emp.user_id,
        components: emp.components.map((c) => ({
          component_id: c.component_id,
          monthly_amount: c.monthly_amount,
          annual_amount: c.annual_amount,
        })),
        statutory: {
          epf_employee: emp.statutory?.epf_employee || 0,
          esi_employee: emp.statutory?.esi_employee || 0,
          pt: emp.statutory?.pt || 0,
          lwf_employee: emp.statutory?.lwf_employee || 0,
        },
      })),
    };

    const res = await callNatsApi(
      () => payrollService.updatePayrollAnalyticsRuns(payload),
      {
        loading: "Finalizing payroll...",
        success: "Batch Payroll Finalized Successfully!",
        errorFallback: "Finalize failed",
      },
    );

    setFinalizing(false);
    if (res) fetchData();
  };

  // ================= 5. DOWNLOAD EXCEL (same way as fine report, no toast) =================
  const handleDownloadExcel = () => {
    if (!records.length) return;

    try {
      const headerRow = [
        "User ID",
        "Employee Name",
        "Gross Monthly",
        "Total Deductions",
        "Net Monthly",
      ];

      const dataRows = records.map((r) => [
        r.user_id ?? "N/A",
        r.full_name || "N/A",
        Number(r.gross_monthly) || 0,
        Number(r.total_deductions) || 0,
        Number(r.net_monthly) || 0,
      ]);

      const sheetData = [headerRow, ...dataRows];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(sheetData);

      const range = XLSX.utils.decode_range(ws["!ref"]);
      for (let R = range.s.r; R <= range.e.r; R++) {
        for (let C = range.s.c; C <= range.e.c; C++) {
          const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[cellRef]) continue;

          if (R === 0) {
            ws[cellRef].s = headerStyle;
          } else if (typeof ws[cellRef].v === "number") {
            ws[cellRef].s = numberCellStyle;
          } else {
            ws[cellRef].s = textCellStyle;
          }
        }
      }

      XLSX.utils.book_append_sheet(wb, ws, "Payroll");
      XLSX.writeFile(wb, `payroll_run_${month}_${year}_${activeTab}.xlsx`);
    } catch (err) {
      console.error("Excel generation failed:", err);
    }
  };

  // ================= 6. RENDER LOGIC =================
  if (finalizingEmployee) {
    return (
      <FinalizePayroll
        data={finalizingEmployee}
        onBack={() => setFinalizingEmployee(null)}
        onLocalSave={handleLocalUpdate}
      />
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg font-poppins font-normal text-[12px]">
      {/* Tab Switcher */}
      <div className="flex border-b mb-4">
        {["draft", "finalized"].map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-6 py-2 capitalize transition-all ${activeTab === t ? "border-b-2 border-black text-black" : "text-gray-400"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Action Bar */}
      <div className="flex gap-3 mb-2 items-center flex-wrap">
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
          options={["2024", "2025", "2026"]}
        />

        {/* Help: how payroll periods work */}
        <InfoTooltip sections={PAYROLL_PERIOD_INFO} />

        {/* Optional Period Start (draft tab only, since Run only exists there) */}
        {activeTab === "draft" && (
          <div className="flex items-center gap-2">
            <span className="text-xs whitespace-nowrap">Period Start:</span>

            <div className="relative">
              <button
                type="button"
                onClick={openPeriodCalendar}
                className="h-[34px] min-w-[140px] flex items-center justify-between gap-3 border px-3 text-xs rounded-md bg-white hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-black"
              >
                <span className={periodStart ? "text-black" : "text-gray-400"}>
                  {periodStart ? formatInputDate(periodStart) : "Optional"}
                </span>
                <Icon icon="solar:calendar-outline" className="w-4 h-4" />
              </button>

              {/* Hidden native date input that provides the calendar */}
              <input
                ref={periodStartRef}
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                tabIndex={-1}
                aria-hidden="true"
                className="absolute left-0 bottom-0 w-0 h-0 opacity-0 pointer-events-none"
              />
            </div>

            {periodStart && (
              <button
                type="button"
                onClick={() => setPeriodStart("")}
                className="text-[11px] text-gray-500 underline"
              >
                Clear
              </button>
            )}
          </div>
        )}

        <div className="flex-grow" />

        {activeTab === "draft" && (
          <>
            <button
              onClick={() => setIsAllocateModalOpen(true)}
              className="px-4 py-2 bg-black text-white rounded-lg flex items-center gap-2"
            >
              <PlusCircle size={14} /> Allocate
            </button>
            <button
              onClick={handleRunButton}
              disabled={running}
              className="px-4 py-2 bg-zinc-100 text-black border border-black rounded-lg flex items-center gap-2 disabled:opacity-60"
            >
              {running ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Play size={14} />
              )}{" "}
              {running ? "Running..." : "Run"}
            </button>
          </>
        )}

        <button
          onClick={handleBulkFinalize}
          disabled={finalizing || running || records.length === 0}
          className="px-6 py-2 bg-black text-white rounded-lg flex items-center gap-2 shadow-lg disabled:opacity-60"
        >
          {finalizing ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <CheckCircle size={14} />
          )}
          Finalize All Staff
        </button>

        <button
          onClick={handleDownloadExcel}
          disabled={records.length === 0}
          className="px-4 py-2 border border-black text-black rounded-lg flex items-center gap-2 disabled:opacity-60"
        >
          <Download size={14} /> Download
        </button>
      </div>

      {/* Inline note */}
      {activeTab === "draft" && (
        <p className="text-[11px] text-gray-400 mb-4">
          If two pay cycles end in the selected month, you’ll be asked to pick
          one.
        </p>
      )}

      {/* Table Section */}
      {loading && records.length === 0 ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-black" size={32} />
        </div>
      ) : (
        <UniversalTable
          columns={[
            { label: "User ID", key: "user_id" },
            { label: "Employee Name", key: "full_name" },
            { label: "Gross Monthly", key: "gross_monthly" },
            { label: "Total Deductions", key: "total_deductions" },
            { label: "Net Monthly", key: "net_monthly" },
          ]}
          data={records}
          rowClickHandler={(row) =>
            setFinalizingEmployee(JSON.parse(JSON.stringify(row)))
          }
        />
      )}

      {/* ALLOCATE MODAL Logic preserved */}
      <AllocatePayrollModal
        isOpen={isAllocateModalOpen}
        onClose={() => setIsAllocateModalOpen(false)}
        step={bulkStep}
        setStep={setBulkStep}
        loading={bulkLoading}
        staffList={bulkStaffList}
        templates={bulkTemplates}
        filters={bulkFilters}
        filterType={filterType}
        handleFilterSelect={handleFilterSelect}
        activeFilters={bulkActiveFilters}
        selectedStaff={selectedStaffUuids}
        setSelectedStaff={setSelectedStaffUuids}
        searchQuery={bulkSearchQuery}
        setSearchQuery={setBulkSearchQuery}
        formData={bulkFormData}
        setFormData={setBulkFormData}
        onSubmit={handleBulkSubmit}
      />

      {/* Choose pay cycle popup */}
      {periodOptions && (
        <PeriodChoiceModal
          options={periodOptions}
          monthLabel={`${month} ${year}`}
          selected={selectedPeriodStart}
          onSelect={setSelectedPeriodStart}
          onCancel={() => {
            setPeriodOptions(null);
            setSelectedPeriodStart("");
          }}
          onConfirm={handleConfirmPeriod}
        />
      )}
    </div>
  );
}
