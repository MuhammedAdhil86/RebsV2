import React, { useState, useEffect, useMemo, useRef } from "react";
import { ListChecks, Users, CheckCircle2, ChevronDown } from "lucide-react";
import { Icon } from "@iconify/react";
import CustomSelect from "../../ui/customselect"; // adjust path/file name if different
import teamService from "../../service/teamservice"; // adjust path if different
import { fetchTimesheetStatuses } from "../../service/timesheetservice";
import { getActiveUsersLight } from "../../service/employeeService"; // adjust to the file that exports getActiveUsersLight

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

const formatMinutes = (m) => {
  const mins = Number(m) || 0;
  const h = Math.floor(mins / 60);
  const r = mins % 60;
  if (!h) return `${r}m`;
  return r ? `${h}h ${r}m` : `${h}h`;
};

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

/* Same palette as the dashboard KPI cards */
const COLORS = {
  green: "#EBFDEF",
  blue: "#E8EFF9",
  orange: "#FFEFE7",
  yellow: "#FFFBDB",
  red: "#FFDADA",
};

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

const Field = ({ label, value }) => (
  <div>
    <p className="text-[10px] uppercase font-semibold text-gray-400">{label}</p>
    <p className="text-xs text-black mt-0.5 break-words">{value ?? "—"}</p>
  </div>
);

/* Multi-select dropdown (checkboxes). Empty selection = no filter ("All"). */
const MultiSelect = ({
  label,
  options,
  value,
  onChange,
  searchable = false,
  allLabel = "All",
}) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const selected = new Set(value);
  const toggle = (v) =>
    onChange(selected.has(v) ? value.filter((x) => x !== v) : [...value, v]);

  const summary =
    value.length === 0
      ? allLabel
      : value.length === 1
        ? (options.find((o) => o.value === value[0])?.label ?? value[0])
        : `${value.length} selected`;

  const shown = q
    ? options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()))
    : options;

  return (
    <div ref={ref} className="relative flex-1 min-w-[110px] max-w-[200px]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 border border-black/10 rounded-lg bg-white px-2.5 py-1.5 text-xs hover:bg-black/[0.02] transition-colors"
      >
        <span className="truncate">
          <span className="text-black/40">{label}: </span>
          <span className="text-black">{summary}</span>
        </span>
        <ChevronDown
          size={14}
          className={`text-black/50 shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-1 w-full min-w-[220px] bg-white border border-black/10 rounded-lg shadow-lg">
          <div className="flex items-center justify-between px-3 py-2 border-b border-black/5">
            <span className="text-[11px] text-black/40">
              {value.length ? `${value.length} selected` : allLabel}
            </span>
            {value.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-[11px] text-black underline"
              >
                Clear
              </button>
            )}
          </div>

          {searchable && (
            <div className="px-3 py-2 border-b border-black/5">
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search…"
                className="w-full text-xs border border-black/10 rounded-md px-2 py-1.5 outline-none"
              />
            </div>
          )}

          <ul className="max-h-60 overflow-y-auto py-1">
            {shown.length === 0 ? (
              <li className="px-3 py-2 text-xs text-black/40">No options</li>
            ) : (
              shown.map((o) => (
                <li key={o.value}>
                  <label className="flex items-center gap-2 px-3 py-1.5 text-xs text-black hover:bg-black/[0.03] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selected.has(o.value)}
                      onChange={() => toggle(o.value)}
                      className="accent-black"
                    />
                    <span className="truncate">{o.label}</span>
                  </label>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

/* ---------- Projects tab ---------- */

const PERIODS = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
];

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

// Convert API status values into the format expected by the select.
const buildTimesheetStatusOptions = (statuses) => {
  const items = Array.isArray(statuses)
    ? statuses
    : Array.isArray(statuses?.statuses)
      ? statuses.statuses
      : [];

  const options = items
    .map((item) => {
      if (typeof item === "string" || typeof item === "number") {
        const value = String(item);
        return { value, label: value };
      }

      if (!item || typeof item !== "object") return null;

      // Keep the backend status text exactly as returned. The projects API
      // expects values such as "In Progress" and "Blocked".
      const value =
        item.status ??
        item.value ??
        item.name ??
        item.label ??
        item.status_name ??
        item.title ??
        item.code;

      if (value === null || value === undefined || value === "") return null;

      const label =
        item.label ??
        item.name ??
        item.status_name ??
        item.title ??
        String(value);

      return { value: String(value), label: String(label) };
    })
    .filter(Boolean);

  return options.filter(
    (option, index, list) =>
      list.findIndex((item) => item.value === option.value) === index,
  );
};

// Convert the active-users response into select options (value = employee id)
const buildEmployeeOptions = (res) => {
  const items = Array.isArray(res)
    ? res
    : Array.isArray(res?.users)
      ? res.users
      : Array.isArray(res?.employees)
        ? res.employees
        : [];

  const options = items
    .map((u) => {
      if (!u || typeof u !== "object") return null;
      // `uuid` (e.g. "100557") is the id the projects API uses; `id` is internal
      const value = u.uuid ?? u.employee_id ?? u.user_id ?? u.id;
      if (value === null || value === undefined || value === "") return null;
      const label =
        u.name ??
        u.full_name ??
        u.employee_name ??
        ([u.first_name, u.last_name].filter(Boolean).join(" ") ||
          String(value));
      return {
        value: String(value),
        label: String(label).replace(/\s+/g, " ").trim(),
      };
    })
    .filter(Boolean);

  return options.filter(
    (option, index, list) =>
      list.findIndex((item) => item.value === option.value) === index,
  );
};

const PROJECT_STATUS_STYLES = {
  active: "bg-emerald-50 text-emerald-700",
  completed: "bg-zinc-100 text-zinc-600",
  on_hold: "bg-amber-50 text-amber-700",
};

/* ---------- period helpers ---------- */

const pad = (n) => String(n).padStart(2, "0");

const toISODate = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

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

const SELECT_CLS =
  "border border-black/10 rounded-lg bg-white px-2.5 py-1.5 text-xs text-black outline-none shrink-0";

/* ---------- API query params ---------- */

const buildParams = ({
  period,
  date,
  month,
  year,
  week,
  statuses,
  projectStatuses,
  employees,
}) => {
  const params = { period };

  if (period === "daily") {
    params.date = date;
  } else if (period === "weekly") {
    params.month = month;
    params.year = year;
    params.week = week;
  } else {
    params.month = month;
    params.year = year;
  }

  if (statuses.length) params.status = statuses.join(",");
  if (projectStatuses.length) params.project_status = projectStatuses.join(",");
  if (employees.length) params.employees = employees.join(",");
  return params;
};

/* ---------- assignee helpers ---------- */

const isDone = (a) => /complete/i.test(a?.status || "");

const assigneeBadge = (a, many) => {
  const label = a.status || "Not started";
  const text = many ? `${(a.name || "").split(" ")[0]}: ${label}` : label;
  return a.status_color
    ? {
        text,
        className: "",
        style: {
          color: a.status_color,
          backgroundColor: `${a.status_color}1A`,
        },
      }
    : { text, className: "bg-zinc-100 text-zinc-600", style: undefined };
};

const ProjectsView = () => {
  const now = new Date();

  // period filters
  const [period, setPeriod] = useState("daily"); // default: daily
  const [date, setDate] = useState(toISODate(now));
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [week, setWeek] = useState(weekOfMonth(now));

  // multi filters (empty array = no filter)
  const [status, setStatus] = useState([]);
  const [projectStatus, setProjectStatus] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [taskStatusOptions, setTaskStatusOptions] = useState([]);
  const [projectStatusOptions, setProjectStatusOptions] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [projectStatusReady, setProjectStatusReady] = useState(false);

  const [data, setData] = useState(null); // { summary, projects }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [openIds, setOpenIds] = useState(() => new Set()); // all closed at first

  const toggle = (id) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const weeksCount = weeksInMonth(month, year);
  const activeWeek = Math.min(week, weeksCount);

  const yearOptions = useMemo(() => {
    const y = new Date().getFullYear();
    return [y - 3, y - 2, y - 1, y, y + 1].map((v) => ({
      value: String(v),
      label: String(v),
    }));
  }, []);

  const monthOptions = MONTHS.map((label, i) => ({
    value: String(i + 1),
    label: label.slice(0, 3),
  }));

  const weekOptions = Array.from({ length: weeksCount }, (_, i) => ({
    value: String(i + 1),
    label: `W${i + 1} · ${weekRangeShort(month, year, i + 1)}`,
  }));

  // Fetch timesheet/task statuses from timesheetservice.
  useEffect(() => {
    let cancelled = false;

    const loadTimesheetStatuses = async () => {
      try {
        const res = await fetchTimesheetStatuses();
        if (cancelled) return;
        setTaskStatusOptions(buildTimesheetStatusOptions(res));
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to fetch timesheet statuses:", err);
          setTaskStatusOptions([]);
        }
      }
    };

    loadTimesheetStatuses();

    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch employees for the employee filter
  useEffect(() => {
    let cancelled = false;

    const loadEmployees = async () => {
      try {
        const res = await getActiveUsersLight();
        if (cancelled) return;
        setEmployeeOptions(buildEmployeeOptions(res));
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to fetch employees:", err);
          setEmployeeOptions([]);
        }
      }
    };

    loadEmployees();

    return () => {
      cancelled = true;
    };
  }, []);

  // GET /manager/projects/statuses
  useEffect(() => {
    let cancelled = false;

    teamService
      .fetchProjectStatuses()
      .then((res) => {
        if (cancelled) return;
        setProjectStatusOptions(res.statuses);
        // start on the API default (e.g. "active")
        setProjectStatus(res.default ? [res.default] : []);
      })
      .catch(() => {
        if (!cancelled) setProjectStatus([]); // fall back to all projects
      })
      .finally(() => {
        if (!cancelled) setProjectStatusReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // GET /admin/projects/task-status
  useEffect(() => {
    if (!projectStatusReady) return; // wait for the project status default
    let cancelled = false;
    setLoading(true);
    setError("");

    teamService
      .fetchProjectsTaskStatus(
        buildParams({
          period,
          date,
          month,
          year,
          week: activeWeek,
          statuses: status,
          projectStatuses: projectStatus,
          employees,
        }),
      )
      .then((res) => {
        if (cancelled) return;

        // Supports both the older { summary, projects } response and the
        // current API response: { status_code, message, data: [...] }.
        const payload = res?.data?.data ?? res?.data ?? res;
        const projects = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.projects)
            ? payload.projects
            : [];

        setData({
          ...(Array.isArray(payload) ? {} : payload),
          projects,
          summary: Array.isArray(payload) ? undefined : payload?.summary,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err.response?.data?.message ||
            err.message ||
            "Could not load project task status.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    period,
    date,
    month,
    year,
    activeWeek,
    status,
    projectStatus,
    employees,
    projectStatusReady,
    reloadKey,
  ]);

  const summary = data?.summary;

  const rows = useMemo(
    () =>
      (data?.projects || []).map((p) => {
        const tasks = p.tasks || [];

        // unique people across all tasks of this project
        const people = new Map();
        tasks.forEach((t) =>
          (t.assignees || []).forEach((a) => {
            const prev = people.get(a.employee_id) || {
              employee_id: a.employee_id,
              name: a.name,
              minutes: 0,
              working: false,
            };
            prev.minutes += Number(a.time_taken_minutes) || 0;
            prev.working = prev.working || !!a.is_working;
            people.set(a.employee_id, prev);
          }),
        );

        // a task is done when it has assignees and all of them completed it
        const done = tasks.filter(
          (t) => t.assignees?.length && t.assignees.every(isDone),
        ).length;

        return { ...p, tasks, people: [...people.values()], done };
      }),
    [data],
  );

  return (
    <>
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
              className={`${SELECT_CLS} pr-8 cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
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

        <MultiSelect
          label="Project status"
          value={projectStatus}
          onChange={setProjectStatus}
          options={projectStatusOptions}
          allLabel="All projects"
        />
        <MultiSelect
          label="Status"
          value={status}
          onChange={setStatus}
          options={taskStatusOptions}
          allLabel="All statuses"
        />
        <MultiSelect
          label="Employees"
          value={employees}
          onChange={setEmployees}
          options={employeeOptions}
          allLabel="All employees"
          searchable
        />
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          label="Total employees"
          value={num(summary?.allocated_employees)}
          hint="Allocated to tasks"
          bg={COLORS.yellow}
        />
        <StatCard
          icon={ListChecks}
          label="No. of tasks"
          value={num(summary?.total_tasks)}
          hint={
            summary
              ? `${num(summary.total_projects)} ${
                  summary.total_projects === 1 ? "project" : "projects"
                }`
              : undefined
          }
          bg={COLORS.blue}
        />
        <StatCard
          icon={CheckCircle2}
          label="Completion"
          value={
            summary?.completion_rate === null ||
            summary?.completion_rate === undefined
              ? "—"
              : `${summary.completion_rate}%`
          }
          hint={summary?.completion_label}
          bg={COLORS.green}
        />
      </div>

      {/* PROJECTS (accordion) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm text-black">Project breakdown</h3>
          <p className="text-xs text-black/40">
            {rows.length} {rows.length === 1 ? "project" : "projects"}
          </p>
        </div>

        {loading ? (
          <div className="border border-black/10 rounded-2xl bg-white shadow-sm py-16 text-center">
            <p className="text-sm text-black">Loading projects…</p>
          </div>
        ) : error ? (
          <div className="border border-black/10 rounded-2xl bg-white shadow-sm py-16 text-center">
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
        ) : rows.length === 0 ? (
          <div className="border border-black/10 rounded-2xl bg-white shadow-sm py-16 text-center">
            <p className="text-sm text-black">No projects found</p>
            <p className="text-xs text-black/40 mt-1">
              No projects match the selected filters.
            </p>
          </div>
        ) : (
          rows.map((r) => {
            const isOpen = openIds.has(r.project_id);
            const unassignedN = r.tasks.filter(
              (t) => !t.assignees?.length,
            ).length;

            return (
              <div
                key={r.project_id}
                className="border border-black/10 rounded-2xl bg-white shadow-sm overflow-hidden"
              >
                {/* Accordion header */}
                <button
                  type="button"
                  onClick={() => toggle(r.project_id)}
                  aria-expanded={isOpen}
                  className="w-full flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-left hover:bg-black/[0.02] transition-colors"
                >
                  <div className="min-w-0">
                    <h3 className="text-sm text-black">{r.project}</h3>
                    <p className="text-xs text-black/40 mt-0.5">
                      Project ID {r.project_id}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-[#E8EFF9] text-black/70">
                      {r.tasks.length} {r.tasks.length === 1 ? "task" : "tasks"}
                    </Badge>
                    <Badge className="bg-[#FFFBDB] text-black/70">
                      {r.people.length}{" "}
                      {r.people.length === 1 ? "person" : "people"}
                    </Badge>
                    {r.tasks.length > 0 && (
                      <Badge className="bg-[#EBFDEF] text-black/70">
                        {r.done} done
                      </Badge>
                    )}
                    {unassignedN > 0 && (
                      <Badge className="bg-[#FFDADA] text-red-700">
                        {unassignedN} unassigned
                      </Badge>
                    )}
                    {r.working_now > 0 && (
                      <Badge className="bg-emerald-50 text-emerald-700">
                        {r.working_now} working now
                      </Badge>
                    )}
                    <Badge
                      className={
                        PROJECT_STATUS_STYLES[r.status] ||
                        "bg-zinc-100 text-zinc-600"
                      }
                    >
                      {humanize(r.status)}
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
                      <Field label="Project ID" value={r.project_id} />
                      <Field label="Project" value={r.project} />
                      <Field label="Status" value={humanize(r.status)} />
                      <Field label="Working now" value={r.working_now} />
                      <Field label="Tasks" value={r.tasks.length} />
                      <Field label="Completed tasks" value={r.done} />
                      <Field label="Unassigned tasks" value={unassignedN} />
                      <Field label="Allocated people" value={r.people.length} />
                    </div>

                    {/* Tasks */}
                    <div className="border-t border-black/5">
                      <p className="px-5 pt-4 text-[10px] uppercase font-semibold text-gray-400">
                        Tasks ({r.tasks.length})
                      </p>

                      {r.tasks.length === 0 ? (
                        <p className="px-5 py-8 text-xs text-black/40">
                          No tasks in this period.
                        </p>
                      ) : (
                        <div className="px-5 py-4 space-y-4">
                          {r.tasks.map((t) => {
                            const assignees = t.assignees || [];
                            return (
                              <div
                                key={t.task_id}
                                className="border border-black/10 rounded-xl overflow-hidden"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-zinc-50/60">
                                  <p className="text-sm text-black">
                                    <span className="text-black/40">
                                      #{t.task_id}
                                    </span>{" "}
                                    {t.task}
                                  </p>
                                  {assignees.length === 0 ? (
                                    <Badge className="bg-amber-50 text-amber-700">
                                      Unassigned
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-[#FFFBDB] text-black/70">
                                      {assignees.length}{" "}
                                      {assignees.length === 1
                                        ? "assignee"
                                        : "assignees"}
                                    </Badge>
                                  )}
                                </div>

                                {assignees.length > 0 && (
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs min-w-[860px]">
                                      <thead>
                                        <tr className="text-black/50 border-y border-black/10">
                                          <th className="font-normal px-4 py-2.5">
                                            Employee
                                          </th>
                                          <th className="font-normal px-3 py-2.5">
                                            Status
                                          </th>
                                          <th className="font-normal px-3 py-2.5">
                                            Work date
                                          </th>
                                          <th className="font-normal px-3 py-2.5">
                                            Start time
                                          </th>
                                          <th className="font-normal px-3 py-2.5">
                                            Time taken
                                          </th>
                                          <th className="font-normal px-3 py-2.5">
                                            Days worked
                                          </th>
                                          <th className="font-normal px-3 py-2.5">
                                            Working
                                          </th>
                                          <th className="font-normal px-4 py-2.5">
                                            Remarks
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-black/5">
                                        {assignees.map((a) => {
                                          const b = assigneeBadge(a, false);
                                          return (
                                            <tr
                                              key={a.employee_id}
                                              className="align-top hover:bg-black/[0.02] transition-colors"
                                            >
                                              <td className="px-4 py-3">
                                                <p className="text-sm text-black">
                                                  {a.name}
                                                </p>
                                                <p className="text-[11px] text-black/40">
                                                  ID {a.employee_id}
                                                </p>
                                              </td>
                                              <td className="px-3 py-3">
                                                <Badge
                                                  className={b.className}
                                                  style={b.style}
                                                >
                                                  {b.text}
                                                </Badge>
                                              </td>
                                              <td className="px-3 py-3 text-black whitespace-nowrap">
                                                {a.work_date
                                                  ? formatDate(
                                                      `${a.work_date}T00:00:00`,
                                                    )
                                                  : "—"}
                                              </td>
                                              <td className="px-3 py-3 text-black whitespace-nowrap">
                                                {formatDateTime(a.start_time)}
                                              </td>
                                              <td className="px-3 py-3 text-black whitespace-nowrap">
                                                {formatMinutes(
                                                  a.time_taken_minutes,
                                                )}
                                              </td>
                                              <td className="px-3 py-3 text-black">
                                                {num(a.days_worked ?? 0)}
                                              </td>
                                              {/* CHANGED: is_working true -> "Running", false -> "Not running" */}
                                              <td className="px-3 py-3">
                                                {a.is_working ? (
                                                  <Badge className="bg-emerald-50 text-emerald-700">
                                                    Running
                                                  </Badge>
                                                ) : (
                                                  <Badge className="bg-zinc-100 text-zinc-600">
                                                    Not running
                                                  </Badge>
                                                )}
                                              </td>
                                              <td className="px-4 py-3 text-black/70 max-w-[260px] break-words">
                                                {a.remarks || "—"}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Allocated people */}
                    <div className="border-t border-black/5 px-5 py-4">
                      <p className="text-[10px] uppercase font-semibold text-gray-400">
                        Allocated people ({r.people.length})
                      </p>
                      {r.people.length === 0 ? (
                        <p className="text-xs text-black/40 mt-3">
                          No one assigned.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                          {r.people.map((a) => (
                            <div
                              key={a.employee_id}
                              className="flex items-center gap-3 border border-black/10 rounded-xl p-3"
                            >
                              <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-xs shrink-0">
                                {initials(a.name)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm text-black truncate">
                                  {a.name}
                                  {a.working && (
                                    <span className="ml-1.5 text-[10px] text-emerald-700">
                                      (Working now)
                                    </span>
                                  )}
                                </p>
                                <p className="text-[11px] text-black/40 truncate">
                                  ID {a.employee_id} ·{" "}
                                  {formatMinutes(a.minutes)} worked
                                </p>
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
    </>
  );
};

export default ProjectsView;
