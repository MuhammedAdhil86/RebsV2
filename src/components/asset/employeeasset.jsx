import React, { useState, useEffect } from "react";
import { IconButton, Checkbox, CircularProgress } from "@mui/material";
import { FiArrowLeft, FiSearch, FiUser } from "react-icons/fi";
import announceService from "../../service/announceService";

const EmployeeAsset = ({ onBack, onEmployeeSelect }) => {
  const [staffDetails, setStaffDetails] = useState([]);
  const [fetchingEmployees, setFetchingEmployees] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);

  // Fetch employees logic
  useEffect(() => {
    const fetchStaffMembers = async () => {
      setFetchingEmployees(true);
      try {
        const response = await announceService.fetchStaff();
        if (response && response.data) {
          setStaffDetails(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch employees:", error);
      } finally {
        setFetchingEmployees(false);
      }
    };
    fetchStaffMembers();
  }, []);

  const filteredEmployees = staffDetails.filter((emp) =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSelection = (employee) => {
    setSelectedEmployeeId(employee.uuid);
    // Pass selection immediately to parent
    onEmployeeSelect({
      uuid: employee.uuid,
      name: employee.name,
    });
  };

  return (
    <div className="h-full flex flex-col bg-white font-sans">
      {/* Header */}
      <div className="p-6 border-b flex items-center gap-3">
        <IconButton onClick={onBack} size="small" className="hover:bg-gray-100">
          <FiArrowLeft className="text-black" />
        </IconButton>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Choose Employee</h2>
          <p className="text-xs text-gray-500 font-medium">
            Select a staff member for allocation
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4">
        <div className="relative group">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" />
          <input
            type="text"
            placeholder="Search by name or designation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-black transition-all"
          />
        </div>
      </div>

      {/* Employee List */}
      <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-24">
        {fetchingEmployees ? (
          <div className="flex flex-col items-center justify-center h-40 space-y-3">
            <CircularProgress size={24} sx={{ color: "black" }} />
            <p className="text-xs text-gray-400 font-medium tracking-tighter">
              FETCHING STAFF LIST...
            </p>
          </div>
        ) : filteredEmployees.length > 0 ? (
          filteredEmployees.map((employee) => (
            <div
              key={employee.uuid}
              onClick={() => handleSelection(employee)}
              className={`flex items-center p-3 rounded-xl border transition-all cursor-pointer group ${
                selectedEmployeeId === employee.uuid
                  ? "border-black bg-gray-50 shadow-sm"
                  : "border-gray-100 hover:border-gray-300"
              }`}
            >
              {/* Avatar Logic */}
              <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center mr-3">
                {employee.imageUrl ? (
                  <img
                    src={employee.imageUrl}
                    alt={employee.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FiUser className="text-gray-400" />
                )}
              </div>

              {/* Info */}
              <div className="flex-grow min-w-0">
                <h3 className="text-sm font-bold text-gray-900 truncate">
                  {employee.name}
                </h3>
                <p className="text-[11px] text-gray-500 font-medium truncate uppercase tracking-tighter">
                  {employee.designation || "Staff Member"}
                </p>
              </div>

              {/* Checkbox Styled to match your theme */}
              <Checkbox
                checked={selectedEmployeeId === employee.uuid}
                sx={{
                  color: "#E5E7EB",
                  "&.Mui-checked": { color: "black" },
                }}
              />
            </div>
          ))
        ) : (
          <div className="text-center py-10">
            <p className="text-sm text-gray-400 italic">No employees found.</p>
          </div>
        )}
      </div>

      {/* Footer Action */}
      <div className="p-6 border-t bg-gray-50 absolute bottom-0 w-full">
        <button
          onClick={onBack}
          disabled={!selectedEmployeeId}
          className="w-full bg-black text-white py-3.5 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95 disabled:opacity-30"
        >
          Confirm Selection
        </button>
      </div>
    </div>
  );
};

export default EmployeeAsset;
