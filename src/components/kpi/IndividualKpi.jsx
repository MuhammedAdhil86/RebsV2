import React from "react";
import { fetchEmployeeKpi } from "../../service/kpiService";
import {
  useKpiData,
  Badge,
  StatCard,
  ScoreCell,
  Loading,
  ErrorBox,
  Notices,
  WeightsNote,
  num,
  humanize,
  nameOf,
  BAND_STYLES,
  REVIEW_STYLES,
} from "./CompanyOverview";

/* ---------- Individual dashboard content ---------- */

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

/* ---------- Individual tab ---------- */

/**
 * `options` is the employee-dropdown request owned by the parent
 * ({ data, loading, error, reload }) because the Employee select lives
 * in the parent's header.
 */
function IndividualKpi({ employeeId, options, month, year }) {
  const individual = useKpiData(
    () => fetchEmployeeKpi(employeeId, month, year),
    [employeeId, month, year],
    !!employeeId,
  );

  if (options.loading || individual.loading) return <Loading />;
  if (options.error) {
    return <ErrorBox message={options.error} onRetry={options.reload} />;
  }
  if (individual.error) {
    return <ErrorBox message={individual.error} onRetry={individual.reload} />;
  }
  if (!employeeId) {
    return (
      <div className="py-24 text-center text-sm text-black/40">
        No employees found for this month.
      </div>
    );
  }
  if (!individual.data) return null;

  return <IndividualView data={individual.data} />;
}

export default IndividualKpi;
