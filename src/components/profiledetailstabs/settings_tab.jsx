import React, { lazy, Suspense } from "react";

// Add this import line
import CompliancesSection from "../company_onboarding_tabs/settings_tabs/compliancesdeductions";

import ManagePreferences from "../company_onboarding_tabs/settings_tabs/managepreferences";
import ActionCenter from "../company_onboarding_tabs/settings_tabs/actionCenter";
import ManagePrivileges from "../company_onboarding_tabs/settings_tabs/manageprivilage";
import Salary from "../company_onboarding_tabs/settings_tabs/salary";
import LeavesSettings from "../company_onboarding_tabs/settings_tabs/leaves_settings";

export default function SettingsTab({ employee }) {
  const employeeUUID = employee?.uuid;

  if (!employeeUUID) {
    return <div className="text-gray-500 p-4">Loading settings...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-1">
      <ManagePreferences uuid={employeeUUID} initialPreferences={employee} />
      <ActionCenter employee={employee} />
      <ManagePrivileges uuid={employeeUUID} />

      {/* Ensure you are using the component here */}
      <CompliancesSection uuid={employeeUUID} />

      <Salary uuid={employeeUUID} />

      <Suspense
        fallback={<div className="text-gray-500">Loading Leaves...</div>}
      >
        <LeavesSettings uuid={employeeUUID} initialPreferences={employee} />
      </Suspense>
    </div>
  );
}
