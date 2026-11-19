import React, { useEffect, useMemo, useState } from "react";
import {
  FiSearch,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiVideo,
  FiUsers,
  FiChevronRight,
  FiX,
} from "react-icons/fi";
import { format, isToday, isTomorrow, isSameDay } from "date-fns";
import { fetchEvents } from "../../service/eventservices";

/* ---------- Helpers ---------- */

const FILTERS = [
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming" },
  { key: "ongoing", label: "Ongoing" },
  { key: "past", label: "Past" },
];

const STATUS = {
  upcoming: { label: "Upcoming", chip: "bg-violet-50 text-violet-600" },
  ongoing: { label: "Ongoing", chip: "bg-emerald-50 text-emerald-600" },
  past: { label: "Past", chip: "bg-zinc-100 text-zinc-500" },
};

// Backend sends "…Z" timestamps that should be read as local time
const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date)
    return Number.isNaN(value.getTime()) ? null : value;
  const str = String(value);
  const d = new Date(str.includes("Z") ? str.split("Z")[0] : str);
  return Number.isNaN(d.getTime()) ? null : d;
};

const getStatus = (event) => {
  const start = toDate(event.start_date);
  const end = toDate(event.end_date) || start;
  if (!start) return "past";
  const now = new Date();
  if (now < start) return "upcoming";
  if (end && now > end) return "past";
  return "ongoing";
};

const formatTime = (date) =>
  date
    ? date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "";

const groupLabel = (date) => {
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "EEE, dd MMM yyyy");
};

/* ---------- UI pieces ---------- */

const EventCard = ({ event, onClick }) => {
  const status = getStatus(event);
  const start = toDate(event.start_date);
  const end = toDate(event.end_date);
  const isPast = status === "past";
  const multiDay = start && end && !isSameDay(start, end);
  const isOnline = event.event_type === "online";
  const place = isOnline ? "Online meeting" : event.place || event.location;
  const people = Array.isArray(event.participation)
    ? event.participation.length
    : Number(event.attendees) || 0;

  return (
    <button
      type="button"
      onClick={() => onClick(event)}
      className="group w-full text-left flex items-stretch gap-3 p-3 rounded-2xl border border-gray-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-zinc-300 hover:shadow-md transition-all cursor-pointer outline-none focus-visible:border-zinc-400"
    >
      {/* Date tile */}
      <div
        className={`w-12 shrink-0 rounded-xl flex flex-col items-center justify-center py-2 ${
          isPast ? "bg-zinc-50 text-zinc-400" : "bg-black text-white"
        }`}
      >
        <span
          className={`text-[9px] uppercase tracking-widest leading-none ${
            isPast ? "text-zinc-400" : "text-white/60"
          }`}
        >
          {start ? format(start, "MMM") : "—"}
        </span>
        <span className="text-[18px] leading-none mt-1">
          {start ? format(start, "dd") : "--"}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4
            className={`text-[13px] leading-snug truncate ${
              isPast ? "text-gray-500" : "text-gray-900"
            }`}
          >
            {event.title || "Untitled event"}
          </h4>
          <span
            className={`flex items-center gap-1.5 shrink-0 px-2 py-0.5 rounded-full text-[10px] tracking-wide ${STATUS[status].chip}`}
          >
            {status === "ongoing" && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            )}
            {STATUS[status].label}
          </span>
        </div>

        {event.description && (
          <p className="text-[11px] text-gray-400 leading-relaxed mt-1 line-clamp-2 break-words">
            {event.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 text-[10px] text-gray-500">
          <span className="flex items-center gap-1.5">
            <FiClock size={11} className="text-gray-400" />
            {multiDay
              ? `${format(start, "dd MMM")} → ${format(end, "dd MMM")}`
              : `${formatTime(start)}${end ? ` – ${formatTime(end)}` : ""}`}
          </span>

          {place && (
            <span className="flex items-center gap-1.5 min-w-0">
              {isOnline ? (
                <FiVideo size={11} className="text-gray-400 shrink-0" />
              ) : (
                <FiMapPin size={11} className="text-gray-400 shrink-0" />
              )}
              <span className="truncate max-w-[160px]">{place}</span>
            </span>
          )}

          {people > 0 && (
            <span className="flex items-center gap-1.5">
              <FiUsers size={11} className="text-gray-400" />
              {people} {people === 1 ? "person" : "people"}
            </span>
          )}
        </div>
      </div>

      <FiChevronRight
        size={16}
        className="self-center shrink-0 text-gray-300 group-hover:text-black group-hover:translate-x-0.5 transition-all"
      />
    </button>
  );
};

const CardSkeleton = () => (
  <div className="flex gap-3 p-3 rounded-2xl border border-gray-100 bg-white animate-pulse">
    <div className="w-12 h-14 rounded-xl bg-gray-100" />
    <div className="flex-1 space-y-2.5 py-1">
      <div className="h-3 w-2/3 bg-gray-100 rounded" />
      <div className="h-2.5 w-full bg-gray-100 rounded" />
      <div className="h-2.5 w-1/3 bg-gray-100 rounded" />
    </div>
  </div>
);

/* ---------- Page ---------- */

const AllEvents = ({ onEventClick, events: propEvents }) => {
  const [fetched, setFetched] = useState([]);
  const [loading, setLoading] = useState(!propEvents);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Use the events passed in; otherwise fetch them
  useEffect(() => {
    if (propEvents) {
      setLoading(false);
      return undefined;
    }
    let mounted = true;
    setLoading(true);
    fetchEvents()
      .then((data) => {
        if (mounted) setFetched(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error("Error fetching events:", error);
        if (mounted) setFetched([]);
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [propEvents]);

  const events = useMemo(
    () => (Array.isArray(propEvents) ? propEvents : fetched),
    [propEvents, fetched],
  );

  const counts = useMemo(() => {
    const c = { all: events.length, upcoming: 0, ongoing: 0, past: 0 };
    events.forEach((e) => {
      c[getStatus(e)] += 1;
    });
    return c;
  }, [events]);

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events
      .filter((e) => filter === "all" || getStatus(e) === filter)
      .filter(
        (e) =>
          !q ||
          (e.title || "").toLowerCase().includes(q) ||
          (e.description || "").toLowerCase().includes(q) ||
          (e.place || e.location || "").toLowerCase().includes(q),
      )
      .sort((a, b) => {
        const diff =
          (toDate(a.start_date)?.getTime() || 0) -
          (toDate(b.start_date)?.getTime() || 0);
        return filter === "past" ? -diff : diff;
      });
  }, [events, filter, search]);

  // Group by day, keeping the sorted order
  const groups = useMemo(() => {
    const map = new Map();
    filteredEvents.forEach((e) => {
      const start = toDate(e.start_date);
      const key = start ? format(start, "yyyy-MM-dd") : "unknown";
      if (!map.has(key)) {
        map.set(key, {
          key,
          label: start ? groupLabel(start) : "No date",
          items: [],
        });
      }
      map.get(key).items.push(e);
    });
    return [...map.values()];
  }, [filteredEvents]);

  const handleEventClick = (event) => {
    if (onEventClick) onEventClick(event);
  };

  return (
    <div className="font-poppins font-normal text-[12px] text-black">
      {/* Toolbar */}
      <div className="space-y-3 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
              <FiCalendar size={15} />
            </div>
            <div>
              <h3 className="text-[14px] text-gray-900 leading-none">
                All events
              </h3>
              <p className="text-[10px] text-gray-400 mt-1 leading-none">
                {counts.all} {counts.all === 1 ? "event" : "events"} this month
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <FiSearch
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, description or place"
            className="w-full bg-[#F8F9FA] text-gray-800 placeholder-gray-300 outline-none border border-gray-100 rounded-xl pl-10 pr-9 py-2.5 text-xs font-normal focus:border-gray-300 focus:bg-white focus:ring-4 focus:ring-gray-100 transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute inset-y-0 right-3 flex items-center text-gray-300 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <FiX size={14} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                type="button"
                key={f.key}
                onClick={() => setFilter(f.key)}
                aria-pressed={active}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-[11px] tracking-wide transition-all cursor-pointer ${
                  active
                    ? "bg-black text-white border-black shadow-md"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-black"
                }`}
              >
                {f.label}
                <span className={active ? "text-white/60" : "text-gray-300"}>
                  {counts[f.key]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="max-h-[calc(100vh-260px)] overflow-y-auto pr-2 -mr-2 custom-scrollbar">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : groups.length > 0 ? (
          <div className="space-y-5 pb-2">
            {groups.map((group) => (
              <section key={group.key}>
                <div className="flex items-center gap-3 mb-2.5">
                  <h4 className="text-[10px] text-gray-500 uppercase tracking-widest whitespace-nowrap">
                    {group.label}
                  </h4>
                  <span className="h-px flex-1 bg-gray-100" />
                  <span className="text-[10px] text-gray-300">
                    {group.items.length}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {group.items.map((event, i) => (
                    <EventCard
                      key={event.id ?? `${group.key}-${i}`}
                      event={event}
                      onClick={handleEventClick}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-14 text-center rounded-2xl border border-dashed border-gray-200 bg-[#FBFBFC]">
            <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 text-gray-300 flex items-center justify-center">
              <FiCalendar size={20} />
            </div>
            <p className="text-xs text-gray-700 mt-1">No events found</p>
            <p className="text-[11px] text-gray-400 max-w-[240px]">
              {search || filter !== "all"
                ? "Try a different search or filter."
                : "Events you create will show up here."}
            </p>
            {(search || filter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
                className="mt-1 text-[11px] text-gray-500 underline underline-offset-4 hover:text-black cursor-pointer"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllEvents;
