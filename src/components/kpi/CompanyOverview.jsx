import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  Users,
  Gauge,
  Clock,
  CalendarX,
  AlertTriangle,
  Info,
  ListChecks,
  CheckCircle2,
  Percent,
  ChevronDown,
  Loader,
  Eye,
  Ban,
  PauseCircle,
  XCircle,
  RotateCcw,
  CalendarCheck,
  Timer,
  ChevronsUpDown,
  ChevronsDownUp,
  Building2,
  ShieldAlert,
  RefreshCw,
} from "lucide-react";
import { showApiError, formatDetail } from "../../utils/apiToast"; // adjust path to your toast util
import { fetchCompanyKpi } from "../../service/kpiService";

/* ---------- constants ---------- */

export const BAND_STYLES = {
  pending_review: "bg-zinc-100 text-zinc-600",
};

export const REVIEW_STYLES = {
  not_started: "bg-zinc-100 text-zinc-600",
  in_progress: "bg-amber-50 text-amber-700",
  submitted: "bg-emerald-50 text-emerald-700",
};

export const MIX_SEGMENTS = [
  {
    key: "on_time",
    label: "On time",
    color: "bg-emerald-500",
    hex: "#34c759",
    tone: "#15803d",
  },
  {
    key: "late",
    label: "Late",
    color: "bg-amber-400",
    hex: "#f2c94c",
    tone: "#a16207",
  },
  {
    key: "delay",
    label: "Delay",
    color: "bg-orange-500",
    hex: "#ff9a62",
    tone: "#c2410c",
  },
  {
    key: "half_day",
    label: "Half day",
    color: "bg-sky-500",
    hex: "#5b8def",
    tone: "#1d4ed8",
  },
  {
    key: "absent",
    label: "Absent",
    color: "bg-red-400",
    hex: "#ef6b6b",
    tone: "#b91c1c",
  },
];

const MONTH_NAMES = [
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

const SORT_OPTIONS = [
  { value: "name", label: "Name (A to Z)" },
  { value: "attention", label: "Most flags first" },
  { value: "regularity_asc", label: "Lowest regularity" },
  { value: "punctuality_asc", label: "Lowest punctuality" },
  { value: "overall_desc", label: "Highest overall score" },
];

/* ---------- helpers ---------- */

// null / undefined -> "—", otherwise a trimmed number
export const num = (v, digits = 0) =>
  v === null || v === undefined || Number.isNaN(Number(v))
    ? "—"
    : Number(v).toLocaleString("en-IN", {
        maximumFractionDigits: digits,
      });

export const pct = (v, digits = 0) =>
  v === null || v === undefined ? "—" : `${num(v, digits)}%`;

// "low_regularity" -> "Low regularity"
export const humanize = (s) => {
  if (!s) return "—";
  const t = String(s).replace(/_/g, " ").trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
};

export const formatDate = (iso) => {
  if (!iso) return "—";
  const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return "—";
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// 313 -> "5h 13m"
export const duration = (minutes) => {
  if (
    minutes === null ||
    minutes === undefined ||
    Number.isNaN(Number(minutes))
  )
    return "—";
  const m = Math.round(Number(minutes));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r}m`;
  return r === 0 ? `${h}h` : `${h}h ${r}m`;
};

export const nameOf = (e) =>
  (e?.user_name || "").trim() || `User ${e?.user_id ?? ""}`;

// Score colour: green >= 75, amber >= 50, red below
const scoreTone = (v) => {
  if (v === null || v === undefined || Number.isNaN(Number(v)))
    return "#d4d4d8";
  const n = Number(v);
  if (n >= 75) return "#34c759";
  if (n >= 50) return "#f2c94c";
  return "#ef6b6b";
};

/**
 * Loads data with loading / error state. Only runs while `enabled` is true.
 * `deps` are the values the request depends on.
 */
export const useKpiData = (fetcher, deps, enabled) => {
  const [state, setState] = useState({
    data: null,
    loading: !!enabled,
    error: "",
    errorDetail: "",
  });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;

    setState((s) => ({ ...s, loading: true, error: "", errorDetail: "" }));
    fetcher()
      .then((data) => {
        if (!cancelled)
          setState({ data, loading: false, error: "", errorDetail: "" });
      })
      .catch((e) => {
        console.error("KPI load failed:", e);
        if (cancelled) return;
        const message =
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Failed to load KPI data.";
        const body = e?.response?.data;
        const errorDetail = formatDetail(
          body?.data ?? (body?.message ? body?.error : undefined),
        );
        setState({ data: null, loading: false, error: message, errorDetail });
        showApiError(e, "Failed to load KPI data.");
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, reloadKey, ...deps]);

  return { ...state, reload: () => setReloadKey((k) => k + 1) };
};

/* ---------- small UI pieces ---------- */

export const Badge = ({
  children,
  className = "bg-zinc-100 text-zinc-600",
}) => (
  <span
    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap ${className}`}
  >
    {children}
  </span>
);

// Same pastel backgrounds as the dashboard cards
export const CARD_BGS = ["#EBFDEF", "#E8EFF9", "#FFEFE7", "#FFFBDB", "#FFDADA"];

// Same look as the dashboard KPI cards: pastel bg, black round icon, uppercase label
export const StatCard = ({
  icon: IconCmp,
  label,
  value,
  hint,
  bg = "#E8EFF9",
}) => (
  <div
    className="shadow-sm rounded-lg p-3 flex items-center gap-3 border border-transparent"
    style={{ backgroundColor: bg }}
  >
    {IconCmp && (
      <div className="flex items-center justify-center min-w-10 h-10 rounded-full bg-black text-white">
        <IconCmp size={20} />
      </div>
    )}
    <div className="overflow-hidden">
      <p className="text-gray-500 text-[10px] sm:text-xs truncate uppercase font-semibold">
        {label}
      </p>
      <h2 className="text-lg sm:text-xl font-medium text-gray-800">{value}</h2>
      {hint && (
        <p className="text-[10px] text-gray-500 mt-0.5 truncate">{hint}</p>
      )}
    </div>
  </div>
);

export const ScoreCell = ({ value }) => {
  if (value === null || value === undefined) {
    return <span className="text-black/30">—</span>;
  }
  const width = Math.max(0, Math.min(100, Number(value)));
  return (
    <div className="flex items-center gap-2 min-w-[90px]">
      <div className="flex-1 h-2 rounded-full bg-black/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${width}%`, background: scoreTone(value) }}
        />
      </div>
      <span className="text-xs text-black w-10 text-right tabular-nums">
        {num(value, 1)}
      </span>
    </div>
  );
};

export const Loading = () => (
  <div className="space-y-6 animate-pulse" aria-busy="true">
    <div className="h-4 w-48 rounded bg-black/5" />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-[72px] rounded-lg bg-black/5" />
      ))}
    </div>
    <div className="h-40 rounded-2xl bg-black/5" />
    <div className="h-32 rounded-2xl bg-black/5" />
    <p className="text-center text-xs text-black/40">Loading KPI data...</p>
  </div>
);

export const ErrorBox = ({ message, detail, onRetry }) => (
  <div className="py-24 text-center">
    <div className="mx-auto w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-3">
      <AlertTriangle size={18} />
    </div>
    <p className="text-sm text-black">Could not load KPI data</p>
    <p className="text-xs text-black/40 mt-1">{message}</p>
    {detail && (
      <p className="text-[11px] text-black/40 mt-1 break-words px-4">
        {detail}
      </p>
    )}
    <button
      onClick={onRetry}
      className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs border border-black/10 rounded-lg hover:bg-black/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
    >
      <RefreshCw size={12} />
      Try again
    </button>
  </div>
);

export const Notices = ({ kpi }) => (
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

export const WeightsNote = ({ weights }) => {
  if (!weights) return null;
  const items = [
    {
      label: "Performance weight",
      value: `${Math.round(weights.performance_weight * 100)}%`,
      note: "Share of the overall score",
    },
    {
      label: "Attendance weight",
      value: `${Math.round(weights.attendance_weight * 100)}%`,
      note: "Share of the overall score",
    },
    {
      label: "Max attendance lift",
      value: `${num(weights.max_attendance_lift)} pts`,
      note: "Most attendance can add",
    },
    {
      label: "Regularity share",
      value: num(weights.regularity_share),
      note: "Within attendance score",
    },
    {
      label: "Punctuality share",
      value: num(weights.punctuality_share),
      note: "Within attendance score",
    },
    {
      label: "LOP free days",
      value: num(weights.lop_free_days),
      note: "No penalty up to this many",
    },
    {
      label: "LOP penalty per day",
      value: `${num(weights.lop_penalty_per_day)} pts`,
      note: "After the free days",
    },
  ];
  return (
    <section className="border border-black/10 rounded-2xl bg-white shadow-sm px-5 py-4 sm:px-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-sm font-medium text-black">
          How scores are calculated
        </h3>
        <p className="text-xs text-black/40">Scoring weights in use</p>
      </div>
      <dl className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
        {items.map((it) => (
          <div key={it.label} className="min-w-0">
            <dt className="text-xs font-medium text-black/50 truncate">
              {it.label}
            </dt>
            <dd className="mt-1 text-lg font-medium text-black tabular-nums leading-none">
              {it.value}
            </dd>
            <p className="mt-1 text-[11px] text-black/40">{it.note}</p>
          </div>
        ))}
      </dl>
    </section>
  );
};

/* ---------- Task KPI cards (shown inside an employee accordion) ---------- */

export const TaskCards = ({ tasks }) => {
  if (!tasks) {
    return (
      <div className="rounded-xl border border-dashed border-black/15 px-4 py-6 text-center">
        <ListChecks size={18} className="mx-auto text-black/30 mb-2" />
        <p className="text-xs text-black/60">No task data for this month</p>
        <p className="text-[11px] text-black/40 mt-0.5">
          Task KPIs appear once tasks are assigned to this employee.
        </p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3">
      <StatCard
        icon={ListChecks}
        bg="#E8EFF9"
        label="Total tasks"
        value={num(tasks.total_tasks)}
      />
      <StatCard
        icon={CheckCircle2}
        bg="#EBFDEF"
        label="Completed"
        value={num(tasks.completed)}
      />
      <StatCard
        icon={Loader}
        bg="#FFFBDB"
        label="In progress"
        value={num(tasks.in_progress)}
      />
      <StatCard
        icon={Eye}
        bg="#FFEFE7"
        label="Under review"
        value={num(tasks.under_review)}
      />
      <StatCard
        icon={Ban}
        bg="#FFDADA"
        label="Blocked"
        value={num(tasks.blocked)}
      />
      <StatCard
        icon={PauseCircle}
        bg="#E8EFF9"
        label="On hold"
        value={num(tasks.on_hold)}
      />
      <StatCard
        icon={XCircle}
        bg="#FFDADA"
        label="Cancelled"
        value={num(tasks.cancelled)}
      />
      <StatCard
        icon={Percent}
        bg="#EBFDEF"
        label="Completion rate"
        value={pct(tasks.completion_rate, 1)}
      />
      <StatCard
        icon={RotateCcw}
        bg="#FFEFE7"
        label="Rework required"
        value={num(tasks.rework_required)}
        hint={`Rework rate ${pct(tasks.rework_rate, 1)}`}
      />
      <StatCard
        icon={CalendarCheck}
        bg="#FFFBDB"
        label="Days logged"
        value={num(tasks.days_logged)}
        hint={`Coverage ${pct(tasks.logging_coverage, 1)}`}
      />
      <StatCard
        icon={Timer}
        bg="#E8EFF9"
        label="Time logged"
        value={duration(tasks.minutes_logged)}
        hint={`${num(tasks.minutes_logged)} min`}
      />
    </div>
  );
};

/* ---------- layout + chart pieces ---------- */

const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const avatarBg = (id) => {
  const s = String(id ?? "");
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return CARD_BGS[h % CARD_BGS.length];
};

const SectionLabel = ({ children }) => (
  <p className="text-xs font-semibold text-black/45">{children}</p>
);

const Panel = ({ title, subtitle, right, children, className = "" }) => (
  <section
    className={`border border-black/10 rounded-2xl bg-white shadow-sm px-5 py-4 sm:px-6 ${className}`}
  >
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h3 className="text-sm font-medium text-black">{title}</h3>
      {subtitle && <p className="text-xs text-black/40">{subtitle}</p>}
      {right}
    </div>
    <div className="mt-4">{children}</div>
  </section>
);

// Quiet metric tile: coloured dot, small label, big number, tinted hint
const Tile = ({ label, value, hint, dot = "#9ca3af", tone }) => (
  <div className="rounded-xl bg-zinc-50 border border-black/5 px-4 py-3 min-w-0">
    <div className="flex items-center gap-2">
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ background: dot }}
      />
      <span className="text-[11px] font-medium text-black/55 truncate">
        {label}
      </span>
    </div>
    <p className="mt-2 text-xl sm:text-2xl font-medium text-black tabular-nums leading-none">
      {value}
    </p>
    {hint && (
      <p
        className="mt-1.5 text-[11px] font-medium truncate"
        style={{ color: tone || "rgba(0,0,0,0.4)" }}
      >
        {hint}
      </p>
    )}
  </div>
);

// Compact donut: value is 0-100, centre text is shown inside the ring
const Ring = ({ value, center, label, note, color }) => {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const v =
    value === null || value === undefined || Number.isNaN(Number(value))
      ? 0
      : Math.max(0, Math.min(100, Number(value)));
  const text = String(center);
  return (
    <div className="flex items-center gap-4 py-4 sm:py-0 sm:px-6 sm:first:pl-0 sm:last:pr-0 first:pt-0 last:pb-0 min-w-0">
      <svg viewBox="0 0 100 100" className="w-[72px] h-[72px] shrink-0">
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="#f1f1f3"
          strokeWidth="9"
        />
        {v > 0 && (
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${(v / 100) * circ} ${circ}`}
            transform="rotate(-90 50 50)"
          />
        )}
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={text.length > 4 ? 19 : 23}
          fontWeight="500"
          fill="#111"
        >
          {text}
        </text>
      </svg>
      <div className="min-w-0">
        <p className="text-xs font-medium text-black/60">{label}</p>
        {note && <p className="mt-1 text-xs text-black/40">{note}</p>}
      </div>
    </div>
  );
};

// Segmented horizontal bar for the attendance mix
const MixBar = ({ mix }) => {
  const parts = MIX_SEGMENTS.map((s) => ({
    ...s,
    pct: Number(mix?.[`${s.key}_pct`]) || 0,
  }));
  const total = parts.reduce((a, p) => a + p.pct, 0);
  if (!mix || total <= 0) {
    return <div className="h-3 rounded-full bg-black/5" />;
  }
  return (
    <div
      className="flex h-3 rounded-full overflow-hidden bg-black/5"
      role="img"
      aria-label={parts
        .map((p) => `${p.label} ${num(p.pct, 1)} percent`)
        .join(", ")}
    >
      {parts.map(
        (p) =>
          p.pct > 0 && (
            <div
              key={p.key}
              title={`${p.label}: ${num(p.pct, 1)}%`}
              style={{ width: `${(p.pct / total) * 100}%`, background: p.hex }}
            />
          ),
      )}
    </div>
  );
};

const MiniBar = ({ value }) => {
  const w =
    value === null || value === undefined
      ? 0
      : Math.max(0, Math.min(100, Number(value)));
  return (
    <div className="h-1.5 rounded-full bg-black/10 overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{ width: `${w}%`, background: scoreTone(value) }}
      />
    </div>
  );
};

/* ---------- Employee detail (shown inside each accordion) ---------- */

const ScoreRing = ({ label, value }) => {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const empty =
    value === null || value === undefined || Number.isNaN(Number(value));
  const v = empty ? 0 : Math.max(0, Math.min(100, Number(value)));
  return (
    <div className="flex flex-col items-center text-center min-w-0">
      <svg viewBox="0 0 64 64" className="w-[68px] h-[68px]">
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke="#f1f1f3"
          strokeWidth="7"
        />
        {v > 0 && (
          <circle
            cx="32"
            cy="32"
            r={r}
            fill="none"
            stroke={scoreTone(value)}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${(v / 100) * circ} ${circ}`}
            transform="rotate(-90 32 32)"
          />
        )}
        <text
          x="32"
          y="32"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="14"
          fontWeight="500"
          fill={empty ? "#a1a1aa" : "#111"}
        >
          {empty ? "—" : num(value, 1)}
        </text>
      </svg>
      <p className="mt-1.5 text-[11px] font-medium text-black/60 leading-tight">
        {label}
      </p>
    </div>
  );
};

// Stacked bar + legend rows: segments = [{ label, value, color }]
const SplitBar = ({ segments, digits = 1 }) => {
  const total = segments.reduce((a, x) => a + (Number(x.value) || 0), 0);
  return (
    <div>
      <div className="flex h-2.5 rounded-full overflow-hidden bg-black/5">
        {total > 0 &&
          segments.map(
            (x) =>
              Number(x.value) > 0 && (
                <div
                  key={x.label}
                  title={`${x.label}: ${num(x.value, digits)}`}
                  style={{
                    width: `${(Number(x.value) / total) * 100}%`,
                    background: x.color,
                  }}
                />
              ),
          )}
      </div>
      <ul className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
        {segments.map((x) => (
          <li
            key={x.label}
            className="flex items-center justify-between gap-2 min-w-0"
          >
            <span className="flex items-center gap-2 min-w-0">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: x.color }}
              />
              <span className="text-xs text-black/60 truncate">{x.label}</span>
            </span>
            <span className="text-xs font-medium text-black tabular-nums">
              {num(x.value, digits)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const FactRow = ({ label, value, hint }) => (
  <div className="flex items-baseline justify-between gap-3 py-2 border-b border-black/5 last:border-0">
    <span className="text-xs text-black/55">{label}</span>
    <span className="text-xs text-black text-right break-words">
      {value ?? "—"}
      {hint && <span className="ml-1.5 text-black/40">{hint}</span>}
    </span>
  </div>
);

const EmployeeDetail = ({ e, flags, kpi }) => {
  const worked = Number(e.worked_days) || 0;
  const eligible = Number(e.eligible_days) || 0;
  const workedPct = eligible > 0 ? Math.min(100, (worked / eligible) * 100) : 0;
  const t = e.tasks;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">
      {/* Profile column */}
      <aside className="bg-zinc-50/70 px-5 py-5 lg:border-r border-b lg:border-b-0 border-black/10 space-y-5">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-14 h-14 rounded-full text-black flex items-center justify-center text-sm font-medium shrink-0"
            style={{ background: avatarBg(e.user_id) }}
          >
            {initials(nameOf(e)) || "?"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-black truncate">
              {nameOf(e)}
            </p>
            <p className="text-[11px] text-black/50 tabular-nums">
              User ID {e.user_id}
            </p>
          </div>
        </div>

        <div>
          <FactRow label="Designation" value={e.designation} />
          <FactRow label="Department" value={e.department} />
          <FactRow label="Review status" value={humanize(e.review_status)} />
          <FactRow label="Band" value={humanize(e.band)} />
          <FactRow label="Overall rating" value={num(e.overall_rating, 1)} />
          <FactRow
            label="Score cap"
            value={e.cap_applied ? "Applied" : "Not applied"}
          />
          <FactRow
            label="Feedback"
            value={
              kpi?.feedback_due && e.review_status !== "submitted"
                ? "Overdue"
                : humanize(e.review_status)
            }
            hint={
              kpi?.feedback_due_on
                ? `due ${formatDate(kpi.feedback_due_on)}`
                : undefined
            }
          />
          <FactRow
            label="Period"
            value={
              kpi?.month && kpi?.year
                ? `${MONTH_NAMES[kpi.month - 1]} ${kpi.year}`
                : "—"
            }
          />
        </div>

        <div>
          <p className="text-xs font-semibold text-black/45 mb-2">
            Needs attention
          </p>
          {flags?.length ? (
            <div className="flex flex-wrap gap-1.5">
              {flags.map((r) => (
                <Badge key={r} className="bg-red-50 text-red-600">
                  {humanize(r)}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-black/50">No flags</p>
          )}
        </div>
      </aside>

      {/* Data column */}
      <div className="px-5 py-5 space-y-6 min-w-0">
        <div>
          <SectionLabel>Scores</SectionLabel>
          <div className="mt-3 grid grid-cols-3 sm:grid-cols-5 gap-3">
            <ScoreRing label="Regularity" value={e.regularity} />
            <ScoreRing label="Punctuality" value={e.punctuality} />
            <ScoreRing label="Attendance" value={e.attendance_score} />
            <ScoreRing label="Performance" value={e.performance_score} />
            <ScoreRing label="Overall" value={e.overall_score} />
          </div>
        </div>

        <div className="border-t border-black/5 pt-5">
          <SectionLabel>Attendance</SectionLabel>
          <div className="mt-3">
            <SplitBar
              segments={[
                { label: "On time", value: e.on_time, color: "#34c759" },
                { label: "Late", value: e.late_days, color: "#f2c94c" },
                { label: "Delay", value: e.delay_days, color: "#ff9a62" },
                { label: "Half day", value: e.half_days, color: "#5b8def" },
                { label: "Absent", value: e.absent_days, color: "#ef6b6b" },
                { label: "Leave", value: e.leave_days, color: "#8b5cf6" },
              ]}
            />
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-x-6 gap-y-3 items-center">
            <div>
              <div className="flex justify-between text-[11px] text-black/50 mb-1">
                <span>Worked days</span>
                <span className="tabular-nums text-black">
                  {num(e.worked_days, 1)} of {num(e.eligible_days, 1)} eligible
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-black/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-black"
                  style={{ width: `${workedPct}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-black/55">
              LOP days{" "}
              <span className="font-medium text-black tabular-nums">
                {num(e.lop_days, 1)}
              </span>
            </p>
          </div>
        </div>

        <div className="border-t border-black/5 pt-5">
          <SectionLabel>Tasks</SectionLabel>
          {!t ? (
            <div className="mt-3 rounded-xl border border-dashed border-black/15 px-4 py-5 text-center">
              <p className="text-xs text-black/60">
                No task data for this month
              </p>
              <p className="text-[11px] text-black/40 mt-0.5">
                Task KPIs appear once tasks are assigned to this employee.
              </p>
            </div>
          ) : (
            <div className="mt-3 space-y-4">
              <SplitBar
                digits={0}
                segments={[
                  { label: "Completed", value: t.completed, color: "#34c759" },
                  {
                    label: "In progress",
                    value: t.in_progress,
                    color: "#f2c94c",
                  },
                  {
                    label: "Under review",
                    value: t.under_review,
                    color: "#ff9a62",
                  },
                  { label: "Blocked", value: t.blocked, color: "#ef6b6b" },
                  { label: "On hold", value: t.on_hold, color: "#5b8def" },
                  { label: "Cancelled", value: t.cancelled, color: "#a1a1aa" },
                ]}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                <div>
                  <FactRow label="Total tasks" value={num(t.total_tasks)} />
                  <FactRow
                    label="Completion rate"
                    value={pct(t.completion_rate, 1)}
                  />
                  <FactRow
                    label="Rework required"
                    value={num(t.rework_required)}
                    hint={`rate ${pct(t.rework_rate, 1)}`}
                  />
                </div>
                <div>
                  <FactRow
                    label="Days logged"
                    value={num(t.days_logged)}
                    hint={`coverage ${pct(t.logging_coverage, 1)}`}
                  />
                  <FactRow
                    label="Time logged"
                    value={duration(t.minutes_logged)}
                    hint={`${num(t.minutes_logged)} min`}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ---------- Company / Team dashboard (same data shape) ---------- */

export const DashboardView = ({ kpi, scope, onOpenEmployee }) => {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [filter, setFilter] = useState("all"); // all | attention | pending
  const [sort, setSort] = useState("name");
  const [openIds, setOpenIds] = useState(() => new Set());

  const employees = kpi?.employees || [];
  const summary = kpi?.summary;
  const mix = kpi?.attendance_mix;
  const weights = kpi?.weights;
  const attention = kpi?.needs_attention || [];
  const taskSummary = kpi?.task_summary;

  const flagsById = useMemo(() => {
    const m = new Map();
    attention.forEach((a) => m.set(String(a.user_id), a.reasons || []));
    return m;
  }, [attention]);

  const employeesById = useMemo(() => {
    const m = new Map();
    employees.forEach((e) => m.set(String(e.user_id), e));
    return m;
  }, [employees]);

  const departments = useMemo(
    () =>
      [...new Set(employees.map((e) => e.department).filter(Boolean))].sort(),
    [employees],
  );

  const deptStats = useMemo(() => {
    const groups = new Map();
    employees.forEach((e) => {
      const key = e.department || "No department";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(e);
    });
    const avg = (list, f) => {
      const vals = list
        .map((x) => x[f])
        .filter((v) => v !== null && v !== undefined);
      return vals.length
        ? vals.reduce((a, b) => a + Number(b), 0) / vals.length
        : null;
    };
    return [...groups.entries()]
      .map(([name, list]) => ({
        name,
        count: list.length,
        regularity: avg(list, "regularity"),
        punctuality: avg(list, "punctuality"),
        flagged: list.filter((x) => flagsById.has(String(x.user_id))).length,
      }))
      .sort((a, b) => b.count - a.count);
  }, [employees, flagsById]);

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = employees.filter((e) => {
      if (department !== "all" && (e.department || "") !== department)
        return false;
      if (filter === "attention" && !flagsById.has(String(e.user_id)))
        return false;
      if (filter === "pending" && e.review_status === "submitted") return false;
      if (!q) return true;
      return [e.user_name, e.department, e.designation, e.user_id]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });

    const nullsLast = (a, b, dir) => {
      if (a == null && b == null) return 0;
      if (a == null) return 1;
      if (b == null) return -1;
      return dir * (Number(a) - Number(b));
    };
    const sorters = {
      name: (a, b) => nameOf(a).localeCompare(nameOf(b)),
      attention: (a, b) =>
        (flagsById.get(String(b.user_id))?.length || 0) -
        (flagsById.get(String(a.user_id))?.length || 0),
      regularity_asc: (a, b) => nullsLast(a.regularity, b.regularity, 1),
      punctuality_asc: (a, b) => nullsLast(a.punctuality, b.punctuality, 1),
      overall_desc: (a, b) => nullsLast(a.overall_score, b.overall_score, -1),
    };
    list = [...list].sort(sorters[sort] || sorters.name);
    return list;
  }, [employees, search, department, filter, sort, flagsById]);

  const toggle = useCallback((id) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = () =>
    setOpenIds(new Set(filteredEmployees.map((e) => e.user_id)));
  const collapseAll = () => setOpenIds(new Set());

  // From the Needs attention list: reveal the person here, then tell the parent
  const jumpTo = (id) => {
    const key = String(id);
    setSearch("");
    setDepartment("all");
    setFilter("all");
    setOpenIds((prev) => new Set(prev).add(key));
    setTimeout(() => {
      document
        .getElementById(`emp-${key}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
    if (typeof onOpenEmployee === "function") onOpenEmployee(key);
  };

  const feedbackPct =
    Number(summary?.feedback_total || 0) > 0
      ? (Number(summary?.feedback_submitted || 0) /
          Number(summary.feedback_total)) *
        100
      : 0;

  const filterChips = [
    { key: "all", label: "All", count: employees.length },
    { key: "attention", label: "Needs attention", count: attention.length },
    {
      key: "pending",
      label: "Review pending",
      count: employees.filter((e) => e.review_status !== "submitted").length,
    },
  ];

  return (
    <div className="space-y-6 min-w-0 max-w-full">
      {/* PERIOD HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {kpi?.month && kpi?.year && (
            <h2 className="text-lg font-medium text-black">
              {MONTH_NAMES[kpi.month - 1]} {kpi.year}
            </h2>
          )}
          <p className="text-xs text-black/45 mt-0.5">
            {scope === "company" ? "Company" : humanize(scope)} KPI report for{" "}
            {num(summary?.employee_count)} employees
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            className={
              kpi?.partial_period
                ? "bg-amber-50 text-amber-700"
                : "bg-emerald-50 text-emerald-700"
            }
          >
            {kpi?.partial_period ? "Month in progress" : "Month complete"}
          </Badge>
          <Badge
            className={
              kpi?.feedback_due
                ? "bg-red-50 text-red-600"
                : "bg-zinc-100 text-zinc-600"
            }
          >
            {kpi?.feedback_due ? "Feedback overdue" : "Feedback on track"}
            {kpi?.feedback_due_on
              ? `, due ${formatDate(kpi.feedback_due_on)}`
              : ""}
          </Badge>
        </div>
      </div>

      <Notices kpi={kpi} />

      {/* SNAPSHOT */}
      <section className="space-y-3">
        <SectionLabel>Snapshot</SectionLabel>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            bg="#EBFDEF"
            label="Employees"
            value={num(summary?.employee_count)}
          />
          <StatCard
            icon={Gauge}
            bg="#E8EFF9"
            label="Avg regularity"
            value={pct(summary?.avg_regularity, 1)}
          />
          <StatCard
            icon={Clock}
            bg="#FFEFE7"
            label="Avg punctuality"
            value={pct(summary?.avg_punctuality, 1)}
          />
          <StatCard
            icon={CalendarX}
            bg="#FFDADA"
            label="Total LOP days"
            value={num(summary?.total_lop_days, 1)}
          />
        </div>
      </section>

      {/* ATTENDANCE MIX */}
      <Panel
        title="Attendance mix"
        subtitle={`Share of all ${scope} employee-days this month`}
      >
        <MixBar mix={mix} />
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {MIX_SEGMENTS.map((s) => (
            <Tile
              key={s.key}
              label={s.label}
              value={num(mix?.[s.key], 1)}
              hint={pct(mix?.[`${s.key}_pct`], 1)}
              dot={s.hex}
              tone={s.tone}
            />
          ))}
        </div>
      </Panel>

      {/* PERFORMANCE + FEEDBACK */}
      <Panel title="Performance and feedback" subtitle="This month">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-black/10">
          <Ring
            label="Avg performance"
            value={summary?.avg_performance}
            center={
              summary?.avg_performance == null
                ? "—"
                : num(summary.avg_performance, 1)
            }
            note={
              summary?.avg_performance == null
                ? "Waiting for reviews"
                : "Out of 100"
            }
            color="#f2c94c"
          />
          <Ring
            label="Avg overall score"
            value={summary?.avg_overall}
            center={
              summary?.avg_overall == null ? "—" : num(summary.avg_overall, 1)
            }
            note={
              summary?.avg_overall == null
                ? "Waiting for reviews"
                : "Out of 100"
            }
            color="#34c759"
          />
          <Ring
            label="Feedback submitted"
            value={feedbackPct}
            center={`${num(summary?.feedback_submitted)}/${num(summary?.feedback_total)}`}
            note={
              kpi?.feedback_due_on
                ? `${kpi?.feedback_due ? "Overdue, was due" : "Due"} ${formatDate(kpi.feedback_due_on)}`
                : undefined
            }
            color="#5b8def"
          />
        </div>
      </Panel>

      {/* TASK SUMMARY */}
      {taskSummary && (
        <Panel
          title="Task summary"
          subtitle={`All tasks across ${scope} employees this month`}
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Tile
              label="Employees with tasks"
              value={num(taskSummary.employees_with_tasks)}
              hint={`of ${num(summary?.employee_count)} employees`}
              dot="#5b8def"
            />
            <Tile
              label="Total tasks"
              value={num(taskSummary.total_tasks)}
              dot="#f2c94c"
            />
            <Tile
              label="Completed"
              value={num(taskSummary.total_completed)}
              hint={`of ${num(taskSummary.total_tasks)} tasks`}
              dot="#34c759"
              tone="#15803d"
            />
            <Tile
              label="Avg completion rate"
              value={pct(taskSummary.avg_completion_rate, 1)}
              hint={
                taskSummary.avg_completion_rate == null
                  ? "No tasks to measure"
                  : undefined
              }
              dot="#ff9a62"
            />
          </div>
        </Panel>
      )}

      {/* BY DEPARTMENT */}
      {deptStats.length > 0 && (
        <Panel
          title="By department"
          subtitle="Average regularity and punctuality"
          right={<Building2 size={14} className="text-black/30" />}
        >
          <ul className="divide-y divide-black/5">
            {deptStats.map((d) => (
              <li
                key={d.name}
                className="grid grid-cols-1 sm:grid-cols-[minmax(0,1.2fr)_1fr_1fr] gap-x-6 gap-y-2 py-3 first:pt-0 last:pb-0 items-center"
              >
                <div className="min-w-0">
                  <p className="text-sm text-black truncate">{d.name}</p>
                  <p className="text-[11px] text-black/40">
                    {d.count} {d.count === 1 ? "employee" : "employees"},{" "}
                    {d.flagged} flagged
                  </p>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-black/50 mb-1">
                    <span>Regularity</span>
                    <span className="tabular-nums text-black">
                      {pct(d.regularity, 1)}
                    </span>
                  </div>
                  <MiniBar value={d.regularity} />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-black/50 mb-1">
                    <span>Punctuality</span>
                    <span className="tabular-nums text-black">
                      {pct(d.punctuality, 1)}
                    </span>
                  </div>
                  <MiniBar value={d.punctuality} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {/* EMPLOYEES (accordion) + NEEDS ATTENTION */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] 2xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
        <div className="space-y-4 min-w-0">
          {/* Toolbar */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="text-sm font-medium text-black">
                  Employee breakdown
                </h3>
                <p className="text-xs text-black/40 mt-0.5">
                  {filteredEmployees.length} of {employees.length} employees.
                  Open one to see attendance, scores, task KPIs and every field.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={expandAll}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs border border-black/10 rounded-lg hover:bg-black/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
                >
                  <ChevronsUpDown size={12} />
                  Expand all
                </button>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs border border-black/10 rounded-lg hover:bg-black/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
                >
                  <ChevronsDownUp size={12} />
                  Collapse all
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(ev) => setSearch(ev.target.value)}
                  placeholder="Search name, department or ID"
                  aria-label="Search employees"
                  className="pl-9 pr-3 py-2 w-full text-xs border border-black/10 rounded-lg outline-none focus:border-black transition-colors"
                />
              </div>
              <select
                value={department}
                onChange={(ev) => setDepartment(ev.target.value)}
                aria-label="Filter by department"
                className="px-3 py-2 text-xs border border-black/10 rounded-lg outline-none focus:border-black bg-white"
              >
                <option value="all">All departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <select
                value={sort}
                onChange={(ev) => setSort(ev.target.value)}
                aria-label="Sort employees"
                className="px-3 py-2 text-xs border border-black/10 rounded-lg outline-none focus:border-black bg-white"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-2">
              {filterChips.map((c) => {
                const active = filter === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setFilter(c.key)}
                    aria-pressed={active}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-black ${
                      active
                        ? "bg-black text-white border-black"
                        : "bg-white text-black/70 border-black/10 hover:bg-black/5"
                    }`}
                  >
                    {c.label}
                    <span
                      className={`tabular-nums ${
                        active ? "text-white/70" : "text-black/40"
                      }`}
                    >
                      {c.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {filteredEmployees.length === 0 ? (
            <div className="border border-black/10 rounded-2xl bg-white shadow-sm py-16 text-center">
              <p className="text-sm text-black">No employees found</p>
              <p className="text-xs text-black/40 mt-1">
                Clear the search or change the filters to see more.
              </p>
            </div>
          ) : (
            filteredEmployees.map((e) => {
              const isOpen =
                openIds.has(e.user_id) || openIds.has(String(e.user_id));
              const role =
                [e.designation, e.department].filter(Boolean).join(" | ") ||
                "—";
              const flags = flagsById.get(String(e.user_id));

              return (
                <div
                  key={e.user_id}
                  id={`emp-${e.user_id}`}
                  className="scroll-mt-4 border border-black/10 rounded-2xl bg-white shadow-sm overflow-hidden"
                >
                  {/* Accordion header */}
                  <button
                    type="button"
                    onClick={() => toggle(e.user_id)}
                    aria-expanded={isOpen}
                    className={`w-full px-5 py-4 text-left transition-colors hover:bg-black/[0.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-black ${
                      isOpen ? "bg-zinc-50/70" : ""
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-11 h-11 rounded-full text-black flex items-center justify-center text-xs font-medium shrink-0"
                          style={{ background: avatarBg(e.user_id) }}
                        >
                          {initials(nameOf(e)) || "?"}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <h3 className="text-sm font-medium text-black truncate">
                              {nameOf(e)}
                            </h3>
                            <span className="text-[11px] text-black/50 bg-black/5 rounded px-1.5 py-0.5 tabular-nums shrink-0">
                              ID {e.user_id}
                            </span>
                          </div>
                          <p className="text-xs text-black/55 mt-0.5 truncate">
                            {role}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="bg-[#E8EFF9] text-black/70">
                          Overall {num(e.overall_score, 1)}
                        </Badge>
                        <Badge
                          className={
                            REVIEW_STYLES[e.review_status] ||
                            "bg-zinc-100 text-zinc-600"
                          }
                        >
                          {humanize(e.review_status)}
                        </Badge>
                        <Badge
                          className={
                            BAND_STYLES[e.band] || "bg-black text-white"
                          }
                        >
                          {humanize(e.band)}
                        </Badge>
                        {flags?.length > 0 && (
                          <Badge className="bg-red-50 text-red-600">
                            <ShieldAlert size={11} />
                            {flags.length} flag{flags.length > 1 ? "s" : ""}
                          </Badge>
                        )}
                        {e.cap_applied && (
                          <Badge className="bg-amber-50 text-amber-700">
                            Cap applied
                          </Badge>
                        )}
                        <ChevronDown
                          size={16}
                          className={`text-black/50 transition-transform duration-200 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </div>

                    {/* Always-visible quick scores */}
                    <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 max-w-md">
                      <div>
                        <div className="flex justify-between text-[11px] text-black/50 mb-1">
                          <span>Regularity</span>
                          <span className="tabular-nums text-black">
                            {pct(e.regularity, 1)}
                          </span>
                        </div>
                        <MiniBar value={e.regularity} />
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] text-black/50 mb-1">
                          <span>Punctuality</span>
                          <span className="tabular-nums text-black">
                            {pct(e.punctuality, 1)}
                          </span>
                        </div>
                        <MiniBar value={e.punctuality} />
                      </div>
                    </div>
                  </button>

                  {/* Accordion body */}
                  {isOpen && (
                    <div className="border-t border-black/10">
                      <EmployeeDetail e={e} flags={flags} kpi={kpi} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Needs attention */}
        <aside className="min-w-0 border border-black/10 rounded-2xl bg-white shadow-sm xl:sticky xl:top-4">
          <div className="flex items-center justify-between px-5 py-4 border-b border-black/10">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-black" />
              <h3 className="text-sm text-black">Needs attention</h3>
            </div>
            <span className="text-[11px] text-white bg-black rounded-full px-2 py-0.5 tabular-nums">
              {attention.length}
            </span>
          </div>

          {attention.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <CheckCircle2
                size={20}
                className="mx-auto text-emerald-600 mb-2"
              />
              <p className="text-sm text-black">All clear</p>
              <p className="text-xs text-black/40 mt-1">
                No employees are flagged this month.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-black/5 xl:max-h-[70vh] overflow-y-auto">
              {attention.map((a) => {
                const emp = employeesById.get(String(a.user_id));
                const sub = emp
                  ? [emp.designation, emp.department]
                      .filter(Boolean)
                      .join(" | ")
                  : "";
                return (
                  <li key={a.user_id} className="px-5 py-3.5">
                    <button
                      type="button"
                      onClick={() => jumpTo(a.user_id)}
                      className="text-sm text-black truncate hover:underline text-left max-w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-black rounded"
                    >
                      {nameOf(a)}
                    </button>
                    <p className="text-[11px] text-black/40 mt-0.5">
                      ID {a.user_id}
                    </p>
                    {sub && (
                      <p className="text-[11px] text-black/40 truncate">
                        {sub}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {(a.reasons || []).map((r) => (
                        <Badge key={r} className="bg-red-50 text-red-600">
                          {humanize(r)}
                        </Badge>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </div>

      <WeightsNote weights={weights} />
    </div>
  );
};

/* ---------- Company tab ---------- */

function CompanyOverview({ month, year, departmentId, onOpenEmployee }) {
  const company = useKpiData(
    () => fetchCompanyKpi(month, year, departmentId),
    [month, year, departmentId],
    true,
  );

  if (company.loading) return <Loading />;
  if (company.error) {
    return (
      <ErrorBox
        message={company.error}
        detail={company.errorDetail}
        onRetry={company.reload}
      />
    );
  }
  if (!company.data) return null;

  return (
    <DashboardView
      kpi={company.data}
      scope="company"
      onOpenEmployee={onOpenEmployee}
    />
  );
}

export default CompanyOverview;
