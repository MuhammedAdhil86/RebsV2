import React, { useState, useEffect } from "react";
import payrollService from "../../../../service/payrollService";

const TdsTab = ({ tdsData = {}, onUpdate, loading }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [regimesList, setRegimesList] = useState([]);
  const [fetchingRegimes, setFetchingRegimes] = useState(false);

  // Local form state variables
  const [tanNumber, setTanNumber] = useState("");
  const [tanCircle, setTanCircle] = useState("");
  const [allowOverride, setAllowOverride] = useState(false);
  const [defaultRegimeId, setDefaultRegimeId] = useState("");
  const [description, setDescription] = useState("");

  // Sync data safely into fields
  useEffect(() => {
    if (tdsData && Object.keys(tdsData).length > 0) {
      setTanNumber(tdsData.tan_number || "");
      setTanCircle(tdsData.tan_circle || "");
      setAllowOverride(Boolean(tdsData.allow_employee_regime_selection));
      setDefaultRegimeId(
        tdsData.default_regime?.id ? String(tdsData.default_regime.id) : "",
      );
      setDescription(tdsData.description || "");
    }
  }, [tdsData]);

  const handleStartEdit = async () => {
    setIsEditing(true);
    setFetchingRegimes(true);
    try {
      const data = await payrollService.getTaxRegimes();
      const loadedRegimes = Array.isArray(data) ? data : [];
      setRegimesList(loadedRegimes);

      if (!defaultRegimeId && loadedRegimes.length > 0) {
        setDefaultRegimeId(String(loadedRegimes[0].id));
      }
    } catch (err) {
      console.error("Could not load tax regimes layout list array:", err);
    } finally {
      setFetchingRegimes(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const success = await onUpdate({
      financial_year_id: Number(tdsData?.financial_year?.id) || 1,
      tan_number: tanNumber.trim().toUpperCase(),
      tan_circle: tanCircle.trim(),
      allow_employee_regime_selection: allowOverride,
      default_regime: Number(defaultRegimeId),
      description: description.trim(),
    });

    if (success) {
      setIsEditing(false);
    }
  };

  const financialYearName =
    tdsData?.financial_year?.name || tdsData?.financial_year?.code || "--";
  const assessmentYearName = tdsData?.financial_year?.assessment_year || "--";

  // --- EDIT STATE VIEW ---
  if (isEditing) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 font-[Poppins] text-[13px] text-gray-700">
        <h2 className="text-[14px] font-medium mb-4">
          Update TDS Configuration ({financialYearName})
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-gray-600">TAN Number</label>
            <input
              type="text"
              value={tanNumber}
              onChange={(e) => setTanNumber(e.target.value)}
              className="border border-gray-300 rounded-md p-2 text-xs focus:outline-none focus:border-black uppercase"
              placeholder="e.g. ABCDE1234F"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-gray-600">
              TDS Circle / Range
            </label>
            <input
              type="text"
              value={tanCircle}
              onChange={(e) => setTanCircle(e.target.value)}
              className="border border-gray-300 rounded-md p-2 text-xs focus:outline-none focus:border-black"
              placeholder="e.g. Kochi"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-gray-600">
              Default Tax Regime
            </label>
            <select
              value={defaultRegimeId}
              onChange={(e) => setDefaultRegimeId(e.target.value)}
              disabled={fetchingRegimes}
              className="border border-gray-300 rounded-md p-2 text-xs bg-white focus:outline-none focus:border-black disabled:opacity-50"
            >
              {fetchingRegimes ? (
                <option>Loading configurations...</option>
              ) : regimesList.length > 0 ? (
                regimesList.map((item) => (
                  <option key={item.id} value={String(item.id)}>
                    {item.name || item.code || `Regime ID: ${item.id}`}
                  </option>
                ))
              ) : (
                <>
                  <option value="1">New Tax Regime</option>
                  <option value="2">Old Tax Regime</option>
                </>
              )}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-gray-600">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border border-gray-300 rounded-md p-2 text-xs focus:outline-none focus:border-black h-20 resize-none"
              placeholder="Provide a configuration reference description..."
            />
          </div>

          <div className="flex items-center gap-2 py-2">
            <input
              type="checkbox"
              id="allowOverrideCheck"
              checked={allowOverride}
              onChange={(e) => setAllowOverride(e.target.checked)}
              className="w-4 h-4 accent-black rounded cursor-pointer"
            />
            <label
              htmlFor="allowOverrideCheck"
              className="select-none cursor-pointer text-gray-600"
            >
              Allow employees to select their preferred tax regime
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-[6px] text-[12px] bg-black text-white font-medium rounded-md hover:bg-gray-800 transition disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-5 py-[6px] text-[12px] border border-gray-300 text-black font-medium rounded-md hover:bg-gray-100 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  // --- VIEW DETAILS STATE ---
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 font-[Poppins] text-[13px] text-gray-700">
      <h2 className="text-[14px] font-medium mb-4">
        Tax Deducted at Source (TDS)
      </h2>

      <div className="space-y-3">
        <div className="flex gap-16">
          <span className="font-medium min-w-[150px]">Financial Year</span>
          <span className="text-gray-600">{financialYearName}</span>
        </div>

        <div className="flex gap-16">
          <span className="font-medium min-w-[150px]">Assessment Year</span>
          <span className="text-gray-600">{assessmentYearName}</span>
        </div>

        <div className="flex gap-16">
          <span className="font-medium min-w-[150px]">TAN Number</span>
          <span className="text-gray-600">{tdsData?.tan_number || "--"}</span>
        </div>

        <div className="flex gap-16">
          <span className="font-medium min-w-[150px]">TDS Circle / Range</span>
          <span className="text-gray-600">{tdsData?.tan_circle || "--"}</span>
        </div>

        <div className="flex gap-16">
          <span className="font-medium min-w-[150px]">Employee Override</span>
          <span className="text-gray-600">
            {tdsData?.allow_employee_regime_selection
              ? "Allowed to choose tax regime preference"
              : "Restricted (Admin enforced)"}
          </span>
        </div>

        <div className="flex gap-16">
          <span className="font-medium min-w-[150px]">Default Tax Regime</span>
          <span className="text-gray-600">
            {tdsData?.default_regime?.name ||
              (tdsData?.default_regime?.regime
                ? tdsData.default_regime.regime.charAt(0).toUpperCase() +
                  tdsData.default_regime.regime.slice(1)
                : "--")}{" "}
            Regime
          </span>
        </div>

        <div className="flex gap-16 pb-3 border-b border-gray-200">
          <span className="font-medium min-w-[150px]">Description</span>
          <span className="text-gray-600">{tdsData?.description || "--"}</span>
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <button
          onClick={handleStartEdit}
          className="px-5 py-[6px] text-[12px] border border-black rounded-md font-medium text-gray-700 hover:bg-gray-50"
        >
          Update
        </button>
      </div>
    </div>
  );
};

export default TdsTab;
