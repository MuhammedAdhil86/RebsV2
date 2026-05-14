import React, { useState } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../../../../service/axiosinstance";

/* Custom Checkbox */
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

export default function UpsertEPF() {
  const [state, setState] = useState({
    epfNumber: "",
    deductionCycle: "",
    employeeContribution: "",
    employerContribution: "",
    includeEmployer: true,
    includeEdu: false,
    includeAdmin: false,
    override: false,
    prorata: false,
    considerSalary: true,
  });

  const handleEnable = async () => {
    if (
      !state.epfNumber ||
      !state.deductionCycle ||
      !state.employeeContribution ||
      !state.employerContribution
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    const employeeRate = parseFloat(state.employeeContribution);
    const employerRate = parseFloat(state.employerContribution);

    if (isNaN(employeeRate) || isNaN(employerRate)) {
      toast.error("Contribution rates must be valid numbers");
      return;
    }

    const payload = {
      epf: {
        enabled: true,
        epf_number: state.epfNumber.trim(),
        deduction_cycle: state.deductionCycle,
        employee_contribution_rate: employeeRate,
        employer_contribution_rate: employerRate,
        splitup_data: {
          basic_percentage: 40,
          da_percentage: 20,
        },
        include_employer_pf_in_structure: state.includeEmployer,
        include_edli_in_structure: state.includeEdu,
        include_admin_in_structure: state.includeAdmin,
        contribution_preferences: {
          employer_pf_contribution: state.includeEmployer,
          edli_contribution: state.includeEdu,
          admin_charges: state.includeAdmin,
        },
        allow_employee_override: state.override,
        pro_rate_restricted_wage: state.prorata,
        consider_applicable_salary: state.considerSalary,
        applicable_salary_threshold: 15000,
        eligible_for_abry_scheme: false,
      },
    };

    try {
      const res = await axiosInstance.put(
        "api/payroll/statutory/epf/upsert",
        payload
      );

      toast.success(
        res.data?.message || "EPF configuration saved successfully!"
      );

      // 🔄 Refresh current tab AFTER success
      setTimeout(() => {
        window.location.reload();
      }, 800);

    } catch (err) {
      console.error(err);
      if (err.response) {
        toast.error(err.response.data?.message || err.response.statusText);
      } else {
        toast.error("Network error while saving EPF configuration");
      }
    }
  };

  const inputClass =
    "w-full h-9 border border-gray-200 rounded px-3 text-[12px] text-gray-700";
  const selectClass =
    "w-full h-9 border border-gray-200 rounded px-3 text-[12px] appearance-none bg-white";

  return (
    <div className="w-full mx-auto bg-white rounded-md p-2">
      <div className="mb-6">
        <h2 className="text-[12px] font-semibold text-gray-800">
          Employees’ Provident Fund
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div>
          <p className="text-[12px] text-gray-500 mb-1">EPF Name</p>
          <input
            value={state.epfNumber}
            onChange={(e) =>
              setState((s) => ({ ...s, epfNumber: e.target.value }))
            }
            placeholder="AA/AAA/000000/XXX"
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
            Employee Contribution Rate
          </p>
          <input
            type="number"
            value={state.employeeContribution}
            onChange={(e) =>
              setState((s) => ({
                ...s,
                employeeContribution: e.target.value,
              }))
            }
            placeholder="12% of Actual PF Wage"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-10">
        <div>
          <p className="text-[12px] font-medium text-gray-800 mb-4">
            Employer Contribution Rate
          </p>

          <input
            type="number"
            value={state.employerContribution}
            onChange={(e) =>
              setState((s) => ({
                ...s,
                employerContribution: e.target.value,
              }))
            }
            placeholder="12% of Actual PF Wage"
            className={`${inputClass} w-[75%] mb-6`}
          />

          <div className="space-y-4">
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
            <div className="pl-5 border-l border-gray-300 space-y-2">
              <CustomCheckbox
                checked={state.includeEdu}
                onChange={() =>
                  setState((s) => ({ ...s, includeEdu: !s.includeEdu }))
                }
                label="Include employer's EDU contribution in employee's salary structure."
              />
              <CustomCheckbox
                checked={state.includeAdmin}
                onChange={() =>
                  setState((s) => ({ ...s, includeAdmin: !s.includeAdmin }))
                }
                label="Include admin charges in employee's salary structure."
              />
            </div>
            <CustomCheckbox
              checked={state.override}
              onChange={() =>
                setState((s) => ({ ...s, override: !s.override }))
              }
              label="Override PF contribution rate at employee level"
            />
          </div>
        </div>

        <div>
          <p className="text-[12px] font-medium text-gray-800 mb-4">
            PF Configuration when LOP Applied
          </p>

          <CustomCheckbox
            checked={state.prorata}
            onChange={() => setState((s) => ({ ...s, prorata: !s.prorata }))}
            label="Pro-rate Restricted PF Wage"
          />

          <CustomCheckbox
            checked={state.considerSalary}
            onChange={() =>
              setState((s) => ({ ...s, considerSalary: !s.considerSalary }))
            }
            label="Consider all applicable salary components if PF wage is less than ₹15,000 after Loss of Pay"
          />
        </div>
      </div>

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
