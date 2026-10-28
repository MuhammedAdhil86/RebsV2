import React, { useState, useEffect, useMemo } from "react";
import { FiDownload } from "react-icons/fi";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx-js-style";

import ReportTable from "../../ui/reporttable";
import CustomSelect from "../../ui/customselect";

// ✅ API (adjust the report service filename if yours differs)
import { fetchStaffReport } from "../../service/reportsService";
import { getDepartmentData, getBranchData } from "../../service/companyService";

import {
  titleStyle,
  headerStyle,
  textCellStyle,
  numberCellStyle,
} from "../helpers/exelsheet";

// ✅ TABLE COLUMNS
const columns = [
  { key: "uuid", label: "User ID", width: 120 },
  { key: "name", label: "Name", width: 230 },
  { key: "employee_ref_no", label: "Ref No", width: 120 },
  { key: "designation", label: "Designation", width: 200 },
  { key: "department", label: "Department", width: 200 },
  { key: "branch", label: "Branch", width: 160 },
  { key: "role", label: "Role", width: 130 },
  { key: "gender", label: "Gender", width: 110 },
  { key: "date_of_join", label: "Joined", width: 130 },
  { key: "reporting_manager", label: "Reporting Manager", width: 200 },
  { key: "ph_no", label: "Phone", width: 140 },
  { key: "email", label: "Email", width: 250 },
  { key: "status", label: "Status", width: 110 },
];

const GENDER_OPTIONS = [
  { value: "", label: "All Genders" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const formatDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d)
    ? "—"
    : d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const clean = (v) => (v ? String(v).replace(/\s+/g, " ").trim() || "—" : "—");

export default function StaffReport() {
  const [departmentId, setDepartmentId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [gender, setGender] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [apiData, setApiData] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ---------- Department / Branch options ---------- */
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [deptData, branchData] = await Promise.all([
          getDepartmentData(),
          getBranchData(),
        ]);
        setDepartments(Array.isArray(deptData) ? deptData : []);
        setBranches(Array.isArray(branchData) ? branchData : []);
      } catch (err) {
        console.error("❌ Error loading department / branch options:", err);
        toast.error("Failed to load departments or branches");
      }
    };
    loadOptions();
  }, []);

  /* ---------- Fetch instantly whenever a dropdown changes ---------- */
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchStaffReport({
          department: departmentId,
          branch: branchId,
          gender,
        });

        if (cancelled) return;

        setApiData(
          data.map((item) => ({
            id: item.id,
            uuid: item.uuid || "—",
            name: clean(`${item.first_name || ""} ${item.last_name || ""}`),
            employee_ref_no: item.employee_ref_no || "—",
            designation: clean(item.designation),
            department: clean(item.department),
            branch: clean(item.branch),
            role: clean(item.role),
            gender: clean(item.gender),
            date_of_join: formatDate(item.date_of_join),
            reporting_manager: clean(item.reporting_manager),
            ph_no: item.ph_no || "—",
            email: item.email || "—",
            status: item.is_active ? "Active" : "Inactive",
          })),
        );
      } catch (err) {
        if (cancelled) return;
        console.error("❌ Error loading staff report:", err);
        setApiData([]);
        toast.error(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load the staff report",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();
    return () => {
      cancelled = true;
    };
  }, [departmentId, branchId, gender]);

  /* ---------- Instant search while typing ---------- */
  const filteredData = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return apiData;
    return apiData.filter((item) =>
      [
        item.name,
        item.uuid,
        item.employee_ref_no,
        item.designation,
        item.department,
        item.branch,
        item.email,
        item.ph_no,
      ].some((v) =>
        String(v ?? "")
          .toLowerCase()
          .includes(q),
      ),
    );
  }, [apiData, searchTerm]);

  /* ---------- Dropdown options ---------- */
  const departmentOptions = [
    { value: "", label: "All Departments" },
    ...departments.map((d) => ({ value: String(d.id), label: d.name })),
  ];
  const branchOptions = [
    { value: "", label: "All Branches" },
    ...branches.map((b) => ({ value: String(b.id), label: b.name })),
  ];

  /* ---------- DOWNLOAD EXCEL ---------- */
  const handleDownload = () => {
    if (!filteredData.length) return;

    const headerRow = [
      "Sl No",
      "User ID",
      "Name",
      "Ref No",
      "Designation",
      "Department",
      "Branch",
      "Role",
      "Gender",
      "Joined",
      "Reporting Manager",
      "Phone",
      "Email",
      "Status",
    ];

    const dataRows = filteredData.map((row, i) => [
      i + 1,
      row.uuid,
      row.name,
      row.employee_ref_no,
      row.designation,
      row.department,
      row.branch,
      row.role,
      row.gender,
      row.date_of_join,
      row.reporting_manager,
      row.ph_no,
      row.email,
      row.status,
    ]);

    const todayLabel = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const sheetData = [
      [`STAFF REPORT AS ON ${todayLabel.toUpperCase()}`],
      headerRow,
      ...dataRows,
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: headerRow.length - 1 } },
    ];

    ws["!cols"] = [
      { wch: 8 },
      { wch: 14 },
      { wch: 32 },
      { wch: 14 },
      { wch: 28 },
      { wch: 28 },
      { wch: 22 },
      { wch: 16 },
      { wch: 12 },
      { wch: 14 },
      { wch: 28 },
      { wch: 16 },
      { wch: 34 },
      { wch: 12 },
    ];

    const range = XLSX.utils.decode_range(ws["!ref"]);

    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellRef]) continue;

        if (R === 0) {
          ws[cellRef].s = titleStyle;
        } else if (R === 1) {
          ws[cellRef].s = headerStyle;
        } else if (typeof ws[cellRef].v === "number") {
          ws[cellRef].s = numberCellStyle;
        } else {
          ws[cellRef].s = textCellStyle;
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, "Staff");
    XLSX.writeFile(
      wb,
      `Staff_Report_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  return (
    <div className="flex flex-col gap-4 text-[13px]">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4 px-2 flex-wrap gap-3">
        {/* LEFT */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="text-[16px] font-medium min-w-fit">
            Staff ({loading ? "…" : filteredData.length})
          </div>

          <CustomSelect
            value={departmentId}
            onChange={(val) => setDepartmentId(val === null ? "" : String(val))}
            options={departmentOptions}
          />

          <CustomSelect
            value={branchId}
            onChange={(val) => setBranchId(val === null ? "" : String(val))}
            options={branchOptions}
          />

          <CustomSelect
            value={gender}
            onChange={(val) => setGender(val === null ? "" : String(val))}
            options={GENDER_OPTIONS}
          />
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3">
          <button
            className="flex items-center px-4 py-1 bg-black text-white rounded whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={handleDownload}
            disabled={!filteredData.length}
          >
            <FiDownload className="mr-2" />
            Download
          </button>

          <div className="relative w-[220px]">
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border px-3 py-1 rounded w-full outline-none"
            />

            <Icon
              icon="mynaui:search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>
        </div>
      </div>

      {/* TABLE */}
      <ReportTable columns={columns} data={filteredData} rowsPerPage={10} />
    </div>
  );
}
