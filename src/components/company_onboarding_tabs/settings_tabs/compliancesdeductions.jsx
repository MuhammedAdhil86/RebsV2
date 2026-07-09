import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import toast, { Toaster } from "react-hot-toast";
import {
  fetchEmployeeProfile,
  overrideTaxProfile,
} from "../../../service/payrollother";

export default function CompliancesSection({ uuid }) {
  const [profile, setProfile] = useState(null);
  const [manualTax, setManualTax] = useState("0");
  const [tempTax, setTempTax] = useState("0"); // Used for tracking editing state
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchEmployeeProfile(uuid);
        setProfile(data);
        const taxVal = data.manual_annual_tax?.toString() || "0";
        setManualTax(taxVal);
        setTempTax(taxVal);
      } catch (error) {
        toast.error("Failed to load tax data");
      } finally {
        setLoading(false);
      }
    };
    if (uuid) loadData();
  }, [uuid]);

  const handleSave = async () => {
    try {
      setLoading(true);
      await overrideTaxProfile(uuid, tempTax);
      setManualTax(tempTax);
      toast.success("Manual Annual Tax updated!");
      setIsEditing(false);
    } catch (error) {
      toast.error("Update failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setTempTax(manualTax); // Reset to last saved value
    setIsEditing(false);
  };

  if (loading)
    return <div className="text-gray-500 p-4 text-[12px]">Loading...</div>;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border w-full">
      <Toaster position="top-right" />

      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-800 text-[14px]">
          Tax & Financials
        </h3>

        {/* Toggle between Edit/Cancel/Done */}
        {isEditing ? (
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="text-gray-500 text-[12px] hover:text-black"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="text-blue-600 text-[12px] hover:underline"
            >
              Save
            </button>
          </div>
        ) : (
          <Icon
            icon="basil:edit-outline"
            className="w-5 h-5 text-gray-400 cursor-pointer hover:text-black"
            onClick={() => setIsEditing(true)}
          />
        )}
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center py-1">
          <span className="text-gray-500 text-[12px]">Tax Regime</span>
          <span className="text-[12px] font-medium uppercase">
            {profile?.tax_regime?.regime || "-"}
          </span>
        </div>

        <div className="flex justify-between items-center py-1">
          <span className="text-gray-500 text-[12px]">
            Prev. Employer Income
          </span>
          <span className="text-[12px] font-medium">
            {profile?.previous_employer_income || 0}
          </span>
        </div>

        <div className="flex justify-between items-center py-1">
          <span className="text-gray-500 text-[12px]">Prev. Employer TDS</span>
          <span className="text-[12px] font-medium">
            {profile?.previous_employer_tds || 0}
          </span>
        </div>

        <div className="flex justify-between items-center py-1">
          <span className="text-gray-500 text-[12px]">Other Income</span>
          <span className="text-[12px] font-medium">
            {profile?.other_income || 0}
          </span>
        </div>

        <div className="flex justify-between items-center py-1 border-t border-gray-100 pt-2">
          <span className="text-gray-800 font-medium text-[12px]">
            Manual Annual Tax
          </span>
          {isEditing ? (
            <input
              type="number"
              value={tempTax}
              onChange={(e) => setTempTax(e.target.value)}
              className="border rounded px-2 py-1 text-[12px] w-32 outline-none focus:border-blue-500"
            />
          ) : (
            <span className="text-[12px] font-bold text-blue-600">
              {manualTax}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
