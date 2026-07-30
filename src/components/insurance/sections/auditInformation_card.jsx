import React from "react";

export default function AuditInformationCard() {
  return (
    <div className="bg-white shadow-sm rounded-lg p-5 border border-gray-200 space-y-4">
      <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider">
        Audit Information
      </h3>

      <div className="divide-y divide-gray-100 text-xs">
        {/* Row 1: Created */}
        <div className="grid grid-cols-3 py-2.5 items-center">
          <div className="text-gray-500 font-normal">Created By</div>
          <div className="text-gray-500 font-normal">Created On</div>
          <div className="text-gray-800 font-medium text-right sm:text-left">
            01 Apr 2024 10:30 AM
          </div>
        </div>

        {/* Row 2: Last Updated */}
        <div className="grid grid-cols-3 py-2.5 items-center">
          <div className="text-gray-500 font-normal">Last Updated By</div>
          <div className="text-gray-500 font-normal">Last Updated On</div>
          <div className="text-gray-800 font-medium text-right sm:text-left">
            20 May 2024 04:45 PM
          </div>
        </div>
      </div>
    </div>
  );
}
