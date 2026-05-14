import React, { useState, useEffect, useMemo } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  FiBell,
  FiPlus,
  FiCalendar,
  FiClock,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { Drawer } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

// Layout & UI
import DashboardLayout from "../ui/pagelayout";
import EventCreate from "../components/events_ui/createevent";
import EventDetailPage from "../components/events_ui/eventdetailpage";
import AllEvents from "../components/events_ui/allevents";

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

const eventColors = {
  meeting: "#c4b5fd",
  training: "#6366f1",
  deadline: "#f59e0b",
  social: "#8b5cf6",
  other: "#c7d2fe",
  leave: "#ef4444",
  holiday: "#22c55e",
  weeklyOff: "#64748b",
};

const DEFAULT_AVATAR = "/person_img.jpg";

const CustomToolbar = (props) => (
  <div className="flex justify-between items-center mb-6 p-2 font-poppins text-[12px]">
    <div className="flex items-center space-x-3">
      <button
        onClick={() => props.onNavigate("PREV")}
        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <FiChevronLeft className="w-4 h-4 text-gray-600" />
      </button>
      <span className="min-w-[150px] text-center uppercase tracking-widest text-gray-800 font-normal">
        {moment(props.date).format("MMMM YYYY")}
      </span>
      <button
        onClick={() => props.onNavigate("NEXT")}
        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <FiChevronRight className="w-4 h-4 text-gray-600" />
      </button>
      <button
        onClick={() => props.onNavigate("TODAY")}
        className="ml-4 px-4 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all uppercase tracking-widest font-normal"
      >
        Today
      </button>
    </div>
  </div>
);

export default function Events({ userId, userName }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerContent, setDrawerContent] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), "MM"));
  const [currentYear, setCurrentYear] = useState(format(new Date(), "yyyy"));
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    getBranchData().then((data) =>
      setBranches(Array.isArray(data) ? data : []),
    );
  }, []);

  const { data: allEvents = [] } = useQuery({
    queryKey: ["allEvents", currentMonth, currentYear],
    queryFn: () => fetchEvents(currentMonth, currentYear),
  });

  const { data: allLeaves = [] } = useQuery({
    queryKey: ["allLeaves", currentMonth, currentYear],
    queryFn: () => fetchMonthlyLeaves(currentMonth, currentYear),
  });

  const { data: holidays = [] } = useQuery({
    queryKey: ["holidays", currentYear, selectedBranch],
    queryFn: () =>
      selectedBranch !== "all"
        ? fetchHolidaysByBranch(selectedBranch)
        : fetchAllHolidays(),
  });

  const { data: weeklyOffs = [] } = useQuery({
    queryKey: ["weeklyOffs", currentYear, selectedBranch],
    queryFn: () =>
      selectedBranch !== "all"
        ? getWeeklyOffByBranch(currentYear, selectedBranch)
        : getWeeklyOffByYear(currentYear),
    placeholderData: (prev) => prev,
  });

  const { data: dailyData } = useQuery({
    queryKey: ["dailyDetails", moment(selectedDate).format("YYYY-MM-DD")],
    queryFn: () => fetchDailyDetails(moment(selectedDate).format("YYYY-MM-DD")),
  });

  const calendarEvents = useMemo(() => {
    const events = (Array.isArray(allEvents) ? allEvents : []).map((e) => ({
      ...e,
      start: new Date(e.start_date),
      end: new Date(e.end_date),
      isEvent: true,
    }));

    const leaves = (
      allLeaves?.flatMap((l) =>
        (l.leave_date || []).map((d) => ({
          id: `leave-${d.id}`,
          title: `${l.name} on leave`,
          start: new Date(d.date),
          end: new Date(d.date),
          allDay: true,
          isLeave: true,
          status: l.status,
        })),
      ) || []
    ).filter((l) => l.status === "Approved");

    const holidayList = (Array.isArray(holidays) ? holidays : []).map((h) => ({
      id: `h-${h.id || Math.random()}`,
      title: h.Reason || h.title || "Holiday",
      start: new Date(h.date),
      end: new Date(h.date),
      allDay: true,
      isHoliday: true,
    }));

    const weeklyOffList = (Array.isArray(weeklyOffs) ? weeklyOffs : []).map(
      (w) => ({
        id: `woff-${w.id || Math.random()}`,
        title: `Weekly Off`,
        start: new Date(w.date),
        end: new Date(w.date),
        allDay: true,
        isWeeklyOff: true,
      }),
    );

    return [...events, ...leaves, ...holidayList, ...weeklyOffList];
  }, [allEvents, allLeaves, holidays, weeklyOffs]);

  const handleNavigate = (newDate) => {
    setCalendarDate(newDate);
    setCurrentMonth(format(newDate, "MM"));
    setCurrentYear(format(newDate, "yyyy"));
  };

  const openDrawer = (content, event = null) => {
    setDrawerContent(content);
    setSelectedEvent(event);
    setDrawerOpen(true);
  };

  return (
    <DashboardLayout userName={userName || "Admin"}>
      <div className="flex justify-between items-center mb-8 font-poppins px-3">
        <div>
          <h1 className="text-[16px] text-gray-900 uppercase tracking-widest font-normal">
            Operation Center
          </h1>
          <p className="text-[10px] text-gray-400 tracking-widest uppercase mt-1 font-normal">
            Schedule & Availability
          </p>
        </div>
        <div className="flex items-center gap-6 text-[12px]">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="bg-transparent text-gray-600 tracking-widest uppercase outline-none cursor-pointer border-none focus:ring-0 font-normal"
          >
            <option value="all">All Branches</option>
            {branches.map((b) => (
              <option key={b.id || b.value} value={b.id || b.value}>
                {b.name || b.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => openDrawer("create")}
            className="flex items-center gap-2 bg-black text-white px-5 py-2 rounded-xl tracking-widest hover:bg-gray-800 transition-all uppercase font-normal"
          >
            <FiPlus size={14} /> New Event
          </button>
          <div className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center bg-white cursor-pointer hover:bg-gray-50 transition-colors">
            <FiBell size={18} className="text-gray-600" />
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-180px)] font-poppins text-[12px]">
        <div className="flex-1 bg-white rounded-[32px] shadow-sm border border-gray-100 p-6 overflow-hidden flex flex-col">
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            date={calendarDate}
            onNavigate={handleNavigate}
            onSelectSlot={(slot) => setSelectedDate(slot.start)}
            onSelectEvent={(e) => openDrawer("detail", e)}
            selectable
            popup
            components={{ toolbar: CustomToolbar }}
            eventPropGetter={(event) => ({
              style: {
                backgroundColor: event.isHoliday
                  ? eventColors.holiday
                  : event.isWeeklyOff
                    ? eventColors.weeklyOff
                    : event.isLeave
                      ? eventColors.leave
                      : eventColors.meeting,
                borderRadius: "6px",
                border: "none",
                color: "white",
                padding: "4px 8px",
                fontSize: "10px",
                fontFamily: "Poppins",
                fontWeight: "400",
              },
            })}
            dayPropGetter={(date) =>
              moment(date).isSame(moment(), "day")
                ? {
                    style: {
                      backgroundColor: "#f8fbff",
                      borderTop: "2px solid #000",
                    },
                  }
                : {}
            }
            style={{ flex: 1 }}
          />
        </div>

        <div className="w-full lg:w-[380px] space-y-6 overflow-y-auto pr-2 custom-scrollbar">
          {/* Holidays */}
          <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
            <h3 className="tracking-widest uppercase text-gray-400 mb-5 flex items-center gap-2 font-normal">
              <div className="w-1 h-3 bg-green-500 rounded-full" /> Upcoming
              Holidays
            </h3>
            <div className="space-y-4">
              {holidays
                ?.filter((h) => moment(h.date).isSameOrAfter(moment(), "day"))
                .slice(0, 2)
                .map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-3 bg-gray-50/50 rounded-2xl"
                  >
                    <FiCalendar className="text-green-500" />
                    <div>
                      <p className="text-gray-800 leading-tight font-normal">
                        {h.title || h.Reason}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5 uppercase font-normal">
                        {format(new Date(h.date), "dd MMM, yyyy")}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          {/* Weekly Offs */}
          <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
            <h3 className="tracking-widest uppercase text-gray-400 mb-5 flex items-center gap-2 font-normal">
              <div className="w-1 h-3 bg-gray-400 rounded-full" /> Weekly Offs
            </h3>
            <div className="space-y-3">
              {weeklyOffs
                ?.filter((w) => moment(w.date).isSameOrAfter(moment(), "day"))
                .slice(0, 2)
                .map((w, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-2xl transition-all group"
                  >
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white transition-all">
                      <FiClock size={14} />
                    </div>
                    <div>
                      <p className="text-gray-800 leading-none mb-1 font-normal">
                        Weekly Off ({w.day})
                      </p>
                      <p className="text-[10px] text-gray-400 uppercase font-normal">
                        {format(new Date(w.date), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          {/* Leaves */}
          <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-6 font-normal">
              <h3 className="tracking-widest uppercase text-gray-400">
                On Leave
              </h3>
              <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase font-normal">
                {format(selectedDate, "dd MMM")}
              </span>
            </div>
            <div className="space-y-4">
              {dailyData?.leaves?.length > 0 ? (
                dailyData.leaves.map((l, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={l.image || DEFAULT_AVATAR}
                        className="w-8 h-8 rounded-full object-cover border border-gray-50"
                        alt=""
                      />
                      <div>
                        <p className="text-gray-800 leading-none font-normal">
                          {l.name}
                        </p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-tighter font-normal">
                          {l.designation}
                        </p>
                      </div>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-red-400 animate-pulse" />
                  </div>
                ))
              ) : (
                <p className="text-gray-300 italic text-center py-2 font-normal">
                  No active leaves
                </p>
              )}
            </div>
          </div>
          {/* Planned Events */}
          <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-6 font-normal">
              <h3 className="tracking-widest uppercase text-gray-400">
                Planned Events
              </h3>
              <button
                onClick={() => openDrawer("all")}
                className="text-[10px] text-gray-400 hover:text-black uppercase underline underline-offset-4"
              >
                View All
              </button>
            </div>
            <div className="space-y-4">
              {dailyData?.events?.length > 0 ? (
                dailyData.events.map((e, i) => (
                  <div
                    key={i}
                    onClick={() => openDrawer("detail", e)}
                    className="p-3 bg-gray-50/50 rounded-xl hover:bg-gray-50 cursor-pointer transition-all border border-transparent hover:border-gray-200"
                  >
                    <p className="text-gray-800 mb-2 leading-tight font-normal">
                      {e.title}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-gray-400 uppercase font-normal">
                      <span className="flex items-center gap-1">
                        <FiClock size={12} />{" "}
                        {format(new Date(e.start_date), "hh:mm a")}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-300 italic text-center py-2 font-normal">
                  No events planned
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          className: "w-[549px] rounded-l-[40px] shadow-2xl border-none",
        }}
      >
        <div className="p-6  h-full flex flex-col font-poppins text-[12px]">
          {drawerContent === "create" && (
            <EventCreate onClose={() => setDrawerOpen(false)} />
          )}
          {drawerContent === "detail" && selectedEvent && (
            <EventDetailPage
              event={selectedEvent}
              onBack={() => setDrawerOpen(false)}
            />
          )}
          {drawerContent === "all" && (
            <div className="h-full">
              <h3 className="text-[16px] uppercase tracking-tighter mb-10 text-gray-900 font-normal">
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
