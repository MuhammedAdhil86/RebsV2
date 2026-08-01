import React from "react";

export default function AuditInformationCard({ auditData }) {
  const formatDate = (dateString) => {
    if (!dateString || dateString.startsWith("0001")) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const auditLogs = Array.isArray(auditData) ? auditData : [];
  const latestAudit = auditLogs[0] || {};

  const action = latestAudit.action || "N/A";
  const remarks = latestAudit.remarks || "N/A";
  const changedBy = latestAudit.changed_by || "N/A";
  const changedAt = formatDate(latestAudit.changed_at);

  return (
    <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
      <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider">
        Audit Information
      </h3>

      <div className="divide-y divide-gray-100 text-xs">
        <div className="grid grid-cols-2 py-2.5 items-center">
          <div className="text-gray-600 font-medium">action</div>
          <div className="text-gray-700 text-right sm:text-left">{action}</div>
        </div>

        <div className="grid grid-cols-2 py-2.5 items-center">
          <div className="text-gray-600 font-medium">remarks</div>
          <div className="text-gray-700 text-right sm:text-left">{remarks}</div>
        </div>

        <div className="grid grid-cols-2 py-2.5 items-center">
          <div className="text-gray-600 font-medium">changed_by</div>
          <div className="text-gray-700 text-right sm:text-left">
            {changedBy}
          </div>
        </div>

        <div className="grid grid-cols-2 py-2.5 items-center">
          <div className="text-gray-600 font-medium">changed_at</div>
          <div className="text-gray-700 text-right sm:text-left">
            {changedAt}
          </div>
        </div>
      </div>
    </div>
  );
}
