import React, { useState, useMemo } from "react";
import { ListChecks, Users, CheckCircle2 } from "lucide-react";
import CustomSelect from "../../ui/customselect"; // adjust path/file name if different

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

/* ---------- Projects tab ---------- */

const PERIODS = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
];

const TASK_STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "completed", label: "Completed" },
  { value: "in_progress", label: "In progress" },
  { value: "pending", label: "Pending" },
];

const TASK_STATUS_STYLES = {
  completed: "bg-emerald-50 text-emerald-700",
  in_progress: "bg-amber-50 text-amber-700",
  pending: "bg-zinc-100 text-zinc-600",
};

// [start, end) for the chosen period, based on today
const periodRange = (id) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let end = new Date(start);
  end.setDate(end.getDate() + 1);

  if (id === "weekly") {
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); // Monday
    end = new Date(start);
    end.setDate(end.getDate() + 7);
  } else if (id === "monthly") {
    start.setDate(1);
    end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
  }
  return { start, end };
};

const rangeLabel = (id) => {
  const { start, end } = periodRange(id);
  if (id === "daily") return formatDate(start);
  if (id === "monthly")
    return start.toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
  const last = new Date(end);
  last.setDate(last.getDate() - 1);
  return `${formatDate(start)} to ${formatDate(last)}`;
};

// A project is completed when all shown tasks are, pending when none started
const projectStatus = (tasks) => {
  if (tasks.every((t) => t.status === "completed")) return "completed";
  if (tasks.every((t) => t.status === "pending")) return "pending";
  return "in_progress";
};

const ProjectsView = ({ projects }) => {
  const [period, setPeriod] = useState("daily"); // default: daily
  const [status, setStatus] = useState("all");

  const rows = useMemo(() => {
    const { start, end } = periodRange(period);

    return projects
      .map((p) => {
        const tasks = (p.tasks || []).filter((t) => {
          const d = new Date(t.created_at);
          const inPeriod = d >= start && d < end;
          return inPeriod && (status === "all" || t.status === status);
        });

        const people = new Map();
        tasks.forEach((t) =>
          (t.allocations || []).forEach((a) => people.set(a.employee_id, a)),
        );

        return {
          ...p,
          tasks,
          people: [...people.values()],
          done: tasks.filter((t) => t.status === "completed").length,
        };
      })
      .filter((r) => r.tasks.length > 0);
  }, [projects, period, status]);

  const stats = useMemo(() => {
    const everyone = new Set();
    let tasks = 0;
    let done = 0;
    rows.forEach((r) => {
      r.people.forEach((a) => everyone.add(a.employee_id));
      tasks += r.tasks.length;
      done += r.done;
    });
    return {
      employees: everyone.size,
      tasks,
      done,
      completion: tasks ? Math.round((done / tasks) * 100) : null,
    };
  }, [rows]);

  return (
    <>
      {/* FILTERS */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center border border-black/10 rounded-lg overflow-hidden">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={`px-3.5 py-2 text-xs transition-colors ${
                period === p.id
                  ? "bg-black text-white"
                  : "text-black hover:bg-black/5"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-black/40">{rangeLabel(period)}</span>
          <CustomSelect
            label="Status"
            value={status}
            onChange={setStatus}
            minWidth={170}
            options={TASK_STATUS_OPTIONS}
          />
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          label="Total employees"
          value={num(stats.employees)}
          hint="Allocated to tasks"
        />
        <StatCard
          icon={ListChecks}
          label="No. of tasks"
          value={num(stats.tasks)}
        />
        <StatCard
          icon={CheckCircle2}
          label="Completion"
          value={stats.completion === null ? "—" : `${stats.completion}%`}
          hint={`${stats.done} of ${stats.tasks} tasks completed`}
        />
      </div>

      {/* PROJECT TABLE */}
      <div className="border border-black/10 rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-black/10">
          <h3 className="text-sm text-black">Project breakdown</h3>
          <p className="text-xs text-black/40 mt-0.5">
            {rows.length} {rows.length === 1 ? "project" : "projects"} with
            tasks in this period.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[760px]">
            <thead>
              <tr className="bg-zinc-50 text-black/50 border-b border-black/10">
                <th className="font-normal px-5 py-3">Project</th>
                <th className="font-normal px-3 py-3">Allocated people</th>
                <th className="font-normal px-3 py-3">Tasks</th>
                <th className="font-normal px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-12 text-center text-black/40"
                  >
                    No tasks match this period and status.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr
                    key={r.project_id}
                    className="hover:bg-black/[0.02] transition-colors align-top"
                  >
                    <td className="px-5 py-3.5 text-sm text-black">
                      {r.project}
                    </td>
                    <td className="px-3 py-3.5">
                      {r.people.length ? (
                        <ul className="space-y-1.5">
                          {r.people.map((a) => (
                            <li key={a.employee_id}>
                              <p className="text-sm text-black">
                                {a.employee_name}
                              </p>
                              <p className="text-[11px] text-black/40">
                                {a.designation}
                              </p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-black/30">No one assigned</span>
                      )}
                    </td>
                    <td className="px-3 py-3.5">
                      <ul className="space-y-1.5">
                        {r.tasks.map((t) => (
                          <li
                            key={t.task_id}
                            className="flex items-center gap-2 text-sm text-black"
                          >
                            <span>{t.task}</span>
                            <Badge
                              className={
                                TASK_STATUS_STYLES[t.status] ||
                                "bg-zinc-100 text-zinc-600"
                              }
                            >
                              {humanize(t.status)}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        className={TASK_STATUS_STYLES[projectStatus(r.tasks)]}
                      >
                        {humanize(projectStatus(r.tasks))}
                      </Badge>
                      <p className="text-[11px] text-black/40 mt-1.5">
                        {r.done} of {r.tasks.length} done
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default ProjectsView;
