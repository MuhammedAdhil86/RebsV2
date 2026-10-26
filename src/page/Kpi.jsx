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
import { fetchCompanyKpi, fetchDepartments } from "../service/kpiservices";

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

/* ---------- small UI pieces ---------- */

const Badge = ({ children, className = "bg-zinc-100 text-zinc-600" }) => (
  <span
    className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap ${className}`}
  >
    {children}
  </span>
);

const StatCard = ({ icon: IconCmp, label, value, hint }) => (
  <div className="border border-black/10 rounded-2xl bg-white shadow-sm p-4">
    <div className="flex items-center gap-2 text-black/50">
      <IconCmp size={14} />
      <span className="text-xs font-medium">{label}</span>
    </div>
    <p className="text-2xl font-semibold text-black mt-2 tracking-tight">
      {value}
    </p>
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
        <div className="h-full bg-black rounded-full" style={{ width: `${width}%` }} />
      </div>
      <span className="text-xs font-medium text-black w-9 text-right">
        {num(value, 1)}
      </span>
    </div>
  );
};

/* ---------- page ---------- */

function Kpi() {
  const now = new Date();
  const [period, setPeriod] = useState({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });
  const [kpi, setKpi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState(""); // "" = all departments

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
    fetchDepartments()
      .then((list) => setDepartments(list || []))
      .catch((e) => console.error("Failed to load departments:", e));
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchCompanyKpi(
          period.month,
          period.year,
          departmentId,
        );
        if (!cancelled) setKpi(data);
      } catch (e) {
        console.error("KPI dashboard load failed:", e);
        if (!cancelled) {
          setKpi(null);
          setError(e?.message || "Failed to load KPI dashboard.");
          toast.error(e?.message || "Failed to load KPI dashboard.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [period, departmentId]);

  const employees = kpi?.employees || [];

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) =>
      [e.user_name, e.department, e.designation, e.user_id]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [employees, search]);

  const summary = kpi?.summary;
  const mix = kpi?.attendance_mix;
  const weights = kpi?.weights;
  const attention = kpi?.needs_attention || [];

  return (
    <DashboardLayout userName="Admin" onLogout={() => {}}>
      <div className="w-full space-y-4">
        <HeaderGlobal userName="Admin" />

        <div className="p-4 bg-white rounded-lg shadow-sm space-y-6">
          {/* HEADER */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-black tracking-tight">
                {MONTHS[period.month - 1]}{" "}
                <span className="text-black/30 font-light">{period.year}</span>
              </h2>
              <p className="text-xs text-black/40 mt-0.5">
                Company KPI dashboard
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                aria-label="Filter by department"
                className="px-3 py-2 text-xs text-black border border-black/10 rounded-lg bg-white outline-none focus:border-black transition-colors"
              >
                <option value="">All departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={String(d.id)}>
                    {String(d.name || "").trim()}
                  </option>
                ))}
              </select>
              <button
                onClick={goToCurrent}
                disabled={isCurrentPeriod}
                className="px-3.5 py-2 text-xs font-medium text-black border border-black/10 rounded-lg hover:bg-black/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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

          {/* LOADING / ERROR */}
          {loading && (
            <div className="py-24 text-center text-sm text-black/40">
              Loading KPI data...
            </div>
          )}

          {!loading && error && (
            <div className="py-24 text-center">
              <p className="text-sm font-medium text-black">
                Could not load KPI data
              </p>
              <p className="text-xs text-black/40 mt-1">{error}</p>
              <button
                onClick={() => setPeriod((p) => ({ ...p }))}
                className="mt-4 px-4 py-2 text-xs font-medium border border-black/10 rounded-lg hover:bg-black/5 transition-colors"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && kpi && (
            <>
              {/* NOTICES */}
              {kpi.partial_period && (
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-50 text-amber-800 text-xs">
                  <Info size={14} className="mt-0.5 shrink-0" />
                  <span>
                    This month is still in progress, so scores are based on the
                    days completed so far.
                  </span>
                </div>
              )}

              {kpi.feedback_due && (
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-50 text-red-700 text-xs">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span>
                    Feedback is overdue. It was due on{" "}
                    {formatDate(kpi.feedback_due_on)}.
                  </span>
                </div>
              )}

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
                    summary?.avg_performance == null
                      ? "Waiting for reviews"
                      : undefined
                  }
                />
                <StatCard
                  icon={Award}
                  label="Avg overall score"
                  value={num(summary?.avg_overall, 1)}
                  hint={
                    summary?.avg_overall == null
                      ? "Waiting for reviews"
                      : undefined
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
                    kpi.feedback_due_on
                      ? `Due ${formatDate(kpi.feedback_due_on)}`
                      : undefined
                  }
                />
              </div>

              {/* ATTENDANCE MIX + NEEDS ATTENTION */}
              <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 items-start">
                {/* Attendance mix */}
                <div className="border border-black/10 rounded-2xl bg-white shadow-sm p-5">
                  <h3 className="text-sm font-semibold text-black">
                    Attendance mix
                  </h3>
                  <p className="text-xs text-black/40 mt-0.5">
                    Share of all employee-days this month
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
                          <span className="text-xs text-black/60">
                            {s.label}
                          </span>
                        </div>
                        <p className="text-lg font-semibold text-black mt-1 leading-none">
                          {num(mix?.[s.key])}
                        </p>
                        <p className="text-[11px] text-black/40 mt-1">
                          {pct(mix?.[`${s.key}_pct`], 1)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Needs attention */}
                <aside className="border border-black/10 rounded-2xl bg-white shadow-sm">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-black/10">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={14} className="text-black" />
                      <h3 className="text-sm font-semibold text-black">
                        Needs attention
                      </h3>
                    </div>
                    <span className="text-[11px] font-semibold text-white bg-black rounded-full px-2 py-0.5">
                      {attention.length}
                    </span>
                  </div>

                  {attention.length === 0 ? (
                    <div className="px-5 py-10 text-center">
                      <p className="text-sm font-medium text-black">
                        All clear
                      </p>
                      <p className="text-xs text-black/40 mt-1">
                        No employees are flagged this month.
                      </p>
                    </div>
                  ) : (
                    <ul className="max-h-[320px] overflow-y-auto divide-y divide-black/5">
                      {attention.map((a) => (
                        <li key={a.user_id} className="px-5 py-3.5">
                          <p className="text-sm font-medium text-black truncate">
                            {(a.user_name || "").trim() || `User ${a.user_id}`}
                          </p>
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
                    <h3 className="text-sm font-semibold text-black">
                      Employee breakdown
                    </h3>
                    <p className="text-xs text-black/40 mt-0.5">
                      {filteredEmployees.length} of {employees.length} employees
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
                        <th className="px-5 py-3 font-semibold">Employee</th>
                        <th className="px-3 py-3 font-semibold text-center">
                          On time
                        </th>
                        <th className="px-3 py-3 font-semibold text-center">
                          Late
                        </th>
                        <th className="px-3 py-3 font-semibold text-center">
                          Delay
                        </th>
                        <th className="px-3 py-3 font-semibold text-center">
                          Half day
                        </th>
                        <th className="px-3 py-3 font-semibold text-center">
                          Absent
                        </th>
                        <th className="px-3 py-3 font-semibold text-center">
                          Leave
                        </th>
                        <th className="px-3 py-3 font-semibold text-center">
                          LOP
                        </th>
                        <th className="px-3 py-3 font-semibold">Regularity</th>
                        <th className="px-3 py-3 font-semibold">Punctuality</th>
                        <th className="px-3 py-3 font-semibold">Attendance</th>
                        <th className="px-3 py-3 font-semibold">Review</th>
                        <th className="px-3 py-3 font-semibold">Overall</th>
                        <th className="px-5 py-3 font-semibold">Band</th>
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
                              <p className="text-sm font-medium text-black">
                                {(e.user_name || "").trim() ||
                                  `User ${e.user_id}`}
                              </p>
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
                                className={
                                  BAND_STYLES[e.band] ||
                                  "bg-black text-white"
                                }
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

              {/* HOW SCORES WORK */}
              {weights && (
                <div className="border border-black/10 rounded-2xl bg-zinc-50 p-5">
                  <h3 className="text-sm font-semibold text-black">
                    How scores are calculated
                  </h3>
                  <ul className="mt-3 space-y-1.5 text-xs text-black/60">
                    <li>
                      Performance weight is{" "}
                      {Math.round(weights.performance_weight * 100)}% and
                      attendance weight is{" "}
                      {Math.round(weights.attendance_weight * 100)}%.
                    </li>
                    <li>
                      Attendance can add up to {weights.max_attendance_lift}{" "}
                      points to the overall score.
                    </li>
                    <li>
                      Attendance score weighs regularity at{" "}
                      {weights.regularity_share} and punctuality at{" "}
                      {weights.punctuality_share}.
                    </li>
                    <li>
                      The first {weights.lop_free_days} loss of pay days are free.
                      After that, each day costs {weights.lop_penalty_per_day}{" "}
                      points.
                    </li>
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Kpi;
