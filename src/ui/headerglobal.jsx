import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FiBell } from "react-icons/fi";
import { Settings } from "lucide-react";
import Notification from "../page/notification";
import announceService from "../service/announceService";
import { useAuthStore } from "../store/authStore";

// How often the bell badge re-checks the unread count while the tab is visible.
const COUNT_POLL_MS = 60000;

export default function HeaderGlobal() {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Extract live user data from Zustand store
  const user = useAuthStore((state) => state.user);

  const firstName = user?.first_name || "";
  const lastName = user?.last_name || "";
  const displayName =
    `${firstName} ${lastName}`.trim() || user?.name || "Admin";

  // Use user image if available, fallback to dynamic initials avatar
  const avatarUrl =
    user?.image && user.image.trim() !== ""
      ? user.image
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&color=fff`;

  /* Unread count for the red badge (GET /employee/notification/count).
     A failed call is ignored so the bell never breaks the header. */
  const loadUnreadCount = useCallback(async () => {
    try {
      const res = await announceService.fetchNotificationCount();
      setUnreadCount(Number(res?.unread) || 0);
    } catch (err) {
      console.error("Failed to load unread count:", err);
    }
  }, []);

  useEffect(() => {
    loadUnreadCount();

    const id = setInterval(() => {
      if (document.visibilityState === "visible") loadUnreadCount();
    }, COUNT_POLL_MS);

    return () => clearInterval(id);
  }, [loadUnreadCount]);

  // After the curtain closes, messages seen while scrolling have been marked
  // read, so refresh the badge. Short delay lets the last read request land.
  const handleCloseNotifications = useCallback(() => {
    setShowNotifications(false);
    setTimeout(loadUnreadCount, 1000);
  }, [loadUnreadCount]);

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
        {/* 🔔 Notification bell. It only ever OPENS the curtain; closing is
            done by the curtain itself (X button, backdrop click or Esc) via
            onClose, so the bell is back to normal after a single close. */}
        <button
          type="button"
          onClick={() => setShowNotifications(true)}
          aria-label={
            unreadCount > 0
              ? `Open notifications, ${unreadCount} unread`
              : "Open notifications"
          }
          className={`relative w-9 h-9 flex items-center justify-center rounded-full border cursor-pointer transition-all ${
            showNotifications
              ? "bg-blue-50 border-blue-300 text-blue-600 shadow-sm"
              : "border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          <FiBell size={20} />

          {/* Red badge: only when there is something unread */}
          {unreadCount > 0 && (
            <span
              className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] font-bold leading-none ring-2 ring-white"
              aria-hidden="true"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {/* Curtain: full width, 80% height. Rendered only while open. */}
        {showNotifications && (
          <Notification onClose={handleCloseNotifications} />
        )}

        {/* Settings button: opens the /settings page (version shown on hover) */}
        <button
          type="button"
          title="Settings · rebs v2.112 · 03-07-2026 17:17:28"
          aria-label="Settings"
          className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
          onClick={() => {
            setShowNotifications(false);
            navigate("/settings");
          }}
        >
          <Settings size={20} />
        </button>

        {/* Dynamic Profile Avatar Box */}
        {/* <div className="w-9 h-9 rounded-full border border-gray-200 overflow-hidden select-none flex items-center justify-center bg-gray-100">
          <img
            src={avatarUrl}
            alt={`${displayName}'s profile avatar`}
            className="w-full h-full object-cover"
          />
        </div> */}
      </div>
    </div>
  );
}
