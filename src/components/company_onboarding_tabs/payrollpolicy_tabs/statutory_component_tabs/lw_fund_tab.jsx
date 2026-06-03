import React, { useState, useEffect } from "react";
import payrollService from "../../../../service/payrollService";

const LabourWelfareFundTab = ({
  lwfData,
  enabled,
  onEnable,
  onDisable,
  onEdit,
  loading,
}) => {
  const [stateInput, setStateInput] = useState(lwfData?.state || "");
  const [deductionCycle, setDeductionCycle] = useState(
    lwfData?.deduction_cycle || "monthly",
  );
  const [availableStates, setAvailableStates] = useState([]);
  const [selectedStateRules, setSelectedStateRules] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [statesLoading, setStatesLoading] = useState(false);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [error, setError] = useState("");

  // 1. Fetch available statutory states
  useEffect(() => {
    if (!enabled) {
      const fetchAvailableStates = async () => {
        setStatesLoading(true);
        try {
          const res = await payrollService.getLWFStateRules();
          const statesArray = res?.states || res || [];
          setAvailableStates(statesArray);

          if (!stateInput && statesArray.length > 0) {
            setStateInput(statesArray[0]);
          }
        } catch (err) {
          console.error("Failed loading states list:", err);
          setError("Could not load configured state lists.");
        } finally {
          setStatesLoading(false);
        }
      };
      fetchAvailableStates();
    }
  }, [enabled]);

  // 2. Fetch all rules attributes whenever the state selection changes
  useEffect(() => {
    const targetState = enabled ? lwfData?.state : stateInput;
    if (!targetState) return;

    const fetchRulesForState = async () => {
      setRulesLoading(true);
      try {
        const rulesData = await payrollService.getLWFRulesByState(targetState);
        setSelectedStateRules(rulesData);

        // Auto-select the correct deduction cycle returned by the rules API
        if (!enabled && rulesData?.deduction_cycle) {
          setDeductionCycle(rulesData.deduction_cycle);
        }
      } catch (err) {
        console.error(`Failed loading rules for ${targetState}:`, err);
        setSelectedStateRules(null);
      } finally {
        setRulesLoading(false);
      }
    };
    fetchRulesForState();
  }, [stateInput, enabled, lwfData?.state]);

  const handleEnable = async (e) => {
    e.preventDefault();
    setError("");

    if (!stateInput) {
      setError("Please select a state to proceed.");
      return;
    }

    setFormLoading(true);
    try {
      const res = await payrollService.enableLWF({
        state: stateInput.toLowerCase(),
        deduction_cycle: deductionCycle.toLowerCase(),
      });

      if (res?.ok === false) {
        setError(res.error || "Backend rejected activation setup.");
        return;
      }

      if (res?.ok === true || res?.data) {
        onEnable(res.data || res);
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

  const inputClass =
    "w-full h-9 border border-gray-300 rounded-md px-3 text-sm focus:outline-none focus:ring-1 focus:ring-black disabled:bg-gray-100 disabled:text-gray-400";
  const selectClass =
    "w-full h-9 border border-gray-300 rounded-md pl-3 pr-8 text-sm bg-white capitalize focus:outline-none focus:ring-1 focus:ring-black appearance-none cursor-pointer disabled:bg-gray-50";

  // ---------------- 1. ENABLE FORM (WITH PREVIEW & READ-ONLY CYCLE) ----------------
  if (!enabled) {
    return (
      <div className="px-4 py-6 bg-gray-50 rounded-md font-poppins text-[12px]">
        <h3 className="font-medium text-gray-800 text-[13px] mb-4">
          Enable Labour Welfare Fund
        </h3>

        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        <form onSubmit={handleEnable} className="space-y-4">
          {/* State Select Dropdown with Balanced Arrow Alignment */}
          <div>
            <label className="block text-gray-600 mb-1">State *</label>
            <div className="relative w-full">
              <select
                value={stateInput}
                onChange={(e) => setStateInput(e.target.value)}
                disabled={statesLoading || formLoading}
                className={selectClass}
              >
                {statesLoading ? (
                  <option>Loading states list...</option>
                ) : (
                  availableStates.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))
                )}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                <svg
                  className="fill-current h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          {/* DYNAMIC LIVE DISPLAY OF ALL API ATTRIBUTES */}
          {stateInput && (
            <div className="p-4 bg-white border border-gray-200 rounded-md text-[12px] text-gray-600 space-y-2">
              <p className="text-gray-700 capitalize border-b border-gray-100 pb-1.5 flex items-center gap-1.5 font-medium">
                <span>⚖️</span> Configured Rules for {stateInput}
              </p>
              {rulesLoading ? (
                <p className="text-gray-400 italic py-1">
                  Fetching live rules data breakdown...
                </p>
              ) : selectedStateRules ? (
                <>
                  <div className="flex justify-between">
                    <span>Employee Contribution:</span>
                    <span className="font-medium text-black">
                      ₹{selectedStateRules.employee_contribution}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Employer Contribution:</span>
                    <span className="font-medium text-black">
                      ₹{selectedStateRules.employer_contribution}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Default Deduction Cycle:</span>
                    <span className="font-medium text-black capitalize">
                      {selectedStateRules.deduction_cycle?.replace("_", " ")}
                    </span>
                  </div>
                  {selectedStateRules.description && (
                    <div className="mt-2 pt-2 border-t border-dashed border-gray-100 text-gray-400 text-[11px] leading-relaxed">
                      <strong>Description:</strong>{" "}
                      {selectedStateRules.description}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-amber-600 italic">
                  No exact rule definitions loaded for this state.
                </p>
              )}
            </div>
          )}

          {/* Deduction Cycle — Read-only Text Input (Not editable) */}
          <div>
            <label className="block text-gray-600 mb-1">Deduction Cycle</label>
            <input
              type="text"
              value={
                rulesLoading
                  ? "Fetching parameters..."
                  : deductionCycle.replace("_", " ")
              }
              className={`${inputClass} capitalize font-medium`}
              disabled
              placeholder="Deduction cycle maps automatically"
            />
          </div>

          <button
            type="submit"
            disabled={formLoading || statesLoading || !selectedStateRules}
            className="px-5 py-2 bg-black text-white rounded-md disabled:bg-gray-400 font-medium text-sm transition-all"
          >
            {formLoading ? "Enabling..." : "Enable LWF"}
          </button>
        </form>
      </div>
    );
  }

  // ---------------- 2. LIVE ENABLED VIEW (SHOWS ALL DATA FIELDS) ----------------
  return (
    <div className="px-2 sm:px-4 md:px-6 w-full font-poppins">
      <h3 className="font-medium text-[14px] sm:text-[15px] text-black flex items-center gap-3">
        Labour Welfare Fund
        <span className="font-normal text-xs text-gray-500">
          (Active Rule Matrix)
        </span>
      </h3>

      <div className="mt-4 p-4 border border-gray-100 rounded-lg bg-gray-50/50 space-y-4 text-sm text-gray-700">
        <div className="flex gap-3 border-b border-gray-100 pb-2">
          <span className="w-[180px] text-gray-500">Selected State</span>
          <span className="font-medium text-black capitalize">
            {lwfData?.state || selectedStateRules?.state}
          </span>
        </div>

        <div className="flex gap-3 border-b border-gray-100 pb-2">
          <span className="w-[180px] text-gray-500">
            Employee’s Contribution
          </span>
          <span className="font-medium text-black">
            ₹{" "}
            {lwfData?.employee_contribution ??
              selectedStateRules?.employee_contribution ??
              0}
          </span>
        </div>

        <div className="flex gap-3 border-b border-gray-100 pb-2">
          <span className="w-[180px] text-gray-500">
            Employer’s Contribution
          </span>
          <span className="font-medium text-black">
            ₹{" "}
            {lwfData?.employer_contribution ??
              selectedStateRules?.employer_contribution ??
              0}
          </span>
        </div>

        <div className="flex gap-3 border-b border-gray-100 pb-2">
          <span className="w-[180px] text-gray-500">Deduction Cycle</span>
          <span className="font-medium text-black capitalize">
            {String(
              lwfData?.deduction_cycle ||
                deductionCycle ||
                selectedStateRules?.deduction_cycle,
            ).replace("_", " ")}
          </span>
        </div>

        {/* DESCRIPTION BLOB DISPLAY */}
        {(lwfData?.description || selectedStateRules?.description) && (
          <div className="text-xs bg-white p-3 rounded border border-gray-200 text-gray-500 leading-relaxed">
            <span className="text-gray-700 font-semibold block mb-1">
              Policy Description:
            </span>
            {lwfData?.description || selectedStateRules?.description}
          </div>
        )}
      </div>

      <hr className="mt-6 border-gray-200" />

      {/* ACTIONS */}
      <div className="flex items-center mt-4 gap-4">
        <button
          onClick={onDisable}
          className="px-5 py-[6px] text-[12px] bg-black text-white rounded-md font-medium"
        >
          Disable
        </button>

        <button
          onClick={onEdit}
          className="px-5 py-[6px] text-[12px] border border-black rounded-md font-medium text-gray-700 hover:bg-gray-50"
        >
          Update
        </button>
      </div>
    </div>
  );
};

export default LabourWelfareFundTab;
