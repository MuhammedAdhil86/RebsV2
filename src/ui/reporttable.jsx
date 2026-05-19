import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

function ReportTable({ columns, data, rowsPerPage = 8, onRowClick }) {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  const totalPages = Math.ceil(data.length / rowsPerPage);
  const startIdx = (currentPage - 1) * rowsPerPage;
  const endIdx = startIdx + rowsPerPage;
  const currentData = data.slice(startIdx, endIdx);

  return (
    /* All default UI styles, shadows, and rounded configurations preserved exactly as requested */
    <section className="p-1 rounded-2xl w-full border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col">
      {/* ─── SCROLLABLE ZONE CONTAINER WITH CUSTOM SCROLLBAR ─── */}
      <div className="w-full overflow-x-auto custom-scrollbar block clear-both">
        <table className="w-full min-w-[800px] text-[12px] border-separate border-spacing-0">
          <thead className="bg-white">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={col.key}
                  className={`px-4 py-4 font-semibold text-gray-700 text-center whitespace-nowrap align-middle border-b border-gray-100
                  ${idx === 0 ? "rounded-tl-2xl" : ""}
                  ${idx === columns.length - 1 ? "rounded-tr-2xl" : ""}`}
                  style={{
                    width: col.width ? `${col.width}px` : "auto",
                    minWidth: col.width ? `${col.width}px` : "auto",
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="text-gray-800">
            {currentData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center py-20 text-gray-400 bg-gray-50/30"
                >
                  No records found for the selected period.
                </td>
              </tr>
            ) : (
              currentData.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className={`group transition-all duration-200 border-b border-gray-50 last:border-none
                  ${onRowClick ? "cursor-pointer hover:bg-blue-50/50" : ""}`}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((col) => {
                    const value = row[col.key];
                    return (
                      <td
                        key={col.key}
                        className="px-4 py-4 truncate text-center align-middle text-[12px] text-gray-600 group-hover:text-blue-700 border-b border-gray-50"
                        style={{
                          width: col.width ? `${col.width}px` : "auto",
                          minWidth: col.width ? `${col.width}px` : "auto",
                        }}
                      >
                        {col.render
                          ? col.render(value, row, rowIdx)
                          : (value ?? "—")}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ─── STATIC FOOTER VIEW (Outside the scroll container so it doesn't move) ─── */}
      {data.length > 0 && (
        <div className="bg-white rounded-b-2xl w-full">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-6 py-4 border-t border-gray-100">
            <span className="text-gray-500 text-[12px]">
              Showing{" "}
              <span className="font-medium text-gray-700">{startIdx + 1}</span>{" "}
              to{" "}
              <span className="font-medium text-gray-700">
                {Math.min(endIdx, data.length)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-gray-700">{data.length}</span>{" "}
              employees
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentPage((prev) => Math.max(prev - 1, 1));
                }}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <div className="px-4 text-[12px] font-medium text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                }}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── INJECTED SCROLLBAR CLASSES FROM MUSTER ROLL ─── */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .custom-scrollbar::-webkit-scrollbar { height: 8px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #ccc; border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #999; }
        `,
        }}
      />
    </section>
  );
}

export default ReportTable;
