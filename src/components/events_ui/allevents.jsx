import React, { useEffect, useState } from "react";
import { fetchEvents } from "../../service/eventservices";

const EventCard = ({ event, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getEventStatus = () => {
    const now = new Date();
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);

    if (now < startDate) return "upcoming";
    if (now > endDate) return "past";
    return "ongoing";
  };

  const statusStyles = {
    upcoming: "bg-violet-300 text-blue-800",
    past: "bg-violet-100 text-gray-800",
  };

  const status = getEventStatus();

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-6 mb-4 transition-all duration-200 cursor-pointer hover:shadow-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick(event)}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-lg text-gray-900">
              {event.title}
            </h4>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status]}`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>

          <p className="text-gray-600 mb-4">{event.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-sm">
                {new Date(event.start_date).toLocaleDateString()} -{" "}
                {new Date(event.end_date).toLocaleDateString()}
              </span>
            </div>

            <div className="flex items-center gap-2 text-gray-600">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm">
                {new Date(event.start_date).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            {event.location && (
              <div className="flex items-center gap-2 text-gray-600">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="text-sm">{event.location}</span>
              </div>
            )}

            {event.attendees && (
              <div className="flex items-center gap-2 text-gray-600">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <span className="text-sm">{event.attendees} attendees</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AllEvents = ({ onEventClick, events: propEvents }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const getEventsData = async () => {
      try {
        // Use propEvents if provided, otherwise fetch events
        if (propEvents) {
          setEvents(propEvents);
          setLoading(false);
        } else {
          const data = await fetchEvents();
          setEvents(data);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching events:", error);
        setLoading(false);
      }
    };

    getEventsData();
  }, [propEvents]);

  const handleEventClick = (event) => {
    if (onEventClick) {
      onEventClick(event);
    }
  };

  const filteredEvents = events.filter((event) => {
    if (filter === "all") return true;
    const now = new Date();
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);

    if (filter === "upcoming") return now < startDate;

    return now > endDate;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className=" bg-gray-50 rounded-xl p-6">
      {/* Sticky Heading */}
      <div className="sticky top-0 z-10 bg-gray-50">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">All Events</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors
                ${filter === "all" ? "bg-gray-900 text-white" : "bg-gray-200 text-gray-600 hover:bg-gray-300"}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("upcoming")}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors
                ${filter === "upcoming" ? "bg-violet-300 text-white" : "bg-gray-200 text-gray-600 hover:bg-gray-300"}`}
            >
              Upcoming
            </button>
          </div>
        </div>
      </div>

      <div className="h-[90vh] overflow-auto">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onClick={handleEventClick}
            />
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No Events Found
            </h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllEvents;
