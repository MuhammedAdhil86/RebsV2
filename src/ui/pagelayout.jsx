import React, { useState } from "react";
import SideBar from "../components/sidebar";

function DashboardLayout({ userName, onLogout, children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => setIsCollapsed((prev) => !prev);

  return (
    // Prevent the whole screen from scrolling horizontally
    <div className="flex h-screen w-screen bg-black overflow-hidden">
      {/* Sidebar - Fixed width based on state */}
      <SideBar
        userData={{ name: userName }}
        isCollapsed={isCollapsed}
        toggleSidebar={toggleSidebar}
      />

      {/* Main container */}
      <div
        className={`flex flex-col transition-all duration-500 ease-in-out m-3 
          /* min-w-0 is CRITICAL to prevent children from expanding this div */
          min-w-0 flex-1 ${isCollapsed ? "md:ml-[6%]" : "md:ml-[20%]"}`}
      >
        {/* The White Box Area */}
        <div className="bg-[#f9fafb] h-[97vh] rounded-2xl shadow-lg flex flex-col transition-all duration-500 overflow-hidden">
          {/* This is the data fetch area. 
              'overflow-x-auto' ensures that if a table is too wide, 
              the scrollbar appears HERE, not on the browser window.
          */}
          <div className="flex-1 overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
