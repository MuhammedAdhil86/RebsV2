import React, { useState } from "react";
import { FiBell } from "react-icons/fi";
import DashboardLayout from "../ui/pagelayout";
import WfhTab from "../components/requests_tab/wtf_tab";
import RegularizationTab from "../components/requests_tab/regularization_tab";  // <-- added

function Requests() {
  const [activeTab, setActiveTab] = useState("wfh");

  return (
    <DashboardLayout userName="Admin" onLogout={() => {}}>
      
      {/* Header */}
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

      {/* Tabs */}
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
          onClick={() => setActiveTab("attendance")}
          className={`pb-1 ${
            activeTab === "attendance"
              ? "border-b-2 border-black font-medium"
              : "text-gray-500"
          }`}
        >
          Attendance
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "wfh" && <WfhTab />}

      {activeTab === "regularization" && <RegularizationTab />} 

      {activeTab === "attendance" && (
        <div className="p-4 text-gray-600">
          Attendance Section Coming Soon...
        </div>
      )}

    </DashboardLayout>
  );
}

export default Requests;
