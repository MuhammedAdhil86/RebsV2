import React from "react";

export default function CustomSelect({
  label,
  value,
  options,
  onChange,
  minWidth = 120,
}) {
  // Compute width based on the longest option
  const longestOptionLength = Math.max(
    ...options.map((opt) => (opt.label ?? opt).toString().length),
  );

  // width in ch + padding, then min-width in px fallback
  const widthCh = Math.max(longestOptionLength + 4, 8); // 8ch min

  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-xs whitespace-nowrap">{label}:</span>}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none border px-3 py-2 text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-black "
          style={{
            width: `${widthCh}ch`,
            minWidth: `${minWidth}px`,
            borderRadius: "6px", // ✅ options box radius
          }}
        >
          {options.map((opt, index) => (
            <option
              key={opt.value ?? opt}
              value={opt.value ?? opt}
              style={{
                borderBottom: "1px solid #e5e7eb", // ✅ every option border bottom
                padding: "8px",
              }}
            >
              {opt.label ?? opt}
            </option>
          ))}
        </select>

        <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
          <svg
            className="w-3 h-3 text-gray-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
