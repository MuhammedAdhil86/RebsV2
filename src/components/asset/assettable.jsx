import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function AssetTable({
  columns = [],
  data = [],
  rowsPerPage = 6,
  onRowClick,
}) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / rowsPerPage);
  const startIdx = (currentPage - 1) * rowsPerPage;
  const currentData = data.slice(startIdx, startIdx + rowsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  return (
    <section className="rounded-lg overflow-x-auto w-full bg-gray-50 p-1">
      {/* ===== HEADER ===== */}
      <table className="w-full table-fixed text-[12px] bg-white border-separate border-spacing-0">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th
                key={col.key}
                className={`px-4 py-3 font-medium text-black text-center whitespace-nowrap
                ${idx === 0 ? "rounded-tl-2xl" : ""}
                ${idx === columns.length - 1 ? "rounded-tr-2xl" : ""}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
      </table>

      <div className="h-2" />

      {/* ===== BODY ===== */}
      <table className="w-full table-fixed bg-white border-separate border-spacing-0 rounded-lg overflow-hidden">
        <tbody className="text-gray-800">
          {currentData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center py-10 text-gray-400"
              >
                No Data Found
              </td>
            </tr>
          ) : (
            currentData.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className="hover:bg-gray-50 cursor-pointer text-center"
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-4 py-4 truncate text-center text-[12px]"
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}

          {/* ===== PAGINATION ===== */}
          {data.length > 0 && (
            <tr>
              <td colSpan={columns.length}>
                <div className="flex justify-between items-center px-4 py-3 text-[12px]">
                  <span className="text-gray-500">
                    Showing {startIdx + 1}-
                    {Math.min(startIdx + rowsPerPage, data.length)} of{" "}
                    {data.length}
                  </span>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-2 border rounded disabled:opacity-30"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(p + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="p-2 border rounded disabled:opacity-30"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
