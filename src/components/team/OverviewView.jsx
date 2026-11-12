import React, { useState, useEffect, useMemo } from "react";
import { Folder, ListChecks, Users, AlertTriangle } from "lucide-react";
import teamService from "../../service/teamservice"; // adjust path if different

/* ---------- helpers + small UI pieces ---------- */

const num = (v) =>
  v === null || v === undefined || Number.isNaN(Number(v))
    ? "—"
    : Number(v).toLocaleString("en-IN");

const humanize = (s) => {
  if (!s) return "—";
  const t = String(s).replace(/_/g, " ").trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
};

const formatDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const Badge = ({ children, className = "bg-zinc-100 text-zinc-600" }) => (
  <span
    className={`inline-block px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap ${className}`}
  >
    {children}
  </span>
);

const StatCard = ({ icon: IconCmp, label, value, hint }) => (
  <div className="border border-black/10 rounded-2xl bg-white shadow-sm p-4">
    <div className="flex items-center gap-2 text-black/50">
      {IconCmp && <IconCmp size={14} />}
      <span className="text-xs">{label}</span>
    </div>
    <p className="text-2xl text-black mt-2 tracking-tight">{value}</p>
    {hint && <p className="text-[11px] text-black/40 mt-1">{hint}</p>}
  </div>
);

/* ---------- Overview tab ---------- */

const STATUS_STYLES = {
  active: "bg-emerald-50 text-emerald-700",
  completed: "bg-zinc-100 text-zinc-600",
  on_hold: "bg-amber-50 text-amber-700",
};

const OverviewView = () => {
  const [projects, setProjects] = useState([]);
  const [total, setTotal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // GET /admin/projects/overview
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    teamService
      .fetchProjectsOverview({ page: 1, limit: 50 })
      .then((res) => {
        if (cancelled) return;
        setProjects(res.projects);
        setTotal(res.total);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err.response?.data?.message ||
            err.message ||
            "Could not load projects.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const { taskCount, members, unassigned } = useMemo(() => {
    const memberIds = new Set();
    const open = [];
    let count = 0;

    projects.forEach((p) =>
      (p.tasks || []).forEach((t) => {
        count += 1;
        if (!t.allocations?.length) {
          open.push({ ...t, project: p.project });
        }
        (t.allocations || []).forEach((a) => memberIds.add(a.employee_id));
      }),
    );

    return { taskCount: count, members: memberIds.size, unassigned: open };
  }, [projects]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm text-black">Loading projects…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm text-black">Could not load projects</p>
        <p className="text-xs text-black/40 mt-1">{error}</p>
        <button
          type="button"
          onClick={() => setReloadKey((k) => k + 1)}
          className="mt-4 px-3.5 py-2 text-xs rounded-lg bg-black text-white hover:bg-black/80 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <>
      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Folder}
          label="Projects"
          value={num(total ?? projects.length)}
        />
        <StatCard icon={ListChecks} label="Tasks" value={num(taskCount)} />
        <StatCard icon={Users} label="Members" value={num(members)} />
        <StatCard
          icon={AlertTriangle}
          label="Unassigned tasks"
          value={num(unassigned.length)}
        />
      </div>

      {/* PROJECTS + UNASSIGNED */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 items-start">
        {/* Projects loop: project -> tasks -> allocations */}
        <div className="space-y-6">
          {projects.length === 0 ? (
            <div className="border border-black/10 rounded-2xl bg-white shadow-sm py-16 text-center">
              <p className="text-sm text-black">No projects yet</p>
              <p className="text-xs text-black/40 mt-1">
                Projects will appear here once they are created.
              </p>
            </div>
          ) : (
            projects.map((p) => (
              <div
                key={p.project_id}
                className="border border-black/10 rounded-2xl bg-white shadow-sm overflow-hidden"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 border-b border-black/10">
                  <div className="min-w-0">
                    <h3 className="text-sm text-black">{p.project}</h3>
                    <p className="text-xs text-black/40 mt-0.5">
                      Created by {p.created_by_name}
                      {[p.designation, p.department].filter(Boolean).length
                        ? ` (${[p.designation, p.department]
                            .filter(Boolean)
                            .join(" | ")})`
                        : ""}{" "}
                      on {formatDate(p.created_at)}
                    </p>
                  </div>
                  <Badge
                    className={
                      STATUS_STYLES[p.status] || "bg-zinc-100 text-zinc-600"
                    }
                  >
                    {humanize(p.status)}
                  </Badge>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[560px]">
                    <thead>
                      <tr className="bg-zinc-50 text-black/50 border-b border-black/10">
                        <th className="font-normal px-5 py-3">Task</th>
                        <th className="font-normal px-3 py-3">Assigned to</th>
                        <th className="font-normal px-5 py-3">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {(p.tasks || []).length === 0 ? (
                        <tr>
                          <td
                            colSpan={3}
                            className="px-5 py-10 text-center text-black/40"
                          >
                            No tasks in this project yet.
                          </td>
                        </tr>
                      ) : (
                        p.tasks.map((t) => (
                          <tr
                            key={t.task_id}
                            className="hover:bg-black/[0.02] transition-colors align-top"
                          >
                            <td className="px-5 py-3.5 text-sm text-black">
                              {t.task}
                            </td>
                            <td className="px-3 py-3.5">
                              {t.allocations?.length ? (
                                <ul className="space-y-2">
                                  {t.allocations.map((a) => (
                                    <li key={a.allocation_id}>
                                      <p className="text-sm text-black">
                                        {a.employee_name}
                                      </p>
                                      <p className="text-[11px] text-black/40 mt-0.5">
                                        {[a.designation, a.department]
                                          .filter(Boolean)
                                          .join(" | ")}{" "}
                                        · Allocated {formatDate(a.allocated_at)}
                                      </p>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <Badge className="bg-amber-50 text-amber-700">
                                  Unassigned
                                </Badge>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-black whitespace-nowrap">
                              {formatDate(t.created_at)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Unassigned tasks */}
        <aside className="border border-black/10 rounded-2xl bg-white shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-black/10">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-black" />
              <h3 className="text-sm text-black">Needs attention</h3>
            </div>
            <span className="text-[11px] text-white bg-black rounded-full px-2 py-0.5">
              {unassigned.length}
            </span>
          </div>

          {unassigned.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-black">All clear</p>
              <p className="text-xs text-black/40 mt-1">
                Every task has someone assigned.
              </p>
            </div>
          ) : (
            <ul className="max-h-[320px] overflow-y-auto divide-y divide-black/5">
              {unassigned.map((t) => (
                <li key={t.task_id} className="px-5 py-3.5">
                  <p className="text-sm text-black">{t.task}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <Badge>{t.project}</Badge>
                    <Badge className="bg-red-50 text-red-600">
                      No one assigned
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </>
  );
};

export default OverviewView;
