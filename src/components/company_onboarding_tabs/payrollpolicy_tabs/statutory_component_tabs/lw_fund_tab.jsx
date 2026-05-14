import React, { useState } from "react";
import payrollService from "../../../../service/payrollService";

const LabourWelfareFundTab = ({
  lwfData,
  enabled,
  onEnable,
  onDisable,
  onEdit, // ✅ ADD THIS
  loading,
}) => {
  const [stateInput, setStateInput] = useState(lwfData?.state || "");
  const [deductionCycle, setDeductionCycle] = useState(
    lwfData?.deduction_cycle || "monthly",
  );
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");

  const allowedCycles = ["monthly", "quarterly", "yearly", "half-yearly"];

  const handleEnable = async (e) => {
    e.preventDefault();
    setError("");
    setFormLoading(true);

    try {
      const res = await payrollService.enableLWF({
        state: stateInput.toLowerCase(),
        deduction_cycle: deductionCycle.toLowerCase(),
      });

      if (res?.ok === false) {
        setError(res.error || "Backend rejected the selected cycle.");
        return;
      }

      if (res?.ok === true) {
        onEnable(res.data);
      }
    } catch (err) {
      setError(
        err?.response?.data?.error || err?.message || "Failed to enable LWF.",
      );
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-10 text-gray-500 text-sm">Loading...</div>
    );
  }

  // ---------------- ENABLE FORM ----------------
  if (!enabled) {
    return (
      <div className="px-4 py-6 bg-gray-50 rounded-md">
        <h3 className="font-medium text-gray-800 mb-4">
          Enable Labour Welfare Fund
        </h3>

        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        <form onSubmit={handleEnable} className="space-y-4">
          <div>
            <label className="block text-gray-600 text-sm mb-1">State</label>
            <input
              value={stateInput}
              onChange={(e) => setStateInput(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-gray-600 text-sm mb-1">
              Deduction Cycle
            </label>
            <select
              value={deductionCycle}
              onChange={(e) => setDeductionCycle(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              {allowedCycles.map((cycle) => (
                <option key={cycle} value={cycle}>
                  {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={formLoading}
            className="px-5 py-2 bg-black text-white rounded-md"
          >
            {formLoading ? "Enabling..." : "Enable LWF"}
          </button>
        </form>
      </div>
    );
  }

  // ---------------- ENABLED VIEW ----------------
  return (
    <div className="px-2 sm:px-4 md:px-6 w-full">
      <h3 className="font-medium text-[14px] sm:text-[15px] text-black flex items-center gap-3">
        Labour Welfare Fund
        <span className="font-normal text-xs">(Ensures social welfare)</span>
      </h3>

      <p className="mt-3 text-[12px] text-gray-600">State: {lwfData?.state}</p>

      <div className="mt-3 space-y-5 text-sm text-gray-700">
        <div className="flex gap-3">
          <span className="w-[180px] text-gray-600">
            Employee’s Contribution
          </span>
          <span>₹ {lwfData?.employee_contribution || 0}</span>
        </div>

        <div className="flex gap-3">
          <span className="w-[180px] text-gray-600">Employer Contribution</span>
          <span>₹ {lwfData?.employer_contribution || 0}</span>
        </div>

        <div className="flex gap-3">
          <span className="w-[180px] text-gray-600">Deduction Cycle</span>
          <span>{lwfData?.deduction_cycle}</span>
        </div>
      </div>

      <hr className="mt-6 border-gray-200" />

      {/* ACTIONS */}
      <div className="flex items-center mt-4 gap-4">
        <button
          onClick={onDisable}
          className="px-5 py-[6px] text-[12px] bg-black text-white rounded-md"
        >
          Disable
        </button>

        <button
          onClick={onEdit}
          className="px-5 py-[6px] text-[12px] border border-black rounded-md"
        >
          Update
        </button>
      </div>
    </div>
  );
};

export default LabourWelfareFundTab;
