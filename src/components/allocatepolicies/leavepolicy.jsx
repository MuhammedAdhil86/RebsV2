import React, { useEffect, useRef, useState } from "react";
import {
  allocateLeaPolicy,
  fetchPrivilegeLeavePolicy,
} from "../../service/companyService";
import toast, { Toaster } from "react-hot-toast";

const LeavePolicy = ({
  leavePolicies,
  leaveList,
  setLeaveList,
  employeeUuid,
}) => {
  const selectRef = useRef(null); // Reference for the dropdown
  const [allocatedPolicies, setAllocatedPolicies] = useState([]); // State to store the already allocated policies

  // Fetch already allocated leave policies on component mount
  useEffect(() => {
    const fetchAllocatedPolicies = async () => {
      try {
        const policies = await fetchPrivilegeLeavePolicy(employeeUuid);
        setAllocatedPolicies(policies || []); // Set fetched policies
        console.log("Fetched allocated policies:", policies);
      } catch (error) {
        console.error("Error fetching allocated leave policies:", error);
      }
    };

    fetchAllocatedPolicies();
  }, [employeeUuid]);

  const handleAddItem = (selectedValue) => {
    if (selectedValue !== "Select") {
      const selectedPolicy = leavePolicies.find(
        (policy) => policy.name === selectedValue
      );
      if (selectedPolicy && !leaveList.includes(selectedPolicy.id)) {
        setLeaveList([...leaveList, selectedPolicy.id]);
      }
    }
  };

  const handleRemoveItem = (index) => {
    const updatedList = leaveList.filter((_, i) => i !== index);
    setLeaveList(updatedList);
  };

  const handleSave = async () => {
    if (leaveList.length > 0) {
      try {
        const leaveData = { leave_types: leaveList };
        await allocateLeaPolicy(employeeUuid, leaveData);

        toast.success("Leave policy allocated successfully");
        console.log("Allocated leave data:", leaveData);

        // Clear the form
        setLeaveList([]); // Clear selected leave policies
        if (selectRef.current) {
          selectRef.current.value = "Select"; // Reset dropdown
        }

        // Update allocated policies after allocation
        const updatedPolicies = leavePolicies.filter((policy) =>
          leaveList.includes(policy.id)
        );
        setAllocatedPolicies([...allocatedPolicies, ...updatedPolicies]);
      } catch (error) {
        toast.error("Error allocating leave policy");
        console.error("Error allocating leave policy:", error);
      }
    } else {
      toast.warning("Please select at least one leave policy.");
    }
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-black mb-2">
        Leave Policies
      </label>
      <div className="flex">
        <select
          id="leave-policies"
          className="w-full text-black bg-gray-200 p-2 rounded-lg focus:outline-none"
          onChange={(e) => handleAddItem(e.target.value)}
          ref={selectRef} // Attach ref to the select element
        >
          <option>Select</option>
          {(leavePolicies && leavePolicies.length > 0 ? leavePolicies : []).map(
            (policy, index) => (
              <option key={index} value={policy.name}>
                {policy.name}
              </option>
            )
          )}
        </select>
      </div>

      {/* Display already allocated policies */}
      <div className="mt-4 text-black bg-slate-200 p-3 rounded">
        <span>
          <strong>Already Allocated Policies:</strong>
        </span>
        <ul className="list-disc ml-6">
          {allocatedPolicies.length > 0 ? (
            allocatedPolicies.map((policy, index) => (
              <li key={index} className="mt-1">
                {policy.name}
              </li>
            ))
          ) : (
            <li>No policies allocated yet</li>
          )}
        </ul>
      </div>

      <div className="flex gap-2 mt-2 flex-wrap">
        {leaveList.map((item, index) => {
          const policy = leavePolicies.find((policy) => policy.id === item);
          return (
            <div
              key={index}
              className="bg-gray-200 text-black p-2 rounded flex items-center gap-2"
            >
              <span>{policy ? policy.name : "Unknown Policy"}</span>
              <button
                onClick={() => handleRemoveItem(index)}
                className="text-red-500"
              >
                &#10005;
              </button>
            </div>
          );
        })}
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

export default LeavePolicy;
