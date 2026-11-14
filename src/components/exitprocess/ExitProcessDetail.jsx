import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { toast } from "react-toastify"; // <ToastContainer /> lives in App.jsx
import { ArrowLeft, Lock, Check, ChevronDown } from "lucide-react";
import exitService from "../../service/exitService";

/* ---------- helpers ---------- */

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

const backendMessage = (err, fallback) =>
  err?.response?.data?.message || err?.message || fallback;

const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

// readable file name from an attachment path/URL
const fileName = (url = "") => {
  try {
    const last = String(url).split("?")[0].split("/").pop() || url;
    return decodeURIComponent(last);
  } catch {
    return url;
  }
};

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

const ProgressBar = ({ value }) => (
  <div className="flex items-center gap-2 w-full">
    <div className="h-1.5 flex-1 rounded-full bg-black/10 overflow-hidden">
      <div
        className="h-full rounded-full bg-black transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
    <span className="text-[11px] text-black/50 w-8 text-right shrink-0">
      {value}%
    </span>
  </div>
);

/* circular progress for the summary panel */
const Ring = ({ value, size = 84 }) => {
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, value));
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

const Field = ({ label, children }) => (
  <div className="flex flex-col min-w-0">
    <label className="text-sm text-gray-700 mb-1.5">{label}</label>
    {children}
  </div>
);

// text-base on phones keeps iOS from zooming into the field
const inputClass =
  "w-full min-w-0 h-11 sm:h-10 rounded-lg border border-gray-300 bg-white px-3 text-base sm:text-sm text-gray-700 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 focus:outline-none transition-all disabled:bg-gray-50 disabled:text-gray-400";

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

/* one row of the details list: label left, value right (stacked on phones) */
const DetailRow = ({ label, value }) => (
  <div className="flex flex-col gap-0.5 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 2xl:flex-col 2xl:gap-0.5">
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
        className={`flex-1 min-w-0 border border-black/10 rounded-2xl bg-white overflow-hidden ${
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

/* searchable interviewer dropdown: shows names only, never IDs */
const InterviewerSelect = ({
  value,
  selectedName,
  options,
  onChange,
  disabled,
  loading,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef(null);

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

  const choose = (id) => {
    onChange(id);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={wrapRef} className="relative w-full min-w-0">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
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
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name"
              className="w-full h-10 rounded-md border border-gray-200 px-3 text-base sm:text-sm text-gray-700 focus:outline-none focus:border-gray-900"
            />
          </div>
          <ul role="listbox" className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-sm text-gray-400">
                {loading ? "Loading…" : "No employees found"}
              </li>
            ) : (
              filtered.map((o) => {
                const active = o.id === String(value ?? "");
                return (
                  <li
                    key={o.id}
                    role="option"
                    aria-selected={active}
                    onClick={() => choose(o.id)}
                    className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5 hover:bg-gray-100 transition-colors ${
                      active ? "bg-gray-50" : ""
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

  // GET /admin/exit-process/get/{id}
  // `quiet` = refresh after a save without blanking the page
  const load = useCallback(
    async (quiet = false) => {
      if (!quiet) {
        setLoading(true);
        setError("");
      }
      try {
        const d = await exitService.fetchExitProcess(id);
        setData(d);
        setInitialForm({
          interviewerId: d.interviewerId,
          noticePeriodStart: toDateInput(d.noticePeriodStart),
          separationDate: toDateInput(d.separationDate),
        });
        setChecklist({ ...d.checklist });
      } catch (err) {
        if (!quiet) {
          setError(backendMessage(err, "Could not load this exit process."));
        } else {
          toast.error(backendMessage(err, "Could not refresh."));
        }
      } finally {
        if (!quiet) setLoading(false);
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
      (initialForm.interviewerId.trim() !== data.interviewerId ||
        initialForm.noticePeriodStart !== toDateInput(data.noticePeriodStart) ||
        initialForm.separationDate !== toDateInput(data.separationDate)),
    [data, initialForm],
  );

  const checklistDirty = useMemo(
    () =>
      !!data &&
      CHECKLIST_ITEMS.some(
        (i) => Boolean(checklist[i.key]) !== Boolean(data.checklist[i.key]),
      ),
    [data, checklist],
  );

  const resetInitial = () =>
    setInitialForm({
      interviewerId: data.interviewerId,
      noticePeriodStart: toDateInput(data.noticePeriodStart),
      separationDate: toDateInput(data.separationDate),
    });

  const resetChecklist = () => setChecklist({ ...data.checklist });

  /* ---- step 1: initial step ---- */
  const saveInitial = async () => {
    if (savingInitial) return;

    if (!initialForm.interviewerId.trim()) {
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
        interviewerId: initialForm.interviewerId.trim(),
        separationDate: initialForm.separationDate,
        noticePeriodStart: initialForm.noticePeriodStart,
      });
      if (res.message) toast.success(res.message);
      await load(true);
    } catch (err) {
      toast.error(backendMessage(err, "Could not save the initial step."));
      if (exitService.isConflict(err)) await load(true); // now locked
    } finally {
      setSavingInitial(false);
    }
  };

  /* ---- step 3: checklist ---- */
  const saveChecklist = async () => {
    if (savingChecklist) return;

    try {
      setSavingChecklist(true);
      const res = await exitService.updateChecklist({ id, ...checklist });
      if (res.message) toast.success(res.message);
      await load(true);
    } catch (err) {
      toast.error(backendMessage(err, "Could not save the checklist."));
      if (exitService.isConflict(err)) await load(true); // now locked
    } finally {
      setSavingChecklist(false);
    }
  };

  /* ---- render ---- */

  const backButton = (
    <button
      type="button"
      onClick={onBack}
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
  const q = data.questionnaire;
  const answered = q.completion > 0 || q.workAgain;
  const checkedCount = CHECKLIST_ITEMS.filter((i) => checklist[i.key]).length;
  const stepsDone = [
    data.initial.completion,
    data.questionnaire.completion,
    data.checklist.completion,
  ].filter((c) => c >= 100).length;

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
            This exit process is {data.status.toLowerCase()} and can no longer
            be edited.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_320px] gap-6 2xl:gap-8 items-start">
        {/* SUMMARY PANEL (right on large screens, on top on small ones) */}
        <aside className="min-w-0 2xl:order-2 2xl:sticky 2xl:top-4 border border-black/10 rounded-2xl bg-white overflow-hidden">
          <div className="flex items-center gap-4 p-4 sm:p-6 border-b border-black/10">
            <Ring value={data.completion} />
            <div className="min-w-0">
              <p className="text-sm text-black">Overall progress</p>
              <p className="text-xs text-black/40 mt-0.5">
                {stepsDone} of 3 steps complete
              </p>
              <div className="mt-2">
                <Badge className={statusClass(data.status)}>
                  {data.status || "—"}
                </Badge>
              </div>
            </div>
          </div>

          <dl className="px-4 sm:px-6 py-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 sm:gap-x-8 2xl:grid-cols-1 divide-y divide-black/5 sm:divide-y-0 2xl:divide-y">
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
            <div className="sm:col-span-2 lg:col-span-3 2xl:col-span-1 divide-y divide-black/5 sm:divide-y-0 2xl:divide-y">
              <DetailRow
                label="Reason for leaving"
                value={data.reasonForLeaving}
              />
              <DetailRow
                label="Attachment"
                value={data.attachment ? fileName(data.attachment) : "None"}
              />
            </div>
          </dl>
        </aside>

        {/* STEPS (vertical timeline) */}
        <div className="2xl:order-1 min-w-0">
          {/* STEP 1: INITIAL STEP */}
          <TimelineStep
            id="exit-step-1"
            number={1}
            title="Initial step"
            description="Assign the interviewer and set the notice and separation dates."
            status={data.initial.status}
            completion={data.initial.completion}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              <Field label="Interviewer">
                <input
                  type="text"
                  inputMode="numeric"
                  value={initialForm.interviewerId}
                  disabled={locked}
                  placeholder="Interviewer employee ID"
                  onChange={(e) =>
                    setInitialForm((f) => ({
                      ...f,
                      interviewerId: e.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Notice period start">
                <input
                  type="date"
                  value={initialForm.noticePeriodStart}
                  disabled={locked}
                  onChange={(e) =>
                    setInitialForm((f) => ({
                      ...f,
                      noticePeriodStart: e.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Separation date (last working day)">
                <input
                  type="date"
                  value={initialForm.separationDate}
                  min={initialForm.noticePeriodStart || undefined}
                  disabled={locked}
                  onChange={(e) =>
                    setInitialForm((f) => ({
                      ...f,
                      separationDate: e.target.value,
                    }))
                  }
                  className={inputClass}
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

          {/* STEP 2: QUESTIONNAIRE (read only) */}
          <TimelineStep
            id="exit-step-2"
            number={2}
            title="Exit questionnaire"
            description="Answers submitted by the employee."
            status={q.status}
            completion={q.completion}
          >
            <dl className="divide-y divide-black/5 -my-3">
              <div className="py-3 flex items-center justify-between gap-4">
                <dt className="text-sm text-black">Would work here again?</dt>
                <dd>
                  <Badge
                    className={
                      !answered
                        ? "bg-zinc-100 text-zinc-600"
                        : q.workAgain
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-600"
                    }
                  >
                    {!answered ? "Not answered" : q.workAgain ? "Yes" : "No"}
                  </Badge>
                </dd>
              </div>
              <div className="py-3">
                <dt className="text-xs text-black/40">Most liked</dt>
                <dd className="text-sm text-black mt-1 break-words">
                  {q.mostLiked || "—"}
                </dd>
              </div>
              <div className="py-3">
                <dt className="text-xs text-black/40">
                  Improvement suggestion
                </dt>
                <dd className="text-sm text-black mt-1 break-words">
                  {q.improvementSuggestion || "—"}
                </dd>
              </div>
              <div className="py-3">
                <dt className="text-xs text-black/40">Additional feedback</dt>
                <dd className="text-sm text-black mt-1 break-words">
                  {q.additionalFeedback || "—"}
                </dd>
              </div>
            </dl>
          </TimelineStep>

          {/* STEP 3: CHECKLIST */}
          <TimelineStep
            id="exit-step-3"
            number={3}
            title="Clearance checklist"
            description={`${checkedCount} of ${CHECKLIST_ITEMS.length} items cleared.`}
            status={data.checklist.status}
            completion={data.checklist.completion}
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
        </div>
      </div>
    </div>
  );
};

export default ExitProcessDetail;
