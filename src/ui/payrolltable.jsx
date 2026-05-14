import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function PayrollTable({
  columns = [],
  data = [],
  rowsPerPage = 6,
  rowClickHandler,
  searchTerm = "",
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [colWidths, setColWidths] = useState([]);
  const [tableData, setTableData] = useState([]);
  const headerRef = useRef(null);

  // ✅ Normalize data (important fix)
  useEffect(() => {
    if (Array.isArray(data)) {
      setTableData(data);
    } else if (Array.isArray(data?.data)) {
      setTableData(data.data);
    } else {
      setTableData([]);
    }
  }, [data]);

  // ✅ Filter safely
  const filteredData = tableData.filter((row) => {
    const term = (searchTerm || "").toLowerCase();
    return (columns || []).some((col) => {
      const value = row?.[col.key];
      return value?.toString()?.toLowerCase()?.includes(term);
    });
  });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIdx = (currentPage - 1) * rowsPerPage;
  const endIdx = startIdx + rowsPerPage;
  const currentData = filteredData.slice(startIdx, endIdx);

  // Calculate column widths
  useEffect(() => {
    if (headerRef.current) {
      const widths = Array.from(headerRef.current.querySelectorAll("th")).map(
        (th) => th.offsetWidth,
      );
      setColWidths(widths);
    }
  }, [tableData, searchTerm, columns]);

  return (
    <section className="rounded-lg overflow-x-auto relative w-full bg-gray-50">
      {/* ===== HEADER TABLE ===== */}
      <table
        ref={headerRef}
        className="w-full min-w-[600px] text-[12px] bg-white border-separate border-spacing-0 overflow-hidden"
      >
        <thead className="bg-white text-black text-[12.5px]">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={col.key}
                className={`px-4 py-3 font-medium text-black text-center whitespace-nowrap align-middle
                ${
                  idx === 0
                    ? "rounded-tl-2xl"
                    : idx === columns.length - 1
                      ? "rounded-tr-2xl"
                      : ""
                }`}
                style={{
                  width: colWidths[idx]
                    ? `${colWidths[idx]}px`
                    : col.width
                      ? `${col.width}px`
                      : "auto",
                  textAlign: col.align || "center",
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
      </table>

      <div className="h-2" />

      {/* ===== BODY TABLE ===== */}
      <table className="w-full min-w-[600px] bg-white border-separate border-spacing-0 rounded-lg overflow-hidden">
        <tbody className="text-gray-800">
          {currentData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center py-4 text-gray-500 border-b border-gray-300"
              >
                No Data Found
              </td>
            </tr>
          ) : (
            currentData.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className={`hover:bg-gray-50 text-center border-b border-gray-300 ${
                  rowClickHandler ? "cursor-pointer" : ""
                }`}
                onClick={() => rowClickHandler && rowClickHandler(row)}
              >
                {columns.map((col, colIdx) => {
                  const value = row[col.key];
                  return (
                    <td
                      key={col.key}
                      data-label={col.label}
                      className="px-4 py-4 truncate text-center align-middle relative text-[12px] border-b border-[#f9fafb]"
                      style={{
                        width: colWidths[colIdx]
                          ? `${colWidths[colIdx]}px`
                          : col.width
                            ? `${col.width}px`
                            : "auto",
                        textAlign: col.align || "center",
                      }}
                    >
                      {col.render ? col.render(value, row, rowIdx) : value}
                    </td>
                  );
                })}
              </tr>
            ))
          )}

          {/* ===== PAGINATION ===== */}
          {filteredData.length > 0 && (
            <tr>
              <td colSpan={columns.length}>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2 px-4 py-3 text-[12.5px]">
                  <span className="text-gray-500">
                    Showing {startIdx + 1}-
                    {Math.min(endIdx, filteredData.length)} of{" "}
                    {filteredData.length}
                  </span>

                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        currentPage > 1 && setCurrentPage(currentPage - 1)
                      }
                      disabled={currentPage === 1}
                      className="p-2 rounded disabled:opacity-50 hover:bg-gray-300"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() =>
                        currentPage < totalPages &&
                        setCurrentPage(currentPage + 1)
                      }
                      disabled={currentPage === totalPages}
                      className="p-2 rounded disabled:opacity-50 hover:bg-gray-300"
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
