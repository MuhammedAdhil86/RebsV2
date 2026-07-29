import React from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";

export default function ProvidersTab() {
  const providers = [
    {
      id: 1,
      name: "Star Health Insurance",
      type: "Health",
      contact: "+91 1800 425 2255",
      email: "support@starhealth.in",
      status: "Active",
    },
    {
      id: 2,
      name: "HDFC Ergo",
      type: "General & Health",
      contact: "+91 1800 2707",
      email: "care@hdfcergo.com",
      status: "Active",
    },
    {
      id: 3,
      name: "ICICI Lombard",
      type: "Comprehensive",
      contact: "+91 1800 2666",
      email: "customersupport@icicilombard.com",
      status: "Active",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-800">
            Insurance Providers
          </h2>
          <p className="text-xs text-gray-500">
            Manage third-party insurance providers and partner companies.
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 text-xs font-medium py-2 px-3 rounded-lg shadow-sm transition-all"
        >
          <Plus size={14} /> Add Provider
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
            <tr>
              <th className="p-3 font-medium">Provider Name</th>
              <th className="p-3 font-medium">Insurance Type</th>
              <th className="p-3 font-medium">Contact Number</th>
              <th className="p-3 font-medium">Email</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {providers.map((provider) => (
              <tr key={provider.id} className="hover:bg-gray-50">
                <td className="p-3 font-semibold text-gray-900">
                  {provider.name}
                </td>
                <td className="p-3">{provider.type}</td>
                <td className="p-3">{provider.contact}</td>
                <td className="p-3">{provider.email}</td>
                <td className="p-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>{" "}
                    {provider.status}
                  </span>
                </td>
                <td className="p-3 text-right space-x-2">
                  <button
                    type="button"
                    className="text-gray-400 hover:text-blue-600"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 size={14} />
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
