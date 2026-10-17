import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import EventEmployee from "./eventemployee";
import GlowButton from "../helpers/glowbutton";
import {
  createEvent,
  updateEventApi,
  fetchTimeZone,
} from "../../service/eventservices";
import toast, { Toaster } from "react-hot-toast";

const ChevronDownIcon = () => (
  <svg
    className="w-3.5 h-3.5 text-gray-500 pointer-events-none"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
      clipRule="evenodd"
    />
  </svg>
);

const EMPTY_FORM = {
  title: "",
  description: "",
  start_date: "",
  start_time: "",
  end_date: "",
  end_time: "",
  event_type: "",
  participation: [],
  place: "",
  link: "",
  when_to_notify: "",
  timezone: "",
};

// "2026-10-20T10:00:00Z" -> { date: "2026-10-20", time: "10:00" } (same Z-stripping as the calendar)
const splitDateTime = (value) => {
  if (!value) return { date: "", time: "" };
  const clean = value.includes("Z") ? value.split("Z")[0] : value;
  const [date, time = ""] = clean.split("T");
  return { date, time: time.slice(0, 5) };
};

// "00:15:00" or "15" -> "15"
const reminderToMinutes = (value) => {
  if (value === undefined || value === null || value === "") return "";
  const str = String(value);
  if (str.includes(":")) {
    const [h = 0, m = 0] = str.split(":").map(Number);
    return String(h * 60 + m);
  }
  return str;
};

// Maps an existing event (from the API) to the form state
const eventToForm = (event) => {
  const start = splitDateTime(event.start_date);
  const end = splitDateTime(event.end_date);
  return {
    title: event.title || "",
    description: event.description || "",
    start_date: start.date,
    start_time: start.time,
    end_date: end.date,
    end_time: end.time,
    event_type: event.event_type || "",
    participation: (event.participation || [])
      .map((p) => (typeof p === "string" ? p : p.uuid || p.user_id || p.id))
      .filter(Boolean),
    place: event.event_type === "offline" ? event.place || "" : "",
    link: event.meeting_url || "",
    when_to_notify: reminderToMinutes(event.reminder_before),
    timezone: event.time_zone || "",
  };
};

export default function EventCreate({
  event = null,
  onClose,
  onCreateSuccess,
}) {
  const isEdit = Boolean(event?.id);
  const [timeZone, setTimeZone] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startDateRef = useRef(null);
  const endDateRef = useRef(null);

  // Opens the native date picker when the calendar icon is clicked
  const openDatePicker = (ref) => {
    const el = ref.current;
    if (!el) return;
    if (typeof el.showPicker === "function") el.showPicker();
    else el.focus();
  };

  const [formData, setFormData] = useState(() =>
    event ? eventToForm(event) : EMPTY_FORM,
  );

  useEffect(() => {
    let isMounted = true;
    fetchTimeZone()
      .then((data) => {
        if (isMounted) {
          setTimeZone(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {
        if (isMounted) setTimeZone([]);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Edit mode: match the event's time_zone to an option in the dropdown
  useEffect(() => {
    if (!isEdit || !timeZone.length || !formData.timezone) return;
    const match = timeZone.find(
      (tz) =>
        String(tz.id) === String(formData.timezone) ||
        tz.name === formData.timezone,
    );
    if (match && String(match.id) !== String(formData.timezone)) {
      setFormData((prev) => ({ ...prev, timezone: match.id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeZone, isEdit]);

  // "2026-10-20" + "10:00" -> "2026-10-20T10:00:00"
  const formatDateTimeWithZone = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return "";
    const standardTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
    return `${dateStr}T${standardTime}`;
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title) newErrors.title = "Title is required";
    if (!formData.description)
      newErrors.description = "Description is required";
    if (!formData.start_date) newErrors.start_date = "Start Date is required";
    if (!formData.start_time) newErrors.start_time = "Start Time is required";
    if (!formData.end_date) newErrors.end_date = "End Date is required";
    if (!formData.end_time) newErrors.end_time = "End Time is required";
    if (!formData.event_type) newErrors.event_type = "Event type is required";
    if (!formData.timezone)
      newErrors.timezone = "Timezone selection is required";
    if (!formData.when_to_notify)
      newErrors.when_to_notify = "Notification timing is required";

    if (formData.event_type === "offline" && !formData.place) {
      newErrors.place = "Place is required for offline events";
    }
    if (formData.event_type === "online" && !formData.link) {
      newErrors.link = "Meeting link is required for online events";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);

    const startDateTime = formatDateTimeWithZone(
      formData.start_date,
      formData.start_time,
    );
    const endDateTime = formatDateTimeWithZone(
      formData.end_date,
      formData.end_time,
    );

    const participationArray = formData.participation.map((uuid) => ({ uuid }));

    // Matches the API body:
    // { title, description, start_date, end_date, event_type, participation,
    //   place, meeting_url, reminder_before, time_zone }
    const eventPayload = {
      title: formData.title,
      description: formData.description,
      start_date: startDateTime,
      end_date: endDateTime,
      event_type: formData.event_type,
      participation: participationArray,
      place: formData.event_type === "offline" ? formData.place : "",
      meeting_url: formData.event_type === "online" ? formData.link : "",
      reminder_before: String(formData.when_to_notify), // e.g. "15"
      time_zone: formData.timezone, // e.g. "Asia/Kolkata"
    };

    try {
      if (isEdit) {
        await updateEventApi(event.id, eventPayload);
        toast.success("Event updated successfully");
      } else {
        await createEvent(eventPayload);
        toast.success("Event created successfully");
      }

      if (typeof onCreateSuccess === "function") {
        await onCreateSuccess();
      }

      setFormData(EMPTY_FORM);

      if (typeof onClose === "function") {
        onClose();
      }
    } catch {
      toast.error(
        isEdit
          ? "Error updating event. Please Try Again"
          : "Error creating event. Please Try Again",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmployeeToggle = (uuid) => {
    setFormData((prev) => ({
      ...prev,
      participation: prev.participation.includes(uuid)
        ? prev.participation.filter((id) => id !== uuid)
        : [...prev.participation, uuid],
    }));
  };

  const handleRemoveEmployee = (uuidToRemove) => {
    setFormData((prev) => ({
      ...prev,
      participation: prev.participation.filter((id) => id !== uuidToRemove),
    }));
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="h-full p-4 bg-white font-poppins font-normal text-black overflow-y-auto relative text-[12px]">
      <Toaster
        position="top-right"
        reverseOrder={false}
        containerStyle={{
          position: "fixed",
          zIndex: 999999,
          top: "24px",
          right: "24px",
        }}
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: "12px",
            background: "#FFFFFF",
            color: "#000000",
            fontSize: "14px",
            padding: "12px 20px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          },
        }}
      />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl text-black font-normal uppercase tracking-wider">
          {isEdit ? "Edit Event" : "Create Event"}
        </h1>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-lg transition-colors cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-[11px] font-normal uppercase tracking-wider text-gray-500 mb-1.5">
            Title
          </label>
          <input
            className="w-full bg-transparent text-gray-800 placeholder-gray-400 outline-none border border-gray-200 rounded-lg px-3 py-2 text-xs focus:border-gray-400 transition-all font-normal"
            name="title"
            placeholder="Event title"
            value={formData.title}
            onChange={handleChange}
          />
          {errors.title && (
            <p className="text-red-500 text-[10px] mt-1 tracking-wide">
              {errors.title}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-[11px] font-normal uppercase tracking-wider text-gray-500 mb-1.5">
            Description
          </label>
          <textarea
            className="w-full bg-transparent text-gray-800 placeholder-gray-400 outline-none border border-gray-200 rounded-lg px-3 py-2 text-xs focus:border-gray-400 transition-all font-normal min-h-[70px]"
            name="description"
            placeholder="Event description"
            value={formData.description}
            onChange={handleChange}
          />
          {errors.description && (
            <p className="text-red-500 text-[10px] mt-1 tracking-wide">
              {errors.description}
            </p>
          )}
        </div>

        {/* Start Date & Time */}
        <div className="flex space-x-4">
          <div className="w-1/2">
            <label className="block text-[11px] font-normal uppercase tracking-wider text-gray-500 mb-1.5">
              Start Date
            </label>
            <div className="relative">
              <input
                ref={startDateRef}
                type="date"
                className="w-full bg-transparent text-gray-800 outline-none border border-gray-200 rounded-lg px-3 py-2 pr-8 text-xs focus:border-gray-400 transition-all font-normal uppercase [&::-webkit-calendar-picker-indicator]:hidden"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={() => openDatePicker(startDateRef)}
                aria-label="Open start date picker"
                className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-800 hover:text-black cursor-pointer"
              >
                <Icon icon="solar:calendar-outline" className="w-4 h-4" />
              </button>
            </div>
            {errors.start_date && (
              <p className="text-red-500 text-[10px] mt-1 tracking-wide">
                {errors.start_date}
              </p>
            )}
          </div>

          <div className="w-1/2">
            <label className="block text-[11px] font-normal uppercase tracking-wider text-gray-500 mb-1.5">
              Start Time
            </label>
            <input
              type="time"
              className="w-full bg-transparent text-gray-800 outline-none border border-gray-200 rounded-lg px-3 py-2 text-xs focus:border-gray-400 transition-all font-normal uppercase"
              name="start_time"
              value={formData.start_time}
              onChange={handleChange}
            />
            {errors.start_time && (
              <p className="text-red-500 text-[10px] mt-1 tracking-wide">
                {errors.start_time}
              </p>
            )}
          </div>
        </div>

        {/* End Date & Time */}
        <div className="flex space-x-4">
          <div className="w-1/2">
            <label className="block text-[11px] font-normal uppercase tracking-wider text-gray-500 mb-1.5">
              End Date
            </label>
            <div className="relative">
              <input
                ref={endDateRef}
                type="date"
                className="w-full bg-transparent text-gray-800 outline-none border border-gray-200 rounded-lg px-3 py-2 pr-8 text-xs focus:border-gray-400 transition-all font-normal uppercase [&::-webkit-calendar-picker-indicator]:hidden"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={() => openDatePicker(endDateRef)}
                aria-label="Open end date picker"
                className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-800 hover:text-black cursor-pointer"
              >
                <Icon icon="solar:calendar-outline" className="w-4 h-4" />
              </button>
            </div>
            {errors.end_date && (
              <p className="text-red-500 text-[10px] mt-1 tracking-wide">
                {errors.end_date}
              </p>
            )}
          </div>

          <div className="w-1/2">
            <label className="block text-[11px] font-normal uppercase tracking-wider text-gray-500 mb-1.5">
              End Time
            </label>
            <input
              type="time"
              className="w-full bg-transparent text-gray-800 outline-none border border-gray-200 rounded-lg px-3 py-2 text-xs focus:border-gray-400 transition-all font-normal uppercase"
              name="end_time"
              value={formData.end_time}
              onChange={handleChange}
            />
            {errors.end_time && (
              <p className="text-red-500 text-[10px] mt-1 tracking-wide">
                {errors.end_time}
              </p>
            )}
          </div>
        </div>

        {/* Event Type */}
        <div>
          <label className="block text-[11px] font-normal uppercase tracking-wider text-gray-500 mb-1.5">
            Event Type
          </label>
          <div className="relative">
            <select
              name="event_type"
              value={formData.event_type}
              onChange={handleChange}
              className="w-full appearance-none bg-transparent text-gray-600 tracking-widest uppercase outline-none cursor-pointer border border-gray-200 rounded-lg px-3 py-2 pr-8 text-xs focus:ring-0 font-normal"
            >
              <option value="">Select event type</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
              <ChevronDownIcon />
            </div>
          </div>
          {errors.event_type && (
            <p className="text-red-500 text-[10px] mt-1 tracking-wide">
              {errors.event_type}
            </p>
          )}
        </div>

        {/* Participation & Notify Container */}
        <div className="flex space-x-4">
          <div className="w-1/2">
            <label className="block text-[11px] font-normal uppercase tracking-wider text-gray-500 mb-1.5">
              Participation
            </label>
            <div className="relative">
              <div
                className="w-full bg-transparent text-gray-600 tracking-widest uppercase outline-none cursor-pointer border border-gray-200 rounded-lg px-3 py-2 pr-8 text-xs focus:ring-0 font-normal flex items-center justify-between"
                onClick={() => setDrawerOpen(true)}
              >
                <span className="truncate">
                  {formData.participation.length > 0
                    ? `${formData.participation.length} selected`
                    : "Select employees"}
                </span>
              </div>
              <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
                <ChevronDownIcon />
              </div>
            </div>
            {errors.participation && (
              <p className="text-red-500 text-[10px] mt-1 tracking-wide">
                {errors.participation}
              </p>
            )}
          </div>

          {/* Nested Employee Selection Drawer */}
          {drawerOpen && (
            <>
              <div
                className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 transition-opacity"
                onClick={() => setDrawerOpen(false)}
              />
              <div className="fixed top-0 right-0 h-full w-[480px] bg-white z-50 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
                <div className="p-8 relative">
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    className="absolute top-4 right-4 text-gray-300 hover:text-gray-600 transition-colors font-normal cursor-pointer"
                  >
                    ✕
                  </button>
                  <EventEmployee
                    onBack={() => setDrawerOpen(false)}
                    onClose={() => setDrawerOpen(false)}
                    selectedEmployees={formData.participation}
                    onEmployeeToggle={handleEmployeeToggle}
                  />
                </div>
              </div>
            </>
          )}

          {/* When to Notify Dropdown */}
          <div className="w-1/2">
            <label className="block text-[11px] font-normal uppercase tracking-wider text-gray-500 mb-1.5">
              When to Notify
            </label>
            <div className="relative">
              <select
                name="when_to_notify"
                value={formData.when_to_notify}
                onChange={handleChange}
                className="w-full appearance-none bg-transparent text-gray-600 tracking-widest uppercase outline-none cursor-pointer border border-gray-200 rounded-lg px-3 py-2 pr-8 text-xs focus:ring-0 font-normal"
              >
                <option value="">Select reminder time</option>
                <option value="5">5 minutes before</option>
                <option value="10">10 minutes before</option>
                <option value="15">15 minutes before</option>
                <option value="20">20 minutes before</option>
                <option value="30">30 minutes before</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
                <ChevronDownIcon />
              </div>
            </div>
            {errors.when_to_notify && (
              <p className="text-red-500 text-[10px] mt-1 tracking-wide">
                {errors.when_to_notify}
              </p>
            )}
          </div>
        </div>

        {/* Selected Employees Data Preview */}
        {formData.participation.length > 0 && (
          <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100 mt-2">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2 font-normal">
              Selected Employees ({formData.participation.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {formData.participation.map((uuid) => (
                <div
                  key={uuid}
                  className="flex items-center bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg text-[10px] font-normal uppercase tracking-wide"
                >
                  <span className="truncate max-w-[150px]">{uuid}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveEmployee(uuid)}
                    className="ml-1.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conditional Fields: Place/Link and Timezone Layout */}
        <div className="flex space-x-4">
          {formData.event_type === "offline" && (
            <div className="w-1/2">
              <label className="block text-[11px] font-normal uppercase tracking-wider text-gray-500 mb-1.5">
                Place
              </label>
              <input
                className="w-full bg-transparent text-gray-800 placeholder-gray-400 outline-none border border-gray-200 rounded-lg px-3 py-2 text-xs focus:border-gray-400 transition-all font-normal"
                name="place"
                placeholder="Event location"
                value={formData.place}
                onChange={handleChange}
              />
              {errors.place && (
                <p className="text-red-500 text-[10px] mt-1 tracking-wide">
                  {errors.place}
                </p>
              )}
            </div>
          )}

          {formData.event_type === "online" && (
            <div className="w-1/2">
              <label className="block text-[11px] font-normal uppercase tracking-wider text-gray-500 mb-1.5">
                Meeting Link
              </label>
              <input
                type="url"
                className="w-full bg-transparent text-gray-800 placeholder-gray-400 outline-none border border-gray-200 rounded-lg px-3 py-2 text-xs focus:border-gray-400 transition-all font-normal"
                name="link"
                placeholder="https://example.com"
                value={formData.link}
                onChange={handleChange}
              />
              {errors.link && (
                <p className="text-red-500 text-[10px] mt-1 tracking-wide">
                  {errors.link}
                </p>
              )}
            </div>
          )}

          <div className={formData.event_type ? "w-1/2" : "w-full"}>
            <label className="block text-[11px] font-normal uppercase tracking-wider text-gray-500 mb-1.5">
              Timezone
            </label>
            <div className="relative">
              <select
                name="timezone"
                value={formData.timezone}
                onChange={handleChange}
                className="w-full appearance-none bg-transparent text-gray-600 tracking-widest uppercase outline-none cursor-pointer border border-gray-200 rounded-lg px-3 py-2 pr-8 text-xs focus:ring-0 font-normal"
              >
                <option value="">Select timezone</option>
                {timeZone.map((tz) => (
                  <option key={tz.id} value={tz.id}>
                    {tz.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
                <ChevronDownIcon />
              </div>
            </div>
            {errors.timezone && (
              <p className="text-red-500 text-[10px] mt-1 tracking-wide">
                {errors.timezone}
              </p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <GlowButton type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? isEdit
                ? "Updating..."
                : "Creating..."
              : isEdit
                ? "Update Event"
                : "Create Event"}
          </GlowButton>
        </div>
      </form>
    </div>
  );
}
