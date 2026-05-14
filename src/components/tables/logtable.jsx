import React from "react";
import { Search } from "lucide-react";

function LogTable({ logs }) {
  return (
    <section className="bg-white rounded-2xl overflow-x-auto shadow">
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h3 className="text-xl font-medium">Log Info</h3>
        <div className="flex items-center gap-1 border px-2 py-1 rounded-lg bg-gray-100 text-xs">
          <input
            type="text"
            placeholder="Search"
            className="bg-transparent text-xs text-gray-600 w-40 focus:outline-none"
          />
          <Search className="w-3 h-3 text-gray-400" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs table-fixed rounded-b-2xl">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200">
              {["Employee", "Designation", "Device", "Time & Date", "Location", "Status"].map(
                (col) => (
                  <th key={col} className="px-3 py-2 text-left font-medium text-gray-500 uppercase">{col}</th>
                )
              )}
            </tr>
          </thead>
          <tbody className="bg-white">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50 border-b border-gray-100">
                <td className="px-3 py-3 flex items-center gap-2">
                  <img src={log.img} alt={log.name} className="w-5 h-5 rounded-full" />
                  {log.name}
                </td>
                <td className="px-3 py-3">{log.role}</td>
                <td className="px-3 py-3">{log.device}</td>
                <td className="px-3 py-3">{log.time}</td>
                <td className="px-3 py-3">{log.location}</td>
                <td className="px-3 py-3">
                  <span className={`w-[70px] h-[27px] flex items-center justify-center rounded-full text-[10px] ${
                    log.status === "Login"
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-600"
                  }`}>
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default LogTable;
