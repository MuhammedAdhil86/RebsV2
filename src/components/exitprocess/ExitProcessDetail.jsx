import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { toast } from "react-toastify"; // <ToastContainer /> lives in App.jsx
import { ArrowLeft, Lock, Check, ChevronDown } from "lucide-react";
import { Icon } from "@iconify/react";
import exitService from "../../service/exitService";
import { getActiveUsersLight } from "../../service/employeeService";

/* ---------- helpers ---------- */

const TOTAL_STEPS = 2; // initial step + checklist (questionnaire is not a step)

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

// "2026-12-01T00:00:00Z" -> "2026-12-01" for <input type="date">
const toDateInput = (iso) => (iso ? String(iso).slice(0, 10) : "");

// "2026-12-30T00:00:00Z" -> UTC midnight timestamp (avoids timezone drift)
const parseDay = (iso) => {
  const s = toDateInput(iso);
  if (!s) return null;
  const t = Date.parse(`${s}T00:00:00Z`);
  return Number.isNaN(t) ? null : t;
};

const todayUtc = () => {
  const n = new Date();
  return Date.UTC(n.getFullYear(), n.getMonth(), n.getDate());
};

const daysBetween = (a, b) =>
  a == null || b == null ? null : Math.round((b - a) / 86400000);

const backendMessage = (err, fallback) =>
  err?.response?.data?.message || err?.message || fallback;

// axios timeout (ECONNABORTED / ETIMEDOUT) or a "timeout" message
const isTimeout = (err) =>
  err?.code === "ECONNABORTED" ||
  err?.code === "ETIMEDOUT" ||
  /timeout/i.test(err?.message || "");

const initials = (name) =>
  String(name ?? "")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const STATUS_STYLES = {
  completed: "bg-emerald-50 text-emerald-700",
  revoked: "bg-red-50 text-red-600",
  "in progress": "bg-amber-50 text-amber-700",
  pending: "bg-amber-50 text-amber-700",
  "not started": "bg-zinc-100 text-zinc-600",
};

const statusClass = (s) =>
  STATUS_STYLES[String(s ?? "").toLowerCase()] || "bg-zinc-100 text-zinc-600";

/* ---------- small UI pieces ---------- */

const Badge = ({ children, className = "bg-zinc-100 text-zinc-600" }) => (
  <span
    className={`inline-block px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap ${className}`}
  >
    {children}
  </span>
);

const ProgressBar = ({ value }) => {
  const v = Number(value) || 0;
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="h-1.5 flex-1 rounded-full bg-black/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-black transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, v))}%` }}
        />
      </div>
      <span className="text-[11px] text-black/50 w-8 text-right shrink-0">
        {v}%
      </span>
    </div>
  );
};

/* circular progress for the summary panel */
const Ring = ({ value, size = 84 }) => {
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(0,0,0,0.08)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#000"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          className="transition-all duration-700"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-base text-black">
        {Math.round(pct)}%
      </span>
    </div>
  );
};

const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse rounded-lg bg-black/5 ${className}`} />
);

const Field = ({ label, htmlFor, children }) => (
  <div className="flex flex-col min-w-0">
    <label htmlFor={htmlFor} className="text-sm text-gray-700 mb-1.5">
      {label}
    </label>
    {children}
  </div>
);

// text-base on phones keeps iOS from zooming into the field
const inputClass =
  "w-full min-w-0 h-11 sm:h-10 rounded-lg border border-gray-300 bg-white px-3 text-base sm:text-sm text-gray-700 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 focus:outline-none transition-all disabled:bg-gray-50 disabled:text-gray-400";

/* date input with the solar calendar icon on the left.
   the native calendar icon is stretched over the whole field and made
   invisible, so clicking anywhere opens the picker */
const DateInput = ({ className: _ignored, ...props }) => (
  <div className="relative w-full min-w-0">
    <Icon
      icon="solar:calendar-outline"
      className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 w-4 h-4 text-gray-500"
    />
    <input
      type="date"
      {...props}
      onClick={(e) => {
        try {
          e.currentTarget.showPicker?.();
        } catch {
          /* some browsers block showPicker, native behaviour still works */
        }
      }}
      className={`${inputClass} relative pl-9 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0`}
    />
  </div>
);

const PrimaryButton = ({ children, ...props }) => (
  <button
    type="button"
    {...props}
    className="w-full sm:w-auto min-h-[44px] sm:min-h-0 bg-gray-900 hover:bg-black text-white text-sm px-6 py-2.5 sm:py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
  >
    {children}
  </button>
);

const GhostButton = ({ children, ...props }) => (
  <button
    type="button"
    {...props}
    className="w-full sm:w-auto min-h-[44px] sm:min-h-0 border border-gray-300 text-gray-700 text-sm px-6 py-2.5 sm:py-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
  >
    {children}
  </button>
);

/* small stat tile for the summary panel */
const StatTile = ({ label, value, hint }) => (
  <div className="rounded-xl border border-black/10 bg-zinc-50/60 px-3 py-3 min-w-0">
    <p className="text-[11px] text-black/40">{label}</p>
    <p className="text-base text-black mt-0.5 truncate">{value}</p>
    {hint && (
      <p className="text-[11px] text-black/40 mt-0.5 truncate">{hint}</p>
    )}
  </div>
);

/* one row of the details list: label left, value right (stacked on phones) */
const DetailRow = ({ label, value, className = "" }) => (
  <div
    className={`flex flex-col gap-0.5 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 2xl:flex-col 2xl:gap-0.5 ${className}`}
  >
    <dt className="text-xs text-black/40 shrink-0">{label}</dt>
    <dd className="text-sm text-black break-words sm:text-right 2xl:text-left">
      {value || "—"}
    </dd>
  </div>
);

/* a step in the vertical timeline */
const TimelineStep = ({
  id,
  number,
  title,
  description,
  status,
  completion,
  last,
  children,
}) => {
  const done = completion >= 100;
  return (
    <div id={id} className="flex gap-3 sm:gap-5 scroll-mt-4">
      {/* rail */}
      <div className="flex flex-col items-center shrink-0">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs ${
            done
              ? "bg-black text-white"
              : "bg-white text-black/60 border border-black/20"
          }`}
        >
          {done ? <Check size={14} /> : number}
        </span>
        {!last && <span className="mt-2 w-px flex-1 bg-black/10" />}
      </div>

      {/* card */}
      <section
        className={`flex-1 min-w-0 border border-black/10 rounded-2xl bg-white ${
          last ? "" : "mb-5 sm:mb-6"
        }`}
      >
        <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-black/10">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base text-black">{title}</h3>
              <p className="text-xs text-black/40 mt-0.5">{description}</p>
            </div>
            <Badge className={statusClass(status)}>{status || "—"}</Badge>
          </div>
          <div className="mt-3 max-w-xs">
            <ProgressBar value={completion} />
          </div>
        </div>
        <div className="p-4 sm:p-6">{children}</div>
      </section>
    </div>
  );
};

/* standalone section (not a timeline step): no number, no rail */
const QuestionnaireCard = ({
  id,
  title,
  description,
  status,
  completion,
  children,
}) => (
  <section
    id={id}
    className="mt-5 sm:mt-6 border border-black/10 rounded-2xl bg-white overflow-hidden scroll-mt-4"
  >
    <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-black/10">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base text-black">{title}</h3>
          <p className="text-xs text-black/40 mt-0.5">{description}</p>
        </div>
        <Badge className={statusClass(status)}>{status || "—"}</Badge>
      </div>
      <div className="mt-3 max-w-xs">
        <ProgressBar value={completion} />
      </div>
    </div>
    <div className="p-4 sm:p-6">{children}</div>
  </section>
);

/* searchable interviewer dropdown: shows names only, never IDs */
const InterviewerSelect = ({ id, value, selectedName, onChange, disabled }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const wrapRef = useRef(null);
  const listRef = useRef(null);

  // fetch the light user list here: show names, keep the uuid as the value
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const users = await getActiveUsersLight();
        if (cancelled) return;
        setOptions(
          (users || []).map((u) => ({
            id: String(u.uuid), // value sent to the API
            name: String(u.name || "")
              .replace(/\s+/g, " ")
              .trim(),
            designation: String(u.designation_name || "")
              .replace(/\s+/g, " ")
              .trim(),
            department: u.department_name || "",
          })),
        );
      } catch (err) {
        if (!cancelled) {
          toast.error(backendMessage(err, "Could not load employees."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = options.find((o) => o.id === String(value ?? ""));
  const label = selected?.name || (value ? selectedName : "");

  const filtered = options.filter((o) =>
    `${o.name} ${o.designation} ${o.department}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );

  // close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // keep the keyboard-highlighted row in view
  useEffect(() => {
    if (!open) return;
    listRef.current?.children?.[activeIdx]?.scrollIntoView?.({
      block: "nearest",
    });
  }, [activeIdx, open]);

  const choose = (optionId) => {
    onChange(optionId);
    setOpen(false);
    setQuery("");
  };

  // arrow keys + Enter inside the search box
  const onSearchKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[activeIdx]) choose(filtered[activeIdx].id);
    }
  };

  return (
    <div ref={wrapRef} className="relative w-full min-w-0">
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => {
          setActiveIdx(0);
          setOpen((o) => !o);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full min-w-0 h-11 sm:h-10 items-center justify-between gap-2 rounded-lg border bg-white px-3 text-left text-base sm:text-sm focus:outline-none transition-all disabled:bg-gray-50 disabled:text-gray-400 ${
          open
            ? "border-gray-900 ring-1 ring-gray-900"
            : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <span
          className={`truncate ${label ? "text-gray-700" : "text-gray-400"}`}
        >
          {loading && !label ? "Loading…" : label || "Select interviewer"}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-gray-700 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-30 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIdx(0);
              }}
              onKeyDown={onSearchKeyDown}
              placeholder="Search by name"
              aria-label="Search interviewer by name"
              className="w-full h-10 rounded-md border border-gray-200 px-3 text-base sm:text-sm text-gray-700 focus:outline-none focus:border-gray-900"
            />
          </div>
          <ul
            ref={listRef}
            role="listbox"
            className="max-h-60 overflow-y-auto py-1"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-sm text-gray-400">
                {loading ? "Loading…" : "No employees found"}
              </li>
            ) : (
              filtered.map((o, idx) => {
                const active = o.id === String(value ?? "");
                return (
                  <li
                    key={o.id}
                    role="option"
                    aria-selected={active}
                    onClick={() => choose(o.id)}
                    onMouseEnter={() => setActiveIdx(idx)}
                    className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5 hover:bg-gray-100 transition-colors ${
                      idx === activeIdx
                        ? "bg-gray-100"
                        : active
                          ? "bg-gray-50"
                          : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800 truncate">{o.name}</p>
                      {(o.designation || o.department) && (
                        <p className="text-[11px] text-gray-400 truncate">
                          {[o.designation, o.department]
                            .filter(Boolean)
                            .join(" | ")}
                        </p>
                      )}
                    </div>
                    {active && (
                      <Check size={14} className="shrink-0 text-gray-900" />
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

const CHECKLIST_ITEMS = [
  { key: "assetHanded", label: "Physical assets returned" },
  { key: "digitalAssetHanded", label: "Digital assets returned" },
  { key: "resignationLetter", label: "Resignation letter received" },
  { key: "security", label: "Security clearance completed" },
  { key: "noticePeriodFollowed", label: "Notice period served" },
  { key: "managerClearance", label: "Manager clearance given" },
];

// questionnaire shown as questions (key = field on data.questionnaire)
const QUESTIONS = [
  {
    key: "workAgain",
    question: "Would you work here again?",
    type: "boolean",
  },
  {
    key: "mostLiked",
    question: "What did you like most about working here?",
  },
  {
    key: "improvementSuggestion",
    question: "What could we improve?",
  },
  {
    key: "additionalFeedback",
    question: "Any additional feedback?",
  },
];

/* ---------- detail ---------- */

const ExitProcessDetail = ({ id, onBack }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // editable copies of the two forms
  const [initialForm, setInitialForm] = useState({
    interviewerId: "",
    noticePeriodStart: "",
    separationDate: "",
  });
  const [checklist, setChecklist] = useState({});

  const [savingInitial, setSavingInitial] = useState(false);
  const [savingChecklist, setSavingChecklist] = useState(false);

  // counts requests so a slow, older response can never overwrite a newer one
  const requestRef = useRef(0);

  // GET /admin/exit-process/get/{id}
  // `quiet` = refresh after a save without blanking the page
  const load = useCallback(
    async (quiet = false) => {
      const reqId = ++requestRef.current;
      if (!quiet) {
        setLoading(true);
        setError("");
      }
      try {
        const d = await exitService.fetchExitProcess(id);
        if (reqId !== requestRef.current) return; // stale response
        setData(d);
        setInitialForm({
          interviewerId: String(d.interviewerId ?? ""),
          noticePeriodStart: toDateInput(d.noticePeriodStart),
          separationDate: toDateInput(d.separationDate),
        });
        setChecklist({ ...(d.checklist ?? {}) });
      } catch (err) {
        if (reqId !== requestRef.current) return;
        if (!quiet) {
          setError(backendMessage(err, "Could not load this exit process."));
        } else {
          toast.error(backendMessage(err, "Could not refresh."));
        }
      } finally {
        if (!quiet && reqId === requestRef.current) setLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    load();
  }, [load]);

  /* unsaved-change detection: Save is only enabled when something changed */
  const initialDirty = useMemo(
    () =>
      !!data &&
      (String(initialForm.interviewerId ?? "").trim() !==
        String(data.interviewerId ?? "") ||
        initialForm.noticePeriodStart !== toDateInput(data.noticePeriodStart) ||
        initialForm.separationDate !== toDateInput(data.separationDate)),
    [data, initialForm],
  );

  const checklistDirty = useMemo(
    () =>
      !!data &&
      CHECKLIST_ITEMS.some(
        (i) =>
          Boolean(checklist[i.key]) !== Boolean((data.checklist ?? {})[i.key]),
      ),
    [data, checklist],
  );

  const resetInitial = () =>
    setInitialForm({
      interviewerId: String(data.interviewerId ?? ""),
      noticePeriodStart: toDateInput(data.noticePeriodStart),
      separationDate: toDateInput(data.separationDate),
    });

  const resetChecklist = () => setChecklist({ ...(data.checklist ?? {}) });

  const handleBack = () => {
    if (
      (initialDirty || checklistDirty) &&
      !window.confirm("You have unsaved changes. Leave without saving?")
    ) {
      return;
    }
    onBack?.();
  };

  /* ---- step 1: initial step ---- */
  const saveInitial = async () => {
    if (savingInitial) return;

    const interviewerId = String(initialForm.interviewerId ?? "").trim();

    if (!interviewerId) {
      toast.error("Select the interviewer");
      return;
    }
    if (!initialForm.noticePeriodStart || !initialForm.separationDate) {
      toast.error("Select the notice period start and separation dates");
      return;
    }
    if (initialForm.separationDate < initialForm.noticePeriodStart) {
      toast.error("Separation date cannot be before the notice period start");
      return;
    }

    try {
      setSavingInitial(true);
      const res = await exitService.updateInitialStep({
        id,
        interviewerId,
        separationDate: initialForm.separationDate,
        noticePeriodStart: initialForm.noticePeriodStart,
      });
      if (res?.message) toast.success(res.message);
      await load(true);
    } catch (err) {
      if (isTimeout(err)) {
        // the server may have saved it anyway, so refresh instead of a false error
        toast.info("Taking longer than usual. Checking if it was saved…");
        await load(true);
      } else {
        toast.error(backendMessage(err, "Could not save the initial step."));
        if (exitService.isConflict(err)) await load(true); // now locked
      }
    } finally {
      setSavingInitial(false);
    }
  };

  /* ---- step 2: checklist ---- */
  const saveChecklist = async () => {
    if (savingChecklist) return;

    // send only the checklist flags, not completion/status from the response
    const payload = Object.fromEntries(
      CHECKLIST_ITEMS.map((i) => [i.key, Boolean(checklist[i.key])]),
    );

    try {
      setSavingChecklist(true);
      const res = await exitService.updateChecklist({ id, ...payload });
      if (res?.message) toast.success(res.message);
      await load(true);
    } catch (err) {
      if (isTimeout(err)) {
        toast.info("Taking longer than usual. Checking if it was saved…");
        await load(true);
      } else {
        toast.error(backendMessage(err, "Could not save the checklist."));
        if (exitService.isConflict(err)) await load(true); // now locked
      }
    } finally {
      setSavingChecklist(false);
    }
  };

  /* ---- render ---- */

  const backButton = (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex items-center gap-1.5 min-h-[44px] sm:min-h-0 text-xs text-black/60 hover:text-black transition-colors self-start"
    >
      <ArrowLeft size={14} />
      Back to exit processes
    </button>
  );

  if (loading) {
    return (
      <div className="space-y-5">
        {backButton}
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-2/3 sm:w-1/3" />
            <Skeleton className="h-3 w-3/4 sm:w-1/2" />
          </div>
        </div>
        <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_320px] gap-6">
          <Skeleton className="h-72 2xl:order-2" />
          <div className="space-y-5">
            <Skeleton className="h-64" />
            <Skeleton className="h-40" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-5">
        {backButton}
        <div className="py-16 sm:py-24 text-center px-4">
          <p className="text-sm text-black">Could not load this exit process</p>
          <p className="text-xs text-black/40 mt-1 break-words">{error}</p>
          <button
            type="button"
            onClick={() => load()}
            className="mt-4 min-h-[44px] sm:min-h-0 px-5 py-2 text-xs rounded-lg bg-black text-white hover:bg-black/80 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const locked = data.isLocked;
  const q = data.questionnaire ?? {};
  const initial = data.initial ?? {};
  const checklistData = data.checklist ?? {};
  const answered = (q.completion ?? 0) > 0 || q.workAgain;
  const checkedCount = CHECKLIST_ITEMS.filter((i) => checklist[i.key]).length;
  // questionnaire is not a step, only initial step + checklist count
  const stepsDone = [initial.completion, checklistData.completion].filter(
    (c) => (c ?? 0) >= 100,
  ).length;

  // summary panel extras
  const noticeTotal = daysBetween(
    parseDay(data.noticePeriodStart),
    parseDay(data.separationDate),
  );
  const daysLeft = daysBetween(todayUtc(), parseDay(data.separationDate));
  const daysLeftLabel =
    daysLeft == null
      ? "—"
      : daysLeft > 0
        ? `${daysLeft} ${daysLeft === 1 ? "day" : "days"}`
        : daysLeft === 0
          ? "Today"
          : "Ended";

  const breakdown = [
    {
      label: "Initial step",
      status: initial.status,
      completion: initial.completion ?? 0,
    },
    {
      label: "Clearance checklist",
      status: checklistData.status,
      completion: checklistData.completion ?? 0,
    },
    {
      label: "Exit questionnaire",
      status: q.status,
      completion: q.completion ?? 0,
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      {backButton}

      {/* HEADER */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-full bg-black text-sm sm:text-base text-white">
          {initials(data.employeeName)}
        </div>
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl text-black tracking-tight break-words">
            {data.employeeName}
          </h2>
          <p className="text-xs text-black/40 mt-0.5 break-words">
            Exit process · Applied on {formatDate(data.appliedOn)}
          </p>
        </div>
      </div>

      {locked && (
        <div className="flex items-start gap-2 rounded-xl border border-black/10 bg-zinc-50 px-4 py-3 text-xs text-black/70">
          <Lock size={14} className="mt-0.5 shrink-0" />
          <span>
            This exit process is {String(data.status ?? "").toLowerCase()} and
            can no longer be edited.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_320px] gap-6 2xl:gap-8 items-start">
        {/* SUMMARY PANEL (right on large screens, on top on small ones) */}
        <aside className="min-w-0 2xl:order-2 2xl:sticky 2xl:top-4 border border-black/10 rounded-2xl bg-white overflow-hidden">
          {/* progress ring */}
          <div className="flex items-center gap-4 p-4 sm:p-6 border-b border-black/10">
            <Ring value={data.completion} />
            <div className="min-w-0">
              <p className="text-sm text-black">Overall progress</p>
              <p className="text-xs text-black/40 mt-0.5">
                {stepsDone} of {TOTAL_STEPS} steps complete
              </p>
              <div className="mt-2">
                <Badge className={statusClass(data.status)}>
                  {data.status || "—"}
                </Badge>
              </div>
            </div>
          </div>

          {/* quick stats */}
          <div className="grid grid-cols-2 gap-3 p-4 sm:p-6 border-b border-black/10">
            <StatTile
              label="Time left"
              value={daysLeftLabel}
              hint={`Until ${formatDate(data.separationDate)}`}
            />
            <StatTile
              label="Notice period"
              value={
                noticeTotal != null && noticeTotal >= 0
                  ? `${noticeTotal} days`
                  : "—"
              }
              hint={`From ${formatDate(data.noticePeriodStart)}`}
            />
          </div>

          {/* per-section breakdown */}
          <div className="p-4 sm:p-6 border-b border-black/10 space-y-4">
            <p className="text-xs text-black/40">Progress breakdown</p>
            {breakdown.map((b) => (
              <div key={b.label}>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-sm text-black">{b.label}</span>
                  <Badge className={statusClass(b.status)}>
                    {b.status || "—"}
                  </Badge>
                </div>
                <ProgressBar value={b.completion} />
              </div>
            ))}
          </div>

          {/* details */}
          <dl className="px-4 sm:px-6 py-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 sm:gap-x-8 2xl:grid-cols-1 divide-y divide-black/5 sm:divide-y-0 2xl:divide-y">
            {data.employeeId && (
              <DetailRow label="Employee ID" value={data.employeeId} />
            )}
            <DetailRow label="Employment type" value={data.employmentType} />
            {data.department && (
              <DetailRow label="Department" value={data.department} />
            )}
            <DetailRow label="Applied on" value={formatDate(data.appliedOn)} />
            <DetailRow
              label="Interviewer"
              value={data.interviewerName || "Not assigned"}
            />
            <DetailRow
              label="Notice period start"
              value={formatDate(data.noticePeriodStart)}
            />
            <DetailRow
              label="Last working day"
              value={formatDate(data.separationDate)}
            />
            <DetailRow
              label="Reason for leaving"
              value={data.reasonForLeaving}
              className="sm:col-span-2 lg:col-span-3 2xl:col-span-1"
            />
          </dl>

          {/* attachment button (no file name) */}
          <div className="p-4 sm:p-6 border-t border-black/10">
            {data.attachment ? (
              <a
                href={data.attachment}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 min-h-[44px] sm:min-h-0 border border-gray-300 text-gray-700 text-sm px-6 py-2.5 sm:py-2 rounded-lg hover:bg-gray-100 transition-all"
              >
                <Icon icon="solar:paperclip-outline" className="w-4 h-4" />
                Open attachment
              </a>
            ) : (
              <p className="text-xs text-black/40 text-center">No attachment</p>
            )}
          </div>
        </aside>

        {/* STEPS (vertical timeline) */}
        <div className="2xl:order-1 min-w-0">
          {/* STEP 1: INITIAL STEP */}
          <TimelineStep
            id="exit-step-1"
            number={1}
            title="Initial step"
            description="Assign the interviewer and set the notice and separation dates."
            status={initial.status}
            completion={initial.completion ?? 0}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              <Field label="Interviewer" htmlFor="exit-interviewer">
                <InterviewerSelect
                  id="exit-interviewer"
                  value={initialForm.interviewerId}
                  selectedName={data.interviewerName}
                  disabled={locked}
                  onChange={(uuid) =>
                    setInitialForm((f) => ({ ...f, interviewerId: uuid }))
                  }
                />
              </Field>
              <Field label="Notice period start" htmlFor="exit-notice-start">
                <DateInput
                  id="exit-notice-start"
                  value={initialForm.noticePeriodStart}
                  disabled={locked}
                  onChange={(e) =>
                    setInitialForm((f) => ({
                      ...f,
                      noticePeriodStart: e.target.value,
                    }))
                  }
                />
              </Field>
              <Field
                label="Separation date (last working day)"
                htmlFor="exit-separation-date"
              >
                <DateInput
                  id="exit-separation-date"
                  value={initialForm.separationDate}
                  min={initialForm.noticePeriodStart || undefined}
                  disabled={locked}
                  onChange={(e) =>
                    setInitialForm((f) => ({
                      ...f,
                      separationDate: e.target.value,
                    }))
                  }
                />
              </Field>
            </div>

            {!locked && (
              <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                {initialDirty && (
                  <span className="text-xs text-black/40 sm:mr-auto text-center sm:text-left">
                    You have unsaved changes
                  </span>
                )}
                {initialDirty && (
                  <GhostButton onClick={resetInitial} disabled={savingInitial}>
                    Discard
                  </GhostButton>
                )}
                <PrimaryButton
                  onClick={saveInitial}
                  disabled={savingInitial || !initialDirty}
                >
                  {savingInitial ? "Saving..." : "Save initial step"}
                </PrimaryButton>
              </div>
            )}
          </TimelineStep>

          {/* STEP 2: CHECKLIST */}
          <TimelineStep
            id="exit-step-2"
            number={2}
            title="Clearance checklist"
            description={`${checkedCount} of ${CHECKLIST_ITEMS.length} items cleared.`}
            status={checklistData.status}
            completion={checklistData.completion ?? 0}
            last
          >
            <ul className="rounded-xl border border-black/10 divide-y divide-black/5 overflow-hidden">
              {CHECKLIST_ITEMS.map((item) => {
                const checked = Boolean(checklist[item.key]);
                return (
                  <li key={item.key}>
                    <label
                      className={`flex items-center gap-3 px-4 py-3.5 text-sm text-black transition-colors ${
                        locked
                          ? "opacity-60"
                          : "cursor-pointer hover:bg-black/[0.02]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={locked}
                        onChange={(e) =>
                          setChecklist((c) => ({
                            ...c,
                            [item.key]: e.target.checked,
                          }))
                        }
                        className="h-5 w-5 sm:h-4 sm:w-4 shrink-0 accent-black"
                      />
                      <span className="flex-1 min-w-0 break-words">
                        {item.label}
                      </span>
                      <Badge
                        className={
                          checked
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-zinc-100 text-zinc-600"
                        }
                      >
                        {checked ? "Cleared" : "Pending"}
                      </Badge>
                    </label>
                  </li>
                );
              })}
            </ul>

            {!locked && (
              <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                {checklistDirty && (
                  <span className="text-xs text-black/40 sm:mr-auto text-center sm:text-left">
                    You have unsaved changes
                  </span>
                )}
                {checklistDirty && (
                  <GhostButton
                    onClick={resetChecklist}
                    disabled={savingChecklist}
                  >
                    Discard
                  </GhostButton>
                )}
                <PrimaryButton
                  onClick={saveChecklist}
                  disabled={savingChecklist || !checklistDirty}
                >
                  {savingChecklist ? "Saving..." : "Save checklist"}
                </PrimaryButton>
              </div>
            )}
          </TimelineStep>

          {/* EXIT QUESTIONNAIRE (separate from the steps, read only) */}
          <QuestionnaireCard
            id="exit-questionnaire"
            title="Exit questionnaire"
            description="Questions answered by the employee."
            status={q.status}
            completion={q.completion ?? 0}
          >
            <ol className="space-y-4">
              {QUESTIONS.map((item, i) => {
                const value = q[item.key];
                const isBool = item.type === "boolean";
                const hasAnswer = isBool ? answered : Boolean(value?.trim?.());

                return (
                  <li
                    key={item.key}
                    className="rounded-xl border border-black/10 bg-zinc-50/50 p-4"
                  >
                    <p className="text-xs text-black/40">Question {i + 1}</p>
                    <p className="text-sm text-black mt-0.5">{item.question}</p>

                    <div className="mt-2.5">
                      {isBool ? (
                        <Badge
                          className={
                            !hasAnswer
                              ? "bg-zinc-100 text-zinc-600"
                              : value
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-600"
                          }
                        >
                          {!hasAnswer ? "Not answered" : value ? "Yes" : "No"}
                        </Badge>
                      ) : (
                        <p
                          className={`text-sm break-words ${
                            hasAnswer ? "text-black" : "text-black/30 italic"
                          }`}
                        >
                          {hasAnswer ? value : "Not answered"}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </QuestionnaireCard>
        </div>
      </div>
    </div>
  );
};

export default ExitProcessDetail;
