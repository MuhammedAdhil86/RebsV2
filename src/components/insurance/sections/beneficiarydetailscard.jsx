import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";

export default function BeneficiaryDetailsCard({ beneficiaries = [] }) {
  return (
    <div className="bg-white shadow-sm rounded-lg p-5 border border-gray-200 space-y-4">
      <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider">
        Beneficiary Details
      </h3>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Relation</th>
              <th className="p-3 font-medium">Contact</th>
              <th className="p-3 font-medium">Email</th>
              <th className="p-3 font-medium text-center">Allocation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-gray-800">
            {beneficiaries.length > 0 ? (
              beneficiaries.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 transition">
                  <td className="p-3 flex items-center gap-2 font-medium">
                    <span>{b.beneficiary_name}</span>
                    {b.is_primary ? (
                      <CheckCircle2
                        size={16}
                        className="text-green-500"
                        title="Primary Beneficiary"
                      />
                    ) : (
                      <XCircle
                        size={16}
                        className="text-gray-300"
                        title="Not Primary"
                      />
                    )}
                  </td>
                  <td className="p-3">{b.relationship}</td>
                  <td className="p-3">{b.contact_number}</td>
                  <td className="p-3">{b.email}</td>
                  <td className="p-3 text-center font-semibold">
                    {b.allocation_percentage}%
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="p-4 text-center text-gray-400">
                  No beneficiaries found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
