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

/* ---------- Shared style tokens (match EmployeeModal) ---------- */
const labelCls =
  "block text-[10px] font-normal uppercase tracking-wide text-gray-400 mb-1.5";
const inputCls =
  "w-full bg-[#F8F9FA] text-gray-800 placeholder-gray-300 outline-none border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-normal focus:border-gray-300 focus:bg-white transition-all";
const selectCls = `${inputCls} appearance-none cursor-pointer pr-9 text-gray-600`;
const errorCls = "text-red-500 text-[10px] mt-1 tracking-wide";
const sectionTitleCls =
  "text-[11px] font-normal text-gray-400 mb-5 uppercase tracking-[0.2em]";

const ChevronDownIcon = () => (
  <svg
    className="w-3.5 h-3.5 text-gray-400 pointer-events-none"
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

const Field = ({ label, error, children, className = "" }) => (
  <div className={className}>
    <label className={labelCls}>{label}</label>
    {children}
    {error && <p className={errorCls}>{error}</p>}
  </div>
);

const SelectWrap = ({ children }) => (
  <div className="relative">
    {children}
    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
      <ChevronDownIcon />
    </div>
  </div>
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

// "2026-10-20T10:00:00Z" -> { date: "2026-10-20", time: "10:00" }
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

  const openDatePicker = (ref) => {
    const el = ref.current;
    if (!el) return;
    if (typeof el.showPicker === "function") el.showPicker();
    else el.focus();
  };

  const [formData, setFormData] = useState(() =>
    event ? eventToForm(event) : EMPTY_FORM,
  );

  // Close on Escape (inner drawer first, then the modal)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (drawerOpen) setDrawerOpen(false);
      else if (typeof onClose === "function") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen, onClose]);

  useEffect(() => {
    let isMounted = true;
    fetchTimeZone()
      .then((data) => {
        if (isMounted) setTimeZone(Array.isArray(data) ? data : []);
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
    if (formData.event_type === "offline" && !formData.place)
      newErrors.place = "Place is required for offline events";
    if (formData.event_type === "online" && !formData.link)
      newErrors.link = "Meeting link is required for online events";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);

    const eventPayload = {
      title: formData.title,
      description: formData.description,
      start_date: formatDateTimeWithZone(
        formData.start_date,
        formData.start_time,
      ),
      end_date: formatDateTimeWithZone(formData.end_date, formData.end_time),
      event_type: formData.event_type,
      participation: formData.participation.map((uuid) => ({ uuid })),
      place: formData.event_type === "offline" ? formData.place : "",
      meeting_url: formData.event_type === "online" ? formData.link : "",
      reminder_before: String(formData.when_to_notify),
      time_zone: formData.timezone,
    };

    try {
      if (isEdit) {
        await updateEventApi(event.id, eventPayload);
        toast.success("Event updated successfully");
      } else {
        await createEvent(eventPayload);
        toast.success("Event created successfully");
      }

      if (typeof onCreateSuccess === "function") await onCreateSuccess();
      setFormData(EMPTY_FORM);
      if (typeof onClose === "function") onClose();
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
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <>
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

      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-[480px] max-w-full bg-white z-50 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300 font-poppins font-normal text-black">
        <div className="p-8 relative">
          {/* Close */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 text-gray-300 hover:text-gray-600 transition-colors font-normal cursor-pointer"
            >
              ✕
            </button>
          )}

          {/* Header */}
          <div className="flex items-center gap-3 mb-8 pr-8">
            <div className="w-12 h-12 rounded-full bg-[#F8F9FA] flex items-center justify-center">
              <Icon
                icon="solar:calendar-add-outline"
                className="w-5 h-5 text-gray-600"
              />
            </div>
            <div>
              <h2 className="text-lg font-normal text-gray-900 leading-tight">
                {isEdit ? "Edit Event" : "Create Event"}
              </h2>
              <p className="text-xs font-normal text-gray-400">
                {isEdit
                  ? "Update the event details below"
                  : "Fill in the details to schedule an event"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* ---------- Details ---------- */}
            <h3 className={sectionTitleCls}>Event Details</h3>
            <div className="flex flex-col gap-4 mb-8">
              <Field label="Title" error={errors.title}>
                <input
                  className={inputCls}
                  name="title"
                  placeholder="Event title"
                  value={formData.title}
                  onChange={handleChange}
                />
              </Field>

              <Field label="Description" error={errors.description}>
                <textarea
                  className={`${inputCls} min-h-[80px] resize-none`}
                  name="description"
                  placeholder="Event description"
                  value={formData.description}
                  onChange={handleChange}
                />
              </Field>
            </div>

            {/* ---------- Schedule ---------- */}
            <h3 className={sectionTitleCls}>Schedule</h3>
            <div className="flex flex-col gap-4 mb-8">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Start Date" error={errors.start_date}>
                  <div className="relative">
                    <input
                      ref={startDateRef}
                      type="date"
                      className={`${inputCls} pr-9 uppercase [&::-webkit-calendar-picker-indicator]:hidden`}
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      onClick={() => openDatePicker(startDateRef)}
                      aria-label="Open start date picker"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-black cursor-pointer"
                    >
                      <Icon icon="solar:calendar-outline" className="w-4 h-4" />
                    </button>
                  </div>
                </Field>

                <Field label="Start Time" error={errors.start_time}>
                  <input
                    type="time"
                    className={`${inputCls} uppercase`}
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleChange}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="End Date" error={errors.end_date}>
                  <div className="relative">
                    <input
                      ref={endDateRef}
                      type="date"
                      className={`${inputCls} pr-9 uppercase [&::-webkit-calendar-picker-indicator]:hidden`}
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      onClick={() => openDatePicker(endDateRef)}
                      aria-label="Open end date picker"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-black cursor-pointer"
                    >
                      <Icon icon="solar:calendar-outline" className="w-4 h-4" />
                    </button>
                  </div>
                </Field>

                <Field label="End Time" error={errors.end_time}>
                  <input
                    type="time"
                    className={`${inputCls} uppercase`}
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleChange}
                  />
                </Field>
              </div>

              <Field label="Timezone" error={errors.timezone}>
                <SelectWrap>
                  <select
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleChange}
                    className={selectCls}
                  >
                    <option value="">Select timezone</option>
                    {timeZone.map((tz) => (
                      <option key={tz.id} value={tz.id}>
                        {tz.name}
                      </option>
                    ))}
                  </select>
                </SelectWrap>
              </Field>
            </div>

            {/* ---------- Location & Reminder ---------- */}
            <h3 className={sectionTitleCls}>Location & Reminder</h3>
            <div className="flex flex-col gap-4 mb-8">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Event Type" error={errors.event_type}>
                  <SelectWrap>
                    <select
                      name="event_type"
                      value={formData.event_type}
                      onChange={handleChange}
                      className={selectCls}
                    >
                      <option value="">Select type</option>
                      <option value="online">Online</option>
                      <option value="offline">Offline</option>
                    </select>
                  </SelectWrap>
                </Field>

                <Field label="When to Notify" error={errors.when_to_notify}>
                  <SelectWrap>
                    <select
                      name="when_to_notify"
                      value={formData.when_to_notify}
                      onChange={handleChange}
                      className={selectCls}
                    >
                      <option value="">Select reminder</option>
                      <option value="5">5 minutes before</option>
                      <option value="10">10 minutes before</option>
                      <option value="15">15 minutes before</option>
                      <option value="20">20 minutes before</option>
                      <option value="30">30 minutes before</option>
                    </select>
                  </SelectWrap>
                </Field>
              </div>

              {formData.event_type === "offline" && (
                <Field label="Place" error={errors.place}>
                  <input
                    className={inputCls}
                    name="place"
                    placeholder="Event location"
                    value={formData.place}
                    onChange={handleChange}
                  />
                </Field>
              )}

              {formData.event_type === "online" && (
                <Field label="Meeting Link" error={errors.link}>
                  <input
                    type="url"
                    className={inputCls}
                    name="link"
                    placeholder="https://example.com"
                    value={formData.link}
                    onChange={handleChange}
                  />
                </Field>
              )}
            </div>

            {/* ---------- Participants ---------- */}
            <h3 className={sectionTitleCls}>Participants</h3>
            <div className="flex flex-col gap-4 mb-8">
              <Field label="Participation" error={errors.participation}>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className={`${inputCls} relative flex items-center text-left cursor-pointer pr-9`}
                >
                  <span
                    className={`truncate ${
                      formData.participation.length
                        ? "text-gray-800"
                        : "text-gray-300"
                    }`}
                  >
                    {formData.participation.length > 0
                      ? `${formData.participation.length} selected`
                      : "Select employees"}
                  </span>
                  <span className="absolute inset-y-0 right-3 flex items-center">
                    <ChevronDownIcon />
                  </span>
                </button>
              </Field>

              {formData.participation.length > 0 && (
                <div className="p-3 rounded-2xl border border-gray-100 bg-white shadow-sm">
                  <p className="text-[9px] text-gray-300 uppercase tracking-widest mb-2 font-normal">
                    Selected Employees ({formData.participation.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {formData.participation.map((uuid) => (
                      <div
                        key={uuid}
                        className="flex items-center bg-[#F8F9FA] text-gray-600 px-2.5 py-1 rounded-lg text-[10px] font-normal uppercase tracking-wide"
                      >
                        <span className="truncate max-w-[150px]">{uuid}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveEmployee(uuid)}
                          aria-label="Remove employee"
                          className="ml-1.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <GlowButton type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? isEdit
                  ? "Updating..."
                  : "Creating..."
                : isEdit
                  ? "Update Event"
                  : "Create Event"}
            </GlowButton>
          </form>
        </div>
      </div>

      {/* Nested Employee Selection Drawer (stacks above the main drawer) */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[60] transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="fixed top-0 right-0 h-full w-[480px] max-w-full bg-white z-[70] shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="p-8 relative">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close"
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
    </>
  );
}
