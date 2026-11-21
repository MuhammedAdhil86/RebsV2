import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Icon } from "@iconify/react";

const labelClass =
  "text-[10px] text-black/40 uppercase tracking-widest block mb-1.5";

const useClickOutside = (ref, handler) => {
  useEffect(() => {
    const listener = (e) => {
      if (ref.current && !ref.current.contains(e.target)) handler();
    };
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, handler]);
};

/* DateField: custom calendar icon, whole field opens the picker
   props: label, value "YYYY-MM-DD", onChange(value), required, disabled, min, max */
export const DateField = ({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  min,
  max,
  name,
  className = "",
}) => (
  <div className={className}>
    {label && <label className={labelClass}>{label}</label>}
    <div className="relative">
      <input
        type="date"
        name={name}
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="relative w-full border border-black/10 rounded-xl pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:border-black transition-colors disabled:bg-gray-50
          [&::-webkit-calendar-picker-indicator]:absolute
          [&::-webkit-calendar-picker-indicator]:inset-0
          [&::-webkit-calendar-picker-indicator]:w-full
          [&::-webkit-calendar-picker-indicator]:h-full
          [&::-webkit-calendar-picker-indicator]:opacity-0
          [&::-webkit-calendar-picker-indicator]:cursor-pointer"
      />
      <Icon
        icon="solar:calendar-outline"
        className="w-4 h-4 text-black absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
      />
    </div>
  </div>
);

/* SelectField: single-select custom dropdown
   props: label, options [{ value, label }], value, onChange(value), placeholder, disabled */
export const SelectField = ({
  label,
  options = [],
  value,
  onChange,
  placeholder = "Select...",
  disabled = false,
  className = "",
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false));

  const selected = options.find((o) => String(o.value) === String(value));

  return (
    <div className={`relative ${className}`} ref={ref}>
      {label && <label className={labelClass}>{label}</label>}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="w-full border border-black/10 rounded-xl px-4 py-2.5 text-sm text-left bg-white focus:outline-none focus:border-black flex justify-between items-center select-none disabled:bg-gray-50"
      >
        <span
          className={`truncate pr-2 ${selected ? "text-black/80" : "text-black/40"}`}
        >
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`text-black/40 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-black/10 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto p-1.5 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
          {options.length === 0 && (
            <p className="px-3 py-2 text-xs text-black/40">No options</p>
          )}
          {options.map((o) => {
            const active = String(o.value) === String(value);
            return (
              <button
                type="button"
                key={o.value}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-xs text-left select-none hover:bg-black/[0.03] ${active ? "bg-black/[0.04] text-black" : "text-black/80"}`}
              >
                <span className="truncate">{o.label}</span>
                {active && <Check size={14} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
