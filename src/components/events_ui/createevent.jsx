import React, { useState, useEffect, useRef, useMemo } from "react";
import { Icon } from "@iconify/react";
import GlowButton from "../helpers/glowbutton";
import {
  createEvent,
  updateEventApi,
  fetchTimeZone,
} from "../../service/eventservices";
import announceService from "../../service/announceService";
import toast from "react-hot-toast";

/* ---------- Shared style tokens (match EmployeeModal) ---------- */
const labelCls =
  "block text-[10px] font-normal uppercase tracking-wide text-gray-400 mb-1.5";
const inputCls =
  "w-full bg-[#F8F9FA] text-gray-800 placeholder-gray-300 outline-none border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-normal focus:border-gray-300 focus:bg-white focus:ring-4 focus:ring-gray-100 transition-all";
const selectCls = `${inputCls} appearance-none cursor-pointer pr-9 text-gray-600`;
const errorCls = "text-red-500 text-[10px] mt-1 tracking-wide";

const DEFAULT_AVATAR = "/person_img.jpg";

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

// Card section with an icon header
const Section = ({
  icon,
  title,
  step,
  done = false,
  aside,
  className = "",
  children,
}) => (
  <section
    className={`rounded-2xl border border-gray-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col ${className}`}
  >
    <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-[#FBFBFC] border-b border-gray-100">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
            done
              ? "bg-black text-white"
              : "bg-white border border-gray-200 text-gray-500"
          }`}
        >
          {done ? (
            <Icon icon="solar:check-read-linear" className="w-4 h-4" />
          ) : (
            <Icon icon={icon} className="w-4 h-4" />
          )}
        </div>
        <div className="min-w-0">
          {step && (
            <p className="text-[9px] text-gray-300 uppercase tracking-[0.25em] leading-none mb-1">
              Step {step}
            </p>
          )}
          <h3 className="text-[11px] font-normal text-gray-600 uppercase tracking-[0.2em] leading-none truncate">
            {title}
          </h3>
        </div>
      </div>
      {aside}
    </div>
    <div className="p-5 flex-1 flex flex-col min-h-0">{children}</div>
  </section>
);

// One row of the live summary card
const SummaryRow = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-lg bg-[#F8F9FA] flex items-center justify-center shrink-0">
      <Icon icon={icon} className="w-4 h-4 text-gray-500" />
    </div>
    <div className="min-w-0">
      <p className="text-[9px] text-gray-300 uppercase tracking-widest leading-none mb-1">
        {label}
      </p>
      <p
        className={`text-xs leading-snug break-words ${
          value ? "text-gray-800" : "text-gray-300"
        }`}
      >
        {value || "Not set"}
      </p>
    </div>
  </div>
);

const getDesignation = (employee) => {
  const d = employee?.designationname;
  if (d && typeof d === "object") return d.Valid ? d.String : "";
  return typeof d === "string" ? d : "";
};

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

  // Date object (calendar events carry start/end as Dates) or a timestamp
  if (value instanceof Date || typeof value === "number") {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return { date: "", time: "" };
    const pad = (n) => String(n).padStart(2, "0");
    return {
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    };
  }

  const str = String(value);
  const clean = str.includes("Z") ? str.split("Z")[0] : str;
  const [date, time = ""] = clean.split(/[T ]/);
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

const formatDuration = (minutes) => {
  const d = Math.floor(minutes / 1440);
  const h = Math.floor((minutes % 1440) / 60);
  const m = minutes % 60;
  return [d && `${d}d`, h && `${h}h`, m && `${m}m`].filter(Boolean).join(" ");
};

/**
 * Renders inside the page's MUI <Drawer> (no fixed overlay of its own).
 * Wide layout: left column = event info, right column = participants.
 * Narrow layout: everything stacks in one column.
 */
export default function EventCreate({
  event = null,
  onClose,
  onCreateSuccess,
}) {
  const isEdit = Boolean(event?.id);
  const [timeZone, setTimeZone] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inline employee picker
  const [staff, setStaff] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState("");
  const [staffReload, setStaffReload] = useState(0);
  const [employeeSearch, setEmployeeSearch] = useState("");

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

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setStaffLoading(true);
      setStaffError("");
      try {
        const response = await announceService.fetchStaff();
        if (isMounted)
          setStaff(Array.isArray(response?.data) ? response.data : []);
      } catch {
        if (isMounted) setStaffError("Failed to load employees");
      } finally {
        if (isMounted) setStaffLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [staffReload]);

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

  const selectedSet = useMemo(
    () => new Set(formData.participation),
    [formData.participation],
  );

  const staffByUuid = useMemo(() => {
    const map = {};
    staff.forEach((s) => {
      map[s.uuid] = s;
    });
    return map;
  }, [staff]);

  const filteredStaff = useMemo(() => {
    const q = employeeSearch.trim().toLowerCase();
    if (!q) return staff;
    return staff.filter(
      (e) =>
        e.name?.toLowerCase().includes(q) ||
        getDesignation(e).toLowerCase().includes(q),
    );
  }, [staff, employeeSearch]);

  const allFilteredSelected =
    filteredStaff.length > 0 &&
    filteredStaff.every((e) => selectedSet.has(e.uuid));

  // Live duration badge
  const durationLabel = useMemo(() => {
    const { start_date, start_time, end_date, end_time } = formData;
    if (!start_date || !start_time || !end_date || !end_time) return "";
    const start = new Date(`${start_date}T${start_time}`);
    const end = new Date(`${end_date}T${end_time}`);
    const diff = Math.round((end - start) / 60000);
    return diff > 0 ? formatDuration(diff) : "";
  }, [formData]);

  // Step completion (drives the progress bar and section check marks)
  const detailsDone = Boolean(formData.title && formData.description);
  const scheduleDone = Boolean(
    formData.start_date &&
    formData.start_time &&
    formData.end_date &&
    formData.end_time &&
    formData.timezone,
  );
  const locationDone = Boolean(
    formData.event_type &&
    formData.when_to_notify &&
    (formData.event_type === "online" ? formData.link : formData.place),
  );
  const participantsDone = formData.participation.length > 0;
  const doneCount = [
    detailsDone,
    scheduleDone,
    locationDone,
    participantsDone,
  ].filter(Boolean).length;

  // Live summary values
  const tzName =
    timeZone.find((tz) => String(tz.id) === String(formData.timezone))?.name ||
    "";
  const fmtDateTime = (d, t) => {
    if (!d) return "";
    const dt = new Date(`${d}T${t || "00:00"}`);
    if (Number.isNaN(dt.getTime())) return "";
    return `${dt.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })}${t ? `, ${dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}` : ""}`;
  };
  const summaryWhen = formData.start_date
    ? `${fmtDateTime(formData.start_date, formData.start_time)}${
        formData.end_date
          ? ` → ${fmtDateTime(formData.end_date, formData.end_time)}`
          : ""
      }`
    : "";
  const summaryWhere =
    formData.event_type === "online"
      ? formData.link || "Online meeting"
      : formData.event_type === "offline"
        ? formData.place || "Offline event"
        : "";

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

  const handleSelectAllFiltered = () => {
    const ids = filteredStaff.map((e) => e.uuid);
    setFormData((prev) => {
      if (allFilteredSelected) {
        const remove = new Set(ids);
        return {
          ...prev,
          participation: prev.participation.filter((id) => !remove.has(id)),
        };
      }
      return {
        ...prev,
        participation: Array.from(new Set([...prev.participation, ...ids])),
      };
    });
  };

  const handleClearEmployees = () =>
    setFormData((prev) => ({ ...prev, participation: [] }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  return (
    <div className="flex flex-col w-full h-full min-h-0 font-poppins font-normal text-black">
      {/* ---------- Header (fixed) ---------- */}
      <div className="shrink-0 flex items-center gap-4 pb-5 mb-5 border-b border-gray-100 relative pr-10">
        <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center shadow-lg shrink-0">
          <Icon
            icon={
              isEdit
                ? "solar:pen-new-square-outline"
                : "solar:calendar-add-outline"
            }
            className="w-6 h-6 text-white"
          />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-normal text-gray-900 leading-tight">
            {isEdit ? "Edit Event" : "Create Event"}
          </h2>
          <p className="text-xs font-normal text-gray-400 mt-0.5">
            {isEdit
              ? "Update the event details below"
              : "Fill in the details to schedule an event"}
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-0 right-0 w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* ---------- Progress ---------- */}
      <div className="shrink-0 mb-5 flex items-center gap-3">
        <div className="flex-1 flex gap-1.5">
          {[detailsDone, scheduleDone, locationDone, participantsDone].map(
            (done, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  done ? "bg-black" : "bg-gray-100"
                }`}
              />
            ),
          )}
        </div>
        <span className="text-[10px] text-gray-400 uppercase tracking-widest whitespace-nowrap">
          {doneCount}/4 complete
        </span>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col flex-1 min-h-0"
      >
        {/* ---------- Scrolling body ---------- */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-2 -mr-2 custom-scrollbar">
          <div className="grid grid-cols-1 min-[1800px]:grid-cols-2 gap-6 items-stretch pb-2">
            {/* ===== Left column: event info ===== */}
            <div className="flex flex-col gap-6">
              <Section
                icon="solar:document-text-outline"
                title="Event Details"
                step="1"
                done={detailsDone}
              >
                <div className="flex flex-col gap-4">
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
                      className={`${inputCls} min-h-[96px] resize-none`}
                      name="description"
                      placeholder="Event description"
                      value={formData.description}
                      onChange={handleChange}
                    />
                  </Field>
                </div>
              </Section>

              <Section
                icon="solar:clock-circle-outline"
                title="Schedule"
                step="2"
                done={scheduleDone}
                aside={
                  durationLabel && (
                    <span className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full bg-[#F8F9FA] text-gray-500 uppercase tracking-widest">
                      <Icon
                        icon="solar:hourglass-outline"
                        className="w-3.5 h-3.5"
                      />
                      {durationLabel}
                    </span>
                  )
                }
              >
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                          <Icon
                            icon="solar:calendar-outline"
                            className="w-4 h-4"
                          />
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="End Date" error={errors.end_date}>
                      <div className="relative">
                        <input
                          ref={endDateRef}
                          type="date"
                          min={formData.start_date || undefined}
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
                          <Icon
                            icon="solar:calendar-outline"
                            className="w-4 h-4"
                          />
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
              </Section>

              <Section
                icon="solar:map-point-outline"
                title="Location & Reminder"
                step="3"
                done={locationDone}
              >
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </Section>
            </div>

            {/* ===== Right column: participants ===== */}
            <div className="flex flex-col gap-6">
              <Section
                icon="solar:users-group-rounded-outline"
                title="Participants"
                className="flex-1 min-h-0"
                step="4"
                done={participantsDone}
                aside={
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-black text-white uppercase tracking-widest">
                    {formData.participation.length} selected
                  </span>
                }
              >
                <div className="flex flex-col gap-3 flex-1 min-h-0">
                  {formData.participation.length > 0 && (
                    <div className="p-3 rounded-2xl border border-gray-100 bg-[#F8F9FA]/60">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[9px] text-gray-400 uppercase tracking-widest font-normal">
                          Selected Employees
                        </p>
                        <button
                          type="button"
                          onClick={handleClearEmployees}
                          className="text-[9px] text-gray-400 hover:text-red-500 uppercase tracking-widest transition-colors cursor-pointer"
                        >
                          Clear all
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                        {formData.participation.map((uuid) => {
                          const emp = staffByUuid[uuid];
                          return (
                            <div
                              key={uuid}
                              className="flex items-center gap-1.5 bg-white border border-gray-100 text-gray-600 pl-1 pr-2 py-1 rounded-full text-[10px] font-normal tracking-wide"
                            >
                              <img
                                src={emp?.imageUrl || DEFAULT_AVATAR}
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = DEFAULT_AVATAR;
                                }}
                                alt=""
                                className="w-5 h-5 rounded-full object-cover"
                              />
                              <span className="truncate max-w-[130px]">
                                {emp?.name || uuid}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleEmployeeToggle(uuid)}
                                aria-label="Remove employee"
                                className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer leading-none"
                              >
                                &times;
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="relative">
                    <Icon
                      icon="solar:magnifer-outline"
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                    />
                    <input
                      type="text"
                      placeholder="Search by name or designation"
                      className={`${inputCls} pl-10 pr-9`}
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.preventDefault();
                      }}
                    />
                    {employeeSearch && (
                      <button
                        type="button"
                        onClick={() => setEmployeeSearch("")}
                        aria-label="Clear search"
                        className="absolute inset-y-0 right-3 flex items-center text-gray-300 hover:text-gray-600 transition-colors cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                      Employees ({filteredStaff.length})
                    </p>
                    <button
                      type="button"
                      onClick={handleSelectAllFiltered}
                      disabled={staffLoading || filteredStaff.length === 0}
                      className="text-[10px] text-gray-400 hover:text-black uppercase tracking-wide transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      {allFilteredSelected ? "Deselect all" : "Select all"}
                    </button>
                  </div>

                  <div className="max-h-[300px] min-[1800px]:max-h-none min-[1800px]:h-0 min-[1800px]:grow min-h-[240px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {staffLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-3 rounded-2xl border border-gray-100 animate-pulse"
                        >
                          <div className="w-10 h-10 rounded-full bg-gray-100" />
                          <div className="flex-1 space-y-2">
                            <div className="h-2.5 w-1/2 bg-gray-100 rounded" />
                            <div className="h-2 w-1/3 bg-gray-100 rounded" />
                          </div>
                          <div className="w-5 h-5 rounded-md bg-gray-100" />
                        </div>
                      ))
                    ) : staffError ? (
                      <div className="flex flex-col items-center gap-3 py-10 text-center">
                        <p className="text-xs text-red-500 tracking-wide">
                          {staffError}
                        </p>
                        <button
                          type="button"
                          onClick={() => setStaffReload((k) => k + 1)}
                          className="px-4 py-1.5 border border-gray-200 rounded-lg text-[10px] uppercase tracking-widest text-gray-600 hover:bg-gray-50 transition-all cursor-pointer"
                        >
                          Retry
                        </button>
                      </div>
                    ) : filteredStaff.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 py-10 text-center">
                        <Icon
                          icon="solar:users-group-rounded-outline"
                          className="w-8 h-8 text-gray-200"
                        />
                        <p className="text-xs text-gray-400">
                          No employees found
                        </p>
                      </div>
                    ) : (
                      filteredStaff.map((employee) => {
                        const isChecked = selectedSet.has(employee.uuid);
                        const designation = getDesignation(employee);
                        return (
                          <div
                            key={employee.uuid}
                            role="checkbox"
                            aria-checked={isChecked}
                            tabIndex={0}
                            onClick={() => handleEmployeeToggle(employee.uuid)}
                            onKeyDown={(e) => {
                              if (e.key === " " || e.key === "Enter") {
                                e.preventDefault();
                                handleEmployeeToggle(employee.uuid);
                              }
                            }}
                            className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer select-none outline-none focus-visible:border-gray-400 ${
                              isChecked
                                ? "border-gray-300 bg-[#F8F9FA]"
                                : "border-gray-100 bg-white hover:bg-[#F8F9FA]/60 hover:border-gray-200"
                            }`}
                          >
                            <img
                              src={employee.imageUrl || DEFAULT_AVATAR}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = DEFAULT_AVATAR;
                              }}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover border border-gray-100 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-800 truncate">
                                {employee.name}
                              </p>
                              <p className="text-[10px] text-gray-400 uppercase tracking-wide truncate mt-0.5">
                                {designation || "No designation"}
                              </p>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                                isChecked
                                  ? "bg-black border-black"
                                  : "bg-white border-gray-200"
                              }`}
                            >
                              {isChecked && (
                                <Icon
                                  icon="solar:check-read-linear"
                                  className="w-3.5 h-3.5 text-white"
                                />
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </Section>

              {/* ---------- Live summary ---------- */}
              <section className="rounded-2xl border border-gray-100 bg-[#FBFBFC] p-5">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-black flex items-center justify-center">
                    <Icon
                      icon="solar:clipboard-list-outline"
                      className="w-4 h-4 text-white"
                    />
                  </div>
                  <h3 className="text-[11px] font-normal text-gray-600 uppercase tracking-[0.2em]">
                    Event Summary
                  </h3>
                </div>
                <p
                  className={`text-sm leading-snug mb-4 break-words ${
                    formData.title ? "text-gray-900" : "text-gray-300"
                  }`}
                >
                  {formData.title || "Untitled event"}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                  <SummaryRow
                    icon="solar:calendar-outline"
                    label="When"
                    value={summaryWhen}
                  />
                  <SummaryRow
                    icon="solar:hourglass-outline"
                    label="Duration"
                    value={durationLabel}
                  />
                  <SummaryRow
                    icon={
                      formData.event_type === "online"
                        ? "solar:videocamera-record-outline"
                        : "solar:map-point-outline"
                    }
                    label={
                      formData.event_type === "online"
                        ? "Meeting link"
                        : "Where"
                    }
                    value={summaryWhere}
                  />
                  <SummaryRow
                    icon="solar:bell-outline"
                    label="Reminder"
                    value={
                      formData.when_to_notify
                        ? `${formData.when_to_notify} min before`
                        : ""
                    }
                  />
                  <SummaryRow
                    icon="solar:global-outline"
                    label="Timezone"
                    value={tzName}
                  />
                  <SummaryRow
                    icon="solar:users-group-rounded-outline"
                    label="Participants"
                    value={
                      formData.participation.length
                        ? `${formData.participation.length} selected`
                        : ""
                    }
                  />
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* ---------- Footer (fixed) ---------- */}
        <div className="shrink-0 pt-4 mt-3 border-t border-gray-100 flex items-center justify-between gap-4">
          <p className="hidden sm:block text-[10px] text-gray-400 uppercase tracking-widest">
            {formData.participation.length} participant
            {formData.participation.length === 1 ? "" : "s"}
            {durationLabel ? ` · ${durationLabel}` : ""}
          </p>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-[11px] uppercase tracking-widest hover:bg-gray-50 transition-all disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
            )}
            <div className="flex-1 sm:flex-none sm:min-w-[200px]">
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
          </div>
        </div>
      </form>
    </div>
  );
}
