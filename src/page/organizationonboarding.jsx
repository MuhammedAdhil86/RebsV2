import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../ui/pagelayout";

// Tabs
import AddBasicInformation from "../components/company_onboarding_tabs/add_basicinfo_tab";
import AddBankInfo from "../components/company_onboarding_tabs/addbankinfo";
import OrganizationalStructure from "../components/company_onboarding_tabs/organizational_structure";
import ManagePayrollPolicy from "../components/company_onboarding_tabs/payrollpolicy";
import OrganizationalPolicy from "../components/company_onboarding_tabs/organizational_policy";

const OrganizationOnboarding = () => {
  const [activeTab, setActiveTab] = useState("details");
  const [detailsTab, setDetailsTab] = useState("basic"); // sub-tab state
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#f7f8fa] rounded-2xl overflow-hidden">
        {/* ================= HEADER ================= */}
        <div className="flex items-center bg-white px-6 py-2 border-b border-gray-200">
          <button
            className="text-sm text-gray-600 mr-3 hover:text-black"
            onClick={() => navigate(-1)}
          >
            &lt; Back
          </button>
          <h1 className="text-lg font-medium text-gray-800">
            Organization Onboarding
          </h1>
        </div>

        {/* ================= TABS ================= */}
        <div className="bg-white border-b border-gray-200">
          {/* Main Tabs */}
          <div className="flex gap-4 px-2 py-3 overflow-x-auto whitespace-nowrap">
            <TabButton
              label="Organizational Details"
              isActive={activeTab === "details"}
              onClick={() => setActiveTab("details")}
            />

            <TabButton
              label="Organizational Structure"
              isActive={activeTab === "structure"}
              onClick={() => setActiveTab("structure")}
            />

            <TabButton
              label="Payroll Policy"
              isActive={activeTab === "payroll"}
              onClick={() => setActiveTab("payroll")}
            />

            <TabButton
              label="Organizational Policy"
              isActive={activeTab === "policy"}
              onClick={() => setActiveTab("policy")}
            />
          </div>
        </div>

        {/* ================= SECTION TITLE ================= */}
        <div className="px-6 py-2">
          {activeTab === "details" && detailsTab === "basic" && (
            <h2 className="text-[14px] font-medium text-gray-800">
              Add Basic Information
            </h2>
          )}

          {activeTab === "details" && detailsTab === "bank" && (
            <h2 className="text-[14px] font-medium text-gray-800">
              Bank Details
            </h2>
          )}

          {activeTab === "structure" && (
            <h2 className="text-[14px] font-medium text-gray-800">
              Organizational Structure
            </h2>
          )}

          {activeTab === "payroll" && (
            <h2 className="text-[14px] font-medium text-gray-800">
              Manage Payroll Policy
            </h2>
          )}

          {activeTab === "policy" && (
            <h2 className="text-[14px] font-medium text-gray-800">
              Organizational Policy
            </h2>
          )}
        </div>

        {/* ================= CONTENT ================= */}
        <div className="px-4 pb-2">
          {activeTab === "details" && detailsTab === "basic" && (
            <AddBasicInformation />
          )}

          {activeTab === "details" && detailsTab === "bank" && <AddBankInfo />}

          {activeTab === "structure" && <OrganizationalStructure />}

          {activeTab === "payroll" && <ManagePayrollPolicy />}

          {activeTab === "policy" && <OrganizationalPolicy />}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OrganizationOnboarding;

/* ================= TAB BUTTON COMPONENT ================= */
const TabButton = ({ label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
        isActive
          ? "text-black border-black"
          : "text-gray-500 border-transparent hover:text-black"
      }`}
    >
      {label}
    </button>
  );
};
