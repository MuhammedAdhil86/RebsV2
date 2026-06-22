import React, { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  FiSearch,
  FiCalendar,
  FiCheckCircle,
  FiUsers,
  FiLayers,
  FiBriefcase,
  FiCheck,
  FiMapPin,
  FiGrid,
} from "react-icons/fi";
import { ChevronDown, RefreshCw } from "lucide-react";

// API Services
import {
  getAllStaff,
  filterStaff,
  getDepartmentData,
  getBranchData,
  getDesignationData,
  getShiftList,
} from "../../service/staffservice";
import { allocateShiftBulkUpsert } from "../../service/companyService";
import axiosInstance from "../../service/axiosinstance";

// Decoupled Sub-View Component Import
import ShiftCalendarView from "./shiftoverview/shiftcalenderview";

export const fetchShiftAllocationsforSwap = async (extraParams = {}) => {
  try {
    const response = await axiosInstance.get("/shifts/effective-allocations", {
      params: extraParams,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch shift allocations inside service:", error);
    throw error;
  }
};

const ShiftBulkAllocation = () => {
  /* ================= STATE ================= */
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter States
  const [filterType, setFilterType] = useState("employee");
  const [filterOptions, setFilterOptions] = useState([]);
  const [selectedFilterId, setSelectedFilterId] = useState("");

  // Shift & Policy States
  const [shifts, setShifts] = useState([]);
  const [selectedShift, setSelectedShift] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Full Screen Calendar Mode States
  const [viewCalendarMode, setViewCalendarMode] = useState(false);
  const [calendarAllocations, setCalendarAllocations] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [departmentsList, setDepartmentsList] = useState([]);

  // Custom Filters for the Shift Calendar Sub-View Component
  const [calMonth, setCalMonth] = useState("2026-06");
  const [calUserId, setCalUserId] = useState("");
  const [calDeptId, setCalDeptId] = useState("");

  /* ================= API ACTIONS ================= */
  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const shiftRes = await getShiftList();
      setShifts(Array.isArray(shiftRes) ? shiftRes : shiftRes?.data || []);

      const staffRes = await getAllStaff();
      const staffList = Array.isArray(staffRes)
        ? staffRes
        : staffRes?.data || [];
      setUsers(staffList);

      const deptRes = await getDepartmentData();
      setDepartmentsList(
        Array.isArray(deptRes) ? deptRes : deptRes?.data || [],
      );
    } catch (error) {
      console.error("Initialization error:", error);
      toast.error("Failed to load initial data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleLoadCalendarAllocations = async () => {
    setCalendarLoading(true);
    try {
      const extraParams = { month: calMonth };
      if (calDeptId) extraParams.department = calDeptId;

      const res = await fetchShiftAllocationsforSwap(extraParams);
      const shiftData = Array.isArray(res) ? res : res?.data || [];

      const userGroups = {};
      shiftData.forEach((item) => {
        const uid = item.user_id;

        if (!userGroups[uid]) {
          const matchedStaffObj = users.find(
            (u) =>
              String(u.id) === String(uid) || String(u.user_id) === String(uid),
          );

          userGroups[uid] = {
            user_id: uid,
            full_name:
              matchedStaffObj?.full_name ||
              matchedStaffObj?.name ||
              item.employee_name ||
              `ID: ${uid}`,
            shifts: Array.from({ length: 31 }, () => ({ type: "off" })),
          };
        }

        const dayIndex = new Date(item.date).getDate() - 1;
        if (dayIndex >= 0 && dayIndex < 31) {
          userGroups[uid].shifts[dayIndex] = {
            type: "work",
            name: item.shift_name || "Work",
            in: item.is_cross_shift ? "Night" : "Regular",
            out: item.shift_id,
          };
        }
      });

      setCalendarAllocations(Object.values(userGroups));
    } catch (err) {
      toast.error("Failed to load shift allocations");
    } finally {
      setCalendarLoading(false);
    }
  };

  useEffect(() => {
    if (viewCalendarMode) {
      handleLoadCalendarAllocations();
    }
  }, [viewCalendarMode, calMonth, calDeptId, users]);

  /* ================= HANDLERS ================= */
  const handleFilterTypeChange = async (type) => {
    setFilterType(type);
    setSelectedFilterId("");
    setFilterOptions([]);

    if (type === "employee") {
      setSelectedUsers([]);
      return;
    }

    if (type === "all") {
      setSelectedUsers(users.map((u) => u.uuid));
      toast.success(`Selected all ${users.length} employees`);
      return;
    }

    setSelectedUsers([]);
    let data = [];
    if (type === "department") data = await getDepartmentData();
    if (type === "designation") data = await getDesignationData();
    if (type === "branch") data = await getBranchData();
    setFilterOptions(Array.isArray(data) ? data : data?.data || []);
  };

  const handleFilterSelect = async (id) => {
    setSelectedFilterId(id);
    if (!id) return;

    setLoading(true);
    let params = {};
    if (filterType === "department") params.department_id = id;
    if (filterType === "designation") params.designation_id = id;
    if (filterType === "branch") params.branch_id = id;

    try {
      const data = await filterStaff(params);
      const filteredList = Array.isArray(data) ? data : data?.data || [];
      setSelectedUsers(filteredList.map((u) => u.uuid));
    } finally {
      setLoading(false);
    }
  };

  const handleAllocate = async () => {
    if (!selectedShift || selectedUsers.length === 0 || !fromDate || !toDate) {
      return toast.error("Please select shift, staff, and dates");
    }

    const payload = {
      shift_id: Number(selectedShift),
      staff_ids: selectedUsers,
      from_date: `${fromDate}T00:00:00Z`,
      to_date: `${toDate}T00:00:00Z`,
    };

    const allocationPromise = allocateShiftBulkUpsert(payload);
    toast.promise(allocationPromise, {
      loading: "Allocating shifts...",
      success: () => {
        fetchInitialData();
        return "Shifts allocated successfully!";
      },
      error: (err) => `Error: ${err.response?.data?.message || "Failed"}`,
    });
  };

  const toggleUserSelection = (uuid) => {
    setSelectedUsers((prev) =>
      prev.includes(uuid) ? prev.filter((u) => u !== uuid) : [...prev, uuid],
    );
  };

  const filteredUsers = users.filter((u) =>
    (u.full_name || u.name)?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="w-full  bg-slate-50/70 p-6 font-poppins text-gray-800 antialiased font-normal">
      <Toaster position="top-right" />

      {viewCalendarMode ? (
        <ShiftCalendarView
          onBack={() => setViewCalendarMode(false)}
          calendarAllocations={calendarAllocations}
          calendarLoading={calendarLoading}
          departmentsList={departmentsList}
          calMonth={calMonth}
          setCalMonth={setCalMonth}
          calUserId={calUserId}
          setCalUserId={setCalUserId}
          calDeptId={calDeptId}
          setCalDeptId={setCalDeptId}
          users={users}
        />
      ) : (
        <>
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-xl text-gray-900 font-normal tracking-tight">
                Bulk Shift Allocation
              </h1>
              <p className="text-xs text-gray-500 mt-0.5 font-normal">
                Configure schedules and assign shifts to teams efficiently.
              </p>
            </div>
            <button
              onClick={fetchInitialData}
              className="inline-flex items-center gap-1.5 self-start px-3 py-1.5 text-xs font-normal text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              Refresh Data
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 max-w-[1600px] mx-auto items-start">
            {/* --- LEFT PANEL: CONFIGURATION --- */}
            <div className="w-full lg:w-[320px] shrink-0 space-y-6">
              <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-5 space-y-5">
                <div className="border-b border-gray-100 pb-3">
                  <h2 className="text-sm text-gray-900 flex items-center gap-2 font-normal">
                    <span className="p-1.5 bg-slate-100 rounded-lg text-gray-600">
                      <FiCalendar size={14} />
                    </span>
                    1. Shift & Schedule
                  </h2>
                </div>

                <div className="relative">
                  <label className="text-[11px] text-gray-500 block mb-1.5 font-normal">
                    Select target Shift
                  </label>
                  <div className="relative">
                    <select
                      value={selectedShift}
                      onChange={(e) => setSelectedShift(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-lg pl-3 pr-10 py-2 text-xs appearance-none text-gray-700 font-normal focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all"
                    >
                      <option value="">Choose Shift Definition</option>
                      {shifts.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.shift_name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      size={14}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-gray-500 block mb-1.5 font-normal">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 font-normal focus:bg-white focus:border-gray-900 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-500 block mb-1.5 font-normal">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 font-normal focus:bg-white focus:border-gray-900 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-5 space-y-5">
                <div className="border-b border-gray-100 pb-3">
                  <h2 className="text-sm text-gray-900 flex items-center gap-2 font-normal">
                    <span className="p-1.5 bg-slate-100 rounded-lg text-gray-600">
                      <FiLayers size={14} />
                    </span>
                    2. Target Selection Strategy
                  </h2>
                </div>

                <div className="relative">
                  <label className="text-[11px] text-gray-500 block mb-1.5 font-normal">
                    Filter Scope
                  </label>
                  <div className="relative">
                    <select
                      value={filterType}
                      onChange={(e) => handleFilterTypeChange(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-lg pl-3 pr-10 py-2 text-xs appearance-none text-gray-700 font-normal focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all"
                    >
                      <option value="employee">Manual Selection Only</option>
                      <option value="all">Select Entire Workspace Pool</option>
                      <option value="department">
                        By Corporate Department
                      </option>
                      <option value="designation">
                        By Operational Designation
                      </option>
                      <option value="branch">By Active Branch Location</option>
                    </select>
                    <ChevronDown
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      size={14}
                    />
                  </div>
                </div>

                {["department", "designation", "branch"].includes(
                  filterType,
                ) && (
                  <div className="relative">
                    <label className="text-[11px] text-gray-500 block mb-1.5 capitalize font-normal">
                      Specify {filterType}
                    </label>
                    <div className="relative">
                      <select
                        value={selectedFilterId}
                        onChange={(e) => handleFilterSelect(e.target.value)}
                        className="w-full bg-slate-50 border border-gray-200 rounded-lg pl-3 pr-10 py-2 text-xs appearance-none text-gray-700 font-normal focus:bg-white focus:border-gray-900 focus:outline-none transition-all"
                      >
                        <option value="">Choose Options...</option>
                        {filterOptions.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        size={14}
                      />
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
                  <div className="flex justify-between items-center bg-slate-50 rounded-lg p-2.5 px-3">
                    <span className="text-[11px] text-gray-500 font-normal">
                      Selected Volume
                    </span>
                    <span className="text-xs bg-gray-900 text-white font-normal px-2 py-0.5 rounded-full">
                      {selectedUsers.length} Staff
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFilterType("employee");
                        setSelectedUsers([]);
                        fetchInitialData();
                      }}
                      className="flex-1 py-2 border border-gray-200 rounded-lg text-xs font-normal text-gray-600 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors"
                    >
                      Clear Form
                    </button>
                    <button
                      type="button"
                      onClick={handleAllocate}
                      className="flex-1 py-2 bg-yellow-300 text-black font-normal rounded-lg text-xs hover:bg-yellow-400 active:bg-yellow-500 shadow-sm transition-all flex items-center justify-center gap-1"
                    >
                      <FiCheckCircle size={13} />
                      Allocation
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* --- RIGHT PANEL: TABLE WORKSPACE --- */}
            <div className="flex-1 w-full bg-white rounded-xl border border-gray-200/80 shadow-sm flex flex-col min-w-0">
              <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3 bg-white rounded-t-xl">
                <div className="relative w-full sm:max-w-xs">
                  <input
                    type="text"
                    placeholder="Search staff pool by name..."
                    className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs placeholder-gray-400 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-gray-950 focus:border-gray-950 focus:outline-none transition-all font-normal"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <FiSearch
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                    size={13}
                  />
                </div>

                <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between">
                  <span className="text-[11px] text-gray-400 hidden sm:inline font-normal">
                    Showing {filteredUsers.length} rows
                  </span>
                  <button
                    type="button"
                    onClick={() => setViewCalendarMode(true)}
                    className="px-3 py-1.5 text-xs font-normal rounded-lg border border-gray-200 hover:bg-gray-50 active:bg-gray-100 text-gray-700 transition-colors flex items-center gap-1"
                  >
                    <FiCalendar size={13} />
                    Show All Shifts
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto max-h-[580px]">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-2">
                    <RefreshCw
                      size={24}
                      className="animate-spin text-gray-300"
                    />
                    <span className="text-xs font-normal">
                      Updating list data...
                    </span>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-2">
                    <FiUsers size={28} className="text-gray-300" />
                    <span className="text-xs font-normal">
                      No personnel entries found matching parameters.
                    </span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/70 border-b border-gray-100 text-[11px] font-normal text-gray-500 uppercase tracking-wider">
                          <th className="p-3.5 pl-5 w-12 text-center font-normal">
                            Assign
                          </th>
                          <th className="p-3.5 font-normal">Staff Details</th>
                          <th className="p-3.5 font-normal">Designation</th>
                          <th className="p-3.5 font-normal">Department</th>
                          <th className="p-3.5 font-normal">Branch</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-xs text-gray-700 font-normal">
                        {filteredUsers.map((emp) => {
                          const isChecked = selectedUsers.includes(emp.uuid);
                          return (
                            <tr
                              key={emp.uuid}
                              onClick={() => toggleUserSelection(emp.uuid)}
                              className={`cursor-pointer transition-colors group ${
                                isChecked
                                  ? "bg-slate-100/70 hover:bg-slate-100"
                                  : "hover:bg-slate-50/60"
                              }`}
                            >
                              <td
                                className="p-3 pl-5 text-center"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="relative inline-flex items-center justify-center">
                                  <input
                                    type="checkbox"
                                    className="peer h-4 w-4 appearance-none rounded border border-gray-300 bg-white checked:border-black checked:bg-black focus:outline-none focus:ring-1 focus:ring-black/40 transition-all cursor-pointer"
                                    checked={isChecked}
                                    onChange={() =>
                                      toggleUserSelection(emp.uuid)
                                    }
                                  />
                                  <FiCheck
                                    size={10}
                                    className="absolute text-white font-normal opacity-0 peer-checked:opacity-100 pointer-events-none"
                                  />
                                </div>
                              </td>
                              <td className="p-3 font-normal text-gray-900">
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className={`h-7 w-7 rounded-full flex items-center justify-center font-normal text-[10px] tracking-wide transition-colors ${isChecked ? "bg-black text-white" : "bg-slate-100 text-gray-600 group-hover:bg-white"}`}
                                  >
                                    {(emp.full_name || emp.name || "S")
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .slice(0, 2)
                                      .toUpperCase()}
                                  </div>
                                  <span className="truncate max-w-[200px] font-normal">
                                    {emp.full_name || emp.name}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3 text-gray-500 font-normal">
                                <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-[10px] font-normal text-gray-600">
                                  <FiBriefcase size={10} />
                                  {emp.designation || emp.role || "Staff"}
                                </span>
                              </td>
                              <td className="p-3 text-gray-500 font-normal">
                                {emp.department ? (
                                  <span className="inline-flex items-center gap-1 bg-blue-50  border border-blue-100 px-2 py-0.5 rounded text-[10px]">
                                    <FiGrid size={10} />
                                    {emp.department}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 italic text-[10px]">
                                    N/A
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-gray-500 font-normal">
                                {emp.branch ? (
                                  <span className="inline-flex items-center gap-1 bg-purple-50  border border-purple-100 px-2 py-0.5 rounded text-[10px]">
                                    <FiMapPin size={10} />
                                    {emp.branch}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 italic text-[10px]">
                                    N/A
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ShiftBulkAllocation;
