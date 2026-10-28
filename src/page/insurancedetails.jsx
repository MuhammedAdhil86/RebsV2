import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import DashboardLayout from "../ui/pagelayout";
import HeaderGlobal from "../ui/headerglobal";
import EmployeeInsuranceTab from "../components/insurance/employee_insurance_tab";
import InsuranceSettingsTab from "../components/insurance/insurance_settings_tab";
import InsuranceClaimsTab from "../components/insurance/claims_tab";

// Change this to the real route of your ManageInsurancePage
const MANAGE_INSURANCE_PATH = "/insurance";

const TabButton = ({ title, isActive, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`pb-1 text-[13px] transition-all relative ${
      isActive
        ? "text-black after:content-[''] after:absolute after:bottom-[-9px] after:left-0 after:w-full after:h-[2px] after:bg-black"
        : "text-gray-500 hover:text-black"
    }`}
  >
    {title}
  </button>
);

export default function InsuranceDetails() {
  const { uuid } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const employeeImage = location.state?.employeeImage;

  const [activeTab, setActiveTab] = useState(() => {
    return (
      localStorage.getItem("manage_insurance_active_tab") ||
      "employee_insurance"
    );
  });

  useEffect(() => {
    localStorage.setItem("manage_insurance_active_tab", activeTab);
  }, [activeTab]);

  const handleBack = () => {
    // location.key is "default" on refresh / direct link (no in-app history)
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate(MANAGE_INSURANCE_PATH);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-100 flex flex-col">
      <DashboardLayout>
        <div className="w-full space-y-4">
          <HeaderGlobal userName="HR Admin" />

          {/* Back button */}
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1 ml-2 text-[13px] text-gray-600 hover:text-black transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Manage Insurance
          </button>

          <div className="bg-white shadow-sm w-full rounded-lg">
            <div className="flex gap-6 border-b border-gray-200 px-5 py-3 select-none">
              <TabButton
                title="Employee Insurance"
                isActive={activeTab === "employee_insurance"}
                onClick={() => setActiveTab("employee_insurance")}
              />
              <TabButton
                title="Insurance Settings"
                isActive={activeTab === "providers"}
                onClick={() => setActiveTab("providers")}
              />
              <TabButton
                title="Insurance Claims"
                isActive={activeTab === "claims"}
                onClick={() => setActiveTab("claims")}
              />
            </div>

            <div className="p-4">
              {activeTab === "employee_insurance" && (
                <EmployeeInsuranceTab
                  uuid={uuid}
                  employeeImage={employeeImage}
                />
              )}
              {activeTab === "providers" && (
                <InsuranceSettingsTab uuid={uuid} />
              )}
              {activeTab === "claims" && <InsuranceClaimsTab uuid={uuid} />}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </div>
  );
}
