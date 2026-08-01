import React from "react";
import { Calendar } from "lucide-react";

export default function ClaimInformationCard({ claims }) {
  const sampleClaim = claims?.[0] || {};

  const formatDate = (dateString) => {
    if (!dateString || dateString.startsWith("0001")) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const status = sampleClaim.claim_status;

  return (
    <div className="bg-white shadow-sm rounded-lg p-5 border border-gray-200 space-y-4 w-full">
      <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider">
        Claim Information{" "}
        <span className="text-gray-400 font-normal lowercase">(Optional)</span>
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 text-xs">
        <div>
          <label className="block text-gray-600 font-medium mb-1">
            Claim ID
          </label>
          <input
            type="text"
            readOnly
            value={sampleClaim.claim_number || sampleClaim.id || "N/A"}
            className="w-full border border-gray-200 bg-gray-50 rounded-md p-2 text-gray-700"
          />
        </div>
        <div>
          <label className="block text-gray-600 font-medium mb-1">
            Claim Status
          </label>
          <select
            disabled
            value={status || ""}
            className={`w-full border border-gray-200 rounded-md p-2 font-medium ${
              status
                ? "bg-emerald-50 text-emerald-700"
                : "bg-gray-50 text-gray-400"
            }`}
          >
            {!status && <option value="">N/A</option>}
            <option value="Approved">Approved</option>
            <option value="Pending">Pending</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-600 font-medium mb-1">
            Claim Amount (₹)
          </label>
          <input
            type="text"
            readOnly
            value={sampleClaim.claim_amount || "0"}
            className="w-full border border-gray-200 bg-gray-50 rounded-md p-2 text-gray-700"
          />
        </div>
        <div>
          <label className="block text-gray-600 font-medium mb-1">
            Settlement Amount (₹)
          </label>
          <input
            type="text"
            readOnly
            value={sampleClaim.settlement_amount || "0"}
            className="w-full border border-gray-200 bg-gray-50 rounded-md p-2 text-gray-700"
          />
        </div>
        <div>
          <label className="block text-gray-600 font-medium mb-1">
            Claim Date
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              readOnly
              value={formatDate(sampleClaim.claim_date)}
              className="w-full border border-gray-200 bg-gray-50 rounded-md p-2 text-gray-700 pr-8"
            />
            <Calendar size={14} className="absolute right-2.5 text-gray-400" />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-gray-600 font-medium mb-1 text-xs">
          Remarks
        </label>
        <input
          type="text"
          readOnly
          value={sampleClaim.remarks || "N/A"}
          className="w-full border border-gray-200 bg-gray-50 rounded-md p-2 text-xs text-gray-700"
        />
      </div>
    </div>
  );
}
