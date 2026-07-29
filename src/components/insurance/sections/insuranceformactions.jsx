import React from "react";

export default function AuditInformationCard() {
  return (
    <div className="bg-white shadow-sm rounded-lg p-5 border border-gray-200 space-y-3 text-xs">
      <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
        Audit Information
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-gray-600">
        <div>
          <span className="text-gray-400 block">Created By</span>
          <span className="font-semibold text-gray-800">HR Admin</span>
        </div>
        <div>
          <span className="text-gray-400 block">Created On</span>
          <span className="font-semibold text-gray-800">
            01 Apr 2024 10:30 AM
          </span>
        </div>
        <div>
          <span className="text-gray-400 block">Last Updated By</span>
          <span className="font-semibold text-gray-800">HR Admin</span>
        </div>
        <div>
          <span className="text-gray-400 block">Last Updated On</span>
          <span className="font-semibold text-gray-800">
            20 May 2024 04:45 PM
          </span>
        </div>
      </div>
    </div>
  );
}
