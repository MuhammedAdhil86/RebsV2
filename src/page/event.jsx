import React, { useState, useEffect, useMemo } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  FiPlus,
  FiCalendar,
  FiClock,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiMapPin,
  FiLoader,
} from "react-icons/fi";
import { Drawer } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  format,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  isSameDay,
  isSameMonth,
  isToday,
  isBefore,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";

// Layout & UI
import DashboardLayout from "../ui/pagelayout";
import HeaderGlobal from "../ui/headerglobal";
import EventCreate from "../components/events_ui/createevent";
import EventDetailPage from "../components/events_ui/eventdetailpage";
import AllEvents from "../components/events_ui/allevents";
import { showApiError } from "../utils/apiToast";

// Standardized Services
import {
  fetchEvents,
  fetchMonthlyLeaves,
  fetchDailyDetails,
} from "../service/eventservices";
import {
  fetchAllHolidays,
  fetchHolidaysByBranch,
} from "../service/holidayservices";
import {
  getWeeklyOffByYear,
  getWeeklyOffByBranch,
  getBranchData,
} from "../service/companyService";

const localizer = momentLocalizer(moment);

const DEFAULT_AVATAR = "/person_img.jpg";

// Event colours: gradient pair + solid (dots / legend)
const TONES = {
  event: { from: "#8b5cf6", to: "#6366f1", solid: "#8b5cf6" },
  leave: { from: "#f87171", to: "#ef4444", solid: "#ef4444" },
  holiday: { from: "#22c55e", to: "#16a34a", solid: "#16a34a" },
  weeklyOff: { from: "#94a3b8", to: "#64748b", solid: "#64748b" },
};

const LEGEND = [
  { label: "Event", color: TONES.event.solid },
  { label: "Leave", color: TONES.leave.solid },
  { label: "Holiday", color: TONES.holiday.solid },
  { label: "Weekly off", color: TONES.weeklyOff.solid },
];

// Backend sends "…Z" timestamps that should be read as local time
const toDate = (value) =>
  value ? new Date(String(value).split("Z")[0]) : new Date();

const getEventTone = (event) =>
  event.isHoliday
    ? TONES.holiday
    : event.isWeeklyOff
      ? TONES.weeklyOff
      : event.isLeave
        ? TONES.leave
        : TONES.event;

// Timed single-day events render as "• 9am Title"; everything else as a chip
const isTimedEvent = (e) =>
  e.isEvent &&
  !e.allDay &&
  isSameDay(e.start, e.end) &&
  (e.start.getHours() !== 0 || e.start.getMinutes() !== 0);

const formatShortTime = (d) =>
  format(d, d.getMinutes() ? "h:mma" : "ha").toLowerCase();

// Shows an API toast whenever a query fails
const useErrorToast = (error, fallback) => {
  useEffect(() => {
    if (error) showApiError(error, fallback);
  }, [error, fallback]);
};

/* ---------- Small UI pieces ---------- */

const CALENDAR_CSS = `
  .ops-calendar .rbc-month-view { border: 1px solid #e4e4e7; border-radius: 20px; overflow: hidden; background: #fff; }
  .ops-calendar .rbc-header { padding: 10px 4px; font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: .1em; color: #71717a; border-left: none; border-bottom: 1px solid #e4e4e7; background: #fafafa; }
  .ops-calendar .rbc-month-row { min-height: 92px; border-top: 1px solid #e4e4e7; }
  .ops-calendar .rbc-month-row:first-of-type { border-top: none; }
  .ops-calendar .rbc-day-bg + .rbc-day-bg { border-left: 1px solid #e4e4e7; }
  .ops-calendar .rbc-day-bg { cursor: pointer; transition: background-color .15s ease; }
  .ops-calendar .rbc-day-bg:hover { background-color: #fafafa; }
  .ops-calendar .rbc-off-range-bg { background: #fff; }
  .ops-calendar .rbc-off-range span { color: #a1a1aa !important; }
  .ops-calendar .rbc-today { background: transparent; }
  .ops-calendar .rbc-date-cell { padding: 6px 0 2px; text-align: center; }
  .ops-calendar .rbc-row-segment { padding: 0 6px 2px; }
  .ops-calendar .rbc-event { min-height: 20px; transition: transform .15s ease, filter .15s ease; }
  .ops-calendar .rbc-event:focus { outline: none; }
  .ops-calendar .ops-event-chip { box-shadow: 0 1px 2px rgba(0,0,0,.14); }
  .ops-calendar .ops-event-chip:hover { filter: brightness(.94); transform: translateY(-1px); }
  .ops-calendar .ops-event-timed:hover { background-color: #f4f4f5 !important; }
  .ops-calendar .rbc-event-content { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ops-calendar .rbc-show-more { font-size: 11px; font-weight: 500; color: #3f3f46; background: transparent; padding: 1px 6px; border-radius: 4px; }
  .ops-calendar .rbc-show-more:hover { background: #f4f4f5; }
  /* Weekly-off days: light grey. Selected day: soft highlight */
  .ops-calendar .ops-day-off { background-color: #fafafa; }
  .ops-calendar .ops-day-today { background-image: linear-gradient(180deg, #f5f3ff 0, #fff 75%); }
  .ops-calendar .ops-day-selected { background-color: #fafafa; box-shadow: inset 0 0 0 1.5px #18181b; }
  @media (max-width: 640px) {
    .ops-calendar .rbc-month-row { min-height: 68px; }
    .ops-calendar .rbc-row-segment { padding: 0 2px 2px; }
    .ops-calendar .rbc-event { font-size: 9px !important; padding: 1px 3px !important; }
  }
`;

// Day number: black circle for today (Google style), "Nov 1" on the 1st
const makeDateHeader = (selectedDate) =>
  function DateHeader({ label, date }) {
    const today = isToday(date);
    const selected = isSameDay(date, selectedDate);
    const state = today
      ? "bg-black text-white"
      : selected
        ? "bg-zinc-200 text-black"
        : "text-zinc-700";
    return (
      <span
        className={`inline-flex items-center justify-center min-w-[26px] h-[26px] px-1.5 rounded-full text-[11px] font-normal ${state}`}
      >
        {date.getDate() === 1 ? format(date, "MMM d") : label}
      </span>
    );
  };

const MonthEvent = ({ event }) =>
  isTimedEvent(event) ? (
    <span className="flex items-center gap-1.5 min-w-0">
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: getEventTone(event).solid }}
      />
      <span className="shrink-0 text-zinc-500">
        {formatShortTime(event.start)}
      </span>
      <span className="truncate">{event.title}</span>
    </span>
  ) : (
    <span className="truncate">{event.title}</span>
  );

// Dark summary card for the selected day
const SelectedDayCard = ({ date, events, leaves, loading, onAdd }) => (
  <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-800 via-zinc-900 to-black text-white p-5 sm:p-6 shadow-lg animate-in fade-in duration-300">
    <span className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-white/5" />
    <span className="absolute -right-2 top-16 w-20 h-20 rounded-full bg-white/5" />

    <p className="relative text-[10px] uppercase tracking-widest text-white/60">
      {isToday(date) ? `Today · ${format(date, "EEEE")}` : format(date, "EEEE")}
    </p>
    <div className="relative flex items-end gap-3 mt-2">
      <span className="text-[48px] leading-none font-light">
        {format(date, "dd")}
      </span>
      <div className="pb-1">
        <p className="text-[14px] leading-tight">{format(date, "MMMM")}</p>
        <p className="text-[11px] text-white/60">{format(date, "yyyy")}</p>
      </div>
    </div>

    <div className="relative flex flex-wrap items-center gap-2 mt-5">
      <span className="px-3 py-1.5 rounded-full bg-white/10 text-[10px] uppercase tracking-wider">
        {loading ? "–" : events} events
      </span>
      <span className="px-3 py-1.5 rounded-full bg-white/10 text-[10px] uppercase tracking-wider">
        {loading ? "–" : leaves} on leave
      </span>
      <button
        type="button"
        onClick={onAdd}
        className="ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-black text-[10px] uppercase tracking-wider hover:bg-zinc-200 active:scale-95 transition-all cursor-pointer"
      >
        <FiPlus size={12} /> Add
      </button>
    </div>
  </section>
);

const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

// Google-style mini month used to jump between dates
const MiniCalendar = ({
  month,
  selected,
  busyDays,
  onSelect,
  onPrev,
  onNext,
}) => {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month)),
    end: endOfWeek(endOfMonth(month)),
  });
  const navBtn =
    "p-1.5 rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-black transition-colors cursor-pointer";

  return (
    <section className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[12px] text-black font-normal pl-1">
          {format(month, "MMMM yyyy")}
        </h3>
        <div className="flex items-center">
          <button
            type="button"
            onClick={onPrev}
            aria-label="Previous month"
            className={navBtn}
          >
            <FiChevronLeft size={14} />
          </button>
          <button
            type="button"
            onClick={onNext}
            aria-label="Next month"
            className={navBtn}
          >
            <FiChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAY_LETTERS.map((d, i) => (
          <span key={i} className="text-[10px] text-zinc-400 py-1">
            {d}
          </span>
        ))}
        {days.map((day) => {
          const inMonth = isSameMonth(day, month);
          const state = isToday(day)
            ? "bg-black text-white"
            : isSameDay(day, selected)
              ? "bg-zinc-200 text-black"
              : inMonth
                ? "text-zinc-700 hover:bg-zinc-100"
                : "text-zinc-300 hover:bg-zinc-100";
          return (
            <button
              type="button"
              key={day.toISOString()}
              onClick={() => onSelect(day)}
              className="relative flex items-center justify-center h-8 cursor-pointer"
            >
              <span
                className={`w-7 h-7 flex items-center justify-center rounded-full text-[11px] transition-colors ${state}`}
              >
                {day.getDate()}
              </span>
              {busyDays.has(format(day, "yyyy-MM-dd")) && (
                <span
                  className={`absolute bottom-0 w-1 h-1 rounded-full ${isToday(day) ? "bg-zinc-400" : "bg-violet-400"}`}
                />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};

const Card = ({ title, accent, action, children }) => (
  <section className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-5 sm:p-6">
    <div className="flex items-center justify-between gap-3 mb-4">
      <h3 className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-500 font-normal">
        {accent && <span className={`w-1 h-3 rounded-full ${accent}`} />}
        {title}
      </h3>
      {action}
    </div>
    {children}
  </section>
);

const EmptyState = ({ children }) => (
  <p className="py-4 text-center text-[11px] text-zinc-300 italic font-normal">
    {children}
  </p>
);

const CardLoader = () => (
  <div className="flex justify-center py-4 text-zinc-400">
    <FiLoader className="animate-spin" size={16} />
  </div>
);

const Chip = ({ children, className = "bg-zinc-100 text-zinc-600" }) => (
  <span
    className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-normal ${className}`}
  >
    {children}
  </span>
);

/* ---------- Page ---------- */

export default function Events({ userName }) {
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerContent, setDrawerContent] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), "MM"));
  const [currentYear, setCurrentYear] = useState(format(new Date(), "yyyy"));
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [branches, setBranches] = useState([]);

  const selectedDay = format(selectedDate, "yyyy-MM-dd");

  useEffect(() => {
    let isMounted = true;
    getBranchData()
      .then((data) => {
        if (isMounted) setBranches(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!isMounted) return;
        setBranches([]);
        showApiError(err, "Failed to load branches");
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleInstantRefresh = async () => {
    try {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["allEvents"],
          refetchType: "all",
        }),
        queryClient.invalidateQueries({
          queryKey: ["dailyDetails"],
          refetchType: "all",
        }),
      ]);
    } catch (err) {
      showApiError(err, "Failed to refresh events");
    }
  };

  const { data: allEvents = [], error: eventsError } = useQuery({
    queryKey: ["allEvents", currentMonth, currentYear],
    queryFn: () => fetchEvents(currentMonth, currentYear),
  });

  const { data: allLeaves = [], error: leavesError } = useQuery({
    queryKey: ["allLeaves", currentMonth, currentYear],
    queryFn: () => fetchMonthlyLeaves(currentMonth, currentYear),
  });

  const {
    data: holidays = [],
    error: holidaysError,
    isLoading: holidaysLoading,
  } = useQuery({
    queryKey: ["holidays", currentYear, selectedBranch],
    queryFn: () =>
      selectedBranch !== "all"
        ? fetchHolidaysByBranch(selectedBranch)
        : fetchAllHolidays(),
  });

  const {
    data: weeklyOffs = [],
    error: weeklyOffsError,
    isLoading: weeklyOffsLoading,
  } = useQuery({
    queryKey: ["weeklyOffs", currentYear, selectedBranch],
    queryFn: () =>
      selectedBranch !== "all"
        ? getWeeklyOffByBranch(currentYear, selectedBranch)
        : getWeeklyOffByYear(currentYear),
    placeholderData: (prev) => prev,
  });

  const {
    data: dailyData,
    error: dailyError,
    isLoading: dailyLoading,
  } = useQuery({
    queryKey: ["dailyDetails", selectedDay],
    queryFn: () => fetchDailyDetails(selectedDay),
  });

  useErrorToast(eventsError, "Failed to load events");
  useErrorToast(leavesError, "Failed to load leaves");
  useErrorToast(holidaysError, "Failed to load holidays");
  useErrorToast(weeklyOffsError, "Failed to load weekly offs");
  useErrorToast(dailyError, "Failed to load daily details");

  const calendarEvents = useMemo(() => {
    const events = (Array.isArray(allEvents) ? allEvents : []).map((e) => ({
      ...e,
      start: toDate(e.start_date),
      end: toDate(e.end_date),
      isEvent: true,
    }));

    const leaves = (allLeaves || [])
      .flatMap((l) =>
        (l.leave_date || []).map((d) => ({
          id: `leave-${d.id}`,
          title: `${l.name} on leave`,
          start: toDate(d.date),
          end: toDate(d.date),
          allDay: true,
          isLeave: true,
          status: l.status,
        })),
      )
      .filter((l) => l.status === "Approved");

    const holidayList = (Array.isArray(holidays) ? holidays : []).map((h) => ({
      id: `h-${h.id ?? h.date}`,
      title: h.Reason || h.title || "Holiday",
      start: toDate(h.date),
      end: toDate(h.date),
      allDay: true,
      isHoliday: true,
    }));

    const weeklyOffList = (Array.isArray(weeklyOffs) ? weeklyOffs : []).map(
      (w) => ({
        id: `woff-${w.id ?? w.date}`,
        title: "Weekly Off",
        start: toDate(w.date),
        end: toDate(w.date),
        allDay: true,
        isWeeklyOff: true,
      }),
    );

    return [...events, ...leaves, ...holidayList, ...weeklyOffList];
  }, [allEvents, allLeaves, holidays, weeklyOffs]);

  // Next two upcoming holidays / weekly offs (today onwards)
  const upcoming = (list) =>
    (Array.isArray(list) ? list : [])
      .filter((item) => !isBefore(toDate(item.date), startOfDay(new Date())))
      .slice(0, 2);

  const upcomingHolidays = upcoming(holidays);
  const upcomingWeeklyOffs = upcoming(weeklyOffs);

  const handleNavigate = (newDate) => {
    setCalendarDate(newDate);
    setCurrentMonth(format(newDate, "MM"));
    setCurrentYear(format(newDate, "yyyy"));
  };

  const goPrev = () => handleNavigate(addMonths(calendarDate, -1));
  const goNext = () => handleNavigate(addMonths(calendarDate, 1));
  const goToday = () => handleNavigate(new Date());

  // Counts for the month on screen
  const monthStats = useMemo(() => {
    const inMonth = calendarEvents.filter((e) =>
      isSameMonth(e.start, calendarDate),
    );
    return {
      events: inMonth.filter((e) => e.isEvent).length,
      leaves: inMonth.filter((e) => e.isLeave).length,
      holidays: inMonth.filter((e) => e.isHoliday).length,
    };
  }, [calendarEvents, calendarDate]);

  // Days to tint on the grid
  const busyDays = useMemo(
    () =>
      new Set(
        calendarEvents
          .filter((e) => e.isEvent || e.isLeave)
          .map((e) => format(e.start, "yyyy-MM-dd")),
      ),
    [calendarEvents],
  );
  const weeklyOffDays = useMemo(
    () =>
      new Set(
        calendarEvents
          .filter((e) => e.isWeeklyOff)
          .map((e) => format(e.start, "yyyy-MM-dd")),
      ),
    [calendarEvents],
  );

  const calendarComponents = useMemo(
    () => ({
      month: { dateHeader: makeDateHeader(selectedDate), event: MonthEvent },
    }),
    [selectedDate],
  );

  const openDrawer = (content, event = null) => {
    setDrawerContent(content);
    setSelectedEvent(event);
    setDrawerOpen(true);
  };

  return (
    <DashboardLayout userName={userName || "Admin"}>
      <style dangerouslySetInnerHTML={{ __html: CALENDAR_CSS }} />

      <div className="w-full space-y-4 sm:space-y-6 font-poppins text-[12px]">
        <HeaderGlobal userName={userName || "Admin"} />

        {/* Action bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-zinc-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-black rounded-2xl text-white shrink-0">
              <FiCalendar size={20} />
            </div>
            <div>
              <h2 className="text-[14px] sm:text-[16px] text-black leading-tight uppercase tracking-wider font-normal">
                Operation Center
              </h2>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider mt-1 font-normal">
                Schedule & availability logs
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-56">
              <FiMapPin
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
              />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full appearance-none bg-white border border-zinc-200 rounded-xl pl-9 pr-9 py-2.5 text-[11px] uppercase tracking-widest text-zinc-700 outline-none focus:border-black transition-all cursor-pointer font-normal"
              >
                <option value="all">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id || b.value} value={b.id || b.value}>
                    {b.name || b.label}
                  </option>
                ))}
              </select>
              <FiChevronDown
                size={14}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
              />
            </div>

            <button
              type="button"
              onClick={() => openDrawer("create")}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-black text-white rounded-2xl hover:bg-zinc-800 active:scale-95 transition-all shadow-lg uppercase tracking-widest text-[11px] font-normal cursor-pointer"
            >
              <FiPlus size={14} /> New Event
            </button>
          </div>
        </div>

        {/* Workspace */}
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:h-[calc(100vh-260px)] lg:min-h-[560px]">
          {/* Calendar */}
          <div className="flex-1 min-w-0 bg-white rounded-3xl border border-zinc-100 shadow-sm p-4 sm:p-6 flex flex-col overflow-hidden animate-in fade-in duration-300">
            {/* Month header (Google style) */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  type="button"
                  onClick={goToday}
                  className="px-4 py-2 mr-1 border border-zinc-300 rounded-full text-[12px] text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer font-normal"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="Previous month"
                  className="p-2 rounded-full text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  <FiChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Next month"
                  className="p-2 rounded-full text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  <FiChevronRight size={18} />
                </button>
                <h3 className="ml-1 sm:ml-2 text-[20px] sm:text-[24px] leading-none text-black tracking-tight font-normal">
                  {format(calendarDate, "MMMM")}{" "}
                  <span className="text-zinc-400">
                    {format(calendarDate, "yyyy")}
                  </span>
                </h3>
              </div>

              <p className="hidden md:block text-[11px] text-zinc-400">
                {monthStats.events} events · {monthStats.leaves} on leave ·{" "}
                {monthStats.holidays} holidays
              </p>
            </div>

            <div className="flex-1 flex flex-col overflow-x-auto">
              <div className="ops-calendar flex-1 flex flex-col min-w-[360px] min-h-[480px] sm:min-w-0">
                <Calendar
                  localizer={localizer}
                  events={calendarEvents}
                  date={calendarDate}
                  onNavigate={handleNavigate}
                  onSelectSlot={(slot) => setSelectedDate(slot.start)}
                  onSelectEvent={(e) => openDrawer("detail", e)}
                  selectable
                  popup
                  toolbar={false}
                  views={["month"]}
                  components={calendarComponents}
                  eventPropGetter={(event) => {
                    const timed = isTimedEvent(event);
                    return {
                      className: timed ? "ops-event-timed" : "ops-event-chip",
                      style: {
                        backgroundColor: "transparent",
                        backgroundImage: timed
                          ? "none"
                          : `linear-gradient(135deg, ${getEventTone(event).from}, ${getEventTone(event).to})`,
                        color: timed ? "#27272a" : "#fff",
                        borderRadius: "4px",
                        border: "none",
                        padding: "1px 6px",
                        fontSize: "11px",
                        fontFamily: "Poppins",
                        fontWeight: timed ? 400 : 500,
                      },
                    };
                  }}
                  dayPropGetter={(date) => {
                    const classes = [
                      weeklyOffDays.has(format(date, "yyyy-MM-dd")) &&
                        "ops-day-off",
                      isToday(date) && "ops-day-today",
                      isSameDay(date, selectedDate) && "ops-day-selected",
                    ].filter(Boolean);
                    return { className: classes.join(" ") };
                  }}
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-4 mt-4 border-t border-zinc-100">
              {LEGEND.map(({ label, color }) => (
                <span
                  key={label}
                  className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-zinc-500 font-normal"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Side panel */}
          <aside className="w-full lg:w-[360px] xl:w-[380px] shrink-0 space-y-4 sm:space-y-6 lg:overflow-y-auto lg:pr-1 custom-scrollbar">
            <SelectedDayCard
              date={selectedDate}
              events={dailyData?.events?.length || 0}
              leaves={dailyData?.leaves?.length || 0}
              loading={dailyLoading}
              onAdd={() => openDrawer("create")}
            />

            <MiniCalendar
              month={calendarDate}
              selected={selectedDate}
              busyDays={busyDays}
              onSelect={(day) => {
                setSelectedDate(day);
                if (!isSameMonth(day, calendarDate)) handleNavigate(day);
              }}
              onPrev={goPrev}
              onNext={goNext}
            />

            <Card title="Upcoming Holidays" accent="bg-green-500">
              {holidaysLoading ? (
                <CardLoader />
              ) : upcomingHolidays.length > 0 ? (
                <div className="space-y-3">
                  {upcomingHolidays.map((h, i) => (
                    <div
                      key={h.id ?? i}
                      className="flex items-center gap-4 p-3 bg-zinc-50/70 rounded-2xl"
                    >
                      <div className="w-9 h-9 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                        <FiCalendar size={15} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-zinc-800 leading-tight truncate font-normal">
                          {h.title || h.Reason}
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-0.5 uppercase font-normal">
                          {format(toDate(h.date), "dd MMM, yyyy")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState>No upcoming holidays</EmptyState>
              )}
            </Card>

            <Card title="Weekly Offs" accent="bg-zinc-400">
              {weeklyOffsLoading ? (
                <CardLoader />
              ) : upcomingWeeklyOffs.length > 0 ? (
                <div className="space-y-3">
                  {upcomingWeeklyOffs.map((w, i) => (
                    <div
                      key={w.id ?? i}
                      className="flex items-center gap-4 p-3 hover:bg-zinc-50 rounded-2xl transition-all group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-zinc-100 text-zinc-400 flex items-center justify-center shrink-0 group-hover:bg-black group-hover:text-white transition-all">
                        <FiClock size={15} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-zinc-800 leading-tight truncate font-normal">
                          Weekly Off ({w.day})
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-0.5 uppercase font-normal">
                          {format(toDate(w.date), "MMM dd, yyyy")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState>No upcoming weekly offs</EmptyState>
              )}
            </Card>

            <Card
              title="On Leave"
              accent="bg-red-500"
              action={
                <Chip className="bg-zinc-100 text-black">
                  {format(selectedDate, "dd MMM")}
                </Chip>
              }
            >
              {dailyLoading ? (
                <CardLoader />
              ) : dailyData?.leaves?.length > 0 ? (
                <div className="space-y-4">
                  {dailyData.leaves.map((l, i) => (
                    <div
                      key={l.id ?? i}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={l.image || DEFAULT_AVATAR}
                          className="w-9 h-9 rounded-full object-cover border border-zinc-100 shrink-0"
                          alt=""
                        />
                        <div className="min-w-0">
                          <p className="text-zinc-800 leading-tight truncate font-normal">
                            {l.name}
                          </p>
                          <p className="text-[10px] text-zinc-400 uppercase tracking-tight truncate font-normal">
                            {l.designation}
                          </p>
                        </div>
                      </div>
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse shrink-0" />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState>No active leaves</EmptyState>
              )}
            </Card>

            <Card
              title="Planned Events"
              accent="bg-violet-400"
              action={
                <button
                  type="button"
                  onClick={() => openDrawer("all")}
                  className="text-[10px] text-zinc-400 hover:text-black uppercase tracking-wider underline underline-offset-4 cursor-pointer"
                >
                  View All
                </button>
              }
            >
              {dailyLoading ? (
                <CardLoader />
              ) : dailyData?.events?.length > 0 ? (
                <div className="space-y-3">
                  {dailyData.events.map((e, i) => (
                    <button
                      type="button"
                      key={e.id ?? i}
                      onClick={() => openDrawer("detail", e)}
                      className="w-full text-left p-3 bg-zinc-50/70 rounded-2xl border border-transparent hover:border-zinc-200 hover:bg-zinc-50 transition-all cursor-pointer"
                    >
                      <p className="text-zinc-800 mb-2 leading-tight truncate font-normal">
                        {e.title}
                      </p>
                      <span className="flex items-center gap-1.5 text-[10px] text-zinc-400 uppercase font-normal">
                        <FiClock size={12} />
                        {format(toDate(e.start_date), "hh:mm a")}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState>No events planned</EmptyState>
              )}
            </Card>
          </aside>
        </div>
      </div>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: "100%", md: "70vw", lg: "50vw" },
            minWidth: { lg: 720 },
            maxWidth: "100vw",
            boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
          },
        }}
      >
        <div className="p-4 sm:p-6 h-full flex flex-col font-poppins text-[12px]">
          {drawerContent === "create" && (
            <EventCreate
              onClose={() => setDrawerOpen(false)}
              onCreateSuccess={handleInstantRefresh}
            />
          )}
          {drawerContent === "detail" && selectedEvent && (
            <EventDetailPage
              event={selectedEvent}
              onBack={() => setDrawerOpen(false)}
              onDeleteSuccess={handleInstantRefresh}
            />
          )}
          {drawerContent === "all" && (
            <div className="h-full">
              <h3 className="text-[16px] uppercase tracking-wider mb-8 text-black font-normal">
                Archive Explorer
              </h3>
              <AllEvents
                events={allEvents}
                onEventClick={(e) => openDrawer("detail", e)}
              />
            </div>
          )}
        </div>
      </Drawer>
    </DashboardLayout>
  );
}
