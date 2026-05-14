import React, { useEffect, useState } from "react";
import LeftSidebar from "./leftsidebox";
import PayrollTable from "../../../ui/payrolltable";
import toast, { Toaster } from "react-hot-toast";

import {
  getAllStaff,
  filterStaff,
  getDepartmentData,
  getBranchData,
  getDesignationData,
  getShiftList,
} from "../../../service/staffservice";
import { allocateShiftBulkUpsert } from "../../../service/companyService";

const ShiftBulkAllocation = () => {
  /* ================= STATE ================= */
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [filterType, setFilterType] = useState("employee");
  const [filterOptions, setFilterOptions] = useState([]);
  const [selectedFilterId, setSelectedFilterId] = useState("");

  const [shifts, setShifts] = useState([]);
  const [selectedShift, setSelectedShift] = useState("");
  const [selectedPolicy, setSelectedPolicy] = useState(null);

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  /* ================= COLUMN DEFINITION ================= */
  const columns = [
    {
      key: "selection",
      label: (
        <input
          type="checkbox"
          className="cursor-pointer"
          onChange={(e) => handleSelectAll(e.target.checked)}
          checked={users.length > 0 && selectedUsers.length === users.length}
        />
      ),
      width: 50,
      render: (_, row) => (
        <input
          type="checkbox"
          className="cursor-pointer"
          checked={selectedUsers.includes(row.uuid)} // ✅ Matches your log: using row.uuid
          onChange={() => toggleUserSelection(row.uuid)}
        />
      ),
    },
    { key: "full_name", label: "Staff Name", align: "left" },
    {
      key: "uuid", // ✅ Matches your log: uuid is the Staff ID
      label: "Staff ID",
      align: "center",
    },
    {
      key: "department", // ✅ Matches your log: department name is in 'department'
      label: "Department",
      align: "center",
      render: (val) => val || <span className="text-gray-400">N/A</span>,
    },
    {
      key: "designation",
      label: "Designation",
      align: "center",
      render: (val) => val || <span className="text-gray-400">N/A</span>,
    },
  ];

  /* ================= API ACTIONS ================= */

  const fetchAllUsers = async () => {
    try {
      const data = await getAllStaff();
      console.log("Total Staff Data Response 👉", data);
      const staffList = Array.isArray(data) ? data : data?.data || [];
      setUsers(staffList);
    } catch (error) {
      console.error("Error fetching all staff:", error);
      setUsers([]);
    }
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
      console.log(`Filtered Staff (${filterType}) Response 👉`, data);

      const filteredList = Array.isArray(data) ? data : data?.data || [];
      setUsers(filteredList);

      // ✅ Auto-check all filtered employees using their UUID
      const filteredUuids = filteredList.map((u) => u.uuid);
      setSelectedUsers(filteredUuids);
    } catch (error) {
      console.error("Error filtering staff:", error);
      setUsers([]);
      setSelectedUsers([]);
    }
    setLoading(false);
  };

  /* ================= HANDLERS ================= */

  const toggleUserSelection = (uuid) => {
    setSelectedUsers((prev) =>
      prev.includes(uuid) ? prev.filter((u) => u !== uuid) : [...prev, uuid],
    );
  };

  const handleSelectAll = (isChecked) => {
    if (isChecked) {
      setSelectedUsers(users.map((u) => u.uuid));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleFilterTypeChange = async (type) => {
    setFilterType(type);
    setSelectedFilterId("");
    setFilterOptions([]);

    if (type === "employee") {
      setSelectedUsers([]); // "Select Employee" mode: clean checkboxes
      return;
    }

    if (type === "all") {
      const allUuids = users.map((u) => u.uuid);
      setSelectedUsers(allUuids); // "All Employees" mode: check everything
      toast.success(`Selected all ${allUuids.length} employees`);
      return;
    }

    setSelectedUsers([]);
    let data = [];
    if (type === "department") data = await getDepartmentData();
    if (type === "designation") data = await getDesignationData();
    if (type === "branch") data = await getBranchData();
    setFilterOptions(Array.isArray(data) ? data : data?.data || []);
  };

  // ... (Initial Load and Allocation logic same as before)
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    await Promise.all([fetchAllUsers(), fetchShifts()]);
    setLoading(false);
  };

  const fetchShifts = async () => {
    try {
      const data = await getShiftList();
      setShifts(Array.isArray(data) ? data : data?.data || []);
    } catch (error) {
      setShifts([]);
    }
  };

  const handleShiftChange = (e) => {
    const shiftId = e.target.value;
    setSelectedShift(shiftId);
    const shift = shifts.find((s) => s.id === Number(shiftId));
    setSelectedPolicy(shift?.policies?.[0] || null);
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
      success: "Shifts allocated successfully!",
      error: (err) =>
        `Error: ${err.response?.data?.message || "Failed to allocate"}`,
    });
  };

  return (
    <div className="flex gap-4 w-full min-h-screen bg-[#F9FAFB] p-4 font-poppins text-[12px]">
      <Toaster position="top-right" />
      <LeftSidebar
        shifts={shifts}
        selectedShift={selectedShift}
        handleShiftChange={handleShiftChange}
        filterType={filterType}
        handleFilterTypeChange={handleFilterTypeChange}
        filterOptions={filterOptions}
        selectedFilterId={selectedFilterId}
        handleFilterSelect={handleFilterSelect}
        handleClearAll={() => {
          setFilterType("employee");
          setSelectedUsers([]);
          fetchAllUsers();
        }}
        selectedPolicy={selectedPolicy}
        selectedUsersCount={selectedUsers.length}
        handleAllocate={handleAllocate}
        fromDate={fromDate}
        setFromDate={setFromDate}
        toDate={toDate}
        setToDate={setToDate}
      />

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col min-w-0">
        <div className="p-4 border-b flex justify-between items-center bg-white sticky top-0 z-10">
          <input
            type="text"
            placeholder="Search staff by name..."
            className="w-full max-w-sm p-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500 font-normal"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="text-xs text-gray-500 font-normal">
            {selectedUsers.length} staff selected
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 text-gray-500 gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span>Processing...</span>
            </div>
          ) : (
            <div className="p-4">
              <PayrollTable
                columns={columns}
                data={users}
                searchTerm={searchTerm}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShiftBulkAllocation;
