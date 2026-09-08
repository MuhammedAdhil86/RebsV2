import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import DashboardLayout from "../ui/pagelayout";
import HeaderGlobal from "../ui/headerglobal";
import WfhTab from "../components/requests_tab/wtf_tab";
import RegularizationTab from "../components/requests_tab/regularization_tab";
import DeviceRequestTab from "../components/requests_tab/device_tab";
import ClaimsRequestTab from "../components/requests_tab/claims_tab";
import InsuranceClaimTab from "../components/requests_tab/insuranceclaim";
import LeaveRequestes from "../components/tables/leaverequests";
import DeviceApprovalModal from "../ui/devicestatusmodal";
import InsuranceApprovalModal from "../ui/insurancestatusmodal";

function Requests() {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("requests_active_tab") || "wfh";
  });

  const [selectedDeviceRow, setSelectedDeviceRow] = useState(null);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);

  const [selectedInsuranceRow, setSelectedInsuranceRow] = useState(null);
  const [isInsuranceModalOpen, setIsInsuranceModalOpen] = useState(false);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    localStorage.setItem("requests_active_tab", activeTab);
  }, [activeTab]);

  const handleDeviceRowClick = (rowData) => {
    setSelectedDeviceRow(rowData);
    setIsDeviceModalOpen(true);
  };

  const handleInsuranceRowClick = (rowData) => {
    setSelectedInsuranceRow(rowData);
    setIsInsuranceModalOpen(true);
  };

  const handleSuccessReload = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <DashboardLayout userName="Admin" onLogout={() => {}}>
      <div className="w-full space-y-4">
        <HeaderGlobal userName="Admin" />

        {/* Tab Navigation Header with explicit inline & Tailwind scrollbar suppression */}
        <div
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
          className="flex gap-4 border-b px-4 text-[14px] bg-white pt-2 shadow-sm rounded-t-lg select-none overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden"
        >
          <button
            type="button"
            onClick={() => setActiveTab("wfh")}
            className={`pb-2 px-1 transition-all relative font-medium whitespace-nowrap ${
              activeTab === "wfh"
                ? "text-black font-semibold after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-black"
                : "text-gray-500 hover:text-black"
            }`}
          >
            Work From Home
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("leave")}
            className={`pb-2 px-1 transition-all relative font-medium whitespace-nowrap ${
              activeTab === "leave"
                ? "text-black font-semibold after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-black"
                : "text-gray-500 hover:text-black"
            }`}
          >
            Leave Requests
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("regularization")}
            className={`pb-2 px-1 transition-all relative font-medium whitespace-nowrap ${
              activeTab === "regularization"
                ? "text-black font-semibold after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-black"
                : "text-gray-500 hover:text-black"
            }`}
          >
            Regularization
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("device")}
            className={`pb-2 px-1 transition-all relative font-medium whitespace-nowrap ${
              activeTab === "device"
                ? "text-black font-semibold after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-black"
                : "text-gray-500 hover:text-black"
            }`}
          >
            Change Device
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("claims")}
            className={`pb-2 px-1 transition-all relative font-medium whitespace-nowrap ${
              activeTab === "claims"
                ? "text-black font-semibold after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-black"
                : "text-gray-500 hover:text-black"
            }`}
          >
            Expense Claim
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("insurance")}
            className={`pb-2 px-1 transition-all relative font-medium whitespace-nowrap ${
              activeTab === "insurance"
                ? "text-black font-semibold after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-black"
                : "text-gray-500 hover:text-black"
            }`}
          >
            Insurance Claim
          </button>
        </div>

        {/* Tab Panels */}
        <div className="mt-2">
          {activeTab === "wfh" && <WfhTab />}
          {activeTab === "leave" && <LeaveRequestes />}
          {activeTab === "regularization" && <RegularizationTab />}
          {activeTab === "device" && (
            <DeviceRequestTab
              key={`device-${refreshTrigger}`}
              onRowClick={handleDeviceRowClick}
            />
          )}
          {activeTab === "claims" && <ClaimsRequestTab />}
          {activeTab === "insurance" && (
            <InsuranceClaimTab
              key={`insurance-${refreshTrigger}`}
              onRowClick={handleInsuranceRowClick}
            />
          )}
        </div>
      </div>

      {/* Device Review Modal */}
      {isDeviceModalOpen &&
        selectedDeviceRow &&
        createPortal(
          <DeviceApprovalModal
            open={isDeviceModalOpen}
            data={selectedDeviceRow}
            onClose={() => {
              setIsDeviceModalOpen(false);
              setSelectedDeviceRow(null);
            }}
            onSuccess={handleSuccessReload}
            onOptimisticUpdate={(id, nextStatus) => {
              console.log(
                `Optimistic updates targeted toward request #${id} changing to status: ${nextStatus}`,
              );
            }}
          />,
          document.body,
        )}

      {/* Insurance Review Modal */}
      {isInsuranceModalOpen &&
        selectedInsuranceRow &&
        createPortal(
          <InsuranceApprovalModal
            open={isInsuranceModalOpen}
            data={selectedInsuranceRow}
            onClose={() => {
              setIsInsuranceModalOpen(false);
              setSelectedInsuranceRow(null);
            }}
            onSuccess={handleSuccessReload}
            onOptimisticUpdate={(id, nextStatus) => {
              console.log(
                `Optimistic update targeted toward insurance claim #${id} changing to status: ${nextStatus}`,
              );
            }}
          />,
          document.body,
        )}
    </DashboardLayout>
  );
}

export default Requests;
