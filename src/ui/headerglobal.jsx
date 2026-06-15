import React, { useState, useEffect, useRef } from "react";
import { FiBell } from "react-icons/fi";
import Notification from "../page/notification";

export default function HeaderGolbal({ userName = "Admin" }) {
  const avatar = "https://i.pravatar.cc/150?img=12";
  const [showVersion, setShowVersion] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notificationRef = useRef(null);
  const settingsRef = useRef(null);

  // Close dropdowns cleanly if user clicks anywhere outside of them
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowVersion(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="bg-white flex justify-between items-center p-4 rounded-lg font-normal w-full gap-4 relative">
      {/* Welcoming text with subtitle */}
      <div className="font-normal">
        <p className="text-sm text-gray-600 font-normal">
          Hi, <span className="font-normal">{userName}</span>, welcome back!
        </p>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0 font-normal relative">
        {/* 🔔 Notification Icon & Popover Container */}
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowVersion(false); // Close version dropdown if open
            }}
            className={`w-9 h-9 flex items-center justify-center rounded-full border cursor-pointer transition-all ${
              showNotifications
                ? "bg-blue-50 border-blue-300 text-blue-600 shadow-sm"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <FiBell className="text-lg" />
          </button>

          {/* Render overlay view when active */}
          {showNotifications && (
            <div className="absolute right-[-80px] sm:right-0 mt-2 w-[calc(100vw-32px)] sm:w-[480px] max-w-[550px] bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
              {/* Constrain height inside header drop layout view */}
              <div className="max-h-[500px] overflow-y-auto [scrollbar-width:thin]">
                <Notification />
              </div>
            </div>
          )}
        </div>

        {/* Settings Container Layout */}
        <div className="relative" ref={settingsRef}>
          <button
            className="text-sm text-gray-700 border border-gray-300 px-4 py-1 rounded-full font-normal hover:bg-gray-50 transition-colors"
            onClick={() => {
              setShowVersion(!showVersion);
              setShowNotifications(false); // Close notifications if open
            }}
          >
            Settings
          </button>

          {/* Version Info Dropdown */}
          {showVersion && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-900 text-white text-xs p-3 rounded-lg shadow-lg z-50">
              <p className="font-semibold text-gray-300">rebs v2.111</p>
              <p className="text-gray-400 mt-1">13-06-2026 07:17:00</p>
            </div>
          )}
        </div>

        {/* Profile Avatar Box */}
        <div className="w-9 h-9 rounded-full border border-gray-200 overflow-hidden select-none">
          <img
            src={avatar}
            alt="User profile avatar"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}
