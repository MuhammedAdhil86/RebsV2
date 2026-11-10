import React, { useMemo, useRef, useEffect } from "react";
import {
  X,
  Search,
  Loader2,
  CheckCircle2,
  Users,
  ChevronRight,
  ChevronLeft,
  Check,
} from "lucide-react";
import CustomSelect from "../ui/customselect";

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

  const filterSelectOptions = [
    { value: "", label: "-- Choose Option --" },
    ...filterOptions.map((item) => ({ value: item.id, label: item.name })),
  ];

  const templateOptions = [
    { value: "", label: "Select a template..." },
    ...templates.map((t) => ({ value: t.id, label: t.name })),
  ];

  const selectedTemplate = templates.find(
    (t) => String(t.id) === String(formData.template_id),
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm font-poppins font-normal text-[12px] p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl h-[640px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-zinc-200">
        {/* --- Header --- */}
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-black rounded-2xl text-white">
              <Users size={22} />
            </div>
            <div>
              <h2 className="text-[16px] text-black leading-tight font-normal">
                Bulk Payroll Allocation
              </h2>
              <div className="flex items-center gap-2 mt-1">
                {/* step indicator */}
                <div className="flex items-center gap-1">
                  {[1, 2].map((n) => (
                    <span
                      key={n}
                      className={`h-1.5 rounded-full transition-all ${
                        n === step ? "w-6 bg-black" : "w-1.5 bg-zinc-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-zinc-400 text-[10px] font-normal">
                  Step {step} of 2 ·{" "}
                  {step === 1 ? "Select Employees" : "Configure Terms"}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-400 hover:text-black"
          >
            <X size={24} />
          </button>
        </div>

        {/* --- Content Area --- */}
        <div className="flex-1 overflow-hidden">
          {step === 1 ? (
            <div className="flex flex-col h-full">
              <div className="p-5 bg-zinc-50 border-b border-zinc-100 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-500 uppercase tracking-widest ml-1 font-normal">
                      Selection Mode
                    </label>
                    <CustomSelect
                      fullWidth
                      className="bg-white py-3 rounded-xl border-zinc-200"
                      value={filterType}
                      options={FILTER_MODE_OPTIONS}
                      onChange={(val) => handleFilterSelect(val, "")}
                    />
                  </div>

                  {filterType !== "employee" && (
                    <div className="space-y-1.5 animate-in slide-in-from-right-2">
                      <label className="text-[10px] text-zinc-500 uppercase tracking-widest ml-1 font-normal">
                        Select {filterType}
                      </label>
                      <CustomSelect
                        fullWidth
                        className="bg-white py-3 border-black text-black"
                        value={
                          filterType === "department"
                            ? activeFilters.dept
                            : activeFilters.branch
                        }
                        options={filterSelectOptions}
                        onChange={(val) => handleFilterSelect(filterType, val)}
                      />
                    </div>
                  )}
                </div>

                <div className="relative group">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="Search staff by name or ID..."
                    className="w-full pl-12 pr-10 py-3 bg-white border border-zinc-200 rounded-xl outline-none focus:border-black transition-all font-normal"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-zinc-400 hover:text-black hover:bg-zinc-100"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white border-b border-zinc-100 text-zinc-400 uppercase text-[10px] tracking-widest z-10 font-normal">
                    <tr>
                      <th className="p-5 w-12">
                        <input
                          ref={selectAllRef}
                          type="checkbox"
                          className="accent-black w-4 h-4 rounded cursor-pointer"
                          onChange={(e) => toggleAll(e.target.checked)}
                          checked={allSelected}
                          title="Select all"
                        />
                      </th>
                      <th className="p-5 font-normal">
                        Staff Details
                        {filteredIds.length > 0 && (
                          <span className="ml-2 normal-case tracking-normal text-zinc-400">
                            ({selectedInViewCount}/{filteredIds.length})
                          </span>
                        )}
                      </th>
                      <th className="p-5 text-right pr-10 font-normal">
                        Department
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {loading ? (
                      <tr>
                        <td colSpan={3} className="p-10 text-center">
                          <Loader2
                            className="animate-spin text-black inline-block"
                            size={22}
                          />
                        </td>
                      </tr>
                    ) : filteredStaff.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="p-10 text-center text-zinc-400"
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
                              isSelected
                                ? "bg-zinc-100 hover:bg-zinc-100"
                                : "hover:bg-zinc-50"
                            }`}
                          >
                            <td
                              className={`p-5 border-l-2 ${
                                isSelected
                                  ? "border-black"
                                  : "border-transparent"
                              }`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                className="accent-black w-4 h-4 rounded cursor-pointer"
                                checked={isSelected}
                                onChange={() => toggleStaff(id)}
                              />
                            </td>
                            <td className="p-5">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`h-9 w-9 rounded-full flex items-center justify-center text-[11px] shrink-0 transition-colors ${
                                    isSelected
                                      ? "bg-black text-white"
                                      : "bg-zinc-100 text-zinc-600"
                                  }`}
                                >
                                  {isSelected ? (
                                    <Check size={14} />
                                  ) : (
                                    getInitials(staff.full_name)
                                  )}
                                </div>
                                <div>
                                  <div className="text-black text-[13px] font-normal">
                                    {staff.full_name}
                                  </div>
                                  <div className="text-[11px] text-zinc-400 font-normal">
                                    ID:{" "}
                                    {staff.employee_id ||
                                      String(id).slice(0, 8)}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-5 text-right pr-10">
                              <span className="inline-block px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-500 text-[11px]">
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
            <div className="p-12 space-y-10 flex-1 h-full flex flex-col justify-center bg-white animate-in slide-in-from-right-4">
              <div className="bg-black p-8 rounded-3xl flex items-center gap-6 text-white shadow-2xl shadow-zinc-200">
                <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center">
                  <CheckCircle2 className="text-white" size={36} />
                </div>
                <div>
                  <h4 className="text-[18px] tracking-tight font-normal">
                    {selectedStaff.length} Employees Ready
                  </h4>
                  <p className="text-zinc-400 text-[11px] mt-1 uppercase tracking-widest font-normal">
                    Confirm configuration terms
                  </p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-2.5">
                  <label className="block text-zinc-400 uppercase text-[10px] tracking-widest ml-1 font-normal">
                    Salary Template
                  </label>
                  <CustomSelect
                    fullWidth
                    className="bg-zinc-50 py-4 rounded-2xl border-zinc-200 text-black text-[12px]"
                    value={formData.template_id}
                    options={templateOptions}
                    onChange={(val) =>
                      setFormData({ ...formData, template_id: val })
                    }
                  />
                  {selectedTemplate && (
                    <p className="ml-1 text-[11px] text-zinc-400">
                      Using: {selectedTemplate.name}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2.5">
                    <label className="block text-zinc-400 uppercase text-[10px] tracking-widest ml-1 font-normal">
                      Start Date
                    </label>
                    <input
                      type="date"
                      min={new Date(
                        new Date().getTime() -
                          new Date().getTimezoneOffset() * 60000,
                      )
                        .toISOString()
                        .slice(0, 10)}
                      className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:border-black transition-all font-normal"
                      value={formData.from_date}
                      onChange={(e) =>
                        setFormData({ ...formData, from_date: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2.5">
                    <label className="block text-zinc-400 uppercase text-[10px] tracking-widest ml-1 font-normal">
                      End Date
                    </label>
                    <input
                      type="date"
                      min={formData.from_date || undefined}
                      className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:border-black transition-all font-normal"
                      value={formData.to_date}
                      onChange={(e) =>
                        setFormData({ ...formData, to_date: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* --- Footer --- */}
        <div className="p-6 border-t border-zinc-100 bg-zinc-50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-black animate-pulse" />
            <span className="text-black uppercase tracking-widest text-[11px] font-normal">
              {selectedStaff.length} SELECTED
            </span>
            {step === 1 && selectedStaff.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedStaff([])}
                className="text-[11px] text-zinc-400 hover:text-black underline underline-offset-2 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex gap-4">
            {step === 2 ? (
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 text-zinc-500 hover:text-black transition-colors flex items-center gap-1 font-normal"
              >
                <ChevronLeft size={16} /> Back
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-6 py-3 text-zinc-500 hover:text-black transition-colors font-normal"
              >
                Cancel
              </button>
            )}
            {step === 1 ? (
              <button
                disabled={selectedStaff.length === 0}
                onClick={() => setStep(2)}
                className="px-10 py-3 bg-black text-white rounded-2xl disabled:opacity-20 hover:bg-zinc-800 flex items-center gap-2 transition-all active:scale-95 shadow-lg font-normal"
              >
                Next Step <ChevronRight size={16} />
              </button>
            ) : (
              <button
                disabled={!isFormValid || loading}
                onClick={onSubmit}
                className="px-10 py-3 bg-black text-white rounded-2xl hover:bg-zinc-800 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-20 shadow-lg font-normal"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  "Confirm Allocation"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllocatePayrollModal;
