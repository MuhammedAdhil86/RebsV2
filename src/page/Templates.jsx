import React, { useState } from "react";
import { Toaster } from "react-hot-toast";
import DashboardLayout from "../ui/pagelayout";
import HeaderGlobal from "../ui/headerglobal";

// Adjust these two paths to wherever your files actually live
import EmailTemplates from "../components/template/email";
import Letter from "../components/template/letter";

const TABS = [
  { key: "email", label: "Email" },
  { key: "letter", label: "Letter" },
];

const Templates = () => {
  const [activeMenu, setActiveMenu] = useState("email");

  return (
    <DashboardLayout>
      <Toaster position="top-right" />
      <div className="w-full space-y-4">
        <HeaderGlobal userName="Admin" />

        {/* Top-level tabs: Email / Letter */}
        <div className="font-poppins font-normal px-3 text-black">
          <div className="flex gap-6 border-b border-gray-100 px-2 text-[13px]">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveMenu(tab.key)}
                className={`pb-2 transition-all relative cursor-pointer ${
                  activeMenu === tab.key
                    ? "text-black font-semibold after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-black"
                    : "text-gray-400 hover:text-black"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Active tab content (no layout/header inside these anymore) */}
        {activeMenu === "email" ? <EmailTemplates /> : <Letter />}
      </div>
    </DashboardLayout>
  );
};

export default Templates;
