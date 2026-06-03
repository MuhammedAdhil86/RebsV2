import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import payrollService from "../../../../service/payrollService";

const UpsertLWF = ({ lwfData = {}, onSuccess }) => {
  // ------------------ STATE ------------------
  const [stateInput, setStateInput] = useState(lwfData.state || "");
  const [deductionCycle, setDeductionCycle] = useState(
    lwfData.deduction_cycle || "monthly",
  );
  const [description, setDescription] = useState(lwfData.description || "");
  const [availableStates, setAvailableStates] = useState([]); // Stores fetched dynamic states
  const [formLoading, setFormLoading] = useState(false);
  const [statesLoading, setStatesLoading] = useState(false); // Tracking dropdown fetch state
  const [error, setError] = useState("");

  const allowedCycles = ["monthly", "quarterly", "half-yearly", "yearly"];

  // ------------------ FETCH STATES RULE ------------------
  useEffect(() => {
    const fetchAvailableStates = async () => {
      setStatesLoading(true);
      try {
        const res = await payrollService.getLWFStateRules();
        const statesArray = res?.states || res || [];
        setAvailableStates(statesArray);

        // Auto-select the first valid rule state item if no initial values exist
        if (!stateInput && statesArray.length > 0) {
          setStateInput(statesArray[0]);
        }
      } catch (err) {
        console.error(
          "Failed loading statutory rules validation states list:",
          err,
        );
        setError("Could not load eligible compliance state lists.");
      } finally {
        setStatesLoading(false);
      }
    };

    fetchAvailableStates();
  }, [stateInput]);

  // ------------------ VALIDATION ------------------
  const validateForm = () => {
    if (!stateInput.trim() || !deductionCycle.trim()) {
      setError("State and Deduction Cycle are required");
      return false;
    }
    if (!allowedCycles.includes(deductionCycle.toLowerCase())) {
      setError(
        `Invalid Deduction Cycle. Allowed values: ${allowedCycles.join(", ")}`,
      );
      return false;
    }
    return true;
  };

  // ------------------ HANDLERS ------------------
  const handleUpsert = async () => {
    setError(""); // clear previous error

    if (!validateForm()) return;

    setFormLoading(true);
    try {
      const res = await payrollService.upsertLWF({
        state: stateInput.toLowerCase(),
        deduction_cycle: deductionCycle.toLowerCase(),
        description: description.trim(),
      });

      // Backend validation errors
      if (res?.ok === false) {
        setError(res.error || "Invalid state or deduction cycle");
        return;
      }

      // Success
      toast.success(res?.message || "LWF updated successfully!");
      onSuccess?.();
    } catch (err) {
      console.error("Upsert LWF error:", err);

      const backendError =
        err?.response?.data?.error || err?.message || "Failed to update LWF";
      setError(backendError);
    } finally {
      setFormLoading(false);
    }
  };

  // ------------------ RENDER CLASSES ------------------
  const selectClass =
    "w-full h-9 border border-gray-300 rounded px-3 text-[12px] bg-white focus:outline-none focus:ring-1 focus:ring-black capitalize disabled:bg-gray-100";

  return (
    <div className="w-full mx-auto bg-white rounded-md p-4 font-poppins text-[12px] shadow-sm">
      <h2 className="text-[14px] font-semibold text-gray-800 mb-3">
        {lwfData && lwfData.state
          ? "Update Labour Welfare Fund"
          : "Add Labour Welfare Fund"}
      </h2>

      {/* Display backend or validation error */}
      {error && <p className="text-red-500 text-[12px] mb-4">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* State Dropdown instead of simple text input */}
        <div>
          <label className="block text-[12px] text-gray-600 mb-1">State</label>
          <select
            value={stateInput}
            onChange={(e) => setStateInput(e.target.value)}
            disabled={statesLoading || formLoading}
            className={selectClass}
          >
            {statesLoading ? (
              <option>Loading states...</option>
            ) : availableStates.length === 0 ? (
              <option value="">No configured states found</option>
            ) : (
              availableStates.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Deduction Cycle */}
        <div>
          <label className="block text-[12px] text-gray-600 mb-1">
            Deduction Cycle
          </label>
          <select
            value={deductionCycle}
            onChange={(e) => setDeductionCycle(e.target.value)}
            disabled={formLoading}
            className={selectClass}
          >
            <option value="" disabled>
              Select deduction cycle
            </option>
            {allowedCycles.map((cycle) => (
              <option key={cycle} value={cycle}>
                {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="sm:col-span-2">
          <label className="block text-[12px] text-gray-600 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={formLoading}
            className="w-full border border-gray-300 rounded px-3 py-2 text-[12px] focus:outline-none focus:ring-1 focus:ring-black disabled:bg-gray-100"
            placeholder="Enter description"
            rows={3}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          className="h-9 px-5 border border-gray-300 rounded text-[12px] hover:bg-gray-100 transition disabled:opacity-50"
          onClick={onSuccess}
          disabled={formLoading}
        >
          Cancel
        </button>
        <button
          type="button"
          className="h-9 px-5 rounded text-[12px] text-white bg-black hover:bg-gray-900 transition flex items-center justify-center disabled:bg-gray-400"
          onClick={handleUpsert}
          disabled={
            formLoading || statesLoading || availableStates.length === 0
          }
        >
          {formLoading ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
};

export default UpsertLWF;
