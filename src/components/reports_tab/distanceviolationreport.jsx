import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { Loader2, Download } from "lucide-react";
import * as XLSX from "xlsx-js-style";

import UniversalTable from "../../ui/universal_table";
// 👇 Same MapModal used in LogDetails; adjust the path if needed
import MapModal from "../../utils/mapmodel";

import {
  titleStyle,
  headerStyle,
  textCellStyle,
  numberCellStyle,
} from "../helpers/exelsheet";

import { fetchDistanceViolationReport } from "../../service/reportsService";
import { getBranchData, getDepartmentData } from "../../service/staffservice";

const todayStr = () => new Date().toISOString().split("T")[0];

const coordKey = (lat, lng) => `${lat},${lng}`;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const LOADING = "Loading...";
const FAILED = "__FAILED__";

// Characters shown in the table before "..."
const PREVIEW_CHARS = 15;

// Index of the "Violation Location" column in the Excel sheet
const LOCATION_COL_INDEX = 10;

// Minimum table width so columns never get squashed on small screens.
// Below this width the table scrolls horizontally inside its card.
const TABLE_MIN_WIDTH = 1200;

// Same height for every control in the filter bar so everything lines up
const CONTROL_HEIGHT = "h-9";

// Excel column widths based on the longest content in each column
const getColumnWidths = (aoa, minWidth = 8, maxWidth = 60) =>
  aoa[0].map((_, colIndex) => {
    const longest = Math.max(
      ...aoa.map((row) => String(row[colIndex] ?? "").length),
    );
    return { wch: Math.min(Math.max(longest + 2, minWidth), maxWidth) };
  });

// Convert lat/long into a readable place name.
// Returns the name, "-" when there is no address, or null when the request failed.
const getPlaceName = async (latitude, longitude) => {
  if (!latitude || !longitude) return "-";

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`,
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data.display_name || "-";
    } catch (error) {
      console.error("Error fetching location name:", error);
      if (attempt === 0) await sleep(1500);
    }
  }
  return null;
};

// ================= LOCATION CELL =================
// Shows the first 15 characters + "...". On hover the full name scrolls
// across like a train. Clicking opens the map.
function LocationCell({ text, onClick }) {
  const [hovered, setHovered] = useState(false);

  if (!text || text === "-") return <span>-</span>;

  const isLong = text.length > PREVIEW_CHARS;
  const preview = isLong ? `${text.slice(0, PREVIEW_CHARS)}...` : text;
  // Longer address = longer scroll time
  const duration = Math.max(6, text.length * 0.18);

  return (
    <div
      className="mx-auto w-[150px] max-w-full overflow-hidden cursor-pointer text-blue-600 hover:underline"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {hovered && isLong ? (
        <div
          className="inline-block whitespace-nowrap"
          style={{
            paddingLeft: "100%",
            animation: `locationTrain ${duration}s linear infinite`,
          }}
        >
          {text}
        </div>
      ) : (
        <span className="whitespace-nowrap">{preview}</span>
      )}
    </div>
  );
}

// ================= DATE FIELD (custom calendar icon) =================
function DateField({ label, value, onChange, min }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <label className="text-gray-500 leading-4">{label}</label>
      <div className="relative">
        <input
          type="date"
          value={value}
          min={min}
          onChange={onChange}
          className={`relative block w-full ${CONTROL_HEIGHT} appearance-none border border-gray-300 rounded-md px-3 pr-9 text-[12px] leading-none outline-none focus:border-black bg-white
            [&::-webkit-calendar-picker-indicator]:absolute
            [&::-webkit-calendar-picker-indicator]:inset-0
            [&::-webkit-calendar-picker-indicator]:w-full
            [&::-webkit-calendar-picker-indicator]:h-full
            [&::-webkit-calendar-picker-indicator]:opacity-0
            [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
        />
        <Icon
          icon="solar:calendar-outline"
          className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
        />
      </div>
    </div>
  );
}

// ================= SELECT =================
// Full width inside the grid on mobile/tablet.
// On large screens it shrinks to fit the selected name.
function FitSelect({ label, value, options, onChange, minWidth = 130 }) {
  const selected = options.find((o) => String(o.value) === String(value));
  const text = (selected?.label ?? "").toString();

  return (
    <div
      className="flex flex-col gap-1 min-w-0 lg:w-[var(--fit-w)]"
      style={{
        "--fit-w": `max(${minWidth}px, calc(${text.length}ch + 44px))`,
      }}
    >
      {label && <label className="text-gray-500 leading-4">{label}</label>}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`block w-full ${CONTROL_HEIGHT} appearance-none border border-gray-300 bg-white rounded-md pl-3 pr-8 text-[12px] leading-none cursor-pointer truncate focus:outline-none focus:border-black`}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
          <svg
            className="w-3 h-3 text-gray-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default function DistanceViolationReport() {
  // ================= STATES =================
  const [from, setFrom] = useState(todayStr());
  const [to, setTo] = useState(todayStr());
  const [departmentId, setDepartmentId] = useState("");
  const [branchId, setBranchId] = useState("");

  const [departmentOptions, setDepartmentOptions] = useState([
    { label: "All Departments", value: "" },
  ]);
  const [branchOptions, setBranchOptions] = useState([
    { label: "All Branches", value: "" },
  ]);

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Place names cache, keyed by "lat,lng" (only successful lookups)
  const [locations, setLocations] = useState({});
  // Keys whose lookup failed (not cached, so they can be retried)
  const [failedKeys, setFailedKeys] = useState({});

  // Map popup
  const [mapModal, setMapModal] = useState(null);

  // ================= LOAD DROPDOWN DATA =================
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [departments, branches] = await Promise.all([
          getDepartmentData(),
          getBranchData(),
        ]);

        setDepartmentOptions([
          { label: "All Departments", value: "" },
          ...departments.map((d) => ({ label: d.name, value: String(d.id) })),
        ]);

        setBranchOptions([
          { label: "All Branches", value: "" },
          ...branches.map((b) => ({ label: b.name, value: String(b.id) })),
        ]);
      } catch (err) {
        console.error("Failed to load department/branch filters:", err);
      }
    };

    loadFilters();
  }, []);

  // ================= AUTO FETCH ON ANY FILTER CHANGE =================
  useEffect(() => {
    if (!from || !to || from > to) return;

    let ignore = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await fetchDistanceViolationReport({
          from,
          to,
          department_id: departmentId,
          branch_id: branchId,
        });

        if (ignore) return;

        const processed = data.map((r) => ({
          ...r,
          id: r.attendance_id,
          distance_display: `${r.distance_meters.toFixed(2)} m`,
        }));

        setRecords(processed);
      } catch (err) {
        console.error("Distance violation fetch failed:", err);
        if (!ignore) setRecords([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchData();

    return () => {
      ignore = true;
    };
  }, [from, to, departmentId, branchId]);

  // ================= DATE HANDLERS =================
  const handleFromChange = (e) => {
    const value = e.target.value;
    setFrom(value);
    if (value && to && value > to) setTo(value);
  };

  const handleToChange = (e) => {
    setTo(e.target.value);
  };

  // ================= AUTO LOAD PLACE NAMES =================
  useEffect(() => {
    let cancelled = false;

    const loadPlaceNames = async () => {
      const seen = new Set();
      const pending = [];

      records.forEach((r) => {
        const key = coordKey(r.violation_latitude, r.violation_longitude);
        if (
          r.violation_latitude &&
          r.violation_longitude &&
          !seen.has(key) &&
          !locations[key]
        ) {
          seen.add(key);
          pending.push({
            key,
            lat: r.violation_latitude,
            lng: r.violation_longitude,
          });
        }
      });

      if (pending.length) {
        setFailedKeys((prev) => {
          const next = { ...prev };
          pending.forEach((p) => delete next[p.key]);
          return next;
        });
      }

      for (let i = 0; i < pending.length; i++) {
        if (cancelled) return;
        const { key, lat, lng } = pending[i];
        const name = await getPlaceName(lat, lng);
        if (cancelled) return;

        if (name === null) {
          setFailedKeys((prev) => ({ ...prev, [key]: true }));
        } else {
          setLocations((prev) => ({ ...prev, [key]: name }));
        }

        if (i < pending.length - 1) await sleep(1100);
      }
    };

    if (records.length) loadPlaceNames();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records]);

  // ================= RETRY ONE FAILED LOCATION =================
  const handleRetry = async (lat, lng) => {
    const key = coordKey(lat, lng);
    setFailedKeys((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

    const name = await getPlaceName(lat, lng);
    if (name === null) {
      setFailedKeys((prev) => ({ ...prev, [key]: true }));
    } else {
      setLocations((prev) => ({ ...prev, [key]: name }));
    }
  };

  // ================= OPEN MAP =================
  const handleViewMap = (row) => {
    setMapModal({
      latitude: row.violation_latitude,
      longitude: row.violation_longitude,
      employeeName: row.employee_name,
      employeeImage: "",
    });
  };

  // ================= TABLE DATA =================
  const tableData = records.map((r) => {
    const key = coordKey(r.violation_latitude, r.violation_longitude);

    let location = "-";
    if (r.violation_latitude && r.violation_longitude) {
      if (locations[key]) location = locations[key];
      else if (failedKeys[key]) location = FAILED;
      else location = LOADING;
    }

    return { ...r, location };
  });

  // Table view: Date first, no User ID
  const columns = [
    { label: "Date", key: "date", align: "center", width: 110 },
    {
      label: "Employee Name",
      key: "employee_name",
      align: "center",
      width: 160,
    },
    { label: "Designation", key: "designation", align: "center", width: 170 },
    { label: "Department", key: "department", align: "center", width: 120 },
    { label: "Branch", key: "branch_name", align: "center", width: 130 },
    { label: "Time", key: "time", align: "center", width: 100 },
    { label: "Status", key: "status", align: "center", width: 100 },
    { label: "Distance", key: "distance_display", align: "center", width: 110 },
    {
      label: "Violation Location",
      key: "location",
      align: "center",
      width: 200,
      render: (val, row) => {
        if (val === LOADING) {
          return (
            <span className="text-gray-400 animate-pulse">Loading...</span>
          );
        }

        if (val === FAILED) {
          return (
            <button
              className="text-red-600 underline whitespace-nowrap"
              onClick={() =>
                handleRetry(row.violation_latitude, row.violation_longitude)
              }
            >
              Failed to load - Retry
            </button>
          );
        }

        return <LocationCell text={val} onClick={() => handleViewMap(row)} />;
      },
    },
  ];

  // ================= DOWNLOAD EXCEL =================
  const handleDownload = async () => {
    if (!records.length || downloading) return;

    try {
      setDownloading(true);

      const names = { ...locations };
      const seen = new Set();
      const missing = [];

      records.forEach((r) => {
        const key = coordKey(r.violation_latitude, r.violation_longitude);
        if (
          r.violation_latitude &&
          r.violation_longitude &&
          !names[key] &&
          !seen.has(key)
        ) {
          seen.add(key);
          missing.push({
            key,
            lat: r.violation_latitude,
            lng: r.violation_longitude,
          });
        }
      });

      const resolved = {};
      for (let i = 0; i < missing.length; i++) {
        const { key, lat, lng } = missing[i];
        const name = await getPlaceName(lat, lng);
        if (name !== null) {
          names[key] = name;
          resolved[key] = name;
        }
        if (i < missing.length - 1) await sleep(1100);
      }

      if (Object.keys(resolved).length) {
        setLocations((prev) => ({ ...prev, ...resolved }));
        setFailedKeys((prev) => {
          const next = { ...prev };
          Object.keys(resolved).forEach((k) => delete next[k]);
          return next;
        });
      }

      const headerRow = [
        "Sl No",
        "Date",
        "User ID",
        "Employee Name",
        "Designation",
        "Department",
        "Branch",
        "Time",
        "Status",
        "Distance (m)",
        "Violation Location",
        "Violation Latitude",
        "Violation Longitude",
        "Office Latitude",
        "Office Longitude",
      ];

      const dataRows = records.map((r, i) => [
        i + 1,
        r.date,
        r.user_id,
        r.employee_name,
        r.designation,
        r.department,
        r.branch_name,
        r.time,
        r.status,
        r.distance_meters,
        names[coordKey(r.violation_latitude, r.violation_longitude)] || "-",
        r.violation_latitude,
        r.violation_longitude,
        r.office_latitude,
        r.office_longitude,
      ]);

      const title =
        from === to
          ? `DISTANCE VIOLATION REPORT - ${from}`
          : `DISTANCE VIOLATION REPORT - ${from} TO ${to}`;

      const sheetData = [[title], headerRow, ...dataRows];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(sheetData);

      ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: headerRow.length - 1 } },
      ];

      ws["!cols"] = getColumnWidths([headerRow, ...dataRows]);

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
          } else if (C === LOCATION_COL_INDEX) {
            ws[cellRef].s = {
              ...textCellStyle,
              alignment: { ...textCellStyle.alignment, wrapText: true },
            };
          } else {
            ws[cellRef].s = textCellStyle;
          }
        }
      }

      XLSX.utils.book_append_sheet(wb, ws, "Distance Violations");
      XLSX.writeFile(wb, `Distance_Violation_${from}_to_${to}.xlsx`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="w-full max-w-full p-1 sm:p-2 rounded-xl font-poppins text-[12px]">
      {/* ================= FILTER BAR =================
          Mobile  : 2 columns  -> From | To / Department | Branch / Download (full width)
          Tablet  : 4 columns  -> all filters in one row, Download below
          Desktop : one row    -> filters on the left, Download on the right */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:flex lg:flex-wrap lg:items-end">
          <DateField label="From" value={from} onChange={handleFromChange} />
          <DateField
            label="To"
            value={to}
            min={from}
            onChange={handleToChange}
          />

          <FitSelect
            label="Department"
            value={departmentId}
            onChange={setDepartmentId}
            options={departmentOptions}
          />
          <FitSelect
            label="Branch"
            value={branchId}
            onChange={setBranchId}
            options={branchOptions}
          />
        </div>

        <button
          onClick={handleDownload}
          disabled={!records.length || loading || downloading}
          className={`flex items-center justify-center gap-2 ${CONTROL_HEIGHT} w-full lg:w-auto px-4 rounded-md border border-black bg-black text-white leading-none hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {downloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {downloading ? "Preparing..." : "Download"}
        </button>
      </div>

      {/* ================= TABLE =================
          The card clips its corners; the inner wrapper scrolls sideways on
          small screens so columns keep their widths and stay aligned. */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <div style={{ minWidth: TABLE_MIN_WIDTH }}>
              <UniversalTable
                columns={columns}
                data={tableData}
                rowsPerPage={10}
                className="rounded-lg shadow-sm"
              />
            </div>
          </div>
        )}
      </div>

      {mapModal && (
        <MapModal
          latitude={mapModal.latitude}
          longitude={mapModal.longitude}
          employeeName={mapModal.employeeName}
          employeeImage={mapModal.employeeImage}
          onClose={() => setMapModal(null)}
        />
      )}

      <style>{`
        @keyframes locationTrain {
          0%   { transform: translateX(0%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}
