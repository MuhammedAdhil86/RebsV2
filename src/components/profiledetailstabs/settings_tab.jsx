import React, { lazy, Suspense } from "react";

// Lightweight components
import ManagePreferences from "../company_onboarding_tabs/settings_tabs/managepreferences";
import ActionCenter from "../company_onboarding_tabs/settings_tabs/actionCenter";
import ManagePrivileges from "../company_onboarding_tabs/settings_tabs/manageprivilage";
import CompliancesDeductions from "../company_onboarding_tabs/settings_tabs/compliancesdeductions";
import Salary from "../company_onboarding_tabs/settings_tabs/salary";
import LeavesSettings from "../company_onboarding_tabs/settings_tabs/leaves_settings";

// Lazy-loaded heavy components
const LeavesVacation = lazy(
  () => import("../company_onboarding_tabs/settings_tabs/leaves_settings"),
);

export default function SettingsTab({ employee }) {
  // Guard against undefined employee
  const employeeUUID = employee?.uuid;

  if (!employeeUUID) {
    return <div className="text-gray-500 p-4">Loading settings...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-1">
      {/* Lightweight components */}
      <ManagePreferences uuid={employeeUUID} initialPreferences={employee} />
      <ActionCenter employee={employee} />
      <ManagePrivileges uuid={employeeUUID} />
      <CompliancesDeductions employee={employee} />
      <Salary uuid={employeeUUID} />
      {/* Lazy-loaded components with fallback */}
      <Suspense
        fallback={<div className="text-gray-500">Loading Leaves...</div>}
      >
        <LeavesSettings uuid={employeeUUID} initialPreferences={employee} />
      </Suspense>
    </div>
  );
}
