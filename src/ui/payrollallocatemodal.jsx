import React, { useMemo } from "react";
import {
  X,
  Search,
  Loader2,
  CheckCircle2,
  Users,
  ChevronRight,
} from "lucide-react";

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
  if (!isOpen) return null;

  const filteredStaff = useMemo(() => {
    return staffList.filter((s) =>
      (s.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [staffList, searchQuery]);

  const isFormValid =
    formData.template_id && formData.from_date && formData.to_date;

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
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${step === 1 ? "bg-zinc-100 text-zinc-600" : "bg-black text-white"}`}
                >
                  Step {step} of 2
                </span>
                <span className="text-zinc-400 text-[10px] font-normal">
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
                    <select
                      className="w-full p-3 bg-white rounded-xl border border-zinc-200 outline-none focus:border-black transition-all cursor-pointer font-normal"
                      value={filterType}
                      onChange={(e) => handleFilterSelect(e.target.value, "")}
                    >
                      <option value="employee">
                        Manual Selection (Show All)
                      </option>
                      <option value="department">Filter by Department</option>
                      <option value="branch">Filter by Branch</option>
                    </select>
                  </div>

                  {filterType !== "employee" && (
                    <div className="space-y-1.5 animate-in slide-in-from-right-2">
                      <label className="text-[10px] text-zinc-500 uppercase tracking-widest ml-1 font-normal">
                        Select {filterType}
                      </label>
                      <select
                        className="w-full p-3 bg-white rounded-xl border border-black outline-none text-black font-normal"
                        value={
                          filterType === "department"
                            ? activeFilters.dept
                            : activeFilters.branch
                        }
                        onChange={(e) =>
                          handleFilterSelect(filterType, e.target.value)
                        }
                      >
                        <option value="">-- Choose Option --</option>
                        {(filterType === "department"
                          ? filters.departments
                          : filters.branches
                        ).map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
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
                    className="w-full pl-12 pr-4 py-3 bg-white border border-zinc-200 rounded-xl outline-none focus:border-black transition-all font-normal"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white border-b border-zinc-100 text-zinc-400 uppercase text-[10px] tracking-widest z-10 font-normal">
                    <tr>
                      <th className="p-5 w-12">
                        <input
                          type="checkbox"
                          className="accent-black w-4 h-4 rounded cursor-pointer"
                          onChange={(e) =>
                            setSelectedStaff(
                              e.target.checked
                                ? filteredStaff.map((s) => s.uuid || s.user_id)
                                : [],
                            )
                          }
                          checked={
                            selectedStaff.length === filteredStaff.length &&
                            filteredStaff.length > 0
                          }
                        />
                      </th>
                      <th className="p-5 font-normal">Staff Details</th>
                      <th className="p-5 text-right pr-10 font-normal">
                        Department
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {filteredStaff.map((staff) => {
                      const id = staff.uuid || staff.user_id;
                      const isSelected = selectedStaff.includes(id);
                      return (
                        <tr
                          key={id}
                          onClick={() =>
                            setSelectedStaff((prev) =>
                              isSelected
                                ? prev.filter((x) => x !== id)
                                : [...prev, id],
                            )
                          }
                          className={`hover:bg-zinc-50 transition-colors cursor-pointer ${isSelected ? "bg-zinc-100" : ""}`}
                        >
                          <td
                            className="p-5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              className="accent-black w-4 h-4 rounded"
                              checked={isSelected}
                              readOnly
                            />
                          </td>
                          <td className="p-5">
                            <div className="text-black text-[13px] font-normal">
                              {staff.full_name}
                            </div>
                            <div className="text-[11px] text-zinc-400 font-normal">
                              ID: {staff.employee_id || id.slice(0, 8)}
                            </div>
                          </td>
                          <td className="p-5 text-right pr-10 text-zinc-500 font-normal">
                            {staff.department_name || staff.department || "N/A"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-12 space-y-10 flex-1 flex flex-col justify-center bg-white animate-in slide-in-from-right-4">
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
                  <select
                    className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:border-black transition-all text-black font-normal"
                    value={formData.template_id}
                    onChange={(e) =>
                      setFormData({ ...formData, template_id: e.target.value })
                    }
                  >
                    <option value="">Select a template...</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2.5">
                    <label className="block text-zinc-400 uppercase text-[10px] tracking-widest ml-1 font-normal">
                      Start Date
                    </label>
                    <input
                      type="date"
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
          </div>

          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="px-6 py-3 text-zinc-500 hover:text-black transition-colors font-normal"
            >
              Cancel
            </button>
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
