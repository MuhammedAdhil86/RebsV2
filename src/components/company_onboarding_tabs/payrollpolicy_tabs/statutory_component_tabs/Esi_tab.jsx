import React from "react";
import { Icon } from "@iconify/react";

const EsiTab = ({ esiData = {}, onDisable, onEdit }) => {
  // Fallback values for numeric fields
  const employeeContribution = esiData.employee_contribution ?? 0;
  const employerContribution = esiData.employer_contribution ?? 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 font-[Poppins] text-[13px] text-gray-700">
      
      <h2 className="text-[14px] font-medium mb-4">Employee's State Insurance</h2>

      <div className="space-y-3">

        {/* ESI Number */}
        <div className="flex gap-16">
          <span className="font-medium min-w-[150px]">ESI Number</span>
          <span className="text-gray-600">{esiData.esi_number || "--"}</span>
        </div>

        {/* Deduction Cycle */}
        <div className="flex gap-16">
          <span className="font-medium min-w-[150px]">Deduction Cycle</span>
          <span className="text-gray-600">{esiData.deduction_cycle || "--"}</span>
        </div>

        {/* Employee Contribution */}
        <div className="flex gap-16">
          <span className="font-medium min-w-[150px]">Employee Contribution</span>
          <span className="text-gray-600">{employeeContribution}% of Gross Pay</span>
        </div>

        {/* Employer Contribution */}
        <div className="flex gap-16">
          <span className="font-medium min-w-[150px]">Employer Contribution</span>
          <span className="text-gray-600">{employerContribution}% of Gross Pay</span>
        </div>

        {/* Other Details */}
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

      {/* Action Buttons */}
      <div className="flex gap-3 mt-8">
        {onEdit && (
          <button
            onClick={onEdit}
            className="flex items-center gap-2 text-xs text-black px-4 py-1.5 border border-gray-300 rounded-md hover:bg-gray-100 transition font-medium"
          >
            <Icon icon="basil:edit-outline" className="w-4 h-4" /> 
            Edit ESI
          </button>
        )}

        {onDisable && (
          <button
            onClick={onDisable}
            className="flex items-center gap-2 text-xs px-4 py-1.5 border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition font-medium"
          >
            <Icon icon="proicons:delete" className="w-4 h-4" /> 
            Disable ESI
          </button>
        )}
      </div>

    </div>
  );
};

export default EsiTab;
