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

/* ------------------------------------------------------------------ */
/* EXCEL EXPORT – every field returned by /staff/report                */
/* (the on-screen table above is unchanged)                            */
/* ------------------------------------------------------------------ */

// null / undefined / the string "null" -> empty cell
const val = (v) =>
  v === null || v === undefined || String(v).trim().toLowerCase() === "null"
    ? ""
    : v;

const text = (v) => String(val(v)).replace(/\s+/g, " ").trim();

const num = (v) => {
  const x = val(v);
  if (x === "") return "";
  const n = Number(x);
  return isNaN(n) ? "" : n;
};

const yesNo = (v) => (v === null || v === undefined ? "" : v ? "Yes" : "No");

const exportDate = (iso) => {
  const f = formatDate(val(iso));
  return f === "—" ? "" : f;
};

const exportDateTime = (iso) => {
  if (!val(iso)) return "";
  const d = new Date(iso);
  return isNaN(d)
    ? ""
    : d.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
};

// label, getter(rawItem), column width (chars)
const EXPORT_COLUMNS = [
  { label: "User ID", get: (r) => text(r.uuid), wch: 12 },
  { label: "Ref No", get: (r) => text(r.employee_ref_no), wch: 12 },
  { label: "First Name", get: (r) => text(r.first_name), wch: 18 },
  { label: "Last Name", get: (r) => text(r.last_name), wch: 18 },
  { label: "Nick Name", get: (r) => text(r.nick_name), wch: 16 },
  {
    label: "Status",
    get: (r) => (r.is_active ? "Active" : "Inactive"),
    wch: 10,
  },
  { label: "Role", get: (r) => text(r.role), wch: 14 },
  { label: "Designation", get: (r) => text(r.designation), wch: 22 },
  { label: "Department", get: (r) => text(r.department), wch: 24 },
  { label: "Branch", get: (r) => text(r.branch), wch: 20 },
  { label: "Location", get: (r) => text(r.location), wch: 18 },
  { label: "Seating Location", get: (r) => text(r.seating_location), wch: 18 },
  {
    label: "Reporting Manager",
    get: (r) => text(r.reporting_manager),
    wch: 24,
  },
  { label: "Default Shift", get: (r) => text(r.default_shift), wch: 24 },
  { label: "Employment Status", get: (r) => num(r.employment_status), wch: 18 },
  { label: "Employee Type", get: (r) => num(r.employee_type), wch: 14 },
  { label: "User Type", get: (r) => num(r.user_type), wch: 10 },
  { label: "Company ID", get: (r) => num(r.company), wch: 12 },
  { label: "Attendance Policy", get: (r) => num(r.attendance_policy), wch: 16 },
  {
    label: "Attendance Required",
    get: (r) => yesNo(r.is_attendance_required),
    wch: 18,
  },
  { label: "Source of Hiring", get: (r) => text(r.source_of_hiring), wch: 16 },
  { label: "Total Experience", get: (r) => text(r.total_experience), wch: 16 },
  { label: "Date of Join", get: (r) => exportDate(r.date_of_join), wch: 14 },
  { label: "Date of Exit", get: (r) => exportDate(r.date_of_exit), wch: 14 },
  { label: "Exit Reason", get: (r) => text(r.reason), wch: 20 },
  { label: "Basic Salary", get: (r) => num(r.basic_salary), wch: 14 },
  { label: "Gross Salary", get: (r) => num(r.gross_salary), wch: 14 },
  { label: "CTC", get: (r) => num(r.ctc), wch: 12 },
  { label: "Salary Period", get: (r) => text(r.salary_period), wch: 14 },
  { label: "Gender", get: (r) => text(r.gender), wch: 10 },
  { label: "Date of Birth", get: (r) => exportDate(r.date_of_birth), wch: 14 },
  { label: "Age", get: (r) => num(r.age), wch: 8 },
  { label: "Marital Status", get: (r) => text(r.marital_status), wch: 14 },
  { label: "Blood Group", get: (r) => text(r.blood_group), wch: 12 },
  { label: "Nationality", get: (r) => text(r.nationality), wch: 14 },
  { label: "Work Email", get: (r) => text(r.email), wch: 30 },
  { label: "Personal Email", get: (r) => text(r.personal_email), wch: 30 },
  { label: "Phone", get: (r) => text(r.ph_no), wch: 14 },
  { label: "Personal Mobile", get: (r) => text(r.personal_mobile), wch: 16 },
  { label: "Work Phone", get: (r) => text(r.work_phone), wch: 14 },
  { label: "Extension Number", get: (r) => text(r.extension_number), wch: 16 },
  { label: "Present Address", get: (r) => text(r.present_address), wch: 45 },
  {
    label: "Permanent Address",
    get: (r) => text(r.permanant_address),
    wch: 45,
  },
  { label: "Aadhar", get: (r) => text(r.aadhar), wch: 16 },
  { label: "PAN", get: (r) => text(r.pan), wch: 14 },
  { label: "UAN", get: (r) => text(r.uan), wch: 16 },
  { label: "ESI Number", get: (r) => text(r.esi_number), wch: 16 },
  { label: "EPF Number", get: (r) => text(r.epf_number), wch: 16 },
  {
    label: "Account Holder",
    get: (r) => text(r.bank_details?.account_holder_name),
    wch: 24,
  },
  {
    label: "Account Number",
    get: (r) => text(r.bank_details?.account_number),
    wch: 20,
  },
  { label: "IFSC", get: (r) => text(r.bank_details?.ifsc), wch: 14 },
  { label: "Bank Name", get: (r) => text(r.bank_details?.bank_name), wch: 22 },
  {
    label: "Bank Branch",
    get: (r) => text(r.bank_details?.bank_branch),
    wch: 20,
  },
  { label: "Dependant Name", get: (r) => text(r.dependant_name), wch: 20 },
  {
    label: "Dependant Relation",
    get: (r) => text(r.dependant_relation),
    wch: 18,
  },
  {
    label: "Dependant DOB",
    get: (r) => exportDate(r.dependant_date_of_birth),
    wch: 16,
  },
  { label: "Expertise", get: (r) => text(r.expertise), wch: 20 },
  { label: "About Me", get: (r) => text(r.about_me), wch: 30 },
  { label: "Tags", get: (r) => text(r.tags), wch: 16 },
  {
    label: "First Login Pending",
    get: (r) => yesNo(r.is_first_login),
    wch: 18,
  },
  { label: "Photo URL", get: (r) => text(r.image), wch: 40 },
  { label: "Created At", get: (r) => exportDateTime(r.created_at), wch: 22 },
  { label: "Updated At", get: (r) => exportDateTime(r.updated_at), wch: 22 },
];

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
            // Full API record – used only by the Excel export
            original: item,
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

  /* ---------- DOWNLOAD EXCEL (all fields) ---------- */
  const handleDownload = () => {
    if (!filteredData.length) return;

    const headerRow = ["Sl No", ...EXPORT_COLUMNS.map((c) => c.label)];

    const dataRows = filteredData.map((row, i) => [
      i + 1,
      ...EXPORT_COLUMNS.map((c) => c.get(row.original || {})),
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

    ws["!cols"] = [{ wch: 8 }, ...EXPORT_COLUMNS.map((c) => ({ wch: c.wch }))];

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
