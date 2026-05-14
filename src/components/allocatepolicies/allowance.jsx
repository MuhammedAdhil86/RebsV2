import React, { useEffect, useRef, useState } from "react";
import { fetchPrivilegeAllowance, allocateAllowanceData } from "../../service/companyService";
import toast, { Toaster } from "react-hot-toast";

const Allowance = ({ allowances, allowanceList, setAllowanceList, employeeUuid }) => {
  const selectRef = useRef(null); // Reference for the dropdown
  const [allocatedAllowances, setAllocatedAllowances] = useState([]); // State to store already allocated allowances

  // Fetch already allocated allowances on component mount
  useEffect(() => {
    const fetchAllocatedAllowances = async () => {
      try {
        const allocated = await fetchPrivilegeAllowance(employeeUuid);
        setAllocatedAllowances(allocated || []); // Set fetched allowances
   
      } catch (error) {
        console.error("Error fetching allocated allowances:", error);
      }
    };

    fetchAllocatedAllowances();
  }, [employeeUuid]);

  const handleAddItem = (selectedValue) => {
    if (selectedValue !== "Select" && !allowanceList.includes(selectedValue)) {
      const selectedAllowance = allowances.find(
        (allowance) => allowance.allowance_name === selectedValue
      );
      if (selectedAllowance) {
        setAllowanceList([...allowanceList, selectedAllowance.id]);
      }
    }
  };

  const handleRemoveItem = (index) => {
    const updatedList = allowanceList.filter((_, i) => i !== index);
    setAllowanceList(updatedList);
  };

  const handleSave = async () => {
    if (allowanceList.length > 0) {
      try {
        const allowanceData = { allowances: allowanceList };
        await allocateAllowanceData(employeeUuid, allowanceData);
        toast.success("Allowance policy allocated successfully");

        // Clear the form
        setAllowanceList([]); // Clear the allowance list
        if (selectRef.current) {
          selectRef.current.value = "Select"; // Reset the dropdown
        }

        // Fetch updated allowances after allocation
        const updatedAllocated = await fetchPrivilegeAllowance(employeeUuid);
        setAllocatedAllowances(updatedAllocated);
      } catch (error) {
        toast.error("Error allocating allowance policy");
        console.error("Error allocating allowance policy:", error);
      }
    } else {
      toast.error("Please select at least one allowance policy.");
    }
  };

  const getAllowanceNameById = (id) => {
    const allowance = allowances.find((allowance) => allowance.id === id);
    return allowance ? allowance.allowance_name : "Unknown";
  };

  return (
    <div className="mb-6">
      <label className="block text-black text-sm font-medium mb-2">
        Allowances
      </label>
      <div className="flex">
        <select
          id="allowances"
          className="w-full bg-gray-200 text-black p-2 rounded-lg focus:outline-none"
          onChange={(e) => handleAddItem(e.target.value)}
          ref={selectRef} // Attach the ref to the select element
        >
          <option>Select</option>
          {allowances.map((allowance, index) => (
            <option key={index} value={allowance.allowance_name}>
              {allowance.allowance_name}
            </option>
          ))}
        </select>
      </div>

      {/* Display already allocated allowances */}
      <div className="mt-4 text-black bg-slate-200 p-3 rounded">
        <span>
          <strong>Already Allocated Allowances:</strong>
        </span>
        <ul className="list-disc ml-6">
          {allocatedAllowances.length > 0 ? (
            allocatedAllowances.map((allowance, index) => (
              <li key={index} className="mt-1">
                {allowance.allowance_name}
              </li>
            ))
          ) : (
            <li>No allowances allocated yet</li>
          )}
        </ul>
      </div>

      <div className="flex gap-2 mt-2 flex-wrap">
        {allowanceList.map((id, index) => (
          <div key={index} className="bg-gray-200 text-black p-2 rounded flex items-center gap-2">
            <span>{getAllowanceNameById(id)}</span>
            <button onClick={() => handleRemoveItem(index)} className="text-red-500">
              &#10005;
            </button>
          </div>
        ))}
      </div>

      <button
        className="bg-black text-white px-4 py-2 mt-2 w-[25%] rounded-lg"
        onClick={handleSave}
      >
        Allocate
      </button>
      <Toaster />
    </div>
  );
};

export default Allowance;
