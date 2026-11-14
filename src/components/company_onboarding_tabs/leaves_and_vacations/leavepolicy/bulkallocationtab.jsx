import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Search, RefreshCw } from "lucide-react";
import PayrollTable from "../../../../ui/payrolltable";
import { toast } from "react-toastify"; // global <ToastContainer /> lives in App.jsx
import payrollService from "../../../../service/payrollService";
import {
  filterStaff,
  getDepartmentData,
  getBranchData,
  getDesignationData,
} from "../../../../service/staffservice";
import { getActiveUsersLight } from "../../../../service/employeeService";
/* ================= CONSTANTS & HELPERS ================= */
const FILTER_TYPES = ["employee", "all", "department", "designation", "branch"];
const CRITERIA_TYPES = ["department", "designation", "branch"];

const TYPE_LABELS = {
  employee: "Select Employee",
  all: "All Employees",
  department: "Department",
  designation: "Designation",
  branch: "Branch",
};

const LOOKUP_FETCHERS = {
  department: getDepartmentData,
  designation: getDesignationData,
  branch: getBranchData,
};

const PARAM_KEYS = {
  department: "department_id",
  designation: "designation_id",
  branch: "branch_id",
};

// Handles: [..]  |  { data: [..] }  |  { data: { data: [..] } }
const toList = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
};

const nameOf = (v) =>
  v && typeof v === "object" ? v.name || v.title || "" : v || "";

// The "light" endpoint and the filter endpoint may return different shapes,
// so normalise once here and the rest of the component stays simple.
const normalizeUser = (u) => ({
  ...u,
  uuid: u.uuid ?? u.id,
  full_name:
    u.full_name ||
    u.name ||
    [u.first_name, u.last_name].filter(Boolean).join(" ") ||
    "-",
  department: nameOf(u.department) || u.department_name || "-",
  designation: nameOf(u.designation) || u.designation_name || "-",
  status: u.status || "Active",
});

const normalizeUsers = (res) => toList(res).map(normalizeUser);

// Pulls the backend message plus any error details out of an axios error
// (or a plain API response), so toasts show what the server actually said.
const getApiMessage = (err, fallback) => {
  const data = err?.response?.data ?? err;
  const msg = data?.message || data?.error || err?.message || fallback;
  const details = data?.errors ?? data?.data;

  let extra = "";
  if (typeof details === "string") {
    extra = details;
  } else if (Array.isArray(details)) {
    extra = details.filter((x) => typeof x === "string").join(", ");
  } else if (details && typeof details === "object") {
    extra = Object.values(details)
      .flat()
      .filter((x) => typeof x === "string")
      .join(", ");
  }

  return extra && extra !== msg ? `${msg}: ${extra}` : msg;
};

const useDebouncedValue = (value, delay = 250) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

/* ================= SKELETON ================= */
const TableSkeleton = ({ rows = 8 }) => (
  <div className="space-y-3 animate-pulse">
    <div className="h-8 bg-gray-100 rounded-lg" />
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="h-10 bg-gray-50 rounded-lg" />
    ))}
  </div>
);

/* ================= COMPONENT ================= */
const BulkAllocationTab = ({ policies }) => {
  /* ---------- STATE ---------- */
  const [allUsers, setAllUsers] = useState([]); // full active staff list
  const [scopedUsers, setScopedUsers] = useState(null); // filtered list (null = no filter)
  const [lookups, setLookups] = useState({
    department: [],
    designation: [],
    branch: [],
  });

  const [initialLoading, setInitialLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm, 250);

  const [filterType, setFilterType] = useState("employee");
  const [selectedFilterId, setSelectedFilterId] = useState("");
  const [selectedPolicyId, setSelectedPolicyId] = useState("");
  const [selectedUsers, setSelectedUsers] = useState(() => new Set());
  const [submitting, setSubmitting] = useState(false);

  /* ---------- CACHE (survives re-renders, no extra renders) ---------- */
  const cache = useRef({
    users: null,
    usersPromise: null,
    lookups: {}, // type -> list
    lookupPromises: {}, // type -> in-flight promise
    filtered: new Map(), // "department:12" -> users[]
  });
  const filterReqId = useRef(0); // guards against stale filter responses
  const selectAllRef = useRef(null);

  /* ---------- DATA LOADERS ---------- */
  const loadAllUsers = useCallback(async ({ force = false } = {}) => {
    const c = cache.current;
    if (!force && c.users) {
      setAllUsers(c.users);
      return c.users;
    }
    // de-duplicate simultaneous calls
    if (!c.usersPromise || force) {
      c.usersPromise = getActiveUsersLight()
        .then(normalizeUsers)
        .finally(() => {
          c.usersPromise = null;
        });
    }
    const list = await c.usersPromise;
    c.users = list;
    setAllUsers(list);
    return list;
  }, []);

  const loadLookup = useCallback(async (type) => {
    const c = cache.current;
    if (c.lookups[type]) return c.lookups[type];

    if (!c.lookupPromises[type]) {
      c.lookupPromises[type] = LOOKUP_FETCHERS[type]()
        .then(toList)
        .then((list) => {
          c.lookups[type] = list;
          setLookups((prev) => ({ ...prev, [type]: list }));
          return list;
        })
        .finally(() => {
          delete c.lookupPromises[type];
        });
    }
    return c.lookupPromises[type];
  }, []);

  /* ---------- INITIAL LOAD: everything in parallel, once ---------- */
  const initialize = useCallback(async () => {
    setInitialLoading(true);
    setLoadError(false);

    const [usersResult] = await Promise.allSettled([
      loadAllUsers({ force: true }),
      // prefetch dropdown data in the background so tab clicks are instant
      ...CRITERIA_TYPES.map((t) => loadLookup(t)),
    ]);

    if (usersResult.status === "rejected") {
      console.error(
        "Bulk Allocation: failed to load staff",
        usersResult.reason,
      );
      setAllUsers([]);
      setLoadError(true);
      toast.error(
        getApiMessage(usersResult.reason, "Could not load staff list"),
        { toastId: "staff-load-error" },
      );
    }
    setInitialLoading(false);
  }, [loadAllUsers, loadLookup]);

  useEffect(() => {
    initialize();
    // run once - NOT on every `policies` change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- DERIVED DATA ---------- */
  const baseUsers = scopedUsers ?? allUsers;

  const visibleUsers = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return baseUsers;
    return baseUsers.filter(
      (u) =>
        u.full_name?.toLowerCase().includes(q) ||
        String(u.uuid ?? "")
          .toLowerCase()
          .includes(q) ||
        String(u.department ?? "")
          .toLowerCase()
          .includes(q) ||
        String(u.designation ?? "")
          .toLowerCase()
          .includes(q),
    );
  }, [baseUsers, debouncedSearch]);

  const filterOptions = CRITERIA_TYPES.includes(filterType)
    ? lookups[filterType]
    : [];

  // Shown in the UI instead of a toast: what the current selection is based on
  const scopeLabel = useMemo(() => {
    if (filterType === "employee") return "Manual selection";
    if (filterType === "all") return "All Employees";
    const opt = filterOptions.find(
      (o) => String(o.id) === String(selectedFilterId),
    );
    return opt
      ? `${TYPE_LABELS[filterType]}: ${opt.name || opt.title}`
      : `${TYPE_LABELS[filterType]}: not chosen`;
  }, [filterType, filterOptions, selectedFilterId]);

  const visibleSelectedCount = useMemo(
    () =>
      visibleUsers.reduce((n, u) => n + (selectedUsers.has(u.uuid) ? 1 : 0), 0),
    [visibleUsers, selectedUsers],
  );
  const allVisibleSelected =
    visibleUsers.length > 0 && visibleSelectedCount === visibleUsers.length;
  const someVisibleSelected = visibleSelectedCount > 0 && !allVisibleSelected;

  // indeterminate state for the header checkbox
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someVisibleSelected;
    }
  }, [someVisibleSelected]);

  /* ---------- SELECTION ---------- */
  const toggleUserSelection = useCallback((uuid) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      next.has(uuid) ? next.delete(uuid) : next.add(uuid);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(
    (isChecked) => {
      setSelectedUsers((prev) => {
        const next = new Set(prev);
        visibleUsers.forEach((u) =>
          isChecked ? next.add(u.uuid) : next.delete(u.uuid),
        );
        return next;
      });
    },
    [visibleUsers],
  );

  /* ---------- FILTER HANDLERS ---------- */
  const handleFilterTypeChange = useCallback(
    async (type) => {
      if (type === filterType && type !== "all") return;

      filterReqId.current += 1; // invalidate any in-flight filter request
      setFilterType(type);
      setSelectedFilterId("");
      setScopedUsers(null);
      setFilterLoading(false);

      if (type === "employee") {
        setSelectedUsers(new Set());
        return;
      }

      if (type === "all") {
        setSelectedUsers(new Set(allUsers.map((u) => u.uuid)));
        return;
      }

      // Criteria modes: nothing selected until a value is chosen
      setSelectedUsers(new Set());
      if (!cache.current.lookups[type]) {
        setLookupLoading(true);
        try {
          await loadLookup(type);
        } catch (error) {
          console.error(error);
          toast.error(getApiMessage(error, `Could not load ${type} data`));
        } finally {
          setLookupLoading(false);
        }
      }
    },
    [filterType, allUsers, loadLookup],
  );

  const handleFilterSelect = useCallback(
    async (id) => {
      setSelectedFilterId(id);

      if (!id) {
        filterReqId.current += 1;
        setScopedUsers(null);
        setSelectedUsers(new Set());
        return;
      }

      const key = `${filterType}:${id}`;
      const cached = cache.current.filtered.get(key);

      // instant result for anything already fetched
      if (cached) {
        filterReqId.current += 1;
        setScopedUsers(cached);
        setSelectedUsers(new Set(cached.map((u) => u.uuid)));
        return;
      }

      const reqId = ++filterReqId.current;
      setFilterLoading(true);

      try {
        const data = await filterStaff({ [PARAM_KEYS[filterType]]: id });
        const list = normalizeUsers(data);
        cache.current.filtered.set(key, list);

        // ignore the response if the user already picked something else
        if (reqId !== filterReqId.current) return;

        setScopedUsers(list);
        setSelectedUsers(new Set(list.map((u) => u.uuid)));
      } catch (error) {
        if (reqId !== filterReqId.current) return;
        console.error(error);
        setScopedUsers([]);
        setSelectedUsers(new Set());
        toast.error(
          getApiMessage(error, "Could not load staff for this selection"),
        );
      } finally {
        if (reqId === filterReqId.current) setFilterLoading(false);
      }
    },
    [filterType],
  );

  /* ---------- ALLOCATE ---------- */
  const handleAllocate = async () => {
    if (!selectedPolicyId) return toast.error("Please select a leave policy");
    if (selectedUsers.size === 0) return toast.error("Select staff members");

    const payload = {
      leave_policy_id: parseInt(selectedPolicyId, 10),
      staff_ids: Array.from(selectedUsers),
    };

    setSubmitting(true);
    try {
      const response = await payrollService.bulkAllocateLeave(payload);
      if (response?.success || response?.status_code === 200) {
        toast.success(response?.message || "Policy successfully allocated!");
        setSelectedUsers(new Set());
        // No full refetch needed - the staff list did not change.
      } else {
        toast.error(getApiMessage(response, "Allocation failed"));
      }
    } catch (error) {
      toast.error(getApiMessage(error, "Server error"));
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- COLUMNS (memoised) ---------- */
  const columns = useMemo(
    () => [
      {
        key: "selection",
        label: (
          <input
            ref={selectAllRef}
            type="checkbox"
            className="cursor-pointer accent-black"
            onChange={(e) => handleSelectAll(e.target.checked)}
            checked={allVisibleSelected}
          />
        ),
        width: 50,
        render: (_, row) => (
          <input
            type="checkbox"
            className="cursor-pointer accent-black"
            checked={selectedUsers.has(row.uuid)}
            onChange={() => toggleUserSelection(row.uuid)}
            onClick={(e) => e.stopPropagation()}
          />
        ),
      },
      { key: "full_name", label: "Staff Name", align: "left" },
      { key: "uuid", label: "Staff ID", align: "center" },
      { key: "department", label: "Department", align: "center" },
      { key: "designation", label: "Designation", align: "center" },
      {
        key: "status",
        label: "Status",
        align: "center",
        render: (val) => (
          <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-[10px] uppercase border border-green-100">
            {val || "Active"}
          </span>
        ),
      },
    ],
    [allVisibleSelected, selectedUsers, handleSelectAll, toggleUserSelection],
  );

  const isBusy = initialLoading || filterLoading;
  const disableAllocate = submitting || selectedUsers.size === 0;

  /* ---------- RENDER ---------- */
  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in duration-500 font-['Poppins']">
      {/* --- SIDEBAR --- */}
      <div className="w-full lg:w-80 space-y-4">
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-6">
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase mb-3 block">
              Policy
            </label>
            <select
              value={selectedPolicyId}
              onChange={(e) => setSelectedPolicyId(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-black"
            >
              <option value="">-- Choose Leave Template --</option>
              {policies?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <hr className="border-gray-50" />

          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase mb-3 block">
              Target Category
            </label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {FILTER_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => handleFilterTypeChange(type)}
                  disabled={initialLoading}
                  className={`px-2 py-2 rounded-lg text-[10px] border transition-all disabled:opacity-60 ${
                    filterType === type
                      ? "bg-black text-white border-black"
                      : "bg-white text-gray-500 border-gray-100 hover:border-gray-300"
                  }`}
                >
                  {TYPE_LABELS[type]}
                </button>
              ))}
            </div>

            {CRITERIA_TYPES.includes(filterType) && (
              <select
                value={selectedFilterId}
                onChange={(e) => handleFilterSelect(e.target.value)}
                disabled={lookupLoading}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-black animate-in slide-in-from-top-2 disabled:opacity-60"
              >
                <option value="">
                  {lookupLoading
                    ? "Loading..."
                    : `-- Select ${TYPE_LABELS[filterType]} --`}
                </option>
                {filterOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name || opt.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          <button
            disabled={disableAllocate}
            onClick={handleAllocate}
            className={`w-full py-3.5 rounded-lg text-[12px] font-medium transition-all ${
              disableAllocate
                ? "bg-gray-100 text-gray-400"
                : "bg-black text-white hover:bg-zinc-800"
            }`}
          >
            {submitting
              ? "Processing..."
              : `Allocate to ${selectedUsers.size} Staff`}
          </button>
        </div>
      </div>

      {/* --- TABLE --- */}
      <div className="flex-1 bg-white border border-gray-100 rounded-xl shadow-sm flex flex-col min-w-0">
        <div className="p-4 border-b flex justify-between items-center bg-white sticky top-0 z-10 rounded-t-xl">
          <div className="relative w-full max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={14}
            />
            <input
              type="text"
              placeholder="Search by name or ID..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-transparent rounded-lg text-xs focus:bg-white focus:border-gray-200 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 ml-3 shrink-0">
            <div className="px-3 py-1 bg-gray-50 text-gray-600 border border-gray-200 rounded-full text-[10px] max-w-[220px] truncate">
              {scopeLabel}
            </div>
            <div className="px-3 py-1 bg-black text-white rounded-full text-[10px]">
              {selectedUsers.size} SELECTED
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 min-h-[500px]">
          {isBusy ? (
            <TableSkeleton />
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
              <span className="text-xs">Could not load staff list.</span>
              <button
                onClick={initialize}
                className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:border-gray-400"
              >
                <RefreshCw size={12} /> Retry
              </button>
            </div>
          ) : visibleUsers.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-xs text-gray-400">
              {debouncedSearch
                ? "No staff match your search."
                : "No staff found."}
            </div>
          ) : (
            <PayrollTable
              columns={columns}
              data={visibleUsers}
              rowsPerPage={12}
              // search is already applied above (debounced), so don't filter twice
              searchTerm=""
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkAllocationTab;
