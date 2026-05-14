import React, { useState, useEffect } from "react";
import { IconButton, Checkbox, Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import announceService from "../../service/announceService";

const EventEmployee = ({ onBack, onEmployeeSelect }) => {
  const [staffDetails, setStaffDetails] = useState([]);
  const [fetchingEmployees, setFetchingEmployees] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);

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
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleEmployeeClick = (uuid) => {
    setSelectedEmployee(uuid);
    onEmployeeSelect(uuid);
  };

  const handleSubmit = () => {
    // Logic for handling the submit action
    console.log("Submitting employee selection:", selectedEmployee);

    // Navigate back to the previous page
    onBack();
  };

  return (
    <div className="employee-container h-full p-8">
      <div className="flex mb-4">
        <div className="flex items-center">
          <IconButton onClick={onBack} className="back-button">
            <ArrowBackIcon sx={{ color: "black" }} />
          </IconButton>
          <h2 className="text-xl font-semibold ml-2 text-black">
            Choose Employee
          </h2>
        </div>
      </div>

      <div className="mt-10 w-[485px] mx-auto p-4">
        {/* Search bar */}
        <div className="mb-4 flex items-center">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search employee"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 pl-10 text-black"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          <button className="px-4 py-2 bg-black text-white rounded-lg ml-3">
            Search
          </button>
        </div>

        {/* Employee List */}
        <div
          className="employee-list space-y-2 overflow-y-auto"
          style={{ maxHeight: "620px" }}
        >
          {fetchingEmployees ? (
            <p>Loading employees...</p>
          ) : (
            filteredEmployees.map((employee) => (
              <div
                key={employee.uuid}
                className="flex items-center bg-white p-3 rounded-lg border border-black cursor-pointer"
                onClick={() => handleEmployeeClick(employee.uuid)} // Handle click event
              >
                <img
                  src={
                    employee.imageUrl || "/placeholder.svg?height=40&width=40"
                  }
                  alt={employee.name}
                  className="w-10 h-10 rounded-full mr-3"
                />
                <div className="flex-grow">
                  <h3 className="font-semibold text-black">{employee.name}</h3>
                  <p className="text-sm text-gray-500">
                    {employee.designationname?.Valid
                      ? employee.designationname.String
                      : "No designation available"}
                  </p>
                </div>
                <Checkbox
                  sx={{ color: "black", "&.Mui-checked": { color: "green" } }}
                />
              </div>
            ))
          )}
        </div>

        {/* Submit Button */}
        <div className="mt-4 flex justify-end">
          <Button variant="contained" color="primary" onClick={handleSubmit}>
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EventEmployee;
