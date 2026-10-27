import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import EventEmployee from "./eventemployee";
import GlowButton from "../helpers/glowbutton";
import { updateEventApi, fetchTimeZone } from "../../service/eventservices";
import announceService from "../../service/announceService";

/* ---------- styles ---------- */
const labelCls =
  "block text-[11px] font-normal uppercase tracking-wider text-gray-500 mb-1.5";
const inputCls =
  "w-full bg-transparent text-gray-800 placeholder-gray-400 outline-none border border-gray-200 rounded-lg px-3 py-2 text-xs focus:border-gray-400 transition-all font-normal";
const selectCls =
  "w-full bg-transparent text-gray-600 tracking-widest uppercase outline-none cursor-pointer border border-gray-200 rounded-lg px-3 py-2 text-xs font-normal";
const errCls = "text-red-500 text-[10px] mt-1 tracking-wide";

const REMINDER_OPTIONS = ["5", "10", "15", "20", "30"];

/* ---------- helpers ---------- */

// "2026-10-21T10:00:00Z" -> { date: "2026-10-21", time: "10:00" }
const splitDateTime = (value) => {
  if (!value) return { date: "", time: "" };
  const clean = value.includes("Z") ? value.split("Z")[0] : value;
  const [date, time = ""] = clean.split("T");
  return { date, time: time.slice(0, 5) };
};

// "15" | "00:15:00" | "15m0s" | "1h0m0s" | 900000000000 (ns) -> "15" (minutes)
const reminderToMinutes = (v) => {
  if (v === undefined || v === null || v === "") return "";
  const s = String(v).trim();

  // HH:MM:SS or MM:SS
  if (s.includes(":")) {
    const parts = s.split(":").map(Number);
    const [h, m] = parts.length === 3 ? parts : [0, parts[0] || 0];
    return String((h || 0) * 60 + (m || 0));
  }

  // Go duration, e.g. "15m0s", "1h30m0s"
  const go = s.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+(?:\.\d+)?)s)?$/);
  if (go && (go[1] || go[2] || go[3])) {
    return String(Number(go[1] || 0) * 60 + Number(go[2] || 0));
  }

  // plain number
  if (/^\d+$/.test(s)) {
    const n = Number(s);
    // very large numbers are nanoseconds from a Go time.Duration
    return String(n >= 60_000_000_000 ? Math.round(n / 60_000_000_000) : n);
  }

  return "";
};

// "2026-10-21" + "10:00" -> "2026-10-21T10:00:00"
const toApiDate = (d, t) => `${d}T${t.length === 5 ? `${t}:00` : t}`;

// Pull the most useful message out of an API error
const getErrorMessage = (err, fallback) => {
  const body = err?.response?.data ?? err?.data ?? err;
  const detail = typeof body?.data === "string" ? body.data : "";
  const msg = typeof body?.message === "string" ? body.message : "";
  if (msg && detail) return `${msg}: ${detail}`;
  return detail || msg || err?.message || fallback;
};

// Maps the event object to the form state
const eventToForm = (event) => {
  const start = splitDateTime(event.start_date || event.start);
  const end = splitDateTime(event.end_date || event.end);
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
    place: event.place || "",
    link: event.meeting_url || "",
    when_to_notify: reminderToMinutes(event.reminder_before),
    // may be a name ("Asia/Kolkata") or an id; resolved to an id once the list loads
    timezone: String(
      event.time_zone_id ?? event.time_zone ?? event.timezone ?? "",
    ),
  };
};

/* ---------- component ---------- */

export default function EventEdit({ event, onClose, onUpdateSuccess }) {
  const [formData, setFormData] = useState(() => eventToForm(event));
  const [timeZones, setTimeZones] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [staffLoaded, setStaffLoaded] = useState(false);
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

  // Load timezones (handles both a bare array and { data: [...] })
  useEffect(() => {
    let mounted = true;
    fetchTimeZone()
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.data;
        if (mounted) setTimeZones(Array.isArray(list) ? list : []);
      })
      .catch(() => mounted && setTimeZones([]));
    return () => {
      mounted = false;
    };
  }, []);

  // Once timezones load, convert the event's timezone (name or id) to an id
  useEffect(() => {
    if (!timeZones.length || !formData.timezone) return;

    const current = String(formData.timezone);
    const match = timeZones.find(
      (tz) => String(tz.id) === current || tz.name === current,
    );

    if (match && String(match.id) !== current) {
      setFormData((p) => ({ ...p, timezone: String(match.id) }));
    }
  }, [timeZones]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load employees (used for the select box and the selected chips)
  useEffect(() => {
    let mounted = true;
    const loadStaff = async () => {
      try {
        const response = await announceService.fetchStaff();
        if (mounted && response?.data) setStaffList(response.data);
      } catch (err) {
        console.error("Failed to fetch employees:", err);
        toast.error(getErrorMessage(err, "Failed to load employees"));
      } finally {
        if (mounted) setStaffLoaded(true);
      }
    };
    loadStaff();
    return () => {
      mounted = false;
    };
  }, []);

  const getEmployee = (uuid) => staffList.find((s) => s.uuid === uuid);

  // Employees not yet added to the event (feeds the select box)
  const availableStaff = staffList.filter(
    (s) => !formData.participation.includes(s.uuid),
  );

  // Standard reminder options, plus the event's current value if it's custom
  const reminderOptions =
    formData.when_to_notify &&
    !REMINDER_OPTIONS.includes(formData.when_to_notify)
      ? [...REMINDER_OPTIONS, formData.when_to_notify].sort(
          (a, b) => Number(a) - Number(b),
        )
      : REMINDER_OPTIONS;

  /* ---------- handlers ---------- */

  const handleChange = (e) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleEmployeeToggle = (uuid) =>
    setFormData((p) => ({
      ...p,
      participation: p.participation.includes(uuid)
        ? p.participation.filter((id) => id !== uuid)
        : [...p.participation, uuid],
    }));

  const handleRemoveEmployee = (uuid) =>
    setFormData((p) => ({
      ...p,
      participation: p.participation.filter((id) => id !== uuid),
    }));

  // Add a new employee from the select box
  const handleAddEmployee = (e) => {
    const uuid = e.target.value;
    if (!uuid) return;
    setFormData((p) =>
      p.participation.includes(uuid)
        ? p
        : { ...p, participation: [...p.participation, uuid] },
    );
  };

  const validate = () => {
    const e = {};
    if (!formData.title.trim()) e.title = "Title is required";
    if (!formData.description.trim()) e.description = "Description is required";
    if (!formData.start_date) e.start_date = "Start date is required";
    if (!formData.start_time) e.start_time = "Start time is required";
    if (!formData.end_date) e.end_date = "End date is required";
    if (!formData.end_time) e.end_time = "End time is required";
    if (!formData.event_type) e.event_type = "Event type is required";
    if (!formData.timezone) e.timezone = "Timezone is required";
    else if (Number.isNaN(Number(formData.timezone)))
      e.timezone = "Please select a timezone from the list";
    if (!formData.when_to_notify) e.when_to_notify = "Reminder is required";
    else if (!/^\d+$/.test(String(formData.when_to_notify)))
      e.when_to_notify = "Please select a reminder time";
    if (formData.event_type === "offline" && !formData.place.trim())
      e.place = "Place is required for offline events";
    if (formData.event_type === "online" && !formData.link.trim())
      e.link = "Meeting link is required for online events";

    if (
      formData.start_date &&
      formData.start_time &&
      formData.end_date &&
      formData.end_time &&
      `${formData.end_date}T${formData.end_time}` <=
        `${formData.start_date}T${formData.start_time}`
    ) {
      e.end_time = "End must be after start";
    }

    setErrors(e);

    const hasErrors = Object.keys(e).length > 0;
    if (hasErrors) toast.error("Please fix the highlighted fields");
    return !hasErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      start_date: toApiDate(formData.start_date, formData.start_time),
      end_date: toApiDate(formData.end_date, formData.end_time),
      event_type: formData.event_type,
      participation: formData.participation.map((uuid) => ({ uuid })),
      place: formData.event_type === "offline" ? formData.place.trim() : "",
      meeting_url: formData.event_type === "online" ? formData.link.trim() : "",
      reminder_before: String(formData.when_to_notify), // minutes, e.g. "15"
      time_zone: String(formData.timezone), // string containing the numeric ID, e.g. "1"
    };

    setIsSubmitting(true);
    try {
      await updateEventApi(event.id || event._id, payload);
      toast.success("Event updated successfully");
      await onUpdateSuccess?.();
      onClose?.();
    } catch (err) {
      console.error("Update failed:", err);
      toast.error(
        getErrorMessage(err, "Error updating event. Please try again"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------- field renderers (plain functions, not components,
       so inputs are not remounted on every keystroke) ---------- */

  const renderDateField = (label, name, refEl) => (
    <div className="w-1/2">
      <label className={labelCls}>{label}</label>
      <div className="relative">
        <input
          ref={refEl}
          type="date"
          name={name}
          value={formData[name]}
          onChange={handleChange}
          className={`${inputCls} pr-8 uppercase [&::-webkit-calendar-picker-indicator]:hidden`}
        />
        <button
          type="button"
          onClick={() => openDatePicker(refEl)}
          aria-label={`Open ${label} picker`}
          className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-800 hover:text-black cursor-pointer"
        >
          <Icon icon="solar:calendar-outline" className="w-4 h-4" />
        </button>
      </div>
      {errors[name] && <p className={errCls}>{errors[name]}</p>}
    </div>
  );

  const renderTimeField = (label, name) => (
    <div className="w-1/2">
      <label className={labelCls}>{label}</label>
      <input
        type="time"
        name={name}
        value={formData[name]}
        onChange={handleChange}
        className={`${inputCls} uppercase`}
      />
      {errors[name] && <p className={errCls}>{errors[name]}</p>}
    </div>
  );

  /* ---------- render ---------- */

  return (
    <div className="h-full p-4 bg-white font-poppins font-normal text-black overflow-y-auto relative text-[12px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl text-black font-normal uppercase tracking-wider">
          Edit Event
        </h1>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 text-lg transition-colors cursor-pointer"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className={labelCls}>Title</label>
          <input
            className={inputCls}
            name="title"
            placeholder="Event title"
            value={formData.title}
            onChange={handleChange}
          />
          {errors.title && <p className={errCls}>{errors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <label className={labelCls}>Description</label>
          <textarea
            className={`${inputCls} min-h-[70px]`}
            name="description"
            placeholder="Event description"
            value={formData.description}
            onChange={handleChange}
          />
          {errors.description && <p className={errCls}>{errors.description}</p>}
        </div>

        {/* Start Date & Time */}
        <div className="flex space-x-4">
          {renderDateField("Start Date", "start_date", startDateRef)}
          {renderTimeField("Start Time", "start_time")}
        </div>

        {/* End Date & Time */}
        <div className="flex space-x-4">
          {renderDateField("End Date", "end_date", endDateRef)}
          {renderTimeField("End Time", "end_time")}
        </div>

        {/* Event Type */}
        <div>
          <label className={labelCls}>Event Type</label>
          <select
            name="event_type"
            value={formData.event_type}
            onChange={handleChange}
            className={selectCls}
          >
            <option value="">Select event type</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>
          {errors.event_type && <p className={errCls}>{errors.event_type}</p>}
        </div>

        {/* Participation & Notify */}
        <div className="flex space-x-4">
          <div className="w-1/2">
            <label className={labelCls}>Participation</label>

            {/* Quick-add select box */}
            <select
              value=""
              onChange={handleAddEmployee}
              className={selectCls}
              disabled={!staffLoaded || availableStaff.length === 0}
            >
              <option value="">
                {!staffLoaded
                  ? "Loading employees..."
                  : availableStaff.length === 0
                    ? "All employees added"
                    : "Add employee"}
              </option>
              {availableStaff.map((s) => (
                <option key={s.uuid} value={s.uuid}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Drawer for bulk selection */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="mt-1.5 text-[10px] uppercase tracking-wider text-gray-500 hover:text-black cursor-pointer"
            >
              {formData.participation.length} selected · Browse all
            </button>
          </div>

          <div className="w-1/2">
            <label className={labelCls}>When to Notify</label>
            <select
              name="when_to_notify"
              value={formData.when_to_notify}
              onChange={handleChange}
              className={selectCls}
            >
              <option value="">Select reminder time</option>
              {reminderOptions.map((m) => (
                <option key={m} value={m}>
                  {m} minutes before
                </option>
              ))}
            </select>
            {errors.when_to_notify && (
              <p className={errCls}>{errors.when_to_notify}</p>
            )}
          </div>
        </div>

        {/* Employee selection drawer */}
        {drawerOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40"
              onClick={() => setDrawerOpen(false)}
            />
            <div className="fixed top-0 right-0 h-full w-[480px] bg-white z-50 shadow-2xl overflow-y-auto">
              <div className="p-8 relative">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="absolute top-4 right-4 text-gray-300 hover:text-gray-600 cursor-pointer"
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

        {/* Selected employees (names + photos) */}
        {formData.participation.length > 0 && (
          <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">
              Selected Employees ({formData.participation.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {formData.participation.map((uuid) => {
                const emp = getEmployee(uuid);
                return (
                  <div
                    key={uuid}
                    className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wide"
                  >
                    {emp?.imageUrl && (
                      <img
                        src={emp.imageUrl}
                        alt={emp.name}
                        className="w-4 h-4 rounded-full object-cover"
                      />
                    )}
                    <span className="truncate max-w-[150px]">
                      {emp?.name || (staffLoaded ? uuid : "Loading...")}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEmployee(uuid)}
                      className="ml-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      &times;
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Place / Link + Timezone */}
        <div className="flex space-x-4">
          {formData.event_type === "offline" && (
            <div className="w-1/2">
              <label className={labelCls}>Place</label>
              <input
                className={inputCls}
                name="place"
                placeholder="Event location"
                value={formData.place}
                onChange={handleChange}
              />
              {errors.place && <p className={errCls}>{errors.place}</p>}
            </div>
          )}

          {formData.event_type === "online" && (
            <div className="w-1/2">
              <label className={labelCls}>Meeting Link</label>
              <input
                type="url"
                className={inputCls}
                name="link"
                placeholder="https://example.com"
                value={formData.link}
                onChange={handleChange}
              />
              {errors.link && <p className={errCls}>{errors.link}</p>}
            </div>
          )}

          <div className={formData.event_type ? "w-1/2" : "w-full"}>
            <label className={labelCls}>Timezone</label>
            <select
              name="timezone"
              value={formData.timezone}
              onChange={handleChange}
              className={selectCls}
            >
              <option value="">Select timezone</option>
              {timeZones.map((tz) => (
                <option key={tz.id} value={String(tz.id)}>
                  {tz.name} ({String(tz.abbreviation || "").trim()})
                </option>
              ))}
            </select>
            {errors.timezone && <p className={errCls}>{errors.timezone}</p>}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all uppercase tracking-widest disabled:opacity-50"
          >
            Cancel
          </button>
          <div className="flex-1">
            <GlowButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Event"}
            </GlowButton>
          </div>
        </div>
      </form>
    </div>
  );
}
