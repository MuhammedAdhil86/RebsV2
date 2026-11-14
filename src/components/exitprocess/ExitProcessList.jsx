import React, { useState, useEffect, useMemo } from "react";
import { Users, Clock, CheckCircle2, XCircle, Search } from "lucide-react";
import exitService from "../../service/exitService";

/* ---------- helpers + small UI pieces ---------- */

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

const STATUS_STYLES = {
  completed: "bg-emerald-50 text-emerald-700",
  revoked: "bg-red-50 text-red-600",
  "in progress": "bg-amber-50 text-amber-700",
  pending: "bg-amber-50 text-amber-700",
  "not started": "bg-zinc-100 text-zinc-600",
};

const statusClass = (s) =>
  STATUS_STYLES[String(s ?? "").toLowerCase()] || "bg-zinc-100 text-zinc-600";

const Badge = ({ children, className = "bg-zinc-100 text-zinc-600" }) => (
  <span
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

/* StatCard: dashboard style, pastel bg + black round icon */
const StatCard = ({ icon: IconCmp, label, value, hint, bg }) => (
  <div
    className="shadow-sm rounded-lg p-3 flex items-center gap-3"
    style={{ backgroundColor: bg }}
  >
    <div className="flex items-center justify-center min-w-10 h-10 rounded-full bg-black text-white">
      {IconCmp && <IconCmp size={18} />}
    </div>
    <div className="overflow-hidden">
      <p className="text-gray-500 text-[10px] sm:text-xs truncate uppercase font-normal">
        {label}
      </p>
      <h2 className="text-lg sm:text-xl font-normal text-gray-800">{value}</h2>
      {hint && <p className="text-[10px] text-gray-500 truncate">{hint}</p>}
    </div>
  </div>
);

const ProgressBar = ({ value }) => (
  <div className="flex items-center gap-2 min-w-[120px]">
    <div className="h-1.5 flex-1 rounded-full bg-black/10 overflow-hidden">
      <div
        className="h-full rounded-full bg-black"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
    <span className="text-[11px] text-black/50 w-8 text-right">{value}%</span>
  </div>
);

const FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "completed", label: "Completed" },
  { id: "revoked", label: "Revoked" },
];

const bucket = (p) => {
  const s = p.status.toLowerCase();
  if (s === "completed") return "completed";
  if (s === "revoked") return "revoked";
  return "active"; // anything still open
};

/* ---------- list ---------- */

const ExitProcessList = ({ onOpen }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  // GET /admin/exit-process/list-all
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    exitService
      .fetchExitProcesses()
      .then((list) => {
        if (!cancelled) setItems(list);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err.response?.data?.message ||
            err.message ||
            "Could not load exit processes.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const counts = useMemo(() => {
    const c = { all: items.length, active: 0, completed: 0, revoked: 0 };
    items.forEach((p) => {
      c[bucket(p)] += 1;
    });
    return c;
  }, [items]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((p) => {
      if (filter !== "all" && bucket(p) !== filter) return false;
      if (!q) return true;
      return (
        p.employeeName.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q)
      );
    });
  }, [items, filter, query]);

  const pctOf = (n) => (counts.all ? Math.round((n / counts.all) * 100) : 0);

  return (
    <>
      {/* HEADER */}
      <div>
        <h2 className="text-2xl text-black tracking-tight">Exit Process</h2>
        <p className="text-xs text-black/40 mt-0.5">
          Track resignations, interviews and clearances
        </p>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total"
          value={counts.all}
          hint="All exit requests"
          bg={COLORS.blue}
        />
        <StatCard
          icon={Clock}
          label="Active"
          value={counts.active}
          hint={`${pctOf(counts.active)}% of total`}
          bg={COLORS.orange}
        />
        <StatCard
          icon={CheckCircle2}
          label="Completed"
          value={counts.completed}
          hint={`${pctOf(counts.completed)}% of total`}
          bg={COLORS.green}
        />
        <StatCard
          icon={XCircle}
          label="Revoked"
          value={counts.revoked}
          hint={`${pctOf(counts.revoked)}% of total`}
          bg={COLORS.red}
        />
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center border border-black/10 rounded-lg overflow-hidden">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`px-3.5 py-2 text-xs transition-colors ${
                filter === f.id
                  ? "bg-black text-white"
                  : "text-black hover:bg-black/5"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or department"
            className="w-full rounded-lg border border-black/10 bg-white py-2 pl-9 pr-3 text-xs text-black focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="border border-black/10 rounded-2xl bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-24 text-center">
            <p className="text-sm text-black">Loading exit processes…</p>
          </div>
        ) : error ? (
          <div className="py-24 text-center">
            <p className="text-sm text-black">Could not load exit processes</p>
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[900px]">
              <thead>
                <tr className="bg-zinc-50 text-black/50 border-b border-black/10">
                  <th className="font-normal px-5 py-3">Employee</th>
                  <th className="font-normal px-3 py-3">Department</th>
                  <th className="font-normal px-3 py-3">Type</th>
                  <th className="font-normal px-3 py-3">Applied on</th>
                  <th className="font-normal px-3 py-3">Notice start</th>
                  <th className="font-normal px-3 py-3">Status</th>
                  <th className="font-normal px-3 py-3">Progress</th>
                  <th className="font-normal px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-14 text-center text-black/40"
                    >
                      {items.length === 0
                        ? "No exit processes yet."
                        : "No exit processes match your filters."}
                    </td>
                  </tr>
                ) : (
                  rows.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-black/[0.02] transition-colors align-middle"
                    >
                      <td className="px-5 py-3.5">
                        <p className="text-sm text-black">{p.employeeName}</p>
                      </td>
                      <td className="px-3 py-3.5 text-black">
                        {p.department || "—"}
                      </td>
                      <td className="px-3 py-3.5 text-black whitespace-nowrap">
                        {p.employmentType || "—"}
                      </td>
                      <td className="px-3 py-3.5 text-black whitespace-nowrap">
                        {formatDate(p.appliedOn)}
                      </td>
                      <td className="px-3 py-3.5 text-black whitespace-nowrap">
                        {formatDate(p.noticePeriodStart)}
                      </td>
                      <td className="px-3 py-3.5">
                        <Badge className={statusClass(p.status)}>
                          {p.status || "—"}
                        </Badge>
                      </td>
                      <td className="px-3 py-3.5">
                        <ProgressBar value={p.completion} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => onOpen(p.id)}
                          className="px-3 py-1.5 text-xs rounded-lg border border-black/10 text-black hover:bg-black hover:text-white transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default ExitProcessList;
