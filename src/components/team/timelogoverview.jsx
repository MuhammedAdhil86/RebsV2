import React, { useState, useEffect, useMemo } from "react";
import { Users, Clock, ListChecks, Activity } from "lucide-react";
import { Icon } from "@iconify/react";
import CustomSelect from "../../ui/customselect"; // adjust path if different
import teamService from "../../service/teamservice"; // adjust path if different

/* ---------- helpers ---------- */

const pad = (n) => String(n).padStart(2, "0");

const toISODate = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const formatMinutes = (m) => {
  const mins = Math.round(Number(m) || 0);
  const h = Math.floor(mins / 60);
  const r = mins % 60;
  if (!h) return `${r}m`;
  return r ? `${h}h ${r}m` : `${h}h`;
};

const formatDay = (iso) => {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const formatDateTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
};

// Week of the month, weeks start on Monday (week 1 = the week containing the 1st)
const weekOfMonth = (d) => {
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  return Math.ceil((d.getDate() + offset) / 7);
};

// month is 1-based
const weeksInMonth = (month, year) => weekOfMonth(new Date(year, month, 0));

// e.g. "9–15 Nov" (week clipped to the month)
const weekRangeShort = (month, year, week) => {
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  const offset = (first.getDay() + 6) % 7;
  let start = new Date(year, month - 1, 1 - offset + (week - 1) * 7);
  let end = new Date(start);
  end.setDate(end.getDate() + 6);
  if (start < first) start = first;
  if (end > last) end = last;
  const mon = end.toLocaleDateString("en-IN", { month: "short" });
  return `${start.getDate()}–${end.getDate()} ${mon}`;
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const PERIODS = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
];

const INPUT_CLS =
  "border border-black/10 rounded-lg bg-white px-2.5 py-1.5 text-xs text-black outline-none shrink-0";

/* Same palette as the dashboard KPI cards */
const COLORS = {
  green: "#EBFDEF",
  blue: "#E8EFF9",
  orange: "#FFEFE7",
  yellow: "#FFFBDB",
  red: "#FFDADA",
};

/* chart colours: each chart uses its own */
const CHART = {
  employees: "#5b8def",
  projects: "#ff9a62",
  days: "#34c759",
};

/* ---------- small UI pieces ---------- */

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

const ChartCard = ({ title, subtitle, children }) => (
  <div className="border border-black/10 rounded-2xl bg-white shadow-sm p-5">
    <h3 className="text-sm text-black">{title}</h3>
    {subtitle && <p className="text-[11px] text-black/40 mt-0.5">{subtitle}</p>}
    <div className="mt-4">{children}</div>
  </div>
);

const Badge = ({
  children,
  className = "bg-zinc-100 text-zinc-600",
  style,
}) => (
  <span
    style={style}
    className={`inline-block px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap ${className}`}
  >
    {children}
  </span>
);

/* horizontal bars: one row per item, value = minutes */
const BarList = ({ items, color }) => {
  if (!items.length) {
    return <p className="text-xs text-black/40">No time logged.</p>;
  }
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
      {items.map((i) => (
        <div key={i.key}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-black truncate pr-2">{i.label}</span>
            <span className="text-black/60 shrink-0">
              {formatMinutes(i.value)}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-zinc-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(i.value / max) * 100}%`, background: color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

/* vertical columns by day, scrolls to the right when there are many days */
const DayColumns = ({ items, color }) => {
  if (!items.length) {
    return <p className="text-xs text-black/40">No time logged.</p>;
  }
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="overflow-x-auto pb-2">
      <div
        className="flex items-stretch gap-3 h-48"
        style={{ minWidth: items.length * 56 }}
      >
        {items.map((i) => (
          <div
            key={i.key}
            title={`${i.label} · ${formatMinutes(i.value)}`}
            className="flex flex-col items-center flex-1 min-w-[44px]"
          >
            <div className="flex-1 w-full flex flex-col items-center justify-end">
              <span className="text-[10px] text-black/60 mb-1 whitespace-nowrap">
                {formatMinutes(i.value)}
              </span>
              <div
                className="w-full max-w-[34px] rounded-t-lg transition-all"
                style={{
                  height: `${(i.value / max) * 100}%`,
                  minHeight: 4,
                  background: color,
                }}
              />
            </div>
            <div className="w-full h-px bg-black/10" />
            <span className="mt-2 text-[10px] text-black/60 whitespace-nowrap">
              {i.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ---------- Timelog overview ---------- */

export default function TimelogOverview() {
  const now = new Date();

  const [period, setPeriod] = useState("daily");
  const [date, setDate] = useState(toISODate(now));
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [week, setWeek] = useState(weekOfMonth(now));

  const [data, setData] = useState(null); // { summary, projects }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const weeksCount = weeksInMonth(month, year);
  const activeWeek = Math.min(week, weeksCount);

  const monthOptions = MONTHS.map((label, i) => ({
    value: String(i + 1),
    label: label.slice(0, 3),
  }));
  const yearOptions = useMemo(() => {
    const y = new Date().getFullYear();
    return [y - 3, y - 2, y - 1, y, y + 1].map((v) => ({
      value: String(v),
      label: String(v),
    }));
  }, []);
  const weekOptions = Array.from({ length: weeksCount }, (_, i) => ({
    value: String(i + 1),
    label: `W${i + 1} · ${weekRangeShort(month, year, i + 1)}`,
  }));

  // GET /admin/projects/task-status  (time_taken_minutes per assignee)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    const params = { period };
    if (period === "daily") {
      params.date = date;
    } else {
      params.month = month;
      params.year = year;
      if (period === "weekly") params.week = activeWeek;
    }

    teamService
      .fetchProjectsTaskStatus(params)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (cancelled) return;
        setData(null);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Could not load the timelog overview.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [period, date, month, year, activeWeek, reloadKey]);

  // one entry per (project, task, assignee)
  const entries = useMemo(() => {
    const out = [];
    (data?.projects || []).forEach((p) =>
      (p.tasks || []).forEach((t) =>
        (t.assignees || []).forEach((a) =>
          out.push({
            key: `${p.project_id}-${t.task_id}-${a.employee_id}`,
            project: p.project,
            taskId: t.task_id,
            task: t.task,
            employeeId: a.employee_id,
            name: a.name,
            status: a.status || "Not started",
            color: a.status_color,
            minutes: Number(a.time_taken_minutes) || 0,
            workDate: a.work_date,
            startTime: a.start_time,
            remarks: a.remarks,
            working: !!a.is_working,
          }),
        ),
      ),
    );
    return out;
  }, [data]);

  const stats = useMemo(() => {
    const logged = entries.filter((e) => e.minutes > 0);
    const people = new Set(logged.map((e) => e.employeeId));
    const tasks = new Set(logged.map((e) => e.taskId));
    const workingNow = (data?.projects || []).reduce(
      (sum, p) => sum + (Number(p.working_now) || 0),
      0,
    );
    const total = logged.reduce((sum, e) => sum + e.minutes, 0);
    return {
      total,
      people: people.size,
      tasks: tasks.size,
      entries: logged.length,
      workingNow,
    };
  }, [entries, data]);

  const groupSum = (keyFn, labelFn) => {
    const map = new Map();
    entries
      .filter((e) => e.minutes > 0)
      .forEach((e) => {
        const k = keyFn(e);
        const prev = map.get(k) || { key: k, label: labelFn(e), value: 0 };
        prev.value += e.minutes;
        map.set(k, prev);
      });
    return [...map.values()];
  };

  const byEmployee = useMemo(
    () =>
      groupSum(
        (e) => e.employeeId,
        (e) => e.name,
      ).sort((a, b) => b.value - a.value),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entries],
  );

  const byProject = useMemo(
    () =>
      groupSum(
        (e) => e.project,
        (e) => e.project,
      ).sort((a, b) => b.value - a.value),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entries],
  );

  const byDay = useMemo(
    () =>
      groupSum(
        (e) => e.workDate || "none",
        (e) => formatDay(e.workDate),
      )
        .filter((d) => d.key !== "none")
        .sort((a, b) => (a.key < b.key ? -1 : 1)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entries],
  );

  const byStatus = useMemo(() => {
    const map = new Map();
    entries.forEach((e) => {
      const prev = map.get(e.status) || {
        status: e.status,
        color: e.color,
        count: 0,
      };
      prev.count += 1;
      map.set(e.status, prev);
    });
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [entries]);

  const recent = useMemo(
    () =>
      entries
        .filter((e) => e.minutes > 0 || e.startTime)
        .sort((a, b) =>
          String(b.startTime || b.workDate || "").localeCompare(
            String(a.startTime || a.workDate || ""),
          ),
        )
        .slice(0, 8),
    [entries],
  );

  return (
    <div className="space-y-6">
      {/* FILTERS (single line) */}
      <div className="flex flex-nowrap items-center gap-2">
        <div className="flex items-center border border-black/10 rounded-lg overflow-hidden shrink-0">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={`px-3 py-1.5 text-xs transition-colors ${
                period === p.id
                  ? "bg-black text-white"
                  : "text-black hover:bg-black/5"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {period === "daily" && (
          <div className="relative shrink-0">
            <input
              type="date"
              value={date}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              onClick={(e) => {
                try {
                  e.currentTarget.showPicker?.();
                } catch {
                  /* picker already open / unsupported */
                }
              }}
              aria-label="Date"
              className={`${INPUT_CLS} pr-8 cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
            />
            <Icon
              icon="solar:calendar-outline"
              className="w-4 h-4 text-black/50 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
            />
          </div>
        )}

        {period !== "daily" && (
          <>
            <CustomSelect
              value={String(month)}
              onChange={(v) => setMonth(Number(v))}
              minWidth={72}
              options={monthOptions}
            />
            <CustomSelect
              value={String(year)}
              onChange={(v) => setYear(Number(v))}
              minWidth={78}
              options={yearOptions}
            />
          </>
        )}

        {period === "weekly" && (
          <CustomSelect
            value={String(activeWeek)}
            onChange={(v) => setWeek(Number(v))}
            minWidth={120}
            options={weekOptions}
          />
        )}
      </div>

      {error ? (
        <div className="border border-black/10 rounded-2xl bg-white shadow-sm py-16 text-center">
          <p className="text-sm text-black">Could not load the overview</p>
          <p className="text-xs text-black/40 mt-1">{error}</p>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="mt-4 px-3.5 py-2 text-xs rounded-lg bg-black text-white hover:bg-black/80 transition-colors"
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          {/* SUMMARY CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={Clock}
              label="Total time logged"
              value={loading ? "…" : formatMinutes(stats.total)}
              hint={loading ? undefined : `${stats.entries} time logs`}
              bg={COLORS.blue}
            />
            <StatCard
              icon={Users}
              label="Employees"
              value={loading ? "…" : stats.people}
              hint="Logged time"
              bg={COLORS.yellow}
            />
            <StatCard
              icon={ListChecks}
              label="Tasks worked"
              value={loading ? "…" : stats.tasks}
              bg={COLORS.green}
            />
            <StatCard
              icon={Activity}
              label="Working now"
              value={loading ? "…" : stats.workingNow}
              bg={COLORS.orange}
            />
          </div>

          {/* CHARTS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <ChartCard title="Time by employee" subtitle="Total time logged">
              <BarList items={byEmployee} color={CHART.employees} />
            </ChartCard>

            <ChartCard title="Time by project" subtitle="Total time logged">
              <BarList items={byProject} color={CHART.projects} />
            </ChartCard>

            <ChartCard title="Time by day" subtitle="Per work date">
              <DayColumns items={byDay} color={CHART.days} />
            </ChartCard>
          </div>

          {/* STATUS + RECENT LOGS */}
          <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-4 items-start">
            <ChartCard title="Log status" subtitle="Entries by task status">
              {byStatus.length === 0 ? (
                <p className="text-xs text-black/40">Nothing to show.</p>
              ) : (
                <ul className="space-y-2.5">
                  {byStatus.map((s) => (
                    <li
                      key={s.status}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="flex items-center gap-2 text-black">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ background: s.color || "#a1a1aa" }}
                        />
                        {s.status}
                      </span>
                      <span className="text-black/60">{s.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </ChartCard>

            <div className="border border-black/10 rounded-2xl bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-black/10">
                <h3 className="text-sm text-black">Recent time logs</h3>
                <p className="text-[11px] text-black/40 mt-0.5">
                  Latest entries in this period
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[720px]">
                  <thead>
                    <tr className="bg-zinc-50 text-black/50 border-b border-black/10">
                      <th className="font-normal px-5 py-3">Employee</th>
                      <th className="font-normal px-3 py-3">Project / Task</th>
                      <th className="font-normal px-3 py-3">Started</th>
                      <th className="font-normal px-3 py-3">Time</th>
                      <th className="font-normal px-3 py-3">Status</th>
                      <th className="font-normal px-5 py-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {loading ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-5 py-10 text-center text-black/40"
                        >
                          Loading time logs…
                        </td>
                      </tr>
                    ) : recent.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-5 py-10 text-center text-black/40"
                        >
                          No time logged in this period.
                        </td>
                      </tr>
                    ) : (
                      recent.map((e) => (
                        <tr
                          key={e.key}
                          className="align-top hover:bg-black/[0.02] transition-colors"
                        >
                          <td className="px-5 py-3 text-sm text-black">
                            {e.name}
                            {e.working && (
                              <span className="ml-1.5 text-[10px] text-emerald-700">
                                (Working now)
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <p className="text-sm text-black">{e.task}</p>
                            <p className="text-[11px] text-black/40">
                              {e.project}
                            </p>
                          </td>
                          <td className="px-3 py-3 text-black whitespace-nowrap">
                            {formatDateTime(e.startTime)}
                          </td>
                          <td className="px-3 py-3 text-black whitespace-nowrap">
                            {formatMinutes(e.minutes)}
                          </td>
                          <td className="px-3 py-3">
                            <Badge
                              className={
                                e.color ? "" : "bg-zinc-100 text-zinc-600"
                              }
                              style={
                                e.color
                                  ? {
                                      color: e.color,
                                      backgroundColor: `${e.color}1A`,
                                    }
                                  : undefined
                              }
                            >
                              {e.status}
                            </Badge>
                          </td>
                          <td className="px-5 py-3 text-black/70 max-w-[240px] break-words">
                            {e.remarks || "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
