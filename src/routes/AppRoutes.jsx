import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Import Guards from our separate file
import { ProtectedRoute, PublicRoute } from "../components/protectedroute";

// Pages
import Login from "../page/login";
import ForgotPasswordUI from "../page/forgetpasssword";
import OtpUi from "../page/otp";
import NewPasswordUI from "../page/newpassword";
import Dashboard from "../page/dashboard";
import Settings from "../page/settings";
import LogPage from "../page/testpage";
import ManageEmployees from "../page/manageemployee";
import EmployeeProfile from "../page/employeedetails";
import EmployeeOnboarding from "../page/exployeeonbording";
import ConsolidatedData from "../components/tables/consoildate";
import ManageEmployeeShifts from "../page/manageemployeeshift";
import OrganizationOnboarding from "../page/organizationonboarding";
import Reports from "../page/resports";
import JobCreation from "../page/jobcreation";
import Requests from "../page/requests";
import EmployeeCalendar from "../page/activitycalander";
import Payroll from "../page/payroll";
import Payslip from "../page/payslip";
import Announcement from "../page/announcement";
import AssetManager from "../page/assetmanager";
import Events from "../page/event";
import Letter from "../page/letter";
import JobEnquiry from "../page/jobenquiry";

function AppRoutes() {
  return (
    <Routes>
      {/* --- Auth / Public Routes (Logged-in users CANNOT access) --- */}
      <Route path="/" element={<PublicRoute element={Login} />} />
      <Route
        path="/forgetpass"
        element={<PublicRoute element={ForgotPasswordUI} />}
      />
      <Route path="/otp" element={<PublicRoute element={OtpUi} />} />
      <Route
        path="/newpassword"
        element={<PublicRoute element={NewPasswordUI} />}
      />

      {/* --- Protected Routes (Logged-out users CANNOT access) --- */}
      <Route
        path="/dashboard"
        element={<ProtectedRoute element={Dashboard} />}
      />
      <Route
        path="/employeeonboarding"
        element={<ProtectedRoute element={EmployeeOnboarding} />}
      />
      <Route path="/settings" element={<ProtectedRoute element={Settings} />} />
      <Route
        path="/manageemployee"
        element={<ProtectedRoute element={ManageEmployees} />}
      />
      <Route path="/test" element={<ProtectedRoute element={LogPage} />} />
      <Route
        path="/details/:id"
        element={<ProtectedRoute element={EmployeeProfile} />}
      />
      <Route
        path="/consoildate"
        element={<ProtectedRoute element={ConsolidatedData} />}
      />
      <Route
        path="/shift"
        element={<ProtectedRoute element={ManageEmployeeShifts} />}
      />
      <Route path="/payslip" element={<ProtectedRoute element={Payslip} />} />
      <Route
        path="/onboarding"
        element={<ProtectedRoute element={OrganizationOnboarding} />}
      />
      <Route path="/reports" element={<ProtectedRoute element={Reports} />} />
      <Route path="/job" element={<ProtectedRoute element={JobCreation} />} />
      <Route path="/Requests" element={<ProtectedRoute element={Requests} />} />
      <Route
        path="/activity"
        element={<ProtectedRoute element={EmployeeCalendar} />}
      />
      <Route path="/payroll" element={<ProtectedRoute element={Payroll} />} />
      <Route
        path="/announcements"
        element={<ProtectedRoute element={Announcement} />}
      />
      <Route
        path="/asset"
        element={<ProtectedRoute element={AssetManager} />}
      />
      <Route path="/letter" element={<ProtectedRoute element={Letter} />} />
      <Route path="/events" element={<ProtectedRoute element={Events} />} />
      <Route
        path="/jobenquiry"
        element={<ProtectedRoute element={JobEnquiry} />}
      />

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
