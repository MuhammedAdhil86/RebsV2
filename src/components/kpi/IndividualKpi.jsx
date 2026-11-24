import React, { useState, useEffect } from "react";
import { Users, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchEmployeeKpi } from "../../service/kpiService";
import { getMyReportees } from "../../service/employeeService";
import {
  useKpiData,
  Loading,
  ErrorBox,
  Notices,
  WeightsNote,
  EmployeeDetail,
  humanize,
  formatDate,
} from "./CompanyOverview";

/* ---------- helpers ---------- */

// Review values: null -> "—", booleans -> Yes/No, ISO dates -> readable date
const reviewValue = (k, v) => {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "object") return JSON.stringify(v);
  if (/(_at|_on|date)$/i.test(k) && /^\d{4}-\d{2}-\d{2}/.test(String(v)))
    return formatDate(v);
  return String(v);
};

const initialsOf = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const reporteeName = (s) =>
  [s.first_name, s.last_name].filter(Boolean).join(" ").trim() ||
  `User ${s.uuid}`;

/* ---------- Individual dashboard content ---------- */

const IndividualView = ({ data }) => {
  // Response shape: { score: {...employee KPI}, review, weights, partial_period }
  const emp = data?.score ?? {};
  const review = data?.review;
  const reviewRows =
    review && typeof review === "object" ? Object.entries(review) : [];

  return (
    <div className="space-y-6 min-w-0 max-w-full">
      <Notices kpi={data} />

      {/* EMPLOYEE: profile, scores, attendance, tasks */}
      <div className="border border-black/10 rounded-2xl bg-white shadow-sm overflow-hidden">
        <EmployeeDetail e={emp} kpi={data} hideFlags />
      </div>

      {/* REVIEW: every field the API returns */}
      <section className="border border-black/10 rounded-2xl bg-white shadow-sm px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className="text-sm font-medium text-black">Review</h3>
          <p className="text-xs text-black/40">
            {reviewRows.length === 0
              ? "Not submitted"
              : `${reviewRows.length} fields`}
          </p>
        </div>
        {reviewRows.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-black/15 px-4 py-6 text-center">
            <p className="text-xs text-black/60">
              No review has been submitted for this month yet.
            </p>
          </div>
        ) : (
          <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6">
            {reviewRows.map(([k, v]) => {
              const empty = v === null || v === undefined || v === "";
              return (
                <div
                  key={k}
                  className="flex items-baseline justify-between gap-3 py-2.5 border-b border-black/5"
                >
                  <dt className="text-xs text-black/55">{humanize(k)}</dt>
                  <dd
                    className={`text-xs text-right break-words min-w-0 ${
                      empty ? "text-black/30" : "text-black"
                    }`}
                  >
                    {reviewValue(k, v)}
                  </dd>
                </div>
              );
            })}
          </dl>
        )}
      </section>

      <WeightsNote weights={data?.weights} />
    </div>
  );
};

/* ---------- Individual tab ---------- */

/**
 * The employee select is filled from GET /staff/my-reportees
 * (the employees who report to the logged-in user).
 *
 * Props:
 *  - employeeId        optional starting employee (from the parent)
 *  - onEmployeeChange  optional (id) => void, keeps the parent in sync
 *  - month, year       reporting period
 */
function IndividualKpi({ employeeId, onEmployeeChange, month, year }) {
  const [reportees, setReportees] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [listReload, setListReload] = useState(0);
  const [selectedId, setSelectedId] = useState(
    employeeId ? String(employeeId) : "",
  );

  // Follow the parent if it changes the employee
  useEffect(() => {
    if (employeeId) setSelectedId(String(employeeId));
  }, [employeeId]);

  // My reportees: GET /staff/my-reportees
  useEffect(() => {
    let cancelled = false;
    setListLoading(true);
    setListError("");
    getMyReportees()
      .then((list) => {
        if (cancelled) return;
        setReportees(Array.isArray(list) ? list : []);
        setListLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Reportees load failed:", err);
        setReportees([]);
        setListLoading(false);
        setListError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load your reportees.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [listReload]);

  // Pick the first reportee when nothing (or someone who is not a reportee) is selected
  useEffect(() => {
    if (reportees.length === 0) return;
    if (!selectedId || !reportees.some((s) => String(s.uuid) === selectedId)) {
      const first = String(reportees[0].uuid);
      setSelectedId(first);
      if (onEmployeeChange) onEmployeeChange(first);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportees]);

  const individual = useKpiData(
    () => fetchEmployeeKpi(selectedId, month, year),
    [selectedId, month, year],
    !!selectedId && !listLoading,
  );

  const pick = (id) => {
    setSelectedId(id);
    if (onEmployeeChange) onEmployeeChange(id);
  };

  const handleChange = (ev) => pick(ev.target.value);

  // Previous / next reportee
  const selectedIndex = reportees.findIndex(
    (s) => String(s.uuid) === selectedId,
  );
  const selectedPerson = selectedIndex >= 0 ? reportees[selectedIndex] : null;
  const step = (delta) => {
    const next = reportees[selectedIndex + delta];
    if (next) pick(String(next.uuid));
  };
  const selectDisabled = listLoading || reportees.length === 0;

  let content;
  if (listLoading || individual.loading) {
    content = <Loading />;
  } else if (listError) {
    content = (
      <ErrorBox
        message={listError}
        onRetry={() => setListReload((k) => k + 1)}
      />
    );
  } else if (individual.error) {
    content = (
      <ErrorBox
        message={individual.error}
        detail={individual.errorDetail}
        onRetry={individual.reload}
      />
    );
  } else if (reportees.length === 0 || !selectedId) {
    content = (
      <div className="py-24 text-center text-sm text-black/40">
        No employees report to you.
      </div>
    );
  } else if (!individual.data) {
    content = null;
  } else {
    content = <IndividualView data={individual.data} />;
  }

  return (
    <div className="space-y-6 min-w-0 max-w-full">
      {/* EMPLOYEE SELECT (my reportees) */}
      <div className="border border-black/10 rounded-2xl bg-white shadow-sm px-4 py-3 sm:px-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center shrink-0">
            <Users size={18} />
          </div>
          <div className="min-w-0">
            <label
              htmlFor="individual-employee"
              className="block text-sm font-medium text-black"
            >
              Employee
            </label>
            <p className="text-[11px] text-black/45">
              {listLoading
                ? "Loading..."
                : reportees.length === 0
                  ? "No reportees"
                  : `${reportees.length} ${
                      reportees.length === 1 ? "reportee" : "reportees"
                    }`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
          <button
            type="button"
            onClick={() => step(-1)}
            disabled={selectDisabled || selectedIndex <= 0}
            aria-label="Previous employee"
            className="h-10 w-10 shrink-0 rounded-xl border border-black/10 bg-white text-black/60 flex items-center justify-center transition-colors hover:bg-black/5 hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-black disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="relative flex-1 sm:flex-none sm:w-72 min-w-0">
            {selectedPerson && (
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black text-white text-[10px] font-medium flex items-center justify-center">
                {initialsOf(reporteeName(selectedPerson)) || "?"}
              </span>
            )}
            <select
              id="individual-employee"
              value={selectedId}
              onChange={handleChange}
              disabled={selectDisabled}
              className={`w-full h-10 appearance-none rounded-xl border border-black/10 bg-white pr-10 text-sm text-black truncate cursor-pointer transition-colors hover:border-black/30 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 disabled:opacity-60 disabled:cursor-not-allowed ${
                selectedPerson ? "pl-11" : "pl-3"
              }`}
            >
              {listLoading && <option value="">Loading employees...</option>}
              {!listLoading && reportees.length === 0 && (
                <option value="">No reportees</option>
              )}
              {reportees.map((s) => (
                <option key={s.uuid} value={String(s.uuid)}>
                  {reporteeName(s)}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-black/50"
            />
          </div>

          <button
            type="button"
            onClick={() => step(1)}
            disabled={selectDisabled || selectedIndex >= reportees.length - 1}
            aria-label="Next employee"
            className="h-10 w-10 shrink-0 rounded-xl border border-black/10 bg-white text-black/60 flex items-center justify-center transition-colors hover:bg-black/5 hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-black disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {content}
    </div>
  );
}

export default IndividualKpi;
