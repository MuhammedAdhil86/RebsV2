import React, { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { RefreshCw, Loader2, AlertCircle, Settings2 } from "lucide-react";
import { toast } from "react-toastify";

import payrollService from "../../../service/payrollService";

/* ---------------- OPTIONS ---------------- */
// value = what the backend expects, label = what the user sees
const PERIOD_TYPE_OPTIONS = [
  { value: "", label: "Select period type" },
  { value: "calendar_month", label: "Calendar Month" },
  { value: "fixed_28_days", label: "Fixed 28 Days" },
  { value: "fixed_30_days", label: "Fixed 30 Days" },
];

/* ---------------- SELECT BOX (inline) ---------------- */

const SelectBox = ({ value, options, onChange }) => (
  <div className="relative w-full">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="appearance-none w-full h-9 border border-gray-200 rounded-md px-3 pr-8 text-xs text-gray-700 bg-white cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-black"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} disabled={opt.value === ""}>
          {opt.label}
        </option>
      ))}
    </select>

    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
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
);

/* ---------------- FORMAT HELPERS ---------------- */

const pad = (n) => String(n).padStart(2, "0");

// DD-MM-YYYY (pass useUTC = true for date-only values so the day never shifts)
const formatDate = (value, useUTC = false) => {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";

  const day = useUTC ? d.getUTCDate() : d.getDate();
  const month = (useUTC ? d.getUTCMonth() : d.getMonth()) + 1;
  const year = useUTC ? d.getUTCFullYear() : d.getFullYear();

  return `${pad(day)}-${pad(month)}-${year}`;
};

// "2026-01-10" -> "10-01-2026" (plain string, no timezone issues)
const formatInputDate = (value) => {
  if (!value) return "";
  const [y, m, d] = value.split("-");
  return `${d}-${m}-${y}`;
};

// hh:mm:ss AM/PM (local time)
const formatTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";

  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

// fixed_28_days -> Fixed 28 Days
const formatText = (value) => {
  if (!value) return "—";
  return String(value)
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

// Fixed field order. company_id is intentionally not included.
// Start date is hidden for calendar_month.
const buildFields = (config) => {
  const fields = [
    {
      label: "Salary Period Type",
      value: formatText(config.salary_period_type),
    },
  ];

  if (config.salary_period_type !== "calendar_month") {
    fields.push({
      label: "Salary Period Start Date",
      value: formatDate(config.salary_period_start_date, true),
    });
  }

  fields.push(
    { label: "Created Date", value: formatDate(config.created_at) },
    { label: "Created Time", value: formatTime(config.created_at) },
    { label: "Updated Date", value: formatDate(config.updated_at) },
    { label: "Updated Time", value: formatTime(config.updated_at) },
  );

  return fields;
};

/* ---------------- FORM STATE MAPPING ---------------- */

const emptyState = {
  salaryPeriodType: "",
  salaryPeriodStartDate: "",
};

const fromApi = (data) => ({
  salaryPeriodType: data?.salary_period_type ?? "",

  // "2026-01-10T00:00:00Z" -> "2026-01-10"
  salaryPeriodStartDate: data?.salary_period_start_date
    ? String(data.salary_period_start_date).slice(0, 10)
    : "",
});

/* ---------------- UPSERT FORM (edit mode) ---------------- */

const PayrollConfigurationForm = ({ initialData, onCancel, onSuccess }) => {
  const isEdit = !!initialData?.salary_period_type;
  const dateInputRef = useRef(null);

  const [state, setState] = useState(
    initialData ? fromApi(initialData) : emptyState,
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setState(fromApi(initialData));
    }
  }, [initialData]);

  const isFixed = state.salaryPeriodType.startsWith("fixed_");

  const handleTypeChange = (value) => {
    setState((prev) => ({
      ...prev,
      salaryPeriodType: value,
      // calendar_month has no start date
      salaryPeriodStartDate:
        value === "calendar_month" ? "" : prev.salaryPeriodStartDate,
    }));
  };

  // Open the native calendar popup
  const openCalendar = () => {
    const input = dateInputRef.current;
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

  const handleSave = async () => {
    if (!state.salaryPeriodType) {
      toast.error("Please select salary period type");
      return;
    }

    if (isFixed && !state.salaryPeriodStartDate) {
      toast.error("Please select salary period start date");
      return;
    }

    // Start date is only sent for fixed_* types
    const payload = isFixed
      ? {
          salary_period_type: state.salaryPeriodType,
          salary_period_start_date: state.salaryPeriodStartDate,
        }
      : { salary_period_type: state.salaryPeriodType };

    try {
      setSaving(true);

      const res = await payrollService.upsertPayrollConfiguration(payload);

      toast.success(
        res?.message ||
          (isEdit
            ? "Payroll configuration updated successfully!"
            : "Payroll configuration saved successfully!"),
      );

      if (onSuccess) {
        onSuccess(res?.data ?? payload, res);
      }
    } catch (err) {
      console.error("Payroll configuration save error:", err);

      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to save payroll configuration",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-[420px] border border-gray-200 rounded-lg bg-white p-4 font-poppins">
      {/* Header */}
      <h2 className="text-[12px] font-semibold text-gray-800 mb-3">
        Payroll Configuration
      </h2>

      {/* Fields */}
      <div className="space-y-3">
        {/* Salary Period Type */}
        <div>
          <p className="text-[12px] text-gray-500 mb-1">Salary Period Type</p>

          <SelectBox
            value={state.salaryPeriodType}
            options={PERIOD_TYPE_OPTIONS}
            onChange={handleTypeChange}
          />
        </div>

        {/* Salary Period Start Date: only for fixed types */}
        {isFixed && (
          <div>
            <p className="text-[12px] text-gray-500 mb-1">
              Salary Period Start Date
            </p>

            <div className="relative w-full">
              <button
                type="button"
                onClick={openCalendar}
                className="w-full h-9 flex items-center justify-between border border-gray-200 rounded-md px-3 text-xs text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:border-gray-400"
              >
                <span
                  className={
                    state.salaryPeriodStartDate
                      ? "text-gray-700"
                      : "text-gray-400"
                  }
                >
                  {state.salaryPeriodStartDate
                    ? formatInputDate(state.salaryPeriodStartDate)
                    : "DD-MM-YYYY"}
                </span>

                <Icon icon="solar:calendar-outline" className="w-4 h-4" />
              </button>

              {/* Hidden native date input that provides the calendar */}
              <input
                ref={dateInputRef}
                type="date"
                value={state.salaryPeriodStartDate}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    salaryPeriodStartDate: e.target.value,
                  }))
                }
                tabIndex={-1}
                aria-hidden="true"
                className="absolute left-0 bottom-0 w-0 h-0 opacity-0 pointer-events-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-2 mt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="h-8 px-4 border border-gray-300 rounded text-[12px] hover:bg-gray-50 disabled:opacity-60"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="h-8 px-4 rounded text-[12px] bg-black text-white disabled:opacity-60"
        >
          {saving ? "Saving..." : isEdit ? "Update" : "Save"}
        </button>
      </div>
    </div>
  );
};

/* ---------------- MAIN COMPONENT (view mode) ---------------- */

const PayrollConfiguration = () => {
  const [configuration, setConfiguration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const fetchPayrollConfiguration = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await payrollService.getPayrollConfiguration();

      // API shape: { data: {...}, ok: true }
      const payload =
        response?.data?.data ?? response?.data ?? response ?? null;

      setConfiguration(payload);
    } catch (err) {
      console.error("Payroll Configuration Error:", err);

      const message =
        err?.response?.data?.message ||
        "Failed to fetch payroll configuration.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayrollConfiguration();
  }, [fetchPayrollConfiguration]);

  const hasConfiguration =
    configuration &&
    typeof configuration === "object" &&
    Object.keys(configuration).length > 0;

  // Edit mode
  if (isEditing) {
    return (
      <PayrollConfigurationForm
        initialData={configuration}
        onCancel={() => setIsEditing(false)}
        onSuccess={() => {
          setIsEditing(false);
          fetchPayrollConfiguration();
        }}
      />
    );
  }

  return (
    <div className="p-1 rounded-xl font-poppins text-[12px]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-medium text-gray-800">
            Payroll Configuration
          </h3>
          <p className="text-[11px] text-gray-400 mt-1">
            View your organization's payroll configuration.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchPayrollConfiguration}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Content */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 min-h-[250px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-black mb-3" />
            <p className="text-xs text-gray-400">
              Loading payroll configuration...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <AlertCircle size={30} className="text-black mb-3" />
            <p className="text-sm font-medium text-gray-700 mb-1">
              Unable to load configuration
            </p>
            <p className="text-xs text-gray-400 mb-4">{error}</p>
            <button
              type="button"
              onClick={fetchPayrollConfiguration}
              className="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800 transition"
            >
              Try Again
            </button>
          </div>
        ) : !hasConfiguration ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Settings2 size={32} className="text-black mb-3" />
            <h4 className="text-sm font-medium text-gray-700 mb-1">
              No Payroll Configuration
            </h4>
            <p className="text-xs text-gray-400 mb-4">
              No payroll configuration data is currently available.
            </p>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800 transition"
            >
              Add Configuration
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Settings2 size={16} className="text-black" />
              <h4 className="text-sm font-medium text-gray-800">
                Configuration Details
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {buildFields(configuration).map((field) => (
                <div
                  key={field.label}
                  className="border border-gray-200 rounded-lg p-3"
                >
                  <p className="text-[11px] text-gray-400 mb-1">
                    {field.label}
                  </p>
                  <p className="text-xs font-medium text-gray-700">
                    {field.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 text-xs text-black px-4 py-1.5 border border-gray-300 rounded-md hover:bg-gray-100 transition font-medium"
              >
                <Icon icon="basil:edit-outline" className="w-4 h-4" />
                Edit Configuration
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayrollConfiguration;
