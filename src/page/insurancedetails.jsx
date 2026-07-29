import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import DashboardLayout from "../ui/pagelayout";
import HeaderGlobal from "../ui/headerglobal";
import EmployeeInsuranceTab from "../components/insurance/employee_insurance_tab";
import ProvidersTab from "../components/insurance/providers";
import InsuranceClaimsTab from "../components/insurance/claims_tab";

const TabButton = ({ title, isActive, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`pb-1 text-[13px] font-medium transition-all relative ${
      isActive
        ? "text-black font-semibold after:content-[''] after:absolute after:bottom-[-9px] after:left-0 after:w-full after:h-[2px] after:bg-black"
        : "text-gray-500 hover:text-black"
    }`}
  >
    {title}
  </button>
);

export default function InsuranceDetails() {
  const { uuid } = useParams();
  const location = useLocation();
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

  return (
    <div className="min-h-screen w-full bg-gray-100 flex flex-col">
      <DashboardLayout>
        <div className="w-full space-y-4">
          <HeaderGlobal userName="HR Admin" />

          <div className="bg-white shadow-sm w-full rounded-lg">
            <div className="flex gap-6 border-b border-gray-200 px-5 py-3 select-none">
              <TabButton
                title="Employee Insurance"
                isActive={activeTab === "employee_insurance"}
                onClick={() => setActiveTab("employee_insurance")}
              />
              <TabButton
                title="Providers"
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
              {activeTab === "providers" && <ProvidersTab uuid={uuid} />}
              {activeTab === "claims" && <InsuranceClaimsTab uuid={uuid} />}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </div>
  );
}
