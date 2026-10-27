import React, { useState, useEffect, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Users,
  Gauge,
  Clock,
  TrendingUp,
  Award,
  CalendarX,
  MessageSquare,
  AlertTriangle,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";
import DashboardLayout from "../ui/pagelayout";
import HeaderGlobal from "../ui/headerglobal";
import {
  fetchCompanyKpi,
  fetchTeamKpi,
  fetchEmployeeKpi,
} from "../service/kpiService";
import { getDepartmentData } from "../service/companyService";
import { getActiveUsersLight } from "../service/employeeService";
import CustomSelect from "../ui/customselect"; // adjust path/file name if different

/* ---------- helpers ---------- */

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

const TABS = [
  { id: "company", label: "Company" },
  { id: "team", label: "Team" },
  { id: "individual", label: "Individual" },
];

const TAB_KEY = "kpi_active_tab";

// null / undefined -> "—", otherwise a trimmed number
const num = (v, digits = 0) =>
  v === null || v === undefined || Number.isNaN(Number(v))
    ? "—"
    : Number(v).toLocaleString("en-IN", {
        maximumFractionDigits: digits,
      });

const pct = (v, digits = 0) =>
  v === null || v === undefined ? "—" : `${num(v, digits)}%`;

// "low_regularity" -> "Low regularity"
const humanize = (s) => {
  if (!s) return "—";
  const t = String(s).replace(/_/g, " ").trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
};

const formatDate = (iso) => {
  if (!iso) return "—";
  const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return "—";
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const nameOf = (e) => (e?.user_name || "").trim() || `User ${e?.user_id ?? ""}`;

// Active-users-light rows can name things differently, so read them defensively
const lightUserName = (u) =>
  (
    u?.name ||
    u?.user_name ||
    `${u?.first_name || ""} ${u?.last_name || ""}`
  ).trim() || `User ${u?.id ?? u?.user_id ?? ""}`;

const BAND_STYLES = {
  pending_review: "bg-zinc-100 text-zinc-600",
};

const REVIEW_STYLES = {
  not_started: "bg-zinc-100 text-zinc-600",
  in_progress: "bg-amber-50 text-amber-700",
  submitted: "bg-emerald-50 text-emerald-700",
};

const MIX_SEGMENTS = [
  { key: "on_time", label: "On time", color: "bg-emerald-500" },
  { key: "late", label: "Late", color: "bg-amber-400" },
  { key: "delay", label: "Delay", color: "bg-orange-500" },
  { key: "half_day", label: "Half day", color: "bg-sky-500" },
  { key: "absent", label: "Absent", color: "bg-red-400" },
];

/**
 * Loads data with loading / error state. Only runs while `enabled` is true.
 * `deps` are the values the request depends on.
 */
const useKpiData = (fetcher, deps, enabled) => {
  const [state, setState] = useState({ data: null, loading: false, error: "" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;

    setState((s) => ({ ...s, loading: true, error: "" }));
    fetcher()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: "" });
      })
      .catch((e) => {
        console.error("KPI load failed:", e);
        if (cancelled) return;
        const message = e?.message || "Failed to load KPI data.";
        setState({ data: null, loading: false, error: message });
        toast.error(message);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, reloadKey, ...deps]);

  return { ...state, reload: () => setReloadKey((k) => k + 1) };
};

/* ---------- small UI pieces ---------- */

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

const ScoreCell = ({ value }) => {
  if (value === null || value === undefined) {
    return <span className="text-black/30">—</span>;
  }
  const width = Math.max(0, Math.min(100, Number(value)));
  return (
    <div className="flex items-center gap-2 min-w-[90px]">
      <div className="flex-1 h-1.5 rounded-full bg-black/10 overflow-hidden">
        <div
          className="h-full bg-black rounded-full"
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="text-xs text-black w-9 text-right">{num(value, 1)}</span>
    </div>
  );
};

const Loading = () => (
  <div className="py-24 text-center text-sm text-black/40">
    Loading KPI data...
  </div>
);

const ErrorBox = ({ message, onRetry }) => (
  <div className="py-24 text-center">
    <p className="text-sm text-black">Could not load KPI data</p>
    <p className="text-xs text-black/40 mt-1">{message}</p>
    <button
      onClick={onRetry}
      className="mt-4 px-4 py-2 text-xs border border-black/10 rounded-lg hover:bg-black/5 transition-colors"
    >
      Try again
    </button>
  </div>
);

const Notices = ({ kpi }) => (
  <>
    {kpi?.partial_period && (
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-50 text-amber-800 text-xs">
        <Info size={14} className="mt-0.5 shrink-0" />
        <span>
          This month is still in progress, so scores are based on the days
          completed so far.
        </span>
      </div>
    )}
    {kpi?.feedback_due && (
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-50 text-red-700 text-xs">
        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
        <span>
          Feedback is overdue. It was due on {formatDate(kpi.feedback_due_on)}.
        </span>
      </div>
    )}
  </>
);

const WeightsNote = ({ weights }) => {
  if (!weights) return null;
  return (
    <div className="border border-black/10 rounded-2xl bg-zinc-50 p-5">
      <h3 className="text-sm text-black">How scores are calculated</h3>
      <ul className="mt-3 space-y-1.5 text-xs text-black/60">
        <li>
          Performance weight is {Math.round(weights.performance_weight * 100)}%
          and attendance weight is {Math.round(weights.attendance_weight * 100)}
          %.
        </li>
        <li>
          Attendance can add up to {weights.max_attendance_lift} points to the
          overall score.
        </li>
        <li>
          Attendance score weighs regularity at {weights.regularity_share} and
          punctuality at {weights.punctuality_share}.
        </li>
        <li>
          The first {weights.lop_free_days} loss of pay days are free. After
          that, each day costs {weights.lop_penalty_per_day} points.
        </li>
      </ul>
    </div>
  );
};

/* ---------- Company / Team dashboard (same data shape) ---------- */

const DashboardView = ({ kpi, scope, onOpenEmployee }) => {
  const [search, setSearch] = useState("");

  const employees = kpi?.employees || [];
  const summary = kpi?.summary;
  const mix = kpi?.attendance_mix;
  const weights = kpi?.weights;
  const attention = kpi?.needs_attention || [];

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) =>
      [e.user_name, e.department, e.designation, e.user_id]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [employees, search]);

  return (
    <>
      <Notices kpi={kpi} />

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Employees"
          value={num(summary?.employee_count)}
        />
        <StatCard
          icon={Gauge}
          label="Avg regularity"
          value={pct(summary?.avg_regularity, 1)}
        />
        <StatCard
          icon={Clock}
          label="Avg punctuality"
          value={pct(summary?.avg_punctuality, 1)}
        />
        <StatCard
          icon={TrendingUp}
          label="Avg performance"
          value={num(summary?.avg_performance, 1)}
          hint={
            summary?.avg_performance == null ? "Waiting for reviews" : undefined
          }
        />
        <StatCard
          icon={Award}
          label="Avg overall score"
          value={num(summary?.avg_overall, 1)}
          hint={
            summary?.avg_overall == null ? "Waiting for reviews" : undefined
          }
        />
        <StatCard
          icon={CalendarX}
          label="Total LOP days"
          value={num(summary?.total_lop_days, 1)}
        />
        <StatCard
          icon={MessageSquare}
          label="Feedback submitted"
          value={`${num(summary?.feedback_submitted)} / ${num(
            summary?.feedback_total,
          )}`}
          hint={
            kpi?.feedback_due_on
              ? `Due ${formatDate(kpi.feedback_due_on)}`
              : undefined
          }
        />
      </div>

      {/* ATTENDANCE MIX + NEEDS ATTENTION */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 items-start">
        <div className="border border-black/10 rounded-2xl bg-white shadow-sm p-5">
          <h3 className="text-sm text-black">Attendance mix</h3>
          <p className="text-xs text-black/40 mt-0.5">
            Share of all {scope} employee-days this month
          </p>

          <div className="flex h-3 w-full rounded-full overflow-hidden bg-black/10 mt-4">
            {MIX_SEGMENTS.map((s) => {
              const value = Number(mix?.[`${s.key}_pct`] || 0);
              if (value <= 0) return null;
              return (
                <div
                  key={s.key}
                  className={s.color}
                  style={{ width: `${value}%` }}
                  title={`${s.label}: ${value}%`}
                />
              );
            })}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-5">
            {MIX_SEGMENTS.map((s) => (
              <div key={s.key}>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                  <span className="text-xs text-black/60">{s.label}</span>
                </div>
                <p className="text-lg text-black mt-1 leading-none">
                  {num(mix?.[s.key])}
                </p>
                <p className="text-[11px] text-black/40 mt-1">
                  {pct(mix?.[`${s.key}_pct`], 1)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <aside className="border border-black/10 rounded-2xl bg-white shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-black/10">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-black" />
              <h3 className="text-sm text-black">Needs attention</h3>
            </div>
            <span className="text-[11px] text-white bg-black rounded-full px-2 py-0.5">
              {attention.length}
            </span>
          </div>

          {attention.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-black">All clear</p>
              <p className="text-xs text-black/40 mt-1">
                No employees are flagged this month.
              </p>
            </div>
          ) : (
            <ul className="max-h-[320px] overflow-y-auto divide-y divide-black/5">
              {attention.map((a) => (
                <li key={a.user_id} className="px-5 py-3.5">
                  <button
                    type="button"
                    onClick={() => onOpenEmployee(String(a.user_id))}
                    className="text-sm text-black truncate hover:underline text-left max-w-full"
                  >
                    {nameOf(a)}
                  </button>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {(a.reasons || []).map((r) => (
                      <Badge key={r} className="bg-red-50 text-red-600">
                        {humanize(r)}
                      </Badge>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      {/* EMPLOYEE TABLE */}
      <div className="border border-black/10 rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-black/10">
          <div>
            <h3 className="text-sm text-black">Employee breakdown</h3>
            <p className="text-xs text-black/40 mt-0.5">
              {filteredEmployees.length} of {employees.length} employees. Click
              a name to see their individual KPI.
            </p>
          </div>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, department or ID"
              className="pl-9 pr-3 py-2 w-64 max-w-full text-xs border border-black/10 rounded-lg outline-none focus:border-black transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[1100px]">
            <thead>
              <tr className="bg-zinc-50 text-black/50 border-b border-black/10">
                <th className="font-normal px-5 py-3">Employee</th>
                <th className="font-normal px-3 py-3 text-center">On time</th>
                <th className="font-normal px-3 py-3 text-center">Late</th>
                <th className="font-normal px-3 py-3 text-center">Delay</th>
                <th className="font-normal px-3 py-3 text-center">Half day</th>
                <th className="font-normal px-3 py-3 text-center">Absent</th>
                <th className="font-normal px-3 py-3 text-center">Leave</th>
                <th className="font-normal px-3 py-3 text-center">LOP</th>
                <th className="font-normal px-3 py-3">Regularity</th>
                <th className="font-normal px-3 py-3">Punctuality</th>
                <th className="font-normal px-3 py-3">Attendance</th>
                <th className="font-normal px-3 py-3">Review</th>
                <th className="font-normal px-3 py-3">Overall</th>
                <th className="font-normal px-5 py-3">Band</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td
                    colSpan={14}
                    className="px-5 py-12 text-center text-black/40"
                  >
                    No employees match your search.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((e) => (
                  <tr
                    key={e.user_id}
                    className="hover:bg-black/[0.02] transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <button
                        type="button"
                        onClick={() => onOpenEmployee(String(e.user_id))}
                        className="text-sm text-black hover:underline text-left"
                      >
                        {nameOf(e)}
                      </button>
                      <p className="text-[11px] text-black/40 mt-0.5">
                        {[e.department, e.designation]
                          .filter(Boolean)
                          .join(" | ") || `ID ${e.user_id}`}
                      </p>
                    </td>
                    <td className="px-3 py-3.5 text-center text-black">
                      {num(e.on_time)}
                    </td>
                    <td className="px-3 py-3.5 text-center text-black">
                      {num(e.late_days)}
                    </td>
                    <td className="px-3 py-3.5 text-center text-black">
                      {num(e.delay_days)}
                    </td>
                    <td className="px-3 py-3.5 text-center text-black">
                      {num(e.half_days)}
                    </td>
                    <td className="px-3 py-3.5 text-center text-black">
                      {num(e.absent_days)}
                    </td>
                    <td className="px-3 py-3.5 text-center text-black">
                      {num(e.leave_days)}
                    </td>
                    <td className="px-3 py-3.5 text-center text-black">
                      {num(e.lop_days, 1)}
                    </td>
                    <td className="px-3 py-3.5">
                      <ScoreCell value={e.regularity} />
                    </td>
                    <td className="px-3 py-3.5">
                      <ScoreCell value={e.punctuality} />
                    </td>
                    <td className="px-3 py-3.5">
                      <ScoreCell value={e.attendance_score} />
                    </td>
                    <td className="px-3 py-3.5">
                      <Badge
                        className={
                          REVIEW_STYLES[e.review_status] ||
                          "bg-zinc-100 text-zinc-600"
                        }
                      >
                        {humanize(e.review_status)}
                      </Badge>
                    </td>
                    <td className="px-3 py-3.5">
                      <ScoreCell value={e.overall_score} />
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        className={BAND_STYLES[e.band] || "bg-black text-white"}
                      >
                        {humanize(e.band)}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <WeightsNote weights={weights} />
    </>
  );
};

/* ---------- Individual dashboard ---------- */

const IndividualView = ({ data }) => {
  // Response shape: { score: {...employee KPI}, review, weights, partial_period }
  const emp = data?.score ?? {};
  const review = data?.review;
  const reviewRows =
    review && typeof review === "object"
      ? Object.entries(review).filter(
          ([k, v]) =>
            v !== null &&
            v !== "" &&
            typeof v !== "object" &&
            ![
              "id",
              "user_id",
              "company_id",
              "created_at",
              "updated_at",
            ].includes(k),
        )
      : [];

  const counts = [
    { label: "On time", value: emp.on_time },
    { label: "Late", value: emp.late_days },
    { label: "Delay", value: emp.delay_days },
    { label: "Half day", value: emp.half_days },
    { label: "Absent", value: emp.absent_days },
    { label: "Leave", value: emp.leave_days },
    { label: "LOP", value: emp.lop_days, digits: 1 },
    { label: "Worked days", value: emp.worked_days },
    { label: "Eligible days", value: emp.eligible_days },
  ];

  const scores = [
    { label: "Regularity", value: emp.regularity },
    { label: "Punctuality", value: emp.punctuality },
    { label: "Attendance score", value: emp.attendance_score },
    { label: "Performance score", value: emp.performance_score },
    { label: "Overall score", value: emp.overall_score },
  ];

  return (
    <>
      <Notices kpi={data} />

      {/* PROFILE */}
      <div className="border border-black/10 rounded-2xl bg-white shadow-sm p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center text-base shrink-0">
            {(nameOf(emp).charAt(0) || "?").toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="text-lg text-black truncate">{nameOf(emp)}</h3>
            <p className="text-xs text-black/40 mt-0.5">
              {[emp.designation, emp.department].filter(Boolean).join(" | ") ||
                `ID ${emp.user_id ?? "—"}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            className={
              REVIEW_STYLES[emp.review_status] || "bg-zinc-100 text-zinc-600"
            }
          >
            {humanize(emp.review_status)}
          </Badge>
          <Badge className={BAND_STYLES[emp.band] || "bg-black text-white"}>
            {humanize(emp.band)}
          </Badge>
        </div>
      </div>

      {/* ATTENDANCE COUNTS */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {counts.map((c) => (
          <StatCard
            key={c.label}
            label={c.label}
            value={num(c.value, c.digits || 0)}
          />
        ))}
      </div>

      {/* SCORES */}
      <div className="border border-black/10 rounded-2xl bg-white shadow-sm p-5">
        <h3 className="text-sm text-black">Scores</h3>
        <div className="mt-4 space-y-4">
          {scores.map((s) => (
            <div
              key={s.label}
              className="grid grid-cols-[140px_1fr] items-center gap-4"
            >
              <span className="text-xs text-black/60">{s.label}</span>
              <ScoreCell value={s.value} />
            </div>
          ))}
        </div>
        {emp.cap_applied && (
          <p className="text-[11px] text-amber-700 mt-4">
            A score cap was applied to this employee.
          </p>
        )}
      </div>

      {/* REVIEW */}
      <div className="border border-black/10 rounded-2xl bg-white shadow-sm p-5">
        <h3 className="text-sm text-black">Review</h3>
        {reviewRows.length === 0 ? (
          <p className="text-xs text-black/40 mt-2">
            No review has been submitted for this month yet.
          </p>
        ) : (
          <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {reviewRows.map(([k, v]) => (
              <div key={k}>
                <dt className="text-[11px] text-black/40">{humanize(k)}</dt>
                <dd className="text-sm text-black mt-0.5 break-words">
                  {String(v)}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <WeightsNote weights={data?.weights} />
    </>
  );
};

/* ---------- page ---------- */

function Kpi() {
  const now = new Date();

  const [activeTab, setActiveTab] = useState(
    () => localStorage.getItem(TAB_KEY) || "company",
  );
  const [period, setPeriod] = useState({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });
  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState(""); // "" = all departments
  const [employeeId, setEmployeeId] = useState("");

  useEffect(() => {
    localStorage.setItem(TAB_KEY, activeTab);
  }, [activeTab]);

  const isCurrentPeriod =
    period.month === now.getMonth() + 1 && period.year === now.getFullYear();

  const changeMonth = (offset) =>
    setPeriod((p) => {
      const d = new Date(p.year, p.month - 1 + offset, 1);
      return { month: d.getMonth() + 1, year: d.getFullYear() };
    });

  const goToCurrent = () =>
    setPeriod({ month: now.getMonth() + 1, year: now.getFullYear() });

  // Department dropdown options (loaded once)
  useEffect(() => {
    getDepartmentData()
      .then((list) => setDepartments(Array.isArray(list) ? list : []))
      .catch((e) => console.error("Failed to load departments:", e));
  }, []);

  const { month, year } = period;

  // Company tab
  const company = useKpiData(
    () => fetchCompanyKpi(month, year, departmentId),
    [month, year, departmentId],
    activeTab === "company",
  );

  // Team tab
  const team = useKpiData(
    () => fetchTeamKpi(month, year),
    [month, year],
    activeTab === "team",
  );

  // Individual tab: employee dropdown options (active users)
  const options = useKpiData(
    async () => {
      const users = await getActiveUsersLight();
      return (Array.isArray(users) ? users : [])
        .map((u) => ({
          // The dashboard endpoint expects the employee code (uuid), not the row id
          id: String(u.uuid ?? u.user_id ?? u.id ?? ""),
          name: lightUserName(u),
          sub: u.department_name || u.department || "",
        }))
        .filter((o) => o.id);
    },
    [],
    activeTab === "individual",
  );

  const employeeOptions = options.data || [];

  // Pick the first employee when nothing (or an unknown one) is selected
  useEffect(() => {
    if (!employeeOptions.length) return;
    if (!employeeOptions.some((o) => o.id === employeeId)) {
      setEmployeeId(employeeOptions[0].id);
    }
  }, [employeeOptions, employeeId]);

  const individual = useKpiData(
    () => fetchEmployeeKpi(employeeId, month, year),
    [employeeId, month, year],
    activeTab === "individual" && !!employeeId,
  );

  // Clicking a name in Company / Team opens that person's Individual tab
  const openEmployee = (id) => {
    setEmployeeId(id);
    setActiveTab("individual");
  };

  // Options in the { value, label } shape CustomSelect expects
  const departmentSelectOptions = [
    { value: "", label: "All departments" },
    ...departments.map((d) => ({
      value: String(d.id),
      label: String(d.name || d.department_name || "").trim(),
    })),
  ];

  const employeeSelectOptions = employeeOptions.length
    ? employeeOptions.map((o) => ({
        value: o.id,
        label: o.sub ? `${o.name} (${o.sub})` : o.name,
      }))
    : [{ value: "", label: "No employees" }];

  const tabButtonClass = (id) =>
    `pb-2 px-1 transition-all relative whitespace-nowrap ${
      activeTab === id
        ? "text-black after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-black"
        : "text-gray-500 hover:text-black"
    }`;

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
          {/* HEADER: month + filters */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl text-black tracking-tight">
                {MONTHS[period.month - 1]}{" "}
                <span className="text-black/30">{period.year}</span>
              </h2>
              <p className="text-xs text-black/40 mt-0.5">
                {activeTab === "company" && "Company KPI dashboard"}
                {activeTab === "team" && "Team KPI dashboard"}
                {activeTab === "individual" && "Individual KPI dashboard"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {activeTab === "company" && (
                <CustomSelect
                  label="Department"
                  value={departmentId}
                  onChange={setDepartmentId}
                  minWidth={170}
                  options={departmentSelectOptions}
                />
              )}

              {activeTab === "individual" && (
                <CustomSelect
                  label="Employee"
                  value={employeeId}
                  onChange={setEmployeeId}
                  minWidth={220}
                  options={employeeSelectOptions}
                />
              )}

              <button
                onClick={goToCurrent}
                disabled={isCurrentPeriod}
                className="px-3.5 py-2 text-xs text-black border border-black/10 rounded-lg hover:bg-black/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                This month
              </button>
              <div className="flex items-center border border-black/10 rounded-lg overflow-hidden">
                <button
                  aria-label="Previous month"
                  onClick={() => changeMonth(-1)}
                  className="p-2 text-black hover:bg-black/5 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="w-px h-5 bg-black/10" />
                <button
                  aria-label="Next month"
                  onClick={() => changeMonth(1)}
                  disabled={isCurrentPeriod}
                  className="p-2 text-black hover:bg-black/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* TAB PANELS */}
          {activeTab === "company" &&
            (company.loading ? (
              <Loading />
            ) : company.error ? (
              <ErrorBox message={company.error} onRetry={company.reload} />
            ) : company.data ? (
              <DashboardView
                kpi={company.data}
                scope="company"
                onOpenEmployee={openEmployee}
              />
            ) : null)}

          {activeTab === "team" &&
            (team.loading ? (
              <Loading />
            ) : team.error ? (
              <ErrorBox message={team.error} onRetry={team.reload} />
            ) : team.data ? (
              <DashboardView
                kpi={team.data}
                scope="team"
                onOpenEmployee={openEmployee}
              />
            ) : null)}

          {activeTab === "individual" &&
            (options.loading || individual.loading ? (
              <Loading />
            ) : options.error ? (
              <ErrorBox message={options.error} onRetry={options.reload} />
            ) : individual.error ? (
              <ErrorBox
                message={individual.error}
                onRetry={individual.reload}
              />
            ) : !employeeId ? (
              <div className="py-24 text-center text-sm text-black/40">
                No employees found for this month.
              </div>
            ) : individual.data ? (
              <IndividualView data={individual.data} />
            ) : null)}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Kpi;
