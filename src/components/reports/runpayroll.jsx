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
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkSubmit = async () => {
    setBulkLoading(true);
    const payload = {
      template_id: Number(bulkFormData.template_id),
      user_ids: selectedStaffUuids,
      effective_from: `${bulkFormData.from_date}T00:00:00Z`,
      effective_to: bulkFormData.to_date
        ? `${bulkFormData.to_date}T00:00:00Z`
        : "2099-12-31T00:00:00Z",
    };
    try {
      await payrollService.bulkAllocatePayroll(payload);
      toast.success("Allocated Successfully!");
      setIsAllocateModalOpen(false);
      setBulkStep(1); // RESET STEPS
      setBulkFormData({ template_id: "", from_date: "", to_date: "" });
      setSelectedStaffUuids([]);
      fetchData();
    } catch (err) {
      toast.error("Allocation failed");
    } finally {
      setBulkLoading(false);
    }
  };

  // ================= 4. RUN & FINALIZE LOGIC =================
  const handleRunButton = async () => {
    setLoading(true);
    try {
      await axiosInstance.post(postPayrollAttendance, {
        month: monthNames.indexOf(month) + 1,
        year: Number(year),
      });
      toast.success("Payroll calculated!");
      fetchData();
    } catch (err) {
      toast.error("Failed to run payroll");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkFinalize = async () => {
    if (!records.length) return;
    setLoading(true);
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

      await payrollService.updatePayrollAnalyticsRuns(payload);
      toast.success("Batch Payroll Finalized Successfully!");
      fetchData();
    } catch (err) {
      toast.error(err.message || "Finalize failed");
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
