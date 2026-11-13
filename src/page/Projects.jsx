import React, { useState, useEffect } from "react";
import DashboardLayout from "../ui/pagelayout";
import HeaderGlobal from "../ui/headerglobal";
import OverviewView from "../components/team/OverviewView";
import ProjectsView from "../components/team/ProjectsView";
import Timelog from "../components/team/TimeLog";

/* ---------- page ---------- */

const TABS = [
  {
    id: "overview",
    label: "Overview",
    title: "Projects Overview",
    subtitle: "Tasks, team members and workload across all projects",
  },
  {
    id: "projects",
    label: "Projects",
    title: "Projects",
    subtitle: "Task status by project, employee and period",
  },
  {
    id: "timelog",
    label: "Timelog",
    title: "Timelog",
    subtitle: "Time logged by employees, projects and days",
  },
];

const TAB_KEY = "team_active_tab";

function Projects() {
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem(TAB_KEY);
    // Ignore an old/unknown saved tab so the page never opens blank.
    return TABS.some((t) => t.id === saved) ? saved : "overview";
  });

  useEffect(() => {
    localStorage.setItem(TAB_KEY, activeTab);
  }, [activeTab]);

  const tabButtonClass = (id) =>
    `pb-2 px-1 transition-all relative whitespace-nowrap ${
      activeTab === id
        ? "text-black after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-black"
        : "text-gray-500 hover:text-black"
    }`;

  const activeTabInfo = TABS.find((t) => t.id === activeTab);

  return (
    <DashboardLayout userName="Admin" onLogout={() => {}}>
      <div className="w-full space-y-4">
        <HeaderGlobal userName="Admin" />

        {/* Tab navigation */}
        <div
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          className="flex gap-4 border-b px-4 text-[14px] bg-white  shadow-sm rounded-t-lg select-none overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={tabButtonClass(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="px-4 bg-white rounded-lg shadow-sm space-y-6">
          {/* HEADER (specific to each tab) */}
          <div>
            <h2 className="text-xl text-black tracking-tight">
              {activeTabInfo?.title}
            </h2>
            <p className="text-xs text-black/40 mt-0.5">
              {activeTabInfo?.subtitle}
            </p>
          </div>

          {/* TAB PANELS (each view loads its own data from the API) */}
          {activeTab === "overview" && <OverviewView />}
          {activeTab === "projects" && <ProjectsView />}
          {activeTab === "timelog" && <Timelog />}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Projects;
