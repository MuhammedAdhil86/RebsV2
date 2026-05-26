import React, { useState, useEffect } from "react";
import { IconButton, Checkbox } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import announceService from "../../service/announceService";

const EventEmployee = ({
  onBack,
  selectedEmployees = [],
  onEmployeeToggle,
}) => {
  const [staffDetails, setStaffDetails] = useState([]);
  const [fetchingEmployees, setFetchingEmployees] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchStaffMembers = async () => {
      setFetchingEmployees(true);
      try {
        const response = await announceService.fetchStaff();
        console.log("Response from server:", response);

        if (response && response.data) {
          console.log("Full Employee Details:", response.data);
          setStaffDetails(response.data);
        } else {
          console.error("Unexpected response structure", response);
        }
      } catch (error) {
        console.error("Failed to fetch employee details:", error);
      } finally {
        setFetchingEmployees(false);
      }
    };

    fetchStaffMembers();
  }, []);

  const filteredEmployees = staffDetails.filter((employee) =>
    employee.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="employee-container h-full p-8 font-['Poppins'] font-normal bg-white text-black">
      {/* Header Container */}
      <div className="flex mb-4 items-center justify-between border-b border-gray-100 pb-4">
        <div className="flex items-center">
          <IconButton onClick={onBack} className="back-button p-1 mr-1">
            <ArrowBackIcon sx={{ color: "black" }} />
          </IconButton>
          <h2 className="text-xl font-semibold text-black font-['Poppins']">
            Choose Employee
          </h2>
        </div>
        <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-['Poppins']">
          {selectedEmployees.length} selected
        </span>
      </div>

      <div className="mt-6 w-[485px] mx-auto">
        {/* Search Bar Block */}
        <div className="mb-6 flex items-center space-x-3">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search employee"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 pl-10 text-black font-['Poppins'] font-normal focus:border-black focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Dynamic Multi-Select Employee List Container */}
        <div
          className="employee-list space-y-3 overflow-y-auto pr-1"
          style={{ maxHeight: "580px" }}
        >
          {fetchingEmployees ? (
            <p className="text-gray-500 text-sm font-['Poppins'] p-4 text-center">
              Loading employees...
            </p>
          ) : filteredEmployees.length === 0 ? (
            <p className="text-gray-400 text-sm font-['Poppins'] p-4 text-center">
              No employees found
            </p>
          ) : (
            filteredEmployees.map((employee) => {
              // Check if employee uuid exists inside the synchronized parent state array
              const isChecked = selectedEmployees.includes(employee.uuid);

              return (
                <div
                  key={employee.uuid}
                  className={`flex items-center bg-white p-3 rounded-xl border transition-all cursor-pointer select-none ${
                    isChecked
                      ? "border-black bg-gray-50/50 shadow-sm"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => onEmployeeToggle(employee.uuid)}
                >
                  <img
                    src={
                      employee.imageUrl ||
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                    }
                    alt={employee.name}
                    className="w-10 h-10 rounded-full mr-3 object-cover border border-gray-100"
                  />
                  <div className="flex-grow min-w-0">
                    <h3 className="font-medium text-sm text-black font-['Poppins'] truncate">
                      {employee.name}
                    </h3>
                    <p className="text-xs text-gray-400 font-['Poppins'] truncate mt-0.5">
                      {employee.designationname?.Valid
                        ? employee.designationname.String
                        : "No designation available"}
                    </p>
                  </div>
                  <Checkbox
                    checked={isChecked}
                    readOnly
                    sx={{
                      color: "#d1d5db",
                      "&.Mui-checked": {
                        color: "black",
                      },
                    }}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Floating Submit Action Block */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2.5 bg-black text-white rounded-lg text-sm font-medium font-['Poppins'] hover:bg-gray-900 transition-all shadow-sm active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventEmployee;
