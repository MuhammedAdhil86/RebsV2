import React, { useEffect, useState } from "react";
import { Search, Palmtree } from "lucide-react";
import PayrollTable from "../../../../ui/payrolltable";
import toast, { Toaster } from "react-hot-toast";
import payrollService from "../../../../service/payrollService";
import {
  getAllStaff,
  filterStaff,
  getDepartmentData,
  getBranchData,
  getDesignationData,
} from "../../../../service/staffservice";

const BulkAllocationTab = ({ policies }) => {
  /* ================= STATE ================= */
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ Updated: Default filter type is now "employee"
  const [filterType, setFilterType] = useState("employee");
  const [filterOptions, setFilterOptions] = useState([]);
  const [selectedFilterId, setSelectedFilterId] = useState("");

  const [selectedPolicyId, setSelectedPolicyId] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  /* ================= INITIAL LOAD ================= */
  useEffect(() => {
    fetchInitialData();
  }, [policies]);

  const fetchInitialData = async () => {
    setLoading(true);
    await fetchAllUsers();
    setLoading(false);
  };

  /* ================= COLUMN DEFINITION ================= */
  const columns = [
    {
      key: "selection",
      label: (
        <input
          type="checkbox"
          className="cursor-pointer accent-black"
          onChange={(e) => handleSelectAll(e.target.checked)}
          checked={users.length > 0 && selectedUsers.length === users.length}
        />
      ),
      width: 50,
      render: (_, row) => (
        <input
          type="checkbox"
          className="cursor-pointer accent-black"
          checked={selectedUsers.includes(row.uuid)}
          onChange={() => toggleUserSelection(row.uuid)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    { key: "full_name", label: "Staff Name", align: "left" },
    { key: "uuid", label: "Staff ID", align: "center" }, // ✅ UUID as ID
    { key: "department", label: "Department", align: "center" }, // ✅ Department name
    { key: "designation", label: "Designation", align: "center" },
    {
      key: "status",
      label: "Status",
      align: "center",
      render: (val) => (
        <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-[10px] uppercase border border-green-100">
          {val || "Active"}
        </span>
      ),
    },
  ];

  /* ================= SELECTION LOGIC ================= */
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

  /* ================= API ACTIONS ================= */
  const fetchAllUsers = async () => {
    try {
      const data = await getAllStaff();
      console.log("Bulk Allocation: Staff Data 👉", data);
      const staffList = Array.isArray(data) ? data : data?.data || [];
      setUsers(staffList);
      // NOTE: We do NOT auto-select here because "Select Employee" is the default clean state
    } catch (error) {
      setUsers([]);
    }
  };

  const handleFilterTypeChange = async (type) => {
    setFilterType(type);
    setSelectedFilterId("");
    setFilterOptions([]);

    if (type === "employee") {
      // ✅ Mode: Select Employee -> Clear all checkboxes for manual choice
      setSelectedUsers([]);
      return;
    }

    if (type === "all") {
      // ✅ Mode: All Employees -> Auto-check every single box
      const allUuids = users.map((u) => u.uuid);
      setSelectedUsers(allUuids);
      toast.success("All employees selected");
      return;
    }

    // Criteria modes (Department/Branch/Designation)
    setSelectedUsers([]);
    try {
      let data = [];
      if (type === "department") data = await getDepartmentData();
      if (type === "designation") data = await getDesignationData();
      if (type === "branch") data = await getBranchData();
      setFilterOptions(Array.isArray(data) ? data : data?.data || []);
    } catch (error) {
      toast.error(`Could not load ${type} data`);
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
      console.log(`Filtered Staff (${filterType}) 👉`, data);
      const filteredList = Array.isArray(data) ? data : data?.data || [];
      setUsers(filteredList);

      // ✅ Mode: Category Selected -> Auto-check all matching staff
      const filteredUuids = filteredList.map((u) => u.uuid);
      setSelectedUsers(filteredUuids);
    } catch (error) {
      setUsers([]);
      setSelectedUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAllocate = async () => {
    if (!selectedPolicyId) return toast.error("Please select a leave policy");
    if (selectedUsers.length === 0) return toast.error("Select staff members");

    const payload = {
      leave_policy_id: parseInt(selectedPolicyId, 10),
      staff_ids: selectedUsers,
    };

    setSubmitting(true);
    try {
      const response = await payrollService.bulkAllocateLeave(payload);
      if (response.success || response.status_code === 200) {
        toast.success("Policy successfully allocated!");
        setSelectedUsers([]);
        fetchAllUsers();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Server error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in duration-500 font-['Poppins']">
      <Toaster position="top-right" />

      {/* --- SIDEBAR --- */}
      <div className="w-full lg:w-80 space-y-4">
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-6">
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase mb-3 block">
              Policy
            </label>
            <select
              value={selectedPolicyId}
              onChange={(e) => setSelectedPolicyId(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-black"
            >
              <option value="">-- Choose Leave Template --</option>
              {policies?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <hr className="border-gray-50" />

          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase mb-3 block">
              Target Category
            </label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {["employee", "all", "department", "designation", "branch"].map(
                (type) => (
                  <button
                    key={type}
                    onClick={() => handleFilterTypeChange(type)}
                    className={`px-2 py-2 rounded-lg text-[10px] capitalize border transition-all ${
                      filterType === type
                        ? "bg-black text-white border-black"
                        : "bg-white text-gray-500 border-gray-100 hover:border-gray-300"
                    }`}
                  >
                    {type === "employee"
                      ? "Select Employee"
                      : type === "all"
                        ? "All Employees"
                        : type}
                  </button>
                ),
              )}
            </div>

            {["department", "designation", "branch"].includes(filterType) && (
              <select
                value={selectedFilterId}
                onChange={(e) => handleFilterSelect(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-black animate-in slide-in-from-top-2"
              >
                <option value="">-- Select {filterType} --</option>
                {filterOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name || opt.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          <button
            disabled={submitting || selectedUsers.length === 0}
            onClick={handleAllocate}
            className={`w-full py-3.5 rounded-lg text-[12px] font-medium transition-all ${
              submitting || selectedUsers.length === 0
                ? "bg-gray-100 text-gray-400"
                : "bg-black text-white hover:bg-zinc-800"
            }`}
          >
            {submitting
              ? "Processing..."
              : `Allocate to ${selectedUsers.length} Staff`}
          </button>
        </div>
      </div>

      {/* --- TABLE --- */}
      <div className="flex-1 bg-white border border-gray-100 rounded-xl shadow-sm flex flex-col min-w-0">
        <div className="p-4 border-b flex justify-between items-center bg-white sticky top-0 z-10 rounded-t-xl">
          <div className="relative w-full max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={14}
            />
            <input
              type="text"
              placeholder="Search by name or ID..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-transparent rounded-lg text-xs focus:bg-white focus:border-gray-200 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="px-3 py-1 bg-black text-white rounded-full text-[10px]">
            {selectedUsers.length} SELECTED
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 min-h-[500px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
              <div className="w-8 h-8 border-3 border-gray-100 border-t-black rounded-full animate-spin" />
              <span className="text-xs">Updating Staff List...</span>
            </div>
          ) : (
            <PayrollTable
              columns={columns}
              data={users}
              rowsPerPage={12}
              searchTerm={searchTerm}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkAllocationTab;
