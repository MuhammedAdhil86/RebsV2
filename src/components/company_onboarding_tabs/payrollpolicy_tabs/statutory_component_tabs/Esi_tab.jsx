import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";
import UpsertESI from "./upsertesi";

const EsiTab = ({ esiData: esiDataProp = {}, onDisable, onUpdated }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const [esiData, setEsiData] = useState(esiDataProp);

  useEffect(() => {
    setEsiData(esiDataProp || {});
  }, [esiDataProp]);

  const employeeContribution = esiData.employee_contribution ?? 0;

  const employerContribution = esiData.employer_contribution ?? 0;

  // Disable ESI
  const handleDisable = async () => {
    if (!onDisable || isDisabling) return;

    try {
      setIsDisabling(true);

      await onDisable();

      toast.success("ESI configuration disabled successfully!");

      setEsiData((prev) => ({
        ...prev,
        enabled: false,
      }));

      if (onUpdated) {
        onUpdated();
      }
    } catch (error) {
      console.error("ESI disable error:", error);

      toast.error(
        error?.response?.data?.message || "Failed to disable ESI configuration",
      );
    } finally {
      setIsDisabling(false);
    }
  };

  // Edit mode
  if (isEditing) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 font-[Poppins]">
        <UpsertESI
          initialData={esiData}
          onCancel={() => setIsEditing(false)}
          onSuccess={(saved) => {
            setEsiData((prev) => ({
              ...prev,
              ...saved,
            }));

            setIsEditing(false);

            if (onUpdated) {
              onUpdated();
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 font-[Poppins] text-[13px] text-gray-700">
      <h2 className="text-[14px] font-medium mb-4">
        Employee's State Insurance
      </h2>

      <div className="space-y-3">
        <div className="flex gap-16">
          <span className="font-medium min-w-[150px]">ESI Number</span>
          <span className="text-gray-600">{esiData.esi_number || "--"}</span>
        </div>

        <div className="flex gap-16">
          <span className="font-medium min-w-[150px]">Deduction Cycle</span>
          <span className="text-gray-600">
            {esiData.deduction_cycle || "--"}
          </span>
        </div>

        <div className="flex gap-16">
          <span className="font-medium min-w-[150px]">
            Employee Contribution
          </span>
          <span className="text-gray-600">
            {employeeContribution}% of Gross Pay
          </span>
        </div>

        <div className="flex gap-16">
          <span className="font-medium min-w-[150px]">
            Employer Contribution
          </span>
          <span className="text-gray-600">
            {employerContribution}% of Gross Pay
          </span>
        </div>

        <div className="flex gap-16">
          <span className="font-medium min-w-[150px]">
            Consider Applicable Salary
          </span>
          <span className="text-gray-600">
            {esiData.consider_applicable_salary ? "Yes" : "No"}
          </span>
        </div>

        {esiData.consider_applicable_salary && (
          <div className="flex gap-16">
            <span className="font-medium min-w-[150px]">
              Applicable Salary Threshold
            </span>
            <span className="text-gray-600">
              ₹{esiData.applicable_salary_threshold ?? 21000}
            </span>
          </div>
        )}

        <div className="flex gap-16">
          <span className="font-medium min-w-[150px]">Wage Ceiling</span>
          <span className="text-gray-600">
            ₹{esiData.wage_ceiling ?? 21000}
          </span>
        </div>

        <div className="flex gap-16 pb-3 border-b border-gray-200">
          <span className="font-medium min-w-[150px]">Other Details</span>
          <span className="text-gray-600">
            {esiData.other_details ||
              (esiData.include_employer_contribution_in_structure
                ? "Employer's contribution is included in employee's salary structure."
                : "--")}
          </span>
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="flex items-center gap-2 text-xs text-black px-4 py-1.5 border border-gray-300 rounded-md hover:bg-gray-100 transition font-medium"
        >
          <Icon icon="basil:edit-outline" className="w-4 h-4" />
          Edit ESI
        </button>

        {onDisable && (
          <button
            type="button"
            onClick={handleDisable}
            disabled={isDisabling}
            className="flex items-center gap-2 text-xs px-4 py-1.5 border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition font-medium disabled:opacity-60"
          >
            <Icon icon="proicons:delete" className="w-4 h-4" />
            {isDisabling ? "Disabling..." : "Disable ESI"}
          </button>
        )}
      </div>
    </div>
  );
};

export default EsiTab;
