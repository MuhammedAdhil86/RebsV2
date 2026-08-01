import React from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";

export default function DependentsCoveredCard({ dependents }) {
  return (
    <div className="bg-white shadow-sm rounded-lg p-5 border border-gray-200 space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider">
          Dependents Covered
        </h3>
        <button
          type="button"
          className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          <Plus size={12} /> Add Dependent
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-gray-400 border-b border-gray-100">
              <th className="pb-2 font-medium">#</th>
              <th className="pb-2 font-medium">Name</th>
              <th className="pb-2 font-medium">Relationship</th>
              <th className="pb-2 font-medium">DOB</th>
              <th className="pb-2 font-medium text-center">Covered</th>
              <th className="pb-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-gray-700">
            {dependents && dependents.length > 0 ? (
              dependents.map((dep, index) => (
                <tr key={dep.id || index}>
                  <td className="py-2.5">{index + 1}</td>
                  <td className="py-2.5 font-medium">{dep.dependent_name}</td>
                  <td className="py-2.5">{dep.relationship}</td>
                  <td className="py-2.5">
                    {dep.date_of_birth && !dep.date_of_birth.startsWith("0001")
                      ? new Date(dep.date_of_birth).toLocaleDateString(
                          "en-GB",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          },
                        )
                      : "N/A"}
                  </td>
                  <td className="py-2.5 text-center">
                    <span className="inline-block w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 text-[10px] leading-4 text-center">
                      {dep.is_covered ? "✓" : ""}
                    </span>
                  </td>
                  <td className="py-2.5 text-right space-x-2">
                    <button
                      type="button"
                      className="text-gray-400 hover:text-blue-600"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      type="button"
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-400">
                  No dependents recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
