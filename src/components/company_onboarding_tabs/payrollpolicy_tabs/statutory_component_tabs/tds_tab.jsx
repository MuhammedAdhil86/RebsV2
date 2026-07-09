import React, { useState, useEffect, useCallback } from "react";
import payrollService from "../../../../service/payrollService";
import { toast } from "react-hot-toast";
import EmployeeDeclarationList from "./declaration_tab";

const TdsTab = ({ onUpdate }) => {
  const [selectedYearId, setSelectedYearId] = useState(null);
  const [financialYears, setFinancialYears] = useState([]);
  const [tdsData, setTdsData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [regimesList, setRegimesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [activeView, setActiveView] = useState("TDS_CONFIG");

  const [tanNumber, setTanNumber] = useState("");
  const [tanCircle, setTanCircle] = useState("");
  const [allowOverride, setAllowOverride] = useState(false);
  const [defaultRegimeId, setDefaultRegimeId] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const activeYear = await payrollService.getActiveFinancialYear();
        if (activeYear?.id) {
          setFinancialYears([activeYear]);
          setSelectedYearId(String(activeYear.id));
        }
      } catch (err) {
        toast.error("Could not load financial settings.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const loadTdsData = useCallback(async (id) => {
    if (!id) return;
    setFetching(true);
    try {
      const response = await payrollService.getTDS(id);
      setTdsData(response);
    } catch (err) {
      toast.error("Failed to load TDS details.");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (selectedYearId) loadTdsData(selectedYearId);
  }, [selectedYearId, loadTdsData]);

  useEffect(() => {
    if (tdsData) {
      setTanNumber(tdsData.tan_number || "");
      setTanCircle(tdsData.tan_circle || "");
      setAllowOverride(Boolean(tdsData.allow_employee_regime_selection));
      setDefaultRegimeId(String(tdsData.default_regime?.id || ""));
      setDescription(tdsData.description || "");
    }
  }, [tdsData]);

  const handleStartEdit = async () => {
    try {
      const data = await payrollService.getTaxRegimes();
      setRegimesList(Array.isArray(data) ? data : []);
      setIsEditing(true);
    } catch (err) {
      toast.error("Could not load tax regimes.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await onUpdate({
      financial_year_id: Number(selectedYearId),
      tan_number: tanNumber.trim().toUpperCase(),
      tan_circle: tanCircle.trim(),
      allow_employee_regime_selection: allowOverride,
      default_regime: Number(defaultRegimeId),
      description: description.trim(),
    });
    if (success) {
      setIsEditing(false);
      loadTdsData(selectedYearId);
    }
  };

  const CustomArrow = () => (
    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
      <svg
        className="h-4 w-4 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </div>
  );

  if (loading)
    return <div className="text-center py-10">Loading configuration...</div>;

  return (
    <div className="space-y-6">
      {activeView === "TDS_CONFIG" && (
        <div className="bg-white p-4 border border-gray-200 rounded-lg">
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Financial Year
          </label>
          <div className="relative w-full max-w-xs">
            <select
              value={selectedYearId || ""}
              onChange={(e) => setSelectedYearId(e.target.value)}
              className="appearance-none border border-gray-300 rounded-md p-2 w-full text-xs bg-white pr-10 focus:ring-1 focus:ring-black outline-none"
            >
              {financialYears.map((fy) => (
                <option key={fy.id} value={fy.id}>
                  {fy.name}
                </option>
              ))}
            </select>
            <CustomArrow />
          </div>
        </div>
      )}

      {activeView === "DECLARATION_LIST" ? (
        <EmployeeDeclarationList
          financialYearId={selectedYearId}
          onBack={() => setActiveView("TDS_CONFIG")}
        />
      ) : fetching ? (
        <div className="text-center py-10">Updating view...</div>
      ) : isEditing ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-sm font-medium mb-6">Update TDS Configuration</h2>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
            <input
              value={tanNumber}
              onChange={(e) => setTanNumber(e.target.value)}
              className="border p-2 w-full rounded"
              placeholder="TAN Number"
            />
            <input
              value={tanCircle}
              onChange={(e) => setTanCircle(e.target.value)}
              className="border p-2 w-full rounded"
              placeholder="TAN Circle"
            />
            <div className="relative w-full">
              <select
                value={defaultRegimeId}
                onChange={(e) => setDefaultRegimeId(e.target.value)}
                className="appearance-none border p-2 w-full rounded bg-white pr-10"
              >
                {regimesList.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <CustomArrow />
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={allowOverride}
                onChange={(e) => setAllowOverride(e.target.checked)}
              />
              Allow Employee Override
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border p-2 w-full rounded"
              placeholder="Description"
              rows={2}
            />
            <div className="flex gap-4 mt-6">
              <button
                type="submit"
                className="px-5 py-1.5 bg-black text-white rounded"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-5 py-1.5 border border-black rounded"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-sm font-medium mb-6">
            Tax Deducted at Source (TDS)
          </h2>
          <div className="space-y-4">
            {[
              { label: "Financial Year", value: tdsData?.financial_year?.name },
              {
                label: "Assessment Year",
                value: tdsData?.financial_year?.assessment_year,
              },
              { label: "TAN Number", value: tdsData?.tan_number },
              { label: "TAN Circle", value: tdsData?.tan_circle },
              {
                label: "Default Regime",
                value: tdsData?.default_regime?.regime?.toUpperCase(),
              },
              {
                label: "Allow Override",
                value: tdsData?.allow_employee_regime_selection ? "Yes" : "No",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex gap-3 border-b border-gray-100 pb-2"
              >
                <span className="w-[180px] text-gray-500">{item.label}</span>
                <span className="font-medium text-black">
                  {item.value || "--"}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleStartEdit}
              className="px-5 py-1.5 border border-black rounded text-sm font-medium hover:bg-gray-50"
            >
              Update
            </button>
            <button
              onClick={() => setActiveView("DECLARATION_LIST")}
              className="px-5 py-1.5 bg-black text-white rounded text-sm font-medium"
            >
              Employee Declarations
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TdsTab;
