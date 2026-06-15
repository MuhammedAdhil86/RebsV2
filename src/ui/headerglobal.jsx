import React, { useState } from "react";
import { FiBell } from "react-icons/fi";

export default function HeaderGolbal({ userName = "Admin" }) {
  const avatar = "https://i.pravatar.cc/150?img=12";
  const [showVersion, setShowVersion] = useState(false);

  return (
    <div className="bg-white flex justify-between items-center p-4 rounded-lg font-normal w-full gap-4 relative">
      {/* ✅ Welcoming text with subtitle is now cleanly native to the global header */}
      <div className="font-normal">
        <p className="text-sm text-gray-600 font-normal">
          Hi, <span className="font-normal">{userName}</span>, welcome back!
        </p>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0 font-normal relative">
        <div className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-300 cursor-pointer hover:bg-gray-50 transition-colors">
          <FiBell className="text-gray-600 text-lg" />
        </div>

        <div className="relative">
          <button
            className="text-sm text-gray-700 border border-gray-300 px-4 py-1 rounded-full font-normal hover:bg-gray-50 transition-colors"
            onClick={() => setShowVersion(!showVersion)}
          >
            Settings
          </button>

          {/* Version Info Dropdown */}
          {showVersion && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-900 text-white text-xs p-3 rounded-lg shadow-lg z-50 pointer-events-none">
              <p className="font-semibold text-gray-300">rebs v2.111</p>
              <p className="text-gray-400 mt-1">13-06-2026 07:17:00</p>
            </div>
          )}
        </div>

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
