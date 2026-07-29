import React from "react";
import { Plus, Eye, CheckCircle, Clock } from "lucide-react";

export default function InsuranceClaimsTab() {
  const claims = [
    {
      id: "CLM-2024-00125",
      employee: "John Mathew",
      type: "Health Insurance",
      amount: "₹ 25,000",
      settlement: "₹ 25,000",
      date: "10 May 2024",
      status: "Approved",
    },
    {
      id: "CLM-2024-00142",
      employee: "Sarah Jenkins",
      type: "Accident Insurance",
      amount: "₹ 12,500",
      settlement: "₹ 0",
      date: "18 Jun 2024",
      status: "Pending",
    },
    {
      id: "CLM-2024-00189",
      employee: "Rahul Sharma",
      type: "Health Insurance",
      amount: "₹ 45,000",
      settlement: "₹ 40,000",
      date: "02 Jul 2024",
      status: "Approved",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Insurance Claims</h2>
          <p className="text-xs text-gray-500">
            Track and manage employee medical or accidental insurance
            reimbursement requests.
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 text-xs font-medium py-2 px-3 rounded-lg shadow-sm transition-all"
        >
          <Plus size={14} /> Raise Claim
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
            <tr>
              <th className="p-3 font-medium">Claim ID</th>
              <th className="p-3 font-medium">Employee</th>
              <th className="p-3 font-medium">Type</th>
              <th className="p-3 font-medium">Claim Amount</th>
              <th className="p-3 font-medium">Settlement</th>
              <th className="p-3 font-medium">Claim Date</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {claims.map((claim) => (
              <tr key={claim.id} className="hover:bg-gray-50">
                <td className="p-3 font-semibold text-gray-900">{claim.id}</td>
                <td className="p-3 font-medium">{claim.employee}</td>
                <td className="p-3">{claim.type}</td>
                <td className="p-3">{claim.amount}</td>
                <td className="p-3 font-medium text-emerald-600">
                  {claim.settlement}
                </td>
                <td className="p-3">{claim.date}</td>
                <td className="p-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
                      claim.status === "Approved"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {claim.status === "Approved" ? (
                      <CheckCircle size={10} className="mr-1" />
                    ) : (
                      <Clock size={10} className="mr-1" />
                    )}
                    {claim.status}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <button
                    type="button"
                    className="text-gray-400 hover:text-blue-600 flex items-center gap-1 ml-auto"
                  >
                    <Eye size={14} /> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
