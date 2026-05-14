import React, { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  FiChevronLeft,
  FiChevronRight,
  FiSearch,
  FiCalendar,
  FiClock,
  FiCheckCircle,
} from "react-icons/fi";
import { ChevronDown } from "lucide-react";

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

const ShiftBulkAllocation = () => {
  /* ================= STATE ================= */
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Sidebar Filter States
  const [filterType, setFilterType] = useState("employee");
  const [filterOptions, setFilterOptions] = useState([]);
  const [selectedFilterId, setSelectedFilterId] = useState("");

  // Shift & Policy States
  const [shifts, setShifts] = useState([]);
  const [selectedShift, setSelectedShift] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Calendar Pagination (31-day logic)
  const [startIndex, setStartIndex] = useState(0);
  const days = Array.from(
    { length: 31 },
    (_, i) => `${String(i + 1).padStart(2, "0")}-Day`,
  );

  /* ================= API ACTIONS ================= */

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Shift Types for Sidebar
      const shiftRes = await getShiftList();
      setShifts(Array.isArray(shiftRes) ? shiftRes : shiftRes?.data || []);

      // 2. Fetch All Staff and their assigned shifts
      const staffRes = await getAllStaff();
      const staffList = Array.isArray(staffRes)
        ? staffRes
        : staffRes?.data || [];

      const shiftDataRes = await axiosInstance.get("/shifts/filtered");
      const existingShifts = shiftDataRes.data || [];

      // Map assigned shifts to the correct day index (1-31)
      const processedUsers = staffList.map((staff) => {
        const staffShifts = Array.from({ length: 31 }, () => ({ type: "off" }));

        existingShifts.forEach((s) => {
          if (s.uuid === staff.uuid || s.staff_id === staff.id) {
            const dayIndex = new Date(s.date).getDate() - 1;
            if (dayIndex >= 0 && dayIndex < 31) {
              staffShifts[dayIndex] = s.shift_type
                ? {
                    type: "work",
                    name: s.shift_type,
                    in: s.in_time || "00:00 AM",
                    out: s.out_time || "00:00 PM",
                    work_hours: s.work_hours || "00:00:00",
                  }
                : { type: "off" };
            }
          }
        });

        return { ...staff, shifts: staffShifts };
      });

      setUsers(processedUsers);
    } catch (error) {
      console.error("Initialization error:", error);
      toast.error("Failed to load staff data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

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

  /* ================= RENDER COMPONENTS ================= */

  return (
    <div className="flex gap-4 w-full min-h-screen bg-[#F9FAFB] p-4 font-poppins text-[12px]">
      <Toaster position="top-right" />

      {/* --- LEFT SIDEBAR (Internalized) --- */}
      <div className="w-[240px] space-y-6 font-poppins font-normal">
        <div className="bg-[#F4981833] border border-[#FFD9A7] rounded-2xl p-3">
          <div className="space-y-4">
            <div className="relative">
              <label className="text-[11px] text-gray-800 block mb-2 font-normal">
                Select a Shift
              </label>
              <select
                value={selectedShift}
                onChange={(e) => setSelectedShift(e.target.value)}
                className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-sm appearance-none text-gray-700 focus:outline-none"
              >
                <option value="">Select Shift</option>
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.shift_name}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-3 top-[38px] text-gray-400"
                size={16}
              />
            </div>

            <div className="space-y-3">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full bg-white border rounded-xl px-4 py-2 text-sm text-gray-700 outline-none"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full bg-white border rounded-xl px-4 py-2 text-sm text-gray-700 outline-none"
              />
            </div>

            <div className="relative">
              <label className="text-[11px] text-gray-800 block mb-2 font-normal">
                Select User Category
              </label>
              <select
                value={filterType}
                onChange={(e) => handleFilterTypeChange(e.target.value)}
                className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-sm appearance-none text-gray-700 focus:outline-none"
              >
                <option value="employee">Select Employee</option>
                <option value="all">All Employees</option>
                <option value="department">Department</option>
                <option value="designation">Designation</option>
                <option value="branch">Branch</option>
              </select>
              <ChevronDown
                className="absolute right-3 top-[38px] text-gray-400"
                size={16}
              />
            </div>

            {["department", "designation", "branch"].includes(filterType) && (
              <div className="relative">
                <label className="text-[11px] text-gray-800 block mb-2 font-normal">
                  Select {filterType}
                </label>
                <select
                  value={selectedFilterId}
                  onChange={(e) => handleFilterSelect(e.target.value)}
                  className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-sm appearance-none text-gray-700 focus:outline-none"
                >
                  <option value="">Select Option</option>
                  {filterOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-3 top-[38px] text-gray-400"
                  size={16}
                />
              </div>
            )}

            <div className="pt-2 border-t border-[#FFD9A7]">
              <p className="text-[10px] text-orange-700 font-medium">
                {selectedUsers.length} selection active
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setFilterType("employee");
                  setSelectedUsers([]);
                  fetchInitialData();
                }}
                className="flex-1 py-1.5 border border-gray-300 rounded-lg text-[11px] text-gray-700 bg-white/50 hover:bg-white"
              >
                Clear
              </button>
              <button
                onClick={handleAllocate}
                className="flex-1 py-1.5 bg-black text-white rounded-lg text-[11px] hover:bg-neutral-800"
              >
                Allocate
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- MAIN CONTENT (Calendar Grid) --- */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col min-w-0">
        <div className="p-4 border-b flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="relative w-full max-w-sm">
            <input
              type="text"
              placeholder="Search staff..."
              className="w-full p-2 pl-8 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500 font-normal"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex gap-1">
              <button
                onClick={() => setStartIndex((prev) => Math.max(0, prev - 5))}
                className="p-1.5 border rounded-lg hover:bg-gray-50 text-gray-600"
              >
                <FiChevronLeft size={16} />
              </button>
              <button
                onClick={() =>
                  setStartIndex((prev) => Math.min(days.length - 5, prev + 5))
                }
                className="p-1.5 border rounded-lg hover:bg-gray-50 text-gray-600"
              >
                <FiChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex justify-center p-20 text-gray-400">
              Loading Grid...
            </div>
          ) : (
            <div className="border rounded-xl overflow-hidden">
              {/* Header Row */}
              <div className="grid grid-cols-[220px_repeat(5,1fr)] bg-gray-50 border-b text-[11px] font-medium text-gray-500">
                <div className="p-3 border-r">Staff Details</div>
                {days.slice(startIndex, startIndex + 5).map((day, i) => (
                  <div
                    key={i}
                    className="p-3 text-center border-r last:border-r-0"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Data Rows */}
              <div className="divide-y">
                {filteredUsers.map((emp) => (
                  <div
                    key={emp.uuid}
                    className="grid grid-cols-[220px_repeat(5,1fr)] group hover:bg-gray-50/50"
                  >
                    <div className="p-3 border-r flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="rounded accent-black"
                        checked={selectedUsers.includes(emp.uuid)}
                        onChange={() => toggleUserSelection(emp.uuid)}
                      />
                      <div className="flex flex-col truncate">
                        <span className="font-semibold text-gray-800 truncate">
                          {emp.full_name || emp.name}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {emp.designation || emp.role || "Staff"}
                        </span>
                      </div>
                    </div>

                    {emp.shifts
                      .slice(startIndex, startIndex + 5)
                      .map((shift, i) => (
                        <div
                          key={i}
                          className="p-2 border-r last:border-r-0 min-h-[110px]"
                        >
                          {shift.type === "work" ? (
                            <div className="h-full border border-green-200 bg-green-50/50 rounded-lg p-2 text-[10px] flex flex-col justify-between">
                              <div className="flex items-center gap-1 text-green-700 font-bold">
                                <FiCheckCircle size={10} />
                                <span className="uppercase">{shift.name}</span>
                              </div>
                              <div className="space-y-1 mt-2 text-gray-600">
                                <div className="flex justify-between">
                                  <span>IN:</span>
                                  <b>{shift.in}</b>
                                </div>
                                <div className="flex justify-between">
                                  <span>OUT:</span>
                                  <b>{shift.out}</b>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="h-full border border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-[10px] text-gray-300 gap-1 bg-gray-50/30">
                              <FiCalendar size={14} />
                              <span>Weekly Off</span>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShiftBulkAllocation;
