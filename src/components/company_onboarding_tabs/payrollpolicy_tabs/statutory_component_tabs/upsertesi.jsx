import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../../../../service/axiosinstance";

/* ---------------- CUSTOM CHECKBOX ---------------- */

const CustomCheckbox = ({ checked, onChange, label }) => (
  <label className="flex items-start gap-3 cursor-pointer select-none">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="peer sr-only"
    />

    <span
      className="mt-0.5 h-4 w-4 rounded border border-gray-300
                 flex items-center justify-center
                 peer-checked:bg-black peer-checked:border-black"
    >
      {checked && (
        <svg width="12" height="12" viewBox="0 0 20 20" fill="white">
          <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 13.6l7.3-7.3a1 1 0 0 1 1.4 0Z" />
        </svg>
      )}
    </span>

    <span className="text-[12px] text-gray-800 leading-snug">{label}</span>
  </label>
);

/* ---------------- DEFAULT STATE ---------------- */

const emptyState = {
  esiNumber: "",
  deductionCycle: "",
  employeeContribution: "",
  employerContribution: "",
  considerApplicableSalary: true,
  applicableSalaryThreshold: "21000",
  wageCeiling: "21000",
  includeEmployer: true,
  otherDetails: "",
};

/* ---------------- API TO FORM MAPPING ---------------- */

const fromApi = (data) => ({
  esiNumber: data?.esi_number ?? "",

  deductionCycle: data?.deduction_cycle ?? "",

  employeeContribution:
    data?.employee_contribution != null
      ? String(data.employee_contribution)
      : "",

  employerContribution:
    data?.employer_contribution != null
      ? String(data.employer_contribution)
      : "",

  considerApplicableSalary: data?.consider_applicable_salary ?? true,

  applicableSalaryThreshold:
    data?.applicable_salary_threshold != null
      ? String(data.applicable_salary_threshold)
      : "21000",

  // Always default wage ceiling to 21000 when API returns null
  wageCeiling: data?.wage_ceiling != null ? String(data.wage_ceiling) : "21000",

  includeEmployer: data?.include_employer_contribution_in_structure ?? true,

  otherDetails: data?.other_details ?? "",
});

/* ---------------- UPSERT ESI ---------------- */

export default function UpsertESI({ initialData, onCancel, onSuccess }) {
  const isEdit = !!initialData?.esi_number;

  const [state, setState] = useState(
    initialData ? fromApi(initialData) : emptyState,
  );

  const [saving, setSaving] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (initialData) {
      setState(fromApi(initialData));
    }
  }, [initialData]);

  /* ---------------- HANDLE CHANGE ---------------- */

  const handleChange = (field, value) => {
    setState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /* ---------------- HANDLE SAVE ---------------- */

  const handleSave = async () => {
    // Required field validation
    if (
      !state.esiNumber.trim() ||
      !state.deductionCycle ||
      state.employeeContribution === "" ||
      state.employerContribution === ""
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    // Threshold required only when applicable salary is enabled
    if (
      state.considerApplicableSalary &&
      state.applicableSalaryThreshold === ""
    ) {
      toast.error("Please enter applicable salary threshold");
      return;
    }

    // Wage ceiling is optional. Default to 21000.
    const wageCeiling =
      state.wageCeiling.trim() === "" ? 21000 : Number(state.wageCeiling);

    if (!Number.isFinite(wageCeiling) || wageCeiling < 0) {
      toast.error("Please enter a valid wage ceiling");
      return;
    }

    const payload = {
      enabled: true,

      esi_number: state.esiNumber.trim(),

      deduction_cycle: state.deductionCycle,

      employee_contribution: Number(state.employeeContribution),

      employer_contribution: Number(state.employerContribution),

      consider_applicable_salary: state.considerApplicableSalary,

      // Preserve threshold value but send null when not applicable
      applicable_salary_threshold: state.considerApplicableSalary
        ? Number(state.applicableSalaryThreshold)
        : null,

      // Optional field: always send 21000 if empty
      wage_ceiling: wageCeiling,

      include_employer_contribution_in_structure: state.includeEmployer,

      other_details: state.otherDetails,
    };

    try {
      setSaving(true);

      console.log("ESI Request Payload:", payload);

      const res = await axiosInstance.put(
        "api/payroll/statutory/esi/upsert",
        payload,
      );

      console.log("ESI API Response:", res.data);

      toast.success(
        res.data?.message ||
          (isEdit
            ? "ESI configuration updated successfully!"
            : "ESI configuration enabled successfully!"),
      );

      // API response contains only status, so use submitted payload
      if (onSuccess) {
        onSuccess(payload, res.data);
      } else {
        setTimeout(() => {
          window.location.reload();
        }, 800);
      }
    } catch (err) {
      console.error("ESI save error:", err);

      toast.error(
        err.response?.data?.message ||
          err.response?.statusText ||
          "Failed to save ESI configuration",
      );
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- STYLES ---------------- */

  const inputClass =
    "w-full h-9 border border-gray-200 rounded px-3 text-[12px] text-gray-700 focus:outline-none focus:border-gray-400";

  const selectClass =
    "w-full h-9 border border-gray-200 rounded px-3 text-[12px] appearance-none bg-white focus:outline-none focus:border-gray-400";

  /* ---------------- UI ---------------- */

  return (
    <div className="w-full mx-auto bg-white rounded-md p-2">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-[12px] font-semibold text-gray-800">
          Employees’ State Insurance (ESI)
        </h2>
      </div>

      {/* Top Fields */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* ESI Number */}
        <div>
          <p className="text-[12px] text-gray-500 mb-1">ESI Number</p>

          <input
            value={state.esiNumber}
            onChange={(e) => handleChange("esiNumber", e.target.value)}
            placeholder="ESI1234567890"
            className={inputClass}
          />
        </div>

        {/* Deduction Cycle */}
        <div>
          <p className="text-[12px] text-gray-500 mb-1">Deduction Cycle</p>

          <select
            value={state.deductionCycle}
            onChange={(e) => handleChange("deductionCycle", e.target.value)}
            className={selectClass}
          >
            <option value="" disabled>
              Select deduction cycle
            </option>

            <option value="monthly">monthly</option>
            <option value="quarterly">quarterly</option>
            <option value="yearly">yearly</option>
          </select>
        </div>

        {/* Employee Contribution */}
        <div>
          <p className="text-[12px] text-gray-500 mb-1">
            Employee Contribution (%)
          </p>

          <input
            type="number"
            step="0.01"
            value={state.employeeContribution}
            onChange={(e) =>
              handleChange("employeeContribution", e.target.value)
            }
            placeholder="0.75"
            className={inputClass}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-2 gap-10">
        {/* Left Section */}
        <div>
          <p className="text-[12px] font-medium text-gray-800 mb-4">
            Employer Contribution (%)
          </p>

          <input
            type="number"
            step="0.01"
            value={state.employerContribution}
            onChange={(e) =>
              handleChange("employerContribution", e.target.value)
            }
            placeholder="3.25"
            className={`${inputClass} w-[75%] mb-6`}
          />

          <div className="space-y-5">
            {/* Include Employer */}
            <CustomCheckbox
              checked={state.includeEmployer}
              onChange={() =>
                handleChange("includeEmployer", !state.includeEmployer)
              }
              label="Include employer's contribution in employee's salary structure."
            />

            {/* Consider Applicable Salary */}
            <CustomCheckbox
              checked={state.considerApplicableSalary}
              onChange={() =>
                handleChange(
                  "considerApplicableSalary",
                  !state.considerApplicableSalary,
                )
              }
              label="Consider applicable salary."
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="space-y-4">
          {/* Applicable Salary Threshold - Conditional */}
          {state.considerApplicableSalary && (
            <div>
              <p className="text-[12px] text-gray-500 mb-1">
                Applicable Salary Threshold
              </p>

              <input
                type="number"
                value={state.applicableSalaryThreshold}
                onChange={(e) =>
                  handleChange("applicableSalaryThreshold", e.target.value)
                }
                placeholder="21000"
                className={inputClass}
              />
            </div>
          )}

          {/* Wage Ceiling - Always Optional */}
          <div>
            <p className="text-[12px] text-gray-500 mb-1">
              Wage Ceiling (Optional)
            </p>

            <input
              type="number"
              value={state.wageCeiling}
              onChange={(e) => handleChange("wageCeiling", e.target.value)}
              placeholder="21000"
              className={inputClass}
            />

            <p className="text-[10px] text-gray-400 mt-1">
              Default value: ₹21,000
            </p>
          </div>

          {/* Other Details */}
          <div>
            <p className="text-[12px] font-medium text-gray-800 mb-1">
              Other Details
            </p>

            <textarea
              value={state.otherDetails}
              onChange={(e) => handleChange("otherDetails", e.target.value)}
              placeholder="ESI applicable for eligible employees"
              className="w-full h-20 border border-gray-200 rounded px-3 py-2 text-[12px] text-gray-700 focus:outline-none focus:border-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 border-t pt-4 mt-8">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="h-9 px-5 border border-gray-300 rounded text-[12px] hover:bg-gray-50 disabled:opacity-60"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="h-9 px-5 rounded text-[12px] bg-black text-white disabled:opacity-60"
        >
          {saving ? "Saving..." : isEdit ? "Update" : "Enable"}
        </button>
      </div>
    </div>
  );
}
