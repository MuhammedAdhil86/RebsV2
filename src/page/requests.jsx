import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import DashboardLayout from "../ui/pagelayout";
import HeaderGlobal from "../ui/headerglobal"; // ✅ Integrated global header component
import WfhTab from "../components/requests_tab/wtf_tab";
import RegularizationTab from "../components/requests_tab/regularization_tab";
import DeviceRequestTab from "../components/requests_tab/device_tab";
import ClaimsRequestTab from "../components/requests_tab/claims_tab";
import DeviceApprovalModal from "../ui/devicestatusmodal";

function Requests() {
  // ✅ Lazy state initialization from localStorage to remember tab choices across refreshes
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("requests_active_tab") || "wfh";
  });

  // Modal State triggers for managing device request interactions
  const [selectedDeviceRow, setSelectedDeviceRow] = useState(null);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // ✅ Synchronize activeTab choices inside the localStorage stream container
  useEffect(() => {
    localStorage.setItem("requests_active_tab", activeTab);
  }, [activeTab]);

  // Triggers row selection context window when a user clicks an item inside UniversalTable
  const handleDeviceRowClick = (rowData) => {
    setSelectedDeviceRow(rowData);
    setIsDeviceModalOpen(true);
  };

  // Safe handler passed down to force silently reloading the table data arrays on submission success
  const handleSuccessReload = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <DashboardLayout userName="Admin" onLogout={() => {}}>
      <div className="w-full space-y-4">
        {/* ✅ Replaced raw header structure with global shared navbar element */}
        <HeaderGlobal userName="Admin" />

        {/* Navigation Tab Links Component Header Layout */}
        <div className="flex gap-4 border-b px-4 text-[14px] bg-white pt-2 shadow-sm rounded-t-lg select-none">
          <button
            type="button"
            onClick={() => setActiveTab("wfh")}
            className={`pb-2 px-1 transition-all relative font-medium ${
              activeTab === "wfh"
                ? "text-black font-semibold after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-black"
                : "text-gray-500 hover:text-black"
            }`}
          >
            Work From Home
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("regularization")}
            className={`pb-2 px-1 transition-all relative font-medium ${
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
            className={`pb-2 px-1 transition-all relative font-medium ${
              activeTab === "device"
                ? "text-black font-semibold after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-black"
                : "text-gray-500 hover:text-black"
            }`}
          >
            Device Request
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("claims")}
            className={`pb-2 px-1 transition-all relative font-medium ${
              activeTab === "claims"
                ? "text-black font-semibold after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-black"
                : "text-gray-500 hover:text-black"
            }`}
          >
            Claims Request
          </button>
        </div>

        {/* Tab Panels Display Wrapper Container */}
        <div className="mt-2">
          {activeTab === "wfh" && <WfhTab />}
          {activeTab === "regularization" && <RegularizationTab />}
          {activeTab === "device" && (
            <DeviceRequestTab
              key={refreshTrigger}
              onRowClick={handleDeviceRowClick}
            />
          )}
          {activeTab === "claims" && <ClaimsRequestTab />}
        </div>
      </div>

      {/* Device Review Modal Rendered dynamically at body root level via Portals */}
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
    </DashboardLayout>
  );
}

export default Requests;
