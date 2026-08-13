import React, { useState, useEffect } from "react";
import SideBar from "../components/sidebar";
import MarkHappinessModal from "./MarkHappinessModal";
import dashboardService from "../service/dashboardService";

function DashboardLayout({ userName, onLogout, children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showHappinessModal, setShowHappinessModal] = useState(false);

  const toggleSidebar = () => setIsCollapsed((prev) => !prev);

  useEffect(() => {
    let timer;

    const checkHappinessStatus = async () => {
      try {
        const response = await dashboardService.fetchHappinessRating();

        // Safe evaluation handling both unwrapped and wrapped Axios interceptor responses
        const resData = response?.data || response;
        const submittedToday = resData?.submitted_today;

        if (submittedToday === false) {
          timer = setTimeout(() => {
            setShowHappinessModal(true);
          }, 5000);
        }
      } catch (error) {
        console.error("Error checking happiness status:", error);
      }
    };

    checkHappinessStatus();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <div className="flex h-screen w-screen bg-black overflow-hidden">
      {/* Global Happiness Rating Modal */}
      <MarkHappinessModal
        isOpen={showHappinessModal}
        onClose={() => setShowHappinessModal(false)}
        onSuccess={() => setShowHappinessModal(false)}
      />

      {/* Sidebar - Fixed width based on state */}
      <SideBar
        userData={{ name: userName }}
        isCollapsed={isCollapsed}
        toggleSidebar={toggleSidebar}
      />

      {/* Main container */}
      <div
        className={`flex flex-col transition-all duration-500 ease-in-out m-3 
          min-w-0 flex-1 ${isCollapsed ? "md:ml-[6%]" : "md:ml-[20%]"}`}
      >
        {/* The White Box Area */}
        <div className="bg-[#f9fafb] h-[97vh] rounded-2xl shadow-lg flex flex-col transition-all duration-500 overflow-hidden">
          <div className="flex-1 overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
