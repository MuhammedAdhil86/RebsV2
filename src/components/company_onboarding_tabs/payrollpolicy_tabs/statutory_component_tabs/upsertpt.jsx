import React, { useState } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../../../../service/axiosinstance";

const UpsertPT = ({ data = {}, onSuccess }) => {
  const [state, setState] = useState({
    ptNumber: data.pt_number || "",
    ptState: data.state || "",
    deductionCycle: data.deduction_cycle || "",
    description: data.description || "",
  });

  const handleUpsert = async () => {
    if (!state.ptNumber || !state.ptState || !state.deductionCycle) {
      toast.error("Please fill all required fields");
      return;
    }

    const payload = {
      pt_number: state.ptNumber.trim(),
      state: state.ptState.trim(),
      deduction_cycle: state.deductionCycle,
      description: state.description.trim(),
      pt_slabs: data.pt_slabs || [], // keep empty or existing, no editing here
    };

    try {
      const res = await axiosInstance.put(
        "api/payroll/statutory/professional-tax/upsert",
        payload
      );
      toast.success(res.data?.message || "Professional Tax updated successfully!");
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update Professional Tax");
    }
  };

  const inputClass =
    "w-full h-9 border border-gray-200 rounded px-3 text-[12px] text-gray-700";
  const selectClass =
    "w-full h-9 border border-gray-200 rounded px-3 text-[12px] appearance-none bg-white";

  return (
    <div className="w-full mx-auto bg-white rounded-md p-4 font-poppins text-[12px]">
      <h2 className="text-[13px] font-semibold text-gray-800 mb-4">
        Update Professional Tax
      </h2>

      {/* Form Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        {/* PT Number */}
        <div>
          <p className="text-[12px] text-gray-600 mb-1">PT Number</p>
          <input
            type="text"
            value={state.ptNumber}
            onChange={(e) => setState((s) => ({ ...s, ptNumber: e.target.value }))}
            className={inputClass}
            placeholder="Enter PT Number"
          />
        </div>

        {/* State */}
        <div>
          <p className="text-[12px] text-gray-600 mb-1">State</p>
          <input
            type="text"
            value={state.ptState}
            onChange={(e) => setState((s) => ({ ...s, ptState: e.target.value }))}
            className={inputClass}
            placeholder="Enter State"
          />
        </div>

        {/* Deduction Cycle */}
        <div>
          <p className="text-[12px] text-gray-600 mb-1">Deduction Cycle</p>
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
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        {/* Description */}
        <div className="sm:col-span-2">
          <p className="text-[12px] text-gray-600 mb-1">Description</p>
          <textarea
            value={state.description}
            onChange={(e) => setState((s) => ({ ...s, description: e.target.value }))}
            className="w-full border border-gray-200 rounded px-3 py-2 text-[12px]"
            placeholder="Enter description"
            rows={3}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 mt-6">
        <button
          className="h-9 px-5 border border-gray-300 rounded text-[12px]"
          onClick={onSuccess} // acts like cancel/back
        >
          Cancel
        </button>
        <button
          className="h-9 px-5 rounded text-[12px] bg-black text-white"
          onClick={handleUpsert}
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default UpsertPT;
