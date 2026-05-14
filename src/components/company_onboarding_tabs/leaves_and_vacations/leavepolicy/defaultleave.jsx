import React, { useState } from "react";
import { createPortal } from "react-dom";
import PayrollTable from "../../../../ui/payrolltable";

const DefaultTemplatesTable = ({
  data = [],
  loading,
  selectedIds = [],
  setSelectedIds,
}) => {
  const [hoverData, setHoverData] = useState(null);

  // Selection Logic
  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = data?.map((item) => item.id) || [];
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // Tooltip Logic
  const handleMouseEnter = (event, text) => {
    if (!text || text.length <= 20) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setHoverData({
      text,
      top: rect.top + window.scrollY - 10,
      left: rect.left + window.scrollX + rect.width / 2,
    });
  };

  const handleMouseLeave = () => setHoverData(null);

  const columns = [
    {
      key: "name",
      label: (
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            className="w-4 h-4 accent-black cursor-pointer rounded border-gray-300"
            onChange={toggleSelectAll}
            checked={data?.length > 0 && selectedIds?.length === data?.length}
          />
          <span>Template Name</span>
        </div>
      ),
      align: "left", // Exact alignment like Shifts
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            className="w-4 h-4 accent-black cursor-pointer rounded border-gray-300"
            checked={selectedIds?.includes(row.id)}
            onChange={() => toggleSelectRow(row.id)}
            onClick={(e) => e.stopPropagation()} // Prevent row click trigger
          />
          <span className="truncate font-medium text-gray-900">{value}</span>
        </div>
      ),
    },
    {
      key: "code",
      label: "Code",
      align: "left",
    },
    {
      key: "leave_type",
      label: "Type",
      align: "center",
      render: (value) => (
        <span className="bg-[#F1F1F8] text-[#5A5A7D] px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
          {value?.replace("_", " ")}
        </span>
      ),
    },
    {
      key: "created_at",
      label: "Created Date",
      align: "center",
      render: (value) => {
        if (!value) return "—";
        const date = new Date(value);
        return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getFullYear()).slice(-2)}`;
      },
    },
    {
      key: "description",
      label: "Description",
      align: "left",
      render: (value) => {
        const text = value || "Standard system template";
        return (
          <div
            className="cursor-help inline-block"
            onMouseEnter={(e) => handleMouseEnter(e, text)}
            onMouseLeave={handleMouseLeave}
          >
            <span className="text-gray-400 truncate block max-w-[150px]">
              {text.length > 20 ? `${text.substring(0, 20)}...` : text}
            </span>
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      align: "center",
      render: (value) => (
        <span
          className={`px-3 py-1 rounded-full border text-[11px] font-medium ${
            value === "active"
              ? "bg-green-50 text-green-500 border-green-100"
              : "bg-gray-50 text-gray-400 border-gray-100"
          }`}
        >
          {value === "active" ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  if (loading)
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin mb-2" />
        <p className="text-gray-400 text-[12px] font-['Poppins']">
          Loading system templates...
        </p>
      </div>
    );

  return (
    <div className="w-full">
      <PayrollTable
        columns={columns}
        data={data || []}
        rowsPerPage={8}
        // We pass an empty function if we don't want row clicks to do anything
        // or a specific handler if needed.
        rowClickHandler={(row) => toggleSelectRow(row.id)}
      />

      {hoverData &&
        createPortal(
          <div
            style={{
              position: "absolute",
              top: hoverData.top,
              left: hoverData.left,
              transform: "translate(-50%, -100%)",
              zIndex: 1000000,
              pointerEvents: "none",
            }}
            className="px-4 py-2 bg-zinc-900 text-white text-[11px] rounded-lg shadow-2xl w-max max-w-[280px] text-center font-['Poppins'] leading-relaxed"
          >
            {hoverData.text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-zinc-900"></div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default DefaultTemplatesTable;
