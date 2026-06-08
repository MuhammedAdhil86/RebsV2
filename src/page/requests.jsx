import React, { useState } from "react";
import { createPortal } from "react-dom";
import { FiBell } from "react-icons/fi";
import DashboardLayout from "../ui/pagelayout";
import WfhTab from "../components/requests_tab/wtf_tab";
import RegularizationTab from "../components/requests_tab/regularization_tab";
import DeviceRequestTab from "../components/requests_tab/device_tab";
import DeviceApprovalModal from "../ui/devicestatusmodal";

function Requests() {
  const [activeTab, setActiveTab] = useState("wfh");

  // Modal State triggers for managing device request interactions
  const [selectedDeviceRow, setSelectedDeviceRow] = useState(null);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
      {/* Header Panel */}
      <div className="bg-white flex justify-between items-center p-4 mb-4 shadow-sm rounded-lg">
        <h1 className="text-lg font-medium text-gray-800">Requests</h1>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-300">
            <FiBell className="text-gray-600 text-lg" />
          </div>

          <button className="text-sm text-gray-700 border border-gray-300 px-4 py-1 rounded-full">
            Settings
          </button>

          <div className="w-9 h-9 rounded-full border border-gray-200 overflow-hidden">
            <img
              src="https://i.pravatar.cc/150?img=12"
              alt="User"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Navigation Tab Links */}
      <div className="flex gap-4 border-b px-4 text-[14px]">
        <button
          onClick={() => setActiveTab("wfh")}
          className={`pb-1 ${
            activeTab === "wfh"
              ? "border-b-2 border-black font-medium"
              : "text-gray-500"
          }`}
        >
          Work From Home
        </button>

        <button
          onClick={() => setActiveTab("regularization")}
          className={`pb-1 ${
            activeTab === "regularization"
              ? "border-b-2 border-black font-medium"
              : "text-gray-500"
          }`}
        >
          Regularization
        </button>

        <button
          onClick={() => setActiveTab("device")}
          className={`pb-1 ${
            activeTab === "device"
              ? "border-b-2 border-black font-medium"
              : "text-gray-500"
          }`}
        >
          Device Request
        </button>
      </div>

      {/* Tab Panels Layout Mapping Container Context Blocks */}
      <div className="mt-4">
        {activeTab === "wfh" && <WfhTab />}

        {activeTab === "regularization" && <RegularizationTab />}

        {activeTab === "device" && (
          <DeviceRequestTab
            key={refreshTrigger}
            onRowClick={handleDeviceRowClick}
          />
        )}
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
              // Allows handling raw layout level mutations locally before network resolves
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
