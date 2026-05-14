import React, { useEffect, useState, useRef } from "react";
import { allocateAttPolicy, ShiftDataGet, getShiftPolicyById } from "../../service/companyService";
import toast, { Toaster } from "react-hot-toast";

const AttendancePolicy = ({
  attendancePolicies,
  attendanceList,
  setAttendanceList,
  employeeUuid
}) => {
  const [loading, setLoading] = useState(false);
  const [allocatedPolicy, setAllocatedPolicy] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [selectedShiftId, setSelectedShiftId] = useState("");
  const [isShiftsLoading, setIsShiftsLoading] = useState(true);
  const selectRef = useRef(null);

  useEffect(() => {
    const fetchShifts = async () => {
      try {
        setIsShiftsLoading(true);
        const data = await ShiftDataGet();
   
        setShifts(data);
      } catch (err) {
        console.error("Failed to fetch shift data:", err);
      } finally {
        setIsShiftsLoading(false);
      }
    };

    fetchShifts();
  }, []);

  // Fetch the already allocated policy on component mount
  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const policyResponse = await getShiftPolicyById(employeeUuid);
        
        
        // Handle array response - take the first policy if it exists
        if (Array.isArray(policyResponse) && policyResponse.length > 0) {
          setAllocatedPolicy(policyResponse[0]); // Take the first policy from the array
        } else if (policyResponse && !Array.isArray(policyResponse)) {
          setAllocatedPolicy(policyResponse); // Handle single object response
        } else {
          setAllocatedPolicy(null); // No policy found
        }
      } catch (error) {
        console.error("Failed to fetch policy:", error);
        // Set allocatedPolicy to null on error to show "No policy allocated yet"
        setAllocatedPolicy(null);
      }
    };

    if (employeeUuid) {
      fetchPolicy();
    }
  }, [employeeUuid]);

  const handleAddItem = (shiftId) => {

    if (!isShiftsLoading && shifts && shifts.length > 0) {
      setAttendanceList([shiftId]);
    }
  };

  const handleSave = async () => {
    if (attendanceList && attendanceList.length === 1) {
      setLoading(true);
      try {
     ;
        const shiftId = parseInt(attendanceList[0], 10);
        if (isNaN(shiftId)) {
          setLoading(false);
          toast.error("Invalid shift ID");
          return;
        }
        const attendanceData = {
          shift_id: shiftId,
          staff_id: employeeUuid,
        };
        await allocateAttPolicy(employeeUuid, attendanceData);
        setLoading(false);
        toast.success("Successfully allocated shift policy");

        // Find the allocated shift from shifts
        const updatedPolicy = shifts && shifts.find((shift) => shift.id === shiftId);
        setAllocatedPolicy(updatedPolicy);

        if (selectRef.current) {
          selectRef.current.value = "";
        }
        setSelectedShiftId("");
      } catch (error) {
        setLoading(false);
        toast.error("Error allocating shift policy");
        console.error("Error allocating shift policy:", error);
      }
    } else {
      alert("Please select one shift policy.");
    }
  };

  // Helper function to render allocated policy information
  const renderAllocatedPolicy = () => {
 
    
    if (!allocatedPolicy) {
      return <li>No policy allocated yet.</li>;
    }

    return (
      <>
        <li><strong>Shift:</strong> {allocatedPolicy.shift_name || "Unknown Shift"}</li>
        {allocatedPolicy.policies && allocatedPolicy.policies.length > 0 ? (
          allocatedPolicy.policies.map((policy, index) => (
            <li key={policy.id || index}>
              <strong>Policy:</strong> {policy.policy_name || "Unknown Policy"}
            </li>
          ))
        ) : (
          <li>No policies found for this shift.</li>
        )}
      </>
    );
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium mb-2 text-black">
        Allocate one shift policy
      </label>
      <div className="flex">
        <select
          id="attendance-policy"
          className="w-full text-black bg-gray-200 p-2 rounded-lg focus:outline-none"
          ref={selectRef}
          value={selectedShiftId}
          onChange={(e) => {
            const shiftId = e.target.value;
            setSelectedShiftId(shiftId);
            handleAddItem(shiftId);
          }}
          disabled={isShiftsLoading}
        >
          <option value="">Select</option>
          {isShiftsLoading ? (
            <option value="" disabled>Loading...</option>
          ) : shifts && shifts.length > 0 ? (
            shifts.map((shift) => (
              <option key={shift.id} value={shift.id}>
                {shift.shift_name}
              </option>
            ))
          ) : (
            <option value="" disabled>No shifts available</option>
          )}
        </select>
      </div>

      {/* Display already allocated policy */}
      <div className="mt-4 text-black bg-slate-200 p-3 rounded">
        <span>
          <strong>Allocated Policy:</strong>
        </span>
        <ul className="list-disc ml-6">
          {renderAllocatedPolicy()}
        </ul>
      </div>

      <div className="flex gap-2 mt-2 flex-wrap">
        {attendanceList && attendanceList.map((item, index) => {
          const policy = shifts && shifts.find((shift) => shift.id === parseInt(item, 10));
          return (
            <div key={index} className="bg-gray-200 text-black p-2 rounded flex items-center gap-2">
              <span>{policy ? policy.shift_name : "Unknown Policy"}</span>
              <button onClick={() => setAttendanceList([])} className="text-red-500">
                &#10005;
              </button>
            </div>
          );
        })}
      </div>
      <button
        className="bg-black text-white px-4 py-2 mt-2 w-[25%] rounded-lg"
        onClick={handleSave}
        disabled={loading || isShiftsLoading}
      >
        {loading ? "Allocating..." : "Allocate"}
      </button>
      <Toaster />
    </div>
  );
};

export default AttendancePolicy;