import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../ui/pagelayout";
import HeaderGlobal from "../ui/headerglobal"; // ✅ Added import path for HeaderGlobal

// Tabs
import AddBasicInformation from "../components/company_onboarding_tabs/add_basicinfo_tab";
import AddBankInfo from "../components/company_onboarding_tabs/addbankinfo";
import OrganizationalStructure from "../components/company_onboarding_tabs/organizational_structure";
import ManagePayrollPolicy from "../components/company_onboarding_tabs/payrollpolicy";
import OrganizationalPolicy from "../components/company_onboarding_tabs/organizational_policy";

const OrganizationOnboarding = () => {
  const navigate = useNavigate();

  // ✅ Lazy state initialization for Main Tab
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("onboarding_active_tab") || "details";
  });

  // ✅ Lazy state initialization for Details Sub-Tab
  const [detailsTab, setDetailsTab] = useState(() => {
    return localStorage.getItem("onboarding_details_sub_tab") || "basic";
  });

  // ✅ Sync Main Tab to localStorage
  useEffect(() => {
    localStorage.setItem("onboarding_active_tab", activeTab);
  }, [activeTab]);

  // ✅ Sync Sub-Tab to localStorage
  useEffect(() => {
    localStorage.setItem("onboarding_details_sub_tab", detailsTab);
  }, [detailsTab]);

  return (
    <DashboardLayout>
      <div className="w-full ">
        {/* ✅ Global Shared Navbar Header */}
        <HeaderGlobal userName="Admin" />

        <div className="min-h-screen bg-[#f7f8fa] rounded-2xl overflow-hidden">
          {/* ================= BACK BUTTON ROW ================= */}
          <div className="flex items-center bg-white px-6 py-3 border-b border-gray-200">
            <button
              type="button"
              className="text-sm font-medium text-gray-600 mr-3 hover:text-black transition-colors"
              onClick={() => navigate(-1)}
            >
              &lt; Back
            </button>
            <h1 className="text-base font-semibold text-gray-800">
              Organization Onboarding
            </h1>
          </div>

          {/* ================= TABS NAVIGATION ================= */}
          <div className="bg-white border-b border-gray-200">
            <div className="flex gap-4 px-4 py-1 overflow-x-auto whitespace-nowrap select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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

          {/* ================= SUB-TABS (Only if on Organizational Details) ================= */}
          {activeTab === "details" && (
            <div className="bg-white border-b border-gray-100 flex gap-4 px-6 py-2 text-xs font-medium text-gray-500">
              <button
                type="button"
                onClick={() => setDetailsTab("basic")}
                className={`transition-colors ${detailsTab === "basic" ? "text-blue-600 font-bold" : "hover:text-gray-800"}`}
              >
                Basic Details
              </button>
              <button
                type="button"
                onClick={() => setDetailsTab("bank")}
                className={`transition-colors ${detailsTab === "bank" ? "text-blue-600 font-bold" : "hover:text-gray-800"}`}
              >
                Bank Info
              </button>
            </div>
          )}

          {/* ================= SECTION TITLE ================= */}
          <div className="px-6 py-3">
            {activeTab === "details" && detailsTab === "basic" && (
              <h2 className="text-[14px] font-semibold text-gray-800">
                Add Basic Information
              </h2>
            )}
            {activeTab === "details" && detailsTab === "bank" && (
              <h2 className="text-[14px] font-semibold text-gray-800">
                Bank Details
              </h2>
            )}
            {activeTab === "structure" && (
              <h2 className="text-[14px] font-semibold text-gray-800">
                Organizational Structure
              </h2>
            )}
            {activeTab === "payroll" && (
              <h2 className="text-[14px] font-semibold text-gray-800">
                Manage Payroll Policy
              </h2>
            )}
            {activeTab === "policy" && (
              <h2 className="text-[14px] font-semibold text-gray-800">
                Organizational Policy
              </h2>
            )}
          </div>

          {/* ================= RENDER TABS CONTENT ================= */}
          <div className="px-6 pb-6">
            {activeTab === "details" && detailsTab === "basic" && (
              <AddBasicInformation />
            )}
            {activeTab === "details" && detailsTab === "bank" && (
              <AddBankInfo />
            )}
            {activeTab === "structure" && <OrganizationalStructure />}
            {activeTab === "payroll" && <ManagePayrollPolicy />}
            {activeTab === "policy" && <OrganizationalPolicy />}
          </div>
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
      type="button"
      onClick={onClick}
      className={`px-3 py-3 text-sm font-medium border-b-2 transition relative ${
        isActive
          ? "text-black border-black font-semibold"
          : "text-gray-500 border-transparent hover:text-black"
      }`}
    >
      {label}
    </button>
  );
};
