import React, { useEffect, useRef, useState } from "react";
import {
  fetchPrivilegeCompliance,
  allocateComplianceData,
} from "../../service/companyService";
import toast, { Toaster } from "react-hot-toast";

const Compliance = ({
  compliances,
  complianceList,
  setComplianceList,
  employeeUuid,
}) => {
  const selectRef = useRef(null); // Reference for the dropdown
  const [allocatedCompliances, setAllocatedCompliances] = useState([]); // State to store already allocated compliances

  // Fetch already allocated compliances on component mount
  useEffect(() => {
    const fetchAllocatedCompliances = async () => {
      try {
        const allocated = await fetchPrivilegeCompliance(employeeUuid);
        setAllocatedCompliances(allocated || []); // Set fetched compliances
        console.log("Fetched allocated compliances:", allocated);
      } catch (error) {
        console.error("Error fetching allocated compliances:", error);
      }
    };

    fetchAllocatedCompliances();
  }, [employeeUuid]);

  const handleAddItem = (selectedValue) => {
    if (selectedValue !== "Select") {
      const selectedCompliance = compliances.find(
        (compliance) => compliance.deduction_name === selectedValue
      );
      if (
        selectedCompliance &&
        !complianceList.includes(selectedCompliance.id)
      ) {
        setComplianceList([...complianceList, selectedCompliance.id]);
      }
    }
  };

  const handleRemoveItem = (index) => {
    const updatedList = complianceList.filter((_, i) => i !== index);
    setComplianceList(updatedList);
  };

  const handleSave = async () => {
    if (complianceList.length > 0) {
      try {
        const complianceData = { compliances: complianceList };
        await allocateComplianceData(employeeUuid, complianceData);
        toast.success("Compliance policy allocated successfully");

        // Clear the form
        setComplianceList([]); // Clear selected compliance policies
        if (selectRef.current) {
          selectRef.current.value = "Select"; // Reset dropdown
        }

        // Fetch updated compliances after allocation
        const updatedAllocated = await fetchPrivilegeCompliance(employeeUuid);
        setAllocatedCompliances(updatedAllocated);
      } catch (error) {
        toast.error("Error allocating compliance policy");
        console.error("Error allocating compliance policy:", error);
      }
    } else {
      toast.warning("Please select at least one compliance policy.");
    }
  };

  const getComplianceNameById = (id) => {
    const compliance = compliances.find((compliance) => compliance.id === id);
    return compliance ? compliance.deduction_name : "Unknown";
  };

  return (
    <div>
      <label className="block text-black text-sm font-medium mb-2">
        Compliance
      </label>
      <div className="flex">
        <select
          id="compliance"
          className="w-full bg-gray-200 p-2 text-black rounded-lg focus:outline-none"
          onChange={(e) => handleAddItem(e.target.value)}
          ref={selectRef}
          defaultValue="" // Add this line
        >
          <option value="" disabled>
            Select
          </option>
          {compliances.length === 0 ? (
            <option>No compliance data available</option>
          ) : (
            compliances.map((compliance, index) => (
              <option key={index} value={compliance.deduction_name}>
                {compliance.deduction_name} ({compliance.deduction_type})
              </option>
            ))
          )}
        </select>
      </div>

      {/* Display already allocated compliances */}
      <div className="mt-4 text-black bg-slate-200 p-3 rounded">
        <span>
          <strong>Already Allocated Compliances:</strong>
        </span>
        <ul className="list-disc ml-6">
          {allocatedCompliances.length > 0 ? (
            allocatedCompliances.map((compliance, index) => (
              <li key={index} className="mt-1">
                {compliance.deduction_name} ({compliance.deduction_type})
              </li>
            ))
          ) : (
            <li>No compliances allocated yet</li>
          )}
        </ul>
      </div>

      <div className="flex gap-2 mt-2 flex-wrap">
        {complianceList.map((id, index) => (
          <div
            key={index}
            className="bg-gray-200 text-black p-2 rounded flex items-center gap-2"
          >
            <span>{getComplianceNameById(id)}</span>
            <button
              onClick={() => handleRemoveItem(index)}
              className="text-red-500"
            >
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

export default Compliance;
