import React from "react";
import { FiBell } from "react-icons/fi"; // React icon for bell

const Header = ({ pageTitle, tabs, activeTab, onTabChange, onTabNavigate }) => {
  return (
    <div className="mb-2">
      <div className="flex justify-between items-center">
        {/* Left Side - Conditional Rendering for Title or Tabs */}
        {tabs ? (
          <div className="flex items-center gap-4">
            {tabs.map((tab, index) => (
              <button
                key={index}
                onClick={() => {
                  if (onTabChange) onTabChange(tab);
                  if (onTabNavigate) onTabNavigate(tab);
                }}
                className={`px-4 py-2 font-poppins font-medium text-sm border-b-2 transition-colors duration-300 ${
                  activeTab === tab
                    ? "border-black text-black"
                    : "border-transparent text-gray-600 hover:text-gray-800"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        ) : pageTitle ? (
          <div>
            <h2 className="text-lg 4xl:text-xl text-black font-poppins font-medium">
              {pageTitle}
            </h2>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <h2 className="text-lg 4xl:text-xl text-black font-poppins font-medium 4xl:font-bold">
              Hi,
            </h2>
            <h2 className="text-base 4xl:text-lg text-gray-600 font-poppins font-medium">
              Welcome Back
            </h2>
          </div>
        )}

        {/* Right Side */}
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-full border border-neutral-400">
            <FiBell className="w-4 h-4 text-black" />
          </div>
          <button className="bg-white text-black text-xs px-6 py-2 4xl:px-6 4xl:py-2 border border-gray-400 rounded-3xl">
            Settings
          </button>
          <img
            src="https://randomuser.me/api/portraits/men/75.jpg"
            alt="user"
            className="w-8 4xl:w-10 h-8 4xl:h-10 rounded-full"
          />
        </div>
      </div>
    </div>
  );
};

export default Header;
