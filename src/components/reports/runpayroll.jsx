import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../service/axiosinstance";
import UniversalTable from "../../ui/universal_table";
import { Loader2, Download, Play, PlusCircle, CheckCircle } from "lucide-react";
import * as XLSX from "xlsx-js-style";
import { postPayrollAttendance } from "../../api/api";
import CustomSelect from "../../ui/customselect";
import AllocatePayrollModal from "../../ui/payrollallocatemodal";
import payrollService from "../../service/payrollService";
import {
  filterStaff,
  getDepartmentData,
  getBranchData,
  getDesignationData,
  getAllStaff,
} from "../../service/staffservice";
// Global <Toaster /> is mounted once in App.jsx — only import `toast` here
import toast from "react-hot-toast";

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

// Pull the most useful error message out of an axios/regular error
const getErrMsg = (err, fallback) =>
  err?.response?.data?.error ||
  err?.response?.data?.message ||
  err?.message ||
  fallback;

// API always returns HTTP 200; failure is signalled by { ok: false, error }.
// Throw so the existing catch blocks show the error toast.
const assertOk = (res) => {
  const body =
    res?.data && typeof res.data === "object" && "ok" in res.data
      ? res.data
      : res;
  if (body && body.ok === false) {
    throw new Error(body.error || body.message || "Request failed");
  }
  return res;
};

// Today as YYYY-MM-DD in local time (for date input min / validation)
const todayStr = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export default function PayrollRunning() {
  const now = new Date();

  // --- Main View States ---
  const [activeTab, setActiveTab] = useState("draft");
  const [finalizingEmployee, setFinalizingEmployee] = useState(null);
  const [month, setMonth] = useState(monthNames[now.getMonth()]);
  const [year, setYear] = useState(String(now.getFullYear()));
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

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
      assertOk(res);
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
      toast.error(getErrMsg(err, "Failed to load payroll data"));
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
          toast.error(getErrMsg(err, "Failed to load allocation details"));
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
      toast.error(getErrMsg(err, "Failed to filter staff"));
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkSubmit = async () => {
    // Validation feedback through the global toaster
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
    const toastId = toast.loading("Allocating payroll...");

    const payload = {
      template_id: Number(bulkFormData.template_id),
      user_ids: selectedStaffUuids,
      effective_from: `${bulkFormData.from_date}T00:00:00Z`,
      effective_to: bulkFormData.to_date
        ? `${bulkFormData.to_date}T00:00:00Z`
        : "2099-12-31T00:00:00Z",
    };

    try {
      const res = await payrollService.bulkAllocatePayroll(payload);
      console.log("Allocate payload:", payload, "response:", res);
      assertOk(res);
      toast.success("Allocated Successfully!", { id: toastId });
      setIsAllocateModalOpen(false);
      setBulkStep(1); // RESET STEPS
      setBulkFormData({ template_id: "", from_date: "", to_date: "" });
      setSelectedStaffUuids([]);
      fetchData();
    } catch (err) {
      toast.error(getErrMsg(err, "Allocation failed"), { id: toastId });
    } finally {
      setBulkLoading(false);
    }
  };

  // ================= 4. RUN & FINALIZE LOGIC =================
  const handleRunButton = async () => {
    setLoading(true);
    const toastId = toast.loading("Calculating payroll...");
    try {
      const res = await axiosInstance.post(postPayrollAttendance, {
        month: monthNames.indexOf(month) + 1,
        year: Number(year),
      });
      assertOk(res);
      toast.success("Payroll calculated!", { id: toastId });
      fetchData();
    } catch (err) {
      toast.error(getErrMsg(err, "Failed to run payroll"), { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkFinalize = async () => {
    if (!records.length) {
      return toast.error("No payroll records to finalize");
    }
    setLoading(true);
    const toastId = toast.loading("Finalizing payroll...");
    try {
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

      const res = await payrollService.updatePayrollAnalyticsRuns(payload);
      assertOk(res);
      toast.success("Batch Payroll Finalized Successfully!", { id: toastId });
      fetchData();
    } catch (err) {
      toast.error(getErrMsg(err, "Finalize failed"), { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // ================= 5. RENDER LOGIC =================
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
      <div className="flex gap-3 mb-4 items-center flex-wrap">
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
              disabled={loading}
              className="px-4 py-2 bg-zinc-100 text-black border border-black rounded-lg flex items-center gap-2"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Play size={14} />
              )}{" "}
              Run
            </button>
          </>
        )}

        <button
          onClick={handleBulkFinalize}
          disabled={loading || records.length === 0}
          className="px-6 py-2 bg-black text-white rounded-lg flex items-center gap-2 shadow-lg"
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <CheckCircle size={14} />
          )}
          Finalize All Staff
        </button>

        <button className="px-4 py-2 border border-black text-black rounded-lg flex items-center gap-2">
          <Download size={14} /> Download
        </button>
      </div>

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
    </div>
  );
}
