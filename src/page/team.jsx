import React, { useState, useEffect, useMemo } from "react";
import DashboardLayout from "../ui/pagelayout";
import HeaderGlobal from "../ui/headerglobal";
import OverviewView from "../components/team/OverviewView";
import ProjectsView from "../components/team/ProjectsView";

/* ---------- static data (full API response) ---------- */
// ONE data source for the whole page. Both tabs get the same projects.
// Swap for an API call later (see the TODO in Team()).
// Task `status` is optional; if the API doesn't send it, normalizeProjects
// derives it.

const ago = (days) => new Date(Date.now() - days * 86400000).toISOString();

const person = (id, name, designation, department, daysAgo = 0) => ({
  allocation_id: id,
  employee_id: String(id),
  employee_name: name,
  designation,
  department,
  allocated_at: ago(daysAgo),
});

const STATIC_RESPONSE = {
  status_code: 200,
  message: "Projects fetched successfully",
  data: {
    total: 3,
    page: 1,
    limit: 50,
    projects: [
      {
        project_id: 4,
        project: "REBS Admin Platform",
        company_id: 36,
        status: "active",
        created_by: "100557",
        created_by_name: "Muhammed Riyas A V",
        designation: "CEO",
        department: "Executive Management",
        created_at: ago(5),
        updated_at: ago(0),
        tasks: [
          {
            task_id: 8,
            task: "Completed db schema",
            status: "completed",
            created_at: ago(0),
            updated_at: ago(0),
            allocations: [
              person(
                100555,
                "Aswin P Raghu",
                "Software Developer",
                "Software Developers",
              ),
            ],
          },
          {
            task_id: 5,
            task: "Complete trial pack integration",
            status: "pending",
            created_at: ago(0),
            updated_at: ago(0),
            allocations: [],
          },
          {
            task_id: 9,
            task: "Build team module UI",
            status: "in_progress",
            created_at: ago(2),
            updated_at: ago(1),
            allocations: [
              person(
                100555,
                "Aswin P Raghu",
                "Software Developer",
                "Software Developers",
                2,
              ),
              person(100560, "Nisha K", "UI Designer", "Design", 2),
            ],
          },
        ],
      },
      {
        project_id: 5,
        project: "Mobile App",
        company_id: 36,
        status: "active",
        created_by: "100557",
        created_by_name: "Muhammed Riyas A V",
        designation: "CEO",
        department: "Executive Management",
        created_at: ago(12),
        updated_at: ago(1),
        tasks: [
          {
            task_id: 12,
            task: "Login screen",
            status: "completed",
            created_at: ago(1),
            updated_at: ago(1),
            allocations: [
              person(
                100561,
                "Rahul S",
                "Mobile Developer",
                "Software Developers",
                1,
              ),
            ],
          },
          {
            task_id: 13,
            task: "Push notifications",
            status: "in_progress",
            created_at: ago(10),
            updated_at: ago(3),
            allocations: [
              person(
                100561,
                "Rahul S",
                "Mobile Developer",
                "Software Developers",
                10,
              ),
            ],
          },
        ],
      },
      {
        project_id: 6,
        project: "Website Revamp",
        company_id: 36,
        status: "on_hold",
        created_by: "100557",
        created_by_name: "Muhammed Riyas A V",
        designation: "CEO",
        department: "Executive Management",
        created_at: ago(25),
        updated_at: ago(2),
        tasks: [
          {
            task_id: 21,
            task: "Landing page design",
            status: "completed",
            created_at: ago(0),
            updated_at: ago(0),
            allocations: [person(100560, "Nisha K", "UI Designer", "Design")],
          },
          {
            task_id: 22,
            task: "SEO audit",
            status: "pending",
            created_at: ago(20),
            updated_at: ago(20),
            allocations: [],
          },
        ],
      },
    ],
  },
};

// Make sure every task has a status. If the API doesn't send one:
// someone allocated -> in_progress, nobody allocated -> pending.
const normalizeProjects = (response) =>
  (response?.data?.projects || []).map((p) => ({
    ...p,
    tasks: (p.tasks || []).map((t) => ({
      ...t,
      status: t.status || (t.allocations?.length ? "in_progress" : "pending"),
    })),
  }));

/* ---------- page ---------- */

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "projects", label: "Projects" },
];

const TAB_KEY = "team_active_tab";

function Team() {
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem(TAB_KEY);
    // Ignore an old/unknown saved tab so the page never opens blank.
    return TABS.some((t) => t.id === saved) ? saved : "overview";
  });

  // TODO: replace STATIC_RESPONSE with an API call (fetch into state here).
  // Both tabs get the same `projects` array, so they always stay in sync.
  const projects = useMemo(() => normalizeProjects(STATIC_RESPONSE), []);

  useEffect(() => {
    localStorage.setItem(TAB_KEY, activeTab);
  }, [activeTab]);

  const tabButtonClass = (id) =>
    `pb-2 px-1 transition-all relative whitespace-nowrap ${
      activeTab === id
        ? "text-black after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-black"
        : "text-gray-500 hover:text-black"
    }`;

  const activeLabel = TABS.find((t) => t.id === activeTab)?.label;

  return (
    <DashboardLayout userName="Admin" onLogout={() => {}}>
      <div className="w-full space-y-4">
        <HeaderGlobal userName="Admin" />

        {/* Tab navigation */}
        <div
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          className="flex gap-4 border-b px-4 text-[14px] bg-white pt-2 shadow-sm rounded-t-lg select-none overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden"
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

        <div className="p-4 bg-white rounded-lg shadow-sm space-y-6">
          {/* HEADER */}
          <div>
            <h2 className="text-2xl text-black tracking-tight">Team</h2>
            <p className="text-xs text-black/40 mt-0.5">
              {activeLabel} dashboard
            </p>
          </div>

          {/* TAB PANELS */}
          {activeTab === "overview" && <OverviewView projects={projects} />}
          {activeTab === "projects" && <ProjectsView projects={projects} />}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Team;
