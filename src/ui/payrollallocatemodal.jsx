import React, { useMemo, useRef, useEffect, useState } from "react";
import {
  X,
  Search,
  Loader2,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Check,
  AlertTriangle,
} from "lucide-react";
import { Icon } from "@iconify/react";
import GlowButton from "../components/helpers/glowbutton";
/* ------------------------------------------------------------------ */
/* Shared look (same as the Apply Admin Leave modal):                  */
/* 12px text, p-3 fields, rounded-2xl, gray-700 medium labels.         */
/* ------------------------------------------------------------------ */
const labelClass = "block mb-1 font-medium text-gray-700";

const DateField = ({ label, value, onChange, min, max, disabled = false }) => (
  <div>
    {label && <label className={labelClass}>{label}</label>}
    <div className="relative">
      <input
        type="date"
        min={min}
        max={max}
        disabled={disabled}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="relative w-full border p-3 pr-10 rounded-2xl disabled:bg-gray-50 disabled:text-gray-400
          [&::-webkit-calendar-picker-indicator]:absolute
          [&::-webkit-calendar-picker-indicator]:inset-0
          [&::-webkit-calendar-picker-indicator]:w-full
          [&::-webkit-calendar-picker-indicator]:h-full
          [&::-webkit-calendar-picker-indicator]:opacity-0
          [&::-webkit-calendar-picker-indicator]:cursor-pointer"
      />
      <Icon
        icon="solar:calendar-outline"
        className="w-4 h-4 text-gray-700 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
      />
    </div>
  </div>
);

const SelectField = ({
  label,
  options = [],
  value,
  onChange,
  placeholder = "Select...",
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => String(o.value) === String(value));

  return (
    <div className="relative" ref={ref}>
      {label && <label className={labelClass}>{label}</label>}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="w-full border p-3 rounded-2xl text-left bg-white flex justify-between items-center select-none disabled:bg-gray-50 disabled:text-gray-400"
      >
        <span
          className={`truncate pr-2 ${selected ? "text-gray-900" : "text-gray-400"}`}
        >
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-2xl shadow-xl z-20 max-h-[180px] overflow-y-auto p-2 space-y-1">
          {options.length === 0 && (
            <div className="p-3 text-center text-gray-400">No options</div>
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
                className={`w-full flex items-center justify-between gap-2 p-2 rounded-lg text-left transition-colors hover:bg-gray-50 ${
                  active ? "bg-gray-50" : ""
                }`}
              >
                <span className="font-medium text-gray-800 truncate">
                  {o.label}
                </span>
                {active && <Check size={14} className="flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("") || "?";

const FILTER_MODE_OPTIONS = [
  { value: "employee", label: "Manual Selection (Show All)" },
  { value: "department", label: "Filter by Department" },
  { value: "branch", label: "Filter by Branch" },
];

const BANK_NOTICE =
  "Payroll can still be processed, but some employee payment details may be missing due to incomplete bank information. Please update the required bank details to ensure accurate and complete payroll processing.";

// Glow animation (soft pulse). Disabled when the user prefers reduced motion.
const GLOW_STYLES = `
@keyframes bank-text-glow {
  0%, 100% {
    text-shadow: 0 0 2px rgba(245, 158, 11, 0.25), 0 0 6px rgba(245, 158, 11, 0.25);
  }
  50% {
    text-shadow: 0 0 4px rgba(245, 158, 11, 0.6), 0 0 12px rgba(245, 158, 11, 0.55), 0 0 20px rgba(245, 158, 11, 0.35);
  }
}
@keyframes bank-icon-glow {
  0%, 100% { filter: drop-shadow(0 0 2px rgba(245, 158, 11, 0.4)); }
  50% { filter: drop-shadow(0 0 7px rgba(245, 158, 11, 0.9)); }
}
.bank-glow-text { animation: bank-text-glow 2.2s ease-in-out infinite; }
.bank-glow-icon { animation: bank-icon-glow 2.2s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .bank-glow-text, .bank-glow-icon { animation: none; }
  .bank-glow-text { text-shadow: 0 0 6px rgba(245, 158, 11, 0.4); }
}
`;

const AllocatePayrollModal = ({
  isOpen,
  onClose,
  step,
  setStep,
  loading,
  staffList = [],
  templates = [],
  filters,
  selectedStaff,
  setSelectedStaff,
  searchQuery,
  setSearchQuery,
  filterType,
  handleFilterSelect,
  activeFilters,
  formData,
  setFormData,
  onSubmit,
}) => {
  const selectAllRef = useRef(null);

  // Hooks must run on every render, so this stays ABOVE the early return
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) =>
      (s.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [staffList, searchQuery]);

  const filteredIds = useMemo(
    () => filteredStaff.map((s) => s.uuid || s.user_id),
    [filteredStaff],
  );

  const selectedInViewCount = filteredIds.filter((id) =>
    selectedStaff.includes(id),
  ).length;
  const allSelected =
    filteredIds.length > 0 && selectedInViewCount === filteredIds.length;
  const someSelected = selectedInViewCount > 0 && !allSelected;

  // Indeterminate state for the "select all" checkbox
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someSelected;
  }, [someSelected, isOpen, step]);

  if (!isOpen) return null;

  const isFormValid =
    formData.template_id && formData.from_date && formData.to_date;

  const toggleStaff = (id) =>
    setSelectedStaff((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const toggleAll = (checked) => {
    if (checked) {
      // add everything visible, keep selections made under other filters
      setSelectedStaff((prev) =>
        Array.from(new Set([...prev, ...filteredIds])),
      );
    } else {
      setSelectedStaff((prev) =>
        prev.filter((id) => !filteredIds.includes(id)),
      );
    }
  };

  const filterOptions =
    filterType === "department"
      ? filters?.departments || []
      : filters?.branches || [];

  const filterSelectOptions = filterOptions.map((item) => ({
    value: item.id,
    label: item.name,
  }));

  const templateOptions = templates.map((t) => ({
    value: t.id,
    label: t.name,
  }));

  const selectedTemplate = templates.find(
    (t) => String(t.id) === String(formData.template_id),
  );

  const todayKey = new Date(
    new Date().getTime() - new Date().getTimezoneOffset() * 60000,
  )
    .toISOString()
    .slice(0, 10);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm font-poppins text-[12px]">
      <style>{GLOW_STYLES}</style>

      <div className="bg-white w-[95%] max-w-[720px] h-[640px] max-h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border border-white/20">
        {/* --- Header --- */}
        <div className="px-8 py-5 flex items-center justify-between border-b border-gray-50 bg-white shrink-0">
          <div>
            <h2 className="text-gray-900 text-[16px] font-medium uppercase">
              Bulk Payroll Allocation
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex items-center gap-1">
                {[1, 2].map((n) => (
                  <span
                    key={n}
                    className={`h-1.5 rounded-full transition-all ${
                      n === step ? "w-6 bg-black" : "w-1.5 bg-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-gray-400 text-[10px]">
                Step {step} of 2 ·{" "}
                {step === 1 ? "Select Employees" : "Configure Terms"}
              </span>
            </div>
          </div>
          <button type="button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* --- Bank details notice (always visible, both steps) --- */}
        <div
          role="note"
          className="shrink-0 flex items-start gap-3 px-8 py-3 bg-amber-50 border-b border-amber-200"
        >
          <AlertTriangle
            size={18}
            className="bank-glow-icon text-amber-500 shrink-0 mt-0.5"
          />
          <p className="bank-glow-text text-[11px] leading-relaxed text-amber-700">
            {BANK_NOTICE}
          </p>
        </div>

        {/* --- Content Area --- */}
        <div className="flex-1 overflow-hidden">
          {step === 1 ? (
            <div className="flex flex-col h-full">
              <div className="px-8 py-4 border-b border-gray-50 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <SelectField
                    label="Selection Mode"
                    options={FILTER_MODE_OPTIONS}
                    value={filterType}
                    onChange={(val) => handleFilterSelect(val, "")}
                  />

                  {filterType !== "employee" && (
                    <SelectField
                      label={`Select ${
                        filterType === "department" ? "Department" : "Branch"
                      }`}
                      placeholder="Choose option"
                      options={filterSelectOptions}
                      value={
                        filterType === "department"
                          ? activeFilters.dept
                          : activeFilters.branch
                      }
                      onChange={(val) => handleFilterSelect(filterType, val)}
                    />
                  )}
                </div>

                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="Search staff by name or ID..."
                    className="w-full pl-9 pr-10 border p-3 rounded-2xl"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-black hover:bg-gray-100"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white border-b border-gray-100 text-gray-400 uppercase text-[10px] tracking-wide z-10">
                    <tr>
                      <th className="p-3 w-12">
                        <input
                          ref={selectAllRef}
                          type="checkbox"
                          className="accent-black w-4 h-4 rounded cursor-pointer"
                          onChange={(e) => toggleAll(e.target.checked)}
                          checked={allSelected}
                          title="Select all"
                        />
                      </th>
                      <th className="p-3 font-medium">
                        Staff Details
                        {filteredIds.length > 0 && (
                          <span className="ml-2 normal-case tracking-normal text-gray-400">
                            ({selectedInViewCount}/{filteredIds.length})
                          </span>
                        )}
                      </th>
                      <th className="p-3 text-right pr-4 font-medium">
                        Department
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                      <tr>
                        <td colSpan={3} className="p-10 text-center">
                          <Loader2
                            className="animate-spin text-black inline-block"
                            size={20}
                          />
                        </td>
                      </tr>
                    ) : filteredStaff.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="p-10 text-center text-gray-400"
                        >
                          No employees found
                        </td>
                      </tr>
                    ) : (
                      filteredStaff.map((staff) => {
                        const id = staff.uuid || staff.user_id;
                        const isSelected = selectedStaff.includes(id);
                        return (
                          <tr
                            key={id}
                            onClick={() => toggleStaff(id)}
                            className={`transition-colors cursor-pointer select-none ${
                              isSelected ? "bg-gray-50" : "hover:bg-gray-50"
                            }`}
                          >
                            <td
                              className="p-3"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                className="accent-black w-4 h-4 rounded cursor-pointer"
                                checked={isSelected}
                                onChange={() => toggleStaff(id)}
                              />
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`h-8 w-8 rounded-full flex items-center justify-center text-[11px] shrink-0 transition-colors ${
                                    isSelected
                                      ? "bg-black text-white"
                                      : "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  {isSelected ? (
                                    <Check size={14} />
                                  ) : (
                                    getInitials(staff.full_name)
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-800">
                                    {staff.full_name}
                                  </div>
                                  <div className="text-[10px] text-gray-400">
                                    ID:{" "}
                                    {staff.employee_id ||
                                      String(id).slice(0, 8)}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-right pr-4">
                              <span className="inline-block px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-[10px]">
                                {staff.department_name ||
                                  staff.department ||
                                  "N/A"}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="px-8 py-6 h-full overflow-y-auto space-y-5">
              <div className="bg-black p-5 rounded-2xl flex items-center gap-4 text-white">
                <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center">
                  <CheckCircle2 className="text-white" size={26} />
                </div>
                <div>
                  <h4 className="text-[16px] font-medium">
                    {selectedStaff.length} Employees Ready
                  </h4>
                  <p className="text-gray-400 text-[10px] mt-0.5 uppercase tracking-wide">
                    Confirm configuration terms
                  </p>
                </div>
              </div>

              <div>
                <SelectField
                  label="Salary Template"
                  placeholder="Select a template..."
                  options={templateOptions}
                  value={formData.template_id}
                  onChange={(val) =>
                    setFormData({ ...formData, template_id: val })
                  }
                />
                {selectedTemplate && (
                  <p className="mt-1 text-[10px] text-gray-400">
                    Using: {selectedTemplate.name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <DateField
                  label="Start Date"
                  min={todayKey}
                  value={formData.from_date}
                  onChange={(v) => setFormData({ ...formData, from_date: v })}
                />
                <DateField
                  label="End Date"
                  min={formData.from_date || undefined}
                  value={formData.to_date}
                  onChange={(v) => setFormData({ ...formData, to_date: v })}
                />
              </div>
            </div>
          )}
        </div>

        {/* --- Footer --- */}
        <div className="px-8 py-4 border-t border-gray-50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-black animate-pulse" />
            <span className="text-gray-900 uppercase tracking-wide font-medium">
              {selectedStaff.length} Selected
            </span>
            {step === 1 && selectedStaff.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedStaff([])}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {step === 2 ? (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center gap-1"
              >
                <ChevronLeft size={16} /> Back
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            )}

            {step === 1 ? (
              <GlowButton
                onClick={() => setStep(2)}
                disabled={selectedStaff.length === 0}
              >
                <span className="flex items-center gap-1">
                  Next Step <ChevronRight size={16} />
                </span>
              </GlowButton>
            ) : (
              <GlowButton onClick={onSubmit} disabled={!isFormValid || loading}>
                {loading ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  "Confirm Allocation"
                )}
              </GlowButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllocatePayrollModal;
