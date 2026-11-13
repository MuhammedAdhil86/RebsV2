import React, { useState, useEffect, useMemo } from "react";
import {
  Folder,
  ListChecks,
  Users,
  AlertTriangle,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";
import teamService from "../../service/teamservice"; // adjust path if different

/* ---------- helpers ---------- */

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

const formatDateTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/* Same palette as the dashboard KPI cards */
const COLORS = {
  green: "#EBFDEF",
  blue: "#E8EFF9",
  orange: "#FFEFE7",
  yellow: "#FFFBDB",
  red: "#FFDADA",
};

/* Stronger tones of the same palette, for chart fills (pastels are too faint on white) */
const CHART = {
  green: "#34c759",
  blue: "#5b8def",
  orange: "#ff9a62",
  yellow: "#f2c94c",
  red: "#ef6b6b",
};

const Badge = ({ children, className = "bg-zinc-100 text-zinc-600" }) => (
  <span
    className={`inline-block px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap ${className}`}
  >
    {children}
  </span>
);

/* StatCard — dashboard style: pastel bg + black round icon */
const StatCard = ({ icon: IconCmp, label, value, hint, bg }) => (
  <div
    className="shadow-sm rounded-lg p-3 flex items-center gap-3"
    style={{ backgroundColor: bg }}
  >
    <div className="flex items-center justify-center min-w-10 h-10 rounded-full bg-black text-white">
      {IconCmp && <IconCmp size={18} />}
    </div>
    <div className="overflow-hidden">
      <p className="text-gray-500 text-[10px] sm:text-xs truncate uppercase font-semibold">
        {label}
      </p>
      <h2 className="text-lg sm:text-xl font-medium text-gray-800">{value}</h2>
      {hint && <p className="text-[10px] text-gray-500 truncate">{hint}</p>}
    </div>
  </div>
);

const Avatar = ({ src, name, size = 40 }) => {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size };
  if (!src || failed) {
    return (
      <div
        style={style}
        className="rounded-full bg-black text-white flex items-center justify-center text-xs shrink-0"
      >
        {initials(name)}
      </div>
    );
  }
  return (
    <img
      src={encodeURI(src)}
      alt={name}
      style={style}
      onError={() => setFailed(true)}
      className="rounded-full object-cover shrink-0"
    />
  );
};

const Field = ({ label, value }) => (
  <div>
    <p className="text-[10px] uppercase font-semibold text-gray-400">{label}</p>
    <p className="text-xs text-black mt-0.5 break-words">{value ?? "—"}</p>
  </div>
);

/* ---------- charts (pure SVG / CSS, no extra dependency) ---------- */

const Donut = ({ assigned, unassigned }) => {
  const total = assigned + unassigned;
  const r = 40;
  const c = 2 * Math.PI * r;
  const assignedLen = total ? (assigned / total) * c : 0;
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 100 100" className="w-32 h-32 -rotate-90 shrink-0">
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={COLORS.red}
          strokeWidth="14"
        />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={CHART.green}
          strokeWidth="14"
          strokeDasharray={`${assignedLen} ${c - assignedLen}`}
        />
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="central"
          className="rotate-90 origin-center"
          style={{
            transform: "rotate(90deg)",
            transformOrigin: "50% 50%",
            fontSize: 18,
          }}
          fill="#111"
        >
          {total ? Math.round((assigned / total) * 100) : 0}%
        </text>
      </svg>
      <ul className="space-y-2 text-xs text-black">
        <li className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: CHART.green }}
          />
          Assigned · {assigned}
        </li>
        <li className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: CHART.red }}
          />
          Unassigned · {unassigned}
        </li>
      </ul>
    </div>
  );
};

const BarRow = ({ label, value, max, color, sub }) => (
  <div>
    <div className="flex items-center justify-between text-xs mb-1">
      <span className="text-black truncate pr-2">
        {label}
        {sub && <span className="text-black/40"> · {sub}</span>}
      </span>
      <span className="text-black/60">{value}</span>
    </div>
    <div className="h-2.5 rounded-full bg-zinc-100 overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${max ? (value / max) * 100 : 0}%`,
          background: color,
        }}
      />
    </div>
  </div>
);

const StackedBar = ({ assigned, unassigned }) => {
  const total = assigned + unassigned;
  return (
    <div className="h-2.5 rounded-full bg-zinc-100 overflow-hidden flex">
      <div
        style={{
          width: `${total ? (assigned / total) * 100 : 0}%`,
          background: CHART.green,
        }}
      />
      <div
        style={{
          width: `${total ? (unassigned / total) * 100 : 0}%`,
          background: CHART.red,
        }}
      />
    </div>
  );
};

const ChartCard = ({ title, subtitle, children }) => (
  <div className="border border-black/10 rounded-2xl bg-white shadow-sm p-5">
    <h3 className="text-sm text-black">{title}</h3>
    {subtitle && <p className="text-[11px] text-black/40 mt-0.5">{subtitle}</p>}
    <div className="mt-4">{children}</div>
  </div>
);

/* Pie chart for "Workload by member" */
const PIE_COLORS = [
  CHART.blue,
  CHART.green,
  CHART.orange,
  CHART.yellow,
  CHART.red,
  "#a78bfa",
  "#2dd4bf",
  "#f472b6",
];

const WorkloadPie = ({ data }) => {
  const items = data.filter((w) => w.count > 0);
  const total = items.reduce((sum, w) => sum + w.count, 0);

  if (!total) {
    return <p className="text-xs text-black/40">No tasks allocated yet.</p>;
  }

  const cx = 50;
  const cy = 50;
  const r = 48;
  let angle = -Math.PI / 2;

  const slices = items.map((w, i) => {
    const frac = w.count / total;
    const start = angle;
    const end = angle + frac * 2 * Math.PI;
    angle = end;
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const large = frac > 0.5 ? 1 : 0;
    return {
      ...w,
      pct: Math.round(frac * 100),
      full: items.length === 1,
      color: PIE_COLORS[i % PIE_COLORS.length],
      d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`,
    };
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <svg viewBox="0 0 100 100" className="w-36 h-36 shrink-0">
        {slices.map((s) =>
          s.full ? (
            <circle key={s.name} cx={cx} cy={cy} r={r} fill={s.color}>
              <title>{`${s.name} · ${s.count} tasks`}</title>
            </circle>
          ) : (
            <path
              key={s.name}
              d={s.d}
              fill={s.color}
              stroke="#fff"
              strokeWidth="1"
            >
              <title>{`${s.name} · ${s.count} task${s.count === 1 ? "" : "s"} (${s.pct}%)`}</title>
            </path>
          ),
        )}
      </svg>

      {/* legend: scrolls to the right when there are many members */}
      <div className="w-full overflow-x-auto pb-2">
        <ul className="flex items-center gap-2 w-max">
          {slices.map((s) => (
            <li
              key={s.name}
              className="flex items-center gap-2 text-xs text-black border border-black/10 rounded-full px-3 py-1.5 whitespace-nowrap shrink-0"
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: s.color }}
              />
              {s.name}
              <span className="text-black/50">
                · {s.count} ({s.pct}%)
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

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
  const [openIds, setOpenIds] = useState(() => new Set());

  const toggle = (id) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

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

  const { taskCount, members, unassigned, perProject, workload } =
    useMemo(() => {
      const memberIds = new Set();
      const open = [];
      const load = {}; // employee_id -> { name, count }
      const per = [];
      let count = 0;

      projects.forEach((p) => {
        let assignedN = 0;
        let unassignedN = 0;

        (p.team || []).forEach((m) => {
          memberIds.add(m.employee_id);
          if (!load[m.employee_id])
            load[m.employee_id] = { name: m.name, count: 0 };
        });

        (p.tasks || []).forEach((t) => {
          count += 1;
          if (!t.allocations?.length) {
            unassignedN += 1;
            open.push({ ...t, project: p.project });
          } else {
            assignedN += 1;
          }
          (t.allocations || []).forEach((a) => {
            memberIds.add(a.employee_id);
            if (!load[a.employee_id])
              load[a.employee_id] = { name: a.employee_name, count: 0 };
            load[a.employee_id].count += 1;
          });
        });

        per.push({
          id: p.project_id,
          name: p.project,
          assigned: assignedN,
          unassigned: unassignedN,
        });
      });

      return {
        taskCount: count,
        members: memberIds.size,
        unassigned: open,
        perProject: per,
        workload: Object.values(load).sort((a, b) => b.count - a.count),
      };
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

  const assignedCount = taskCount - unassigned.length;
  const maxLoad = Math.max(1, ...workload.map((w) => w.count));
  const maxPerProject = Math.max(
    1,
    ...perProject.map((p) => p.assigned + p.unassigned),
  );

  return (
    <div className="space-y-6">
      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Folder}
          label="Projects"
          value={num(total ?? projects.length)}
          bg={COLORS.green}
        />
        <StatCard
          icon={ListChecks}
          label="Tasks"
          value={num(taskCount)}
          hint={`${assignedCount} assigned`}
          bg={COLORS.blue}
        />
        <StatCard
          icon={Users}
          label="Members"
          value={num(members)}
          bg={COLORS.yellow}
        />
        <StatCard
          icon={AlertTriangle}
          label="Unassigned tasks"
          value={num(unassigned.length)}
          bg={COLORS.red}
        />
      </div>

      {/* GRAPHS */}
      {projects.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ChartCard title="Task assignment" subtitle="Assigned vs unassigned">
            <Donut assigned={assignedCount} unassigned={unassigned.length} />
          </ChartCard>

          <ChartCard
            title="Workload by member"
            subtitle="Tasks allocated per person"
          >
            {workload.length === 0 ? (
              <p className="text-xs text-black/40">No members yet.</p>
            ) : (
              <WorkloadPie data={workload} />
            )}
          </ChartCard>

          <ChartCard
            title="Tasks per project"
            subtitle="Green assigned · red unassigned"
          >
            <div className="space-y-4">
              {perProject.map((p) => (
                <div key={p.id}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-black truncate pr-2">{p.name}</span>
                    <span className="text-black/60">
                      {p.assigned + p.unassigned}
                    </span>
                  </div>
                  <div
                    style={{
                      width: `${((p.assigned + p.unassigned) / maxPerProject) * 100}%`,
                    }}
                  >
                    <StackedBar
                      assigned={p.assigned}
                      unassigned={p.unassigned}
                    />
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      )}

      {/* PROJECTS (accordion) + UNASSIGNED */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 items-start">
        <div className="space-y-4">
          {projects.length === 0 ? (
            <div className="border border-black/10 rounded-2xl bg-white shadow-sm py-16 text-center">
              <p className="text-sm text-black">No projects yet</p>
              <p className="text-xs text-black/40 mt-1">
                Projects will appear here once they are created.
              </p>
            </div>
          ) : (
            projects.map((p) => {
              const isOpen = openIds.has(p.project_id);
              const tasks = p.tasks || [];
              const team = p.team || [];
              const unassignedN = tasks.filter(
                (t) => !t.allocations?.length,
              ).length;
              const assignedN = tasks.length - unassignedN;

              return (
                <div
                  key={p.project_id}
                  className="border border-black/10 rounded-2xl bg-white shadow-sm overflow-hidden"
                >
                  {/* Accordion header */}
                  <button
                    type="button"
                    onClick={() => toggle(p.project_id)}
                    aria-expanded={isOpen}
                    className="w-full flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-left hover:bg-black/[0.02] transition-colors"
                  >
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
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[#E8EFF9] text-black/70">
                        {tasks.length} tasks
                      </Badge>
                      <Badge className="bg-[#FFFBDB] text-black/70">
                        {team.length} members
                      </Badge>
                      {unassignedN > 0 && (
                        <Badge className="bg-[#FFDADA] text-red-700">
                          {unassignedN} unassigned
                        </Badge>
                      )}
                      <Badge
                        className={
                          STATUS_STYLES[p.status] || "bg-zinc-100 text-zinc-600"
                        }
                      >
                        {humanize(p.status)}
                      </Badge>
                      <ChevronDown
                        size={16}
                        className={`text-black/50 transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </button>

                  {/* Accordion body — full data */}
                  {isOpen && (
                    <div className="border-t border-black/10">
                      {/* Project details */}
                      <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 bg-zinc-50/60">
                        <Field label="Project ID" value={p.project_id} />
                        <Field label="Company ID" value={p.company_id} />
                        <Field label="Status" value={humanize(p.status)} />
                        <Field label="Created by ID" value={p.created_by} />
                        <Field label="Created by" value={p.created_by_name} />
                        <Field label="Designation" value={p.designation} />
                        <Field label="Department" value={p.department} />
                        <Field
                          label="Created at"
                          value={formatDateTime(p.created_at)}
                        />
                        <Field
                          label="Updated at"
                          value={formatDateTime(p.updated_at)}
                        />
                      </div>

                      {/* Progress */}
                      <div className="px-5 py-4 border-t border-black/5">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-black">Task assignment</span>
                          <span className="text-black/50">
                            {assignedN}/{tasks.length} assigned
                          </span>
                        </div>
                        <StackedBar
                          assigned={assignedN}
                          unassigned={unassignedN}
                        />
                      </div>

                      {/* Tasks table */}
                      <div className="border-t border-black/5">
                        <p className="px-5 pt-4 text-[10px] uppercase font-semibold text-gray-400">
                          Tasks ({tasks.length})
                        </p>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs min-w-[640px] mt-2">
                            <thead>
                              <tr className="bg-zinc-50 text-black/50 border-y border-black/10">
                                <th className="font-normal px-5 py-3">ID</th>
                                <th className="font-normal px-3 py-3">Task</th>
                                <th className="font-normal px-3 py-3">
                                  Assigned to
                                </th>
                                <th className="font-normal px-3 py-3">
                                  Created
                                </th>
                                <th className="font-normal px-5 py-3">
                                  Updated
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5">
                              {tasks.length === 0 ? (
                                <tr>
                                  <td
                                    colSpan={5}
                                    className="px-5 py-10 text-center text-black/40"
                                  >
                                    No tasks in this project yet.
                                  </td>
                                </tr>
                              ) : (
                                tasks.map((t) => (
                                  <tr
                                    key={t.task_id}
                                    className="hover:bg-black/[0.02] transition-colors align-top"
                                  >
                                    <td className="px-5 py-3.5 text-black/50">
                                      #{t.task_id}
                                    </td>
                                    <td className="px-3 py-3.5 text-sm text-black">
                                      {t.task}
                                    </td>
                                    <td className="px-3 py-3.5">
                                      {t.allocations?.length ? (
                                        <ul className="space-y-2">
                                          {t.allocations.map((a) => (
                                            <li key={a.allocation_id}>
                                              <p className="text-sm text-black">
                                                {a.employee_name}{" "}
                                                <span className="text-[11px] text-black/40">
                                                  (ID {a.employee_id})
                                                </span>
                                              </p>
                                              <p className="text-[11px] text-black/40 mt-0.5">
                                                {[a.designation, a.department]
                                                  .filter(Boolean)
                                                  .join(" | ")}{" "}
                                                · Allocated{" "}
                                                {formatDateTime(a.allocated_at)}
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
                                    <td className="px-3 py-3.5 text-black whitespace-nowrap">
                                      {formatDate(t.created_at)}
                                    </td>
                                    <td className="px-5 py-3.5 text-black whitespace-nowrap">
                                      {formatDate(t.updated_at)}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Team */}
                      <div className="border-t border-black/5 px-5 py-4">
                        <p className="text-[10px] uppercase font-semibold text-gray-400">
                          Team ({team.length})
                        </p>
                        {team.length === 0 ? (
                          <p className="text-xs text-black/40 mt-3">
                            No team members yet.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                            {team.map((m) => (
                              <div
                                key={m.employee_id}
                                className="flex items-center gap-3 border border-black/10 rounded-xl p-3"
                              >
                                <Avatar src={m.image} name={m.name} />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm text-black truncate">
                                    {m.name}
                                    {m.is_me && (
                                      <span className="ml-1.5 text-[10px] text-emerald-700">
                                        (You)
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-[11px] text-black/40 truncate">
                                    ID {m.employee_id} ·{" "}
                                    {[m.designation, m.department]
                                      .filter(Boolean)
                                      .join(" | ")}
                                  </p>
                                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                                    {(m.roles || []).map((r) => (
                                      <Badge
                                        key={r}
                                        className="bg-[#EBFDEF] text-black/70"
                                      >
                                        {humanize(r)}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
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
              <CheckCircle2
                size={20}
                className="mx-auto text-emerald-600 mb-2"
              />
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
    </div>
  );
};

export default OverviewView;
