import React, { useState } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../../../../service/axiosinstance";

/* Custom Checkbox (SAME AS EPF) */
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

export default function UpsertESI() {
  const [state, setState] = useState({
    esiNumber: "",
    deductionCycle: "",
    employeeContribution: "",
    employerContribution: "",
    includeEmployer: true,
    otherDetails: "",
  });

  const handleEnable = async () => {
    if (
      !state.esiNumber ||
      !state.deductionCycle ||
      !state.employeeContribution ||
      !state.employerContribution
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    const payload = {
      enabled: true,
      esi_number: state.esiNumber.trim(),
      deduction_cycle: state.deductionCycle,
      employee_contribution: Number(state.employeeContribution),
      employer_contribution: Number(state.employerContribution),
      include_employer_contribution_in_structure: state.includeEmployer,
      other_details: state.otherDetails,
    };

    try {
      const res = await axiosInstance.put(
        "api/payroll/statutory/esi/upsert",
        payload
      );

      toast.success(res.data?.message || "ESI configuration saved successfully!");

      // 🔄 Refresh tab after success
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (err) {
      console.error(err);
      if (err.response) {
        toast.error(err.response.data?.message || err.response.statusText);
      } else {
        toast.error("Network error while saving ESI configuration");
      }
    }
  };

  const inputClass =
    "w-full h-9 border border-gray-200 rounded px-3 text-[12px] text-gray-700";
  const selectClass =
    "w-full h-9 border border-gray-200 rounded px-3 text-[12px] appearance-none bg-white";

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
        <div>
          <p className="text-[12px] text-gray-500 mb-1">ESI Number</p>
          <input
            value={state.esiNumber}
            onChange={(e) =>
              setState((s) => ({ ...s, esiNumber: e.target.value }))
            }
            placeholder="ESI1234567890"
            className={inputClass}
          />
        </div>

        <div>
          <p className="text-[12px] text-gray-500 mb-1">Deduction Cycle</p>
          <select
            value={state.deductionCycle}
            onChange={(e) =>
              setState((s) => ({ ...s, deductionCycle: e.target.value }))
            }
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

        <div>
          <p className="text-[12px] text-gray-500 mb-1">
            Employee Contribution (%)
          </p>
          <input
            type="number"
            step="0.01"
            value={state.employeeContribution}
            onChange={(e) =>
              setState((s) => ({
                ...s,
                employeeContribution: e.target.value,
              }))
            }
            placeholder="1.75"
            className={inputClass}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-2 gap-10">
        {/* Left */}
        <div>
          <p className="text-[12px] font-medium text-gray-800 mb-4">
            Employer Contribution (%)
          </p>

          <input
            type="number"
            step="0.01"
            value={state.employerContribution}
            onChange={(e) =>
              setState((s) => ({
                ...s,
                employerContribution: e.target.value,
              }))
            }
            placeholder="4.75"
            className={`${inputClass} w-[75%] mb-6`}
          />

          <CustomCheckbox
            checked={state.includeEmployer}
            onChange={() =>
              setState((s) => ({
                ...s,
                includeEmployer: !s.includeEmployer,
              }))
            }
            label="Include employer's contribution in employee's salary structure."
          />
        </div>

        {/* Right */}
        <div>
          <p className="text-[12px] font-medium text-gray-800 mb-4">
            Other Details
          </p>

          <textarea
            value={state.otherDetails}
            onChange={(e) =>
              setState((s) => ({ ...s, otherDetails: e.target.value }))
            }
            placeholder="Updated for FY 2025"
            className="w-full h-20 border border-gray-200 rounded px-3 py-2 text-[12px] text-gray-700"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 border-t pt-4 mt-8">
        <button className="h-9 px-5 border border-gray-300 rounded text-[12px]">
          Cancel
        </button>
        <button
          onClick={handleEnable}
          className="h-9 px-5 rounded text-[12px] bg-black text-white"
        >
          Enable
        </button>
      </div>
    </div>
  );
}
