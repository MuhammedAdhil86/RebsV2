import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import payrollService from "../../../../service/payrollService";

const UpsertPT = ({ data = {}, onSuccess }) => {
  const [state, setState] = useState({
    ptNumber: data.pt_number || "",
    ptState: data.state || "",
    deductionCycle: data.deduction_cycle || "",
    description: data.description || "",
  });

  const [fetchingCycle, setFetchingCycle] = useState(false);
  const [saving, setSaving] = useState(false);

  const indianStates = [
    "andhra pradesh",
    "arunachal pradesh",
    "assam",
    "bihar",
    "chhattisgarh",
    "goa",
    "gujarat",
    "haryana",
    "himachal pradesh",
    "jharkhand",
    "karnataka",
    "kerala",
    "madhya pradesh",
    "maharashtra",
    "manipur",
    "meghalaya",
    "mizoram",
    "nagaland",
    "odisha",
    "punjab",
    "rajasthan",
    "sikkim",
    "tamil nadu",
    "telangana",
    "tripura",
    "uttarakhand",
    "uttar pradesh",
    "west bengal",
    "delhi",
    "chandigarh",
    "puducherry",
    "jammu and kashmir",
    "ladakh",
  ];

  useEffect(() => {
    if (!state.ptState) return;

    const fetchCycleForState = async () => {
      setFetchingCycle(true);
      try {
        const res = await payrollService.getActivePTSlabs(state.ptState);
        const slabsArray = Array.isArray(res) ? res : res?.data || [];

        if (slabsArray.length > 0 && slabsArray[0]?.deduction_cycle) {
          setState((prev) => ({
            ...prev,
            deductionCycle: slabsArray[0].deduction_cycle,
          }));
        } else {
          setState((prev) => ({ ...prev, deductionCycle: "not configured" }));
        }
      } catch (err) {
        console.error("Failed to fetch matching state parameters:", err);
        setState((prev) => ({ ...prev, deductionCycle: "error loading" }));
      } finally {
        setFetchingCycle(false);
      }
    };

    fetchCycleForState();
  }, [state.ptState]);

  const handleUpsert = async () => {
    if (!state.ptNumber || !state.ptState) {
      toast.error("Please fill all required fields");
      return;
    }

    setSaving(true);
    const payload = {
      pt_number: state.ptNumber.trim(),
      state: state.ptState.trim().toLowerCase(),
      description: state.description.trim(),
    };

    try {
      await payrollService.upsertPT(payload);
      toast.success("Professional Tax updated successfully!");
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message ||
          "Failed to update Professional Tax settings",
      );
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full h-9 border border-gray-200 rounded px-3 text-[12px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-black disabled:bg-gray-100 disabled:text-gray-400";

  // 🛠️ FIXED: Added clear pr-8 padding right boundary constraints so text never overlaps the arrow
  const selectClass =
    "w-full h-9 border border-gray-200 rounded pl-3 pr-8 text-[12px] appearance-none bg-white focus:outline-none focus:ring-1 focus:ring-black capitalize disabled:bg-gray-50 text-gray-700 cursor-pointer";

  return (
    <div className="w-full mx-auto bg-white rounded-md p-4 font-poppins text-[12px]">
      <h2 className="text-[13px] font-semibold text-gray-800 mb-4">
        Update Professional Tax
      </h2>

      {/* Form Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* PT Number */}
        <div>
          <p className="text-[12px] text-gray-600 mb-1">PT Number *</p>
          <input
            type="text"
            value={state.ptNumber}
            onChange={(e) =>
              setState((s) => ({ ...s, ptNumber: e.target.value }))
            }
            className={inputClass}
            placeholder="Enter PT Number"
            disabled={saving}
          />
        </div>

        {/* State Select Box with Balanced Padding Arrow Alignment */}
        <div>
          <p className="text-[12px] text-gray-600 mb-1">State *</p>
          <div className="relative w-full">
            <select
              value={state.ptState.toLowerCase()}
              onChange={(e) =>
                setState((s) => ({ ...s, ptState: e.target.value }))
              }
              className={selectClass}
              disabled={saving}
            >
              <option value="" disabled>
                Select state
              </option>
              {indianStates.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            {/* 🛠️ FIXED: Arrow icon positioned with absolute values matching standard input fields gap (px-3/right-3) */}
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

        {/* Deduction Cycle */}
        <div>
          <p className="text-[12px] text-gray-600 mb-1">Deduction Cycle</p>
          <input
            type="text"
            value={
              fetchingCycle
                ? "Fetching cycle..."
                : state.deductionCycle.replace("_", " ")
            }
            className={`${inputClass} capitalize font-medium`}
            disabled
            placeholder="Deduction cycle maps automatically"
          />
        </div>

        {/* Description */}
        <div className="sm:col-span-2">
          <p className="text-[12px] text-gray-600 mb-1">Description</p>
          <textarea
            value={state.description}
            onChange={(e) =>
              setState((s) => ({ ...s, description: e.target.value }))
            }
            className="w-full border border-gray-200 rounded px-3 py-2 text-[12px] focus:outline-none focus:ring-1 focus:ring-black disabled:bg-gray-50 text-gray-700"
            placeholder="Enter description rules summary notes"
            rows={3}
            disabled={saving}
          />
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex justify-end gap-3 mt-6">
        <button
          className="h-9 px-5 border border-gray-300 rounded text-[12px] hover:bg-gray-50 transition"
          onClick={onSuccess}
          disabled={saving}
        >
          Cancel
        </button>
        <button
          className="h-9 px-5 rounded text-[12px] bg-black text-white hover:bg-gray-900 transition disabled:bg-gray-400"
          onClick={handleUpsert}
          disabled={saving || fetchingCycle}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
};

export default UpsertPT;
