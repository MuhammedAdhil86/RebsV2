import React, { useState, useEffect, useRef } from "react";
import { FiBell } from "react-icons/fi";
import Notification from "../page/notification";
import { useAuthStore } from "../store/authStore"; // ✅ Import your Zustand store

export default function HeaderGlobal() {
  const [showVersion, setShowVersion] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notificationRef = useRef(null);
  const settingsRef = useRef(null);

  // ✅ Extract live user data from Zustand store
  const user = useAuthStore((state) => state.user);

  const firstName = user?.first_name || "";
  const lastName = user?.last_name || "";
  const displayName =
    `${firstName} ${lastName}`.trim() || user?.name || "Admin";

  // ✅ Use user image if available, fallback to dynamic initials avatar
  const avatarUrl =
    user?.image && user.image.trim() !== ""
      ? user.image
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&color=fff`;

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
      {/* Welcoming text with dynamic user name */}
      <div className="font-normal">
        <p className="text-sm text-gray-600 font-normal">
          Hi, <span className="font-semibold text-gray-800">{displayName}</span>
          ! Welcome back. Hope you're having a great day!
        </p>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0 font-normal relative">
        {/* 🔔 Notification Icon & Popover Container */}
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowVersion(false);
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
              setShowNotifications(false);
            }}
          >
            Settings
          </button>

          {/* Version Info Dropdown */}
          {showVersion && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-900 text-white text-xs p-3 rounded-lg shadow-lg z-50">
              <p className="font-semibold text-gray-300">rebs v2.112</p>
              <p className="text-gray-400 mt-1">03-07-2026 17:17:28</p>
            </div>
          )}
        </div>

        {/* Dynamic Profile Avatar Box */}
        <div className="w-9 h-9 rounded-full border border-gray-200 overflow-hidden select-none flex items-center justify-center bg-gray-100">
          <img
            src={avatarUrl}
            alt={`${displayName}'s profile avatar`}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}
