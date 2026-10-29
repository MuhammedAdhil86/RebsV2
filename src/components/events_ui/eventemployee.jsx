import React, { useState, useEffect, useMemo } from "react";
import { Icon } from "@iconify/react";
import announceService from "../../service/announceService";

/* ---------- Shared style tokens (same as EventCreate / EmployeeModal) ---------- */
const inputCls =
  "w-full bg-[#F8F9FA] text-gray-800 placeholder-gray-300 outline-none border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-normal focus:border-gray-300 focus:bg-white transition-all";
const sectionTitleCls =
  "text-[11px] font-normal text-gray-400 uppercase tracking-[0.2em]";

const DEFAULT_AVATAR = "/person_img.jpg";

const getDesignation = (employee) => {
  const d = employee?.designationname;
  if (d && typeof d === "object") return d.Valid ? d.String : "";
  return typeof d === "string" ? d : "";
};

const SkeletonRow = () => (
  <div className="flex items-center gap-3 p-3 rounded-2xl border border-gray-100 animate-pulse">
    <div className="w-10 h-10 rounded-full bg-gray-100" />
    <div className="flex-1 space-y-2">
      <div className="h-2.5 w-1/2 bg-gray-100 rounded" />
      <div className="h-2 w-1/3 bg-gray-100 rounded" />
    </div>
    <div className="w-5 h-5 rounded-md bg-gray-100" />
  </div>
);

const EventEmployee = ({
  onBack,
  selectedEmployees = [],
  onEmployeeToggle,
}) => {
  const [staffDetails, setStaffDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const response = await announceService.fetchStaff();
        if (!isMounted) return;
        setStaffDetails(Array.isArray(response?.data) ? response.data : []);
      } catch {
        if (isMounted) setLoadError("Failed to load employees");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  const filteredEmployees = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return staffDetails;
    return staffDetails.filter(
      (e) =>
        e.name?.toLowerCase().includes(q) ||
        getDesignation(e).toLowerCase().includes(q),
    );
  }, [staffDetails, searchTerm]);

  const selectedSet = useMemo(
    () => new Set(selectedEmployees),
    [selectedEmployees],
  );

  const allFilteredSelected =
    filteredEmployees.length > 0 &&
    filteredEmployees.every((e) => selectedSet.has(e.uuid));

  // Toggles only the rows that need to change, so it works with a per-item toggle handler
  const handleSelectAll = () => {
    filteredEmployees.forEach((e) => {
      const isSelected = selectedSet.has(e.uuid);
      if (allFilteredSelected ? isSelected : !isSelected) {
        onEmployeeToggle?.(e.uuid, e);
      }
    });
  };

  const handleClear = () => {
    staffDetails.forEach((e) => {
      if (selectedSet.has(e.uuid)) onEmployeeToggle?.(e.uuid, e);
    });
  };

  return (
    <div className="flex flex-col h-full font-poppins font-normal text-black">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pr-8">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="w-12 h-12 rounded-full bg-[#F8F9FA] hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
        >
          <Icon
            icon="solar:alt-arrow-left-outline"
            className="w-5 h-5 text-gray-600"
          />
        </button>
        <div className="min-w-0">
          <h2 className="text-lg font-normal text-gray-900 leading-tight">
            Choose Employees
          </h2>
          <p className="text-xs font-normal text-gray-400">
            Select who should attend this event
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Icon
          icon="solar:magnifer-outline"
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search by name or designation"
          className={`${inputCls} pl-10 pr-9`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm("")}
            aria-label="Clear search"
            className="absolute inset-y-0 right-3 flex items-center text-gray-300 hover:text-gray-600 transition-colors cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* List toolbar */}
      <div className="flex items-center justify-between mb-3">
        <h3 className={sectionTitleCls}>
          Employees{" "}
          <span className="text-gray-300">({filteredEmployees.length})</span>
        </h3>
        <div className="flex items-center gap-4 text-[10px] uppercase tracking-wide">
          <button
            type="button"
            onClick={handleSelectAll}
            disabled={loading || filteredEmployees.length === 0}
            className="text-gray-400 hover:text-black transition-colors disabled:opacity-40 disabled:hover:text-gray-400 cursor-pointer"
          >
            {allFilteredSelected ? "Deselect all" : "Select all"}
          </button>
          {selectedEmployees.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 overflow-y-auto -mr-2 pr-2 space-y-2 custom-scrollbar">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
        ) : loadError ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-xs text-red-500 tracking-wide">{loadError}</p>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="px-4 py-1.5 border border-gray-200 rounded-lg text-[10px] uppercase tracking-widest text-gray-600 hover:bg-gray-50 transition-all cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Icon
              icon="solar:users-group-rounded-outline"
              className="w-8 h-8 text-gray-200"
            />
            <p className="text-xs text-gray-400">No employees found</p>
          </div>
        ) : (
          filteredEmployees.map((employee) => {
            const isChecked = selectedSet.has(employee.uuid);
            const designation = getDesignation(employee);

            return (
              <div
                key={employee.uuid}
                role="checkbox"
                aria-checked={isChecked}
                tabIndex={0}
                onClick={() => onEmployeeToggle?.(employee.uuid, employee)}
                onKeyDown={(e) => {
                  if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    onEmployeeToggle?.(employee.uuid, employee);
                  }
                }}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer select-none outline-none focus-visible:border-gray-400 ${
                  isChecked
                    ? "border-gray-300 bg-[#F8F9FA]"
                    : "border-gray-100 bg-white hover:bg-[#F8F9FA]/60 hover:border-gray-200"
                }`}
              >
                <img
                  src={employee.imageUrl || DEFAULT_AVATAR}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = DEFAULT_AVATAR;
                  }}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover border border-gray-100 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-800 truncate">
                    {employee.name}
                  </p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide truncate mt-0.5">
                    {designation || "No designation"}
                  </p>
                </div>
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                    isChecked
                      ? "bg-black border-black"
                      : "bg-white border-gray-200"
                  }`}
                >
                  {isChecked && (
                    <Icon
                      icon="solar:check-read-linear"
                      className="w-3.5 h-3.5 text-white"
                    />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between gap-4">
        <span className="text-[10px] text-gray-400 uppercase tracking-widest">
          {selectedEmployees.length} selected
        </span>
        <button
          type="button"
          onClick={onBack}
          className="px-8 py-2.5 bg-black text-white rounded-xl text-[11px] uppercase tracking-widest hover:bg-gray-800 transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );
};

export default EventEmployee;
