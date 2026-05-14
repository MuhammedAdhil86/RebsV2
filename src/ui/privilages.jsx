import React, { useState, useEffect } from "react";
import AttendancePolicy from "../components/allocatepolicies/attendancepolicy";
import LeavePolicy from "../components/allocatepolicies/leavepolicy";
import Allowance from "../components/allocatepolicies/allowance";
import Compliance from "../components/allocatepolicies/compliance";
import Roles from "../components/allocatepolicies/roles";
import {
  fetchPolicyData,
  fetchLeavePolicy,
  AllowanceDataGet,
  ComplianceDataGet,
} from "../service/companyService";
import AttendanceReq from "../components/allocatepolicies/attendancereq";

const Privilege = ({ employee }) => {
  console.log("empl", employee.uuid);
  const [roles, setRoles] = useState([]);
  const [attendanceList, setAttendanceList] = useState([]);
  const [leaveList, setLeaveList] = useState([]);
  const [allowanceList, setAllowanceList] = useState([]);
  const [complianceList, setComplianceList] = useState([]);

  const [attendancePolicies, setAttendancePolicies] = useState([]);
  const [leavePolicies, setLeavePolicies] = useState([]);
  const [allowances, setAllowances] = useState([]);
  const [compliances, setCompliances] = useState([]);

  useEffect(() => {
    // Fetch data using employee.uuid
    fetchPolicyData(employee.uuid).then((data) => setAttendancePolicies(data));
    fetchLeavePolicy(employee.uuid).then((data) => setLeavePolicies(data));
    AllowanceDataGet(employee.uuid).then((data) => setAllowances(data));
    ComplianceDataGet(employee.uuid).then((data) => setCompliances(data));
  }, [employee.uuid],[employee]);
console.log("ghfjf",leavePolicies,attendancePolicies,allowances,compliances);

  return (
    <div className="flex flex-col items-center justify-start h-full px-4">
      <div className="w-full ml-8 mb-4 mt-8">
        <h1 className="text-2xl text-black font-semibold">Add Privilege</h1>
        <p className="text-sm text-black">
          Grant Special Access to Users or Roles
        </p>
      </div>

      <div className="container w-full p-4">
      <AttendanceReq
          roles={roles}
          employees={employee}
          employeeUuid={employee.uuid}
        />
        <Roles
         roles={roles}
         employees={employee}
         employeeUuid={employee.uuid}
          />
        <AttendancePolicy
          attendancePolicies={attendancePolicies}
          attendanceList={attendanceList}
          setAttendanceList={setAttendanceList}
          employeeUuid={employee.uuid} // Pass employee.uuid as a prop
        />
        <LeavePolicy
          leavePolicies={leavePolicies}
          leaveList={leaveList}
          setLeaveList={setLeaveList}
          employeeUuid={employee.uuid} // Pass employee.uuid as a prop
        />
        <Allowance
          allowances={allowances}
          allowanceList={allowanceList}
          setAllowanceList={setAllowanceList}
          employeeUuid={employee.uuid} // Pass employee.uuid as a prop
        />
        <Compliance
          compliances={compliances}
          complianceList={complianceList}
          setComplianceList={setComplianceList}
          employeeUuid={employee.uuid} // Pass employee.uuid as a prop
        />
      </div>
    </div>
  );
};

export default Privilege;
