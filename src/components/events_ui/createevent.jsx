import React, { useState, useEffect, useRef, useMemo } from "react";
import { Icon } from "@iconify/react";
import GlowButton from "../helpers/glowbutton";
import {
  createEvent,
  updateEventApi,
  fetchTimeZone,
} from "../../service/eventservices";
import { getActiveUsersLight } from "../../service/employeeService";
import { toast } from "react-toastify";
import { resolveApiSuccess, resolveApiError } from "../../utils/apiToast";

/* ---------- Shared style tokens ---------- */
const labelCls =
  "block text-[10px] font-normal uppercase tracking-wide text-gray-400 mb-1.5";
const inputCls =
  "w-full bg-[#F8F9FA] text-gray-800 placeholder-gray-300 outline-none border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-normal focus:border-gray-300 focus:bg-white focus:ring-4 focus:ring-gray-100 transition-all";
const inputErrCls =
  "!border-red-300 !bg-red-50/40 focus:!ring-red-100 focus:!border-red-400";
const selectCls = `${inputCls} appearance-none cursor-pointer pr-9 text-gray-600`;
const errorCls =
  "flex items-center gap-1 text-red-500 text-[10px] mt-1.5 tracking-wide";

// Soft tones for letter avatars (picked from the employee's name)
const AVATAR_TONES = [
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-teal-100 text-teal-700",
  "bg-indigo-100 text-indigo-700",
  "bg-orange-100 text-orange-700",
];

const REMINDER_PRESETS = ["5", "10", "15", "30", "60"];
const DURATION_PRESETS = [
  { label: "30 min", minutes: 30 },
  { label: "1 hr", minutes: 60 },
  { label: "2 hrs", minutes: 120 },
  { label: "All day", minutes: "all-day" },
];

// Order used to scroll to the first invalid field
const FIELD_ORDER = [
  "title",
  "description",
  "start_date",
  "start_time",
  "end_date",
  "end_time",
  "timezone",
  "event_type",
  "when_to_notify",
  "place",
  "link",
];

/* ---------- Small helpers ---------- */

const pad = (n) => String(n).padStart(2, "0");

const toDateInput = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const toTimeInput = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

const addMinutes = (date, time, minutes) => {
  const d = new Date(`${date}T${time}`);
  if (Number.isNaN(d.getTime())) return null;
  d.setMinutes(d.getMinutes() + minutes);
  return { date: toDateInput(d), time: toTimeInput(d) };
};

const cleanText = (value) => (value || "").replace(/\s+/g, " ").trim();

const getDesignation = (employee) => cleanText(employee?.designation_name);

// "Muhammed Riyas A V" -> "MV", "Jishnu K" -> "JK", "Thomas" -> "T"
const getInitials = (name) => {
  const parts = cleanText(name).split(" ").filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getAvatarTone = (name) => {
  let hash = 0;
  for (const ch of cleanText(name)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length];
};

const formatDuration = (minutes) => {
  const d = Math.floor(minutes / 1440);
  const h = Math.floor((minutes % 1440) / 60);
  const m = minutes % 60;
  return [d && `${d}d`, h && `${h}h`, m && `${m}m`].filter(Boolean).join(" ");
};

const formatReminder = (min) => {
  const n = Number(min);
  if (!n) return "";
  return n >= 60 ? formatDuration(n) : `${n} min`;
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
    return { date: toDateInput(d), time: toTimeInput(d) };
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

const scrollToId = (id) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

/* ---------- UI pieces ---------- */

const ChevronDownIcon = () => (
  <Icon
    icon="solar:alt-arrow-down-linear"
    className="w-3.5 h-3.5 text-gray-400"
  />
);

const Field = ({ name, label, error, hint, children, className = "" }) => (
  <div
    id={name ? `field-${name}` : undefined}
    className={`scroll-mt-4 ${className}`}
  >
    <label className={labelCls}>{label}</label>
    {children}
    {error ? (
      <p className={errorCls}>
        <Icon icon="solar:danger-circle-linear" className="w-3 h-3" />
        {error}
      </p>
    ) : (
      hint && <p className="text-[10px] text-gray-300 mt-1.5">{hint}</p>
    )}
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

// Date input with a custom picker button (the native indicator is hidden)
const DateInput = ({ name, value, onChange, min, className = "" }) => {
  const ref = useRef(null);
  const open = () => {
    const el = ref.current;
    if (!el) return;
    if (typeof el.showPicker === "function") el.showPicker();
    else el.focus();
  };
  return (
    <div className="relative">
      <input
        ref={ref}
        type="date"
        name={name}
        value={value}
        min={min}
        onChange={onChange}
        className={`${className} pr-9 uppercase [&::-webkit-calendar-picker-indicator]:hidden`}
      />
      <button
        type="button"
        onClick={open}
        aria-label={`Open ${name.replace("_", " ")} picker`}
        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-black cursor-pointer"
      >
        <Icon icon="solar:calendar-outline" className="w-4 h-4" />
      </button>
    </div>
  );
};

// Card section with an icon header
const Section = ({
  id,
  icon,
  title,
  subtitle,
  done = false,
  aside,
  className = "",
  children,
}) => (
  <section
    id={id}
    className={`scroll-mt-4 rounded-2xl border ${
      done ? "border-zinc-300" : "border-gray-100"
    } bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col transition-colors duration-300 ${className}`}
  >
    <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[#FBFBFC] border-b border-gray-100">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
            done
              ? "bg-black text-white scale-100"
              : "bg-white border border-gray-200 text-gray-500"
          }`}
        >
          <Icon
            icon={done ? "solar:check-read-linear" : icon}
            className="w-4 h-4"
          />
        </div>
        <div className="min-w-0">
          <h3 className="text-[12px] font-normal text-gray-800 tracking-wide leading-none truncate">
            {title}
          </h3>
          {subtitle && (
            <p className="text-[10px] text-gray-400 mt-1 leading-none truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {aside}
    </div>
    <div className="p-4 flex-1 flex flex-col min-h-0">{children}</div>
  </section>
);

// One row of the live summary card
const SummaryRow = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
      <Icon icon={icon} className="w-4 h-4 text-white/70" />
    </div>
    <div className="min-w-0">
      <p className="text-[9px] text-white/40 uppercase tracking-widest leading-none mb-1">
        {label}
      </p>
      <p
        className={`text-xs leading-snug break-words ${
          value ? "text-white" : "text-white/30"
        }`}
      >
        {value || "Not set"}
      </p>
    </div>
  </div>
);

// Photo when the employee has one, otherwise a coloured letter avatar
const Avatar = ({
  src,
  name,
  size = "w-10 h-10",
  text = "text-[11px]",
  online,
  className = "",
}) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const showImage = Boolean(src) && !failed;

  return (
    <div className={`relative shrink-0 rounded-full ${className}`}>
      {showImage ? (
        <img
          src={src}
          onError={() => setFailed(true)}
          alt=""
          className={`${size} rounded-full object-cover border border-gray-100`}
        />
      ) : (
        <div
          aria-hidden="true"
          className={`${size} ${getAvatarTone(name)} ${text} rounded-full flex items-center justify-center font-normal tracking-wide select-none`}
        >
          {getInitials(name)}
        </div>
      )}
      {online !== undefined && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
            online ? "bg-emerald-500" : "bg-gray-300"
          }`}
        />
      )}
    </div>
  );
};

/**
 * Renders inside the page's MUI <Drawer> (no fixed overlay of its own).
 * Wide layout: left column = event info, right column = participants + summary.
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
  const [deptFilter, setDeptFilter] = useState("all");
  const [customReminder, setCustomReminder] = useState("");

  const [formData, setFormData] = useState(() =>
    event ? eventToForm(event) : EMPTY_FORM,
  );

  /* ---------- Data loading ---------- */

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
        const data = await getActiveUsersLight();
        if (isMounted) setStaff(Array.isArray(data) ? data : []);
      } catch {
        if (isMounted) setStaffError("Couldn't load employees. Try again.");
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

  /* ---------- Derived data ---------- */

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

  const departments = useMemo(() => {
    const counts = new Map();
    staff.forEach((s) => {
      if (!s.department_name) return;
      counts.set(s.department_name, (counts.get(s.department_name) || 0) + 1);
    });
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [staff]);

  const filteredStaff = useMemo(() => {
    const q = employeeSearch.trim().toLowerCase();
    return staff.filter((e) => {
      if (deptFilter !== "all" && e.department_name !== deptFilter)
        return false;
      if (!q) return true;
      return (
        cleanText(e.name).toLowerCase().includes(q) ||
        getDesignation(e).toLowerCase().includes(q) ||
        (e.department_name || "").toLowerCase().includes(q)
      );
    });
  }, [staff, employeeSearch, deptFilter]);

  const allFilteredSelected =
    filteredStaff.length > 0 &&
    filteredStaff.every((e) => selectedSet.has(e.uuid));

  // Live duration badge
  const durationMinutes = useMemo(() => {
    const { start_date, start_time, end_date, end_time } = formData;
    if (!start_date || !start_time || !end_date || !end_time) return 0;
    const start = new Date(`${start_date}T${start_time}`);
    const end = new Date(`${end_date}T${end_time}`);
    const diff = Math.round((end - start) / 60000);
    return diff > 0 ? diff : 0;
  }, [formData]);
  const durationLabel = durationMinutes ? formatDuration(durationMinutes) : "";

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
  const steps = [
    { label: "Details", id: "sec-details", done: detailsDone },
    { label: "Schedule", id: "sec-schedule", done: scheduleDone },
    { label: "Location", id: "sec-location", done: locationDone },
    { label: "People", id: "sec-people", done: participantsDone },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const errorCount = Object.values(errors).filter(Boolean).length;

  // Live summary values
  const tzName =
    timeZone.find((tz) => String(tz.id) === String(formData.timezone))?.name ||
    "";

  const fmtDateTime = (d, t) => {
    if (!d) return "";
    const dt = new Date(`${d}T${t || "00:00"}`);
    if (Number.isNaN(dt.getTime())) return "";
    const datePart = dt.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const timePart = t
      ? `, ${dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`
      : "";
    return `${datePart}${timePart}`;
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

  const reminderOptions = [
    ...new Set([...REMINDER_PRESETS, formData.when_to_notify].filter(Boolean)),
  ]
    .map(String)
    .sort((a, b) => Number(a) - Number(b));

  /* ---------- Form logic ---------- */

  const setField = (name, value) => {
    setFormData((prev) => {
      const next = { ...prev, [name]: value };

      // Keep the end date in step with the start date
      if (name === "start_date" && value) {
        if (!prev.end_date || prev.end_date < value) next.end_date = value;
      }

      // First time a start time is picked, suggest a one-hour event
      if (name === "start_time" && value && !prev.end_time && next.start_date) {
        const end = addMinutes(next.start_date, value, 60);
        if (end) {
          next.end_date = end.date;
          next.end_time = end.time;
        }
      }
      return next;
    });

    setErrors((prev) => {
      const cleared = { ...prev, [name]: undefined };
      if (["start_date", "start_time", "end_date", "end_time"].includes(name)) {
        cleared.end_time = undefined;
      }
      return cleared;
    });
  };

  const handleChange = (e) => setField(e.target.name, e.target.value);

  const applyDuration = (minutes) => {
    const { start_date, start_time } = formData;
    if (!start_date) return;

    if (minutes === "all-day") {
      setFormData((prev) => ({
        ...prev,
        start_time: "00:00",
        end_date: start_date,
        end_time: "23:59",
      }));
    } else {
      if (!start_time) return;
      const end = addMinutes(start_date, start_time, minutes);
      if (!end) return;
      setFormData((prev) => ({
        ...prev,
        end_date: end.date,
        end_time: end.time,
      }));
    }
    setErrors((prev) => ({
      ...prev,
      start_time: undefined,
      end_date: undefined,
      end_time: undefined,
    }));
  };

  const applyCustomReminder = () => {
    const n = parseInt(customReminder, 10);
    if (!n || n <= 0) return;
    setField("when_to_notify", String(n));
    setCustomReminder("");
  };

  const formatDateTimeWithZone = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return "";
    const standardTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
    return `${dateStr}T${standardTime}`;
  };

  const validateForm = () => {
    const e = {};
    if (!formData.title.trim()) e.title = "Add a title for the event";
    if (!formData.description.trim()) e.description = "Add a short description";
    if (!formData.start_date) e.start_date = "Pick a start date";
    if (!formData.start_time) e.start_time = "Pick a start time";
    if (!formData.end_date) e.end_date = "Pick an end date";
    if (!formData.end_time) e.end_time = "Pick an end time";
    if (
      formData.start_date &&
      formData.start_time &&
      formData.end_date &&
      formData.end_time &&
      !durationMinutes
    ) {
      e.end_time = "End must be after the start";
    }
    if (!formData.timezone) e.timezone = "Select a timezone";
    if (!formData.event_type) e.event_type = "Choose online or offline";
    if (!formData.when_to_notify) e.when_to_notify = "Choose a reminder time";
    if (formData.event_type === "offline" && !formData.place.trim())
      e.place = "Add the place for this offline event";
    if (formData.event_type === "online" && !formData.link.trim())
      e.link = "Add the meeting link for this online event";

    setErrors(e);

    const firstKey = FIELD_ORDER.find((k) => e[k]);
    if (firstKey) {
      setTimeout(() => scrollToId(`field-${firstKey}`), 0);
    }
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (isSubmitting || !validateForm()) return;

    setIsSubmitting(true);

    const eventPayload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      start_date: formatDateTimeWithZone(
        formData.start_date,
        formData.start_time,
      ),
      end_date: formatDateTimeWithZone(formData.end_date, formData.end_time),
      event_type: formData.event_type,
      participation: formData.participation.map((uuid) => ({ uuid })),
      place: formData.event_type === "offline" ? formData.place.trim() : "",
      meeting_url: formData.event_type === "online" ? formData.link.trim() : "",
      reminder_before: String(formData.when_to_notify),
      time_zone: formData.timezone,
    };

    const tid = toast.loading(
      isEdit ? "Updating event..." : "Creating event...",
    );

    try {
      const res = isEdit
        ? await updateEventApi(event.id, eventPayload)
        : await createEvent(eventPayload);

      // Backend message becomes the toast title
      resolveApiSuccess(
        tid,
        res,
        isEdit ? "Event updated successfully" : "Event created successfully",
      );

      if (typeof onCreateSuccess === "function") await onCreateSuccess();
      setFormData(EMPTY_FORM);
      if (typeof onClose === "function") onClose();
    } catch (error) {
      // Backend message + data (or error) from error.response.data
      resolveApiError(
        tid,
        error,
        isEdit
          ? "Error updating event. Please try again"
          : "Error creating event. Please try again",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------- Participant handlers ---------- */

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

  const inp = (name, extra = "") =>
    `${inputCls} ${errors[name] ? inputErrCls : ""} ${extra}`;

  const canPickDuration = Boolean(formData.start_date && formData.start_time);

  /* ---------- Render ---------- */

  return (
    <div className="flex flex-col w-full h-full min-h-0 font-poppins font-normal text-black">
      {/* ---------- Header (fixed) ---------- */}
      <div className="shrink-0 relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-800 via-zinc-900 to-black text-white p-4 mb-3 shadow-lg">
        <span className="absolute -right-10 -top-12 w-40 h-40 rounded-full bg-white/5" />
        <span className="absolute right-10 top-14 w-20 h-20 rounded-full bg-white/5" />

        <div className="relative flex items-center gap-4 pr-12">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
            <Icon
              icon={
                isEdit
                  ? "solar:pen-new-square-outline"
                  : "solar:calendar-add-outline"
              }
              className="w-5 h-5 text-white"
            />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-normal leading-tight truncate">
              {formData.title.trim() ||
                (isEdit ? "Edit event" : "Create event")}
            </h2>
            <p className="text-xs font-normal text-white/60 mt-0.5 truncate">
              {isEdit
                ? "Update the event details below"
                : "Fill in the details to schedule an event"}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <Icon icon="solar:close-circle-linear" className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* ---------- Progress (click a step to jump to it) ---------- */}
      <div className="shrink-0 mb-4 flex items-end gap-4">
        <div className="flex-1 grid grid-cols-4 gap-2">
          {steps.map((step) => (
            <button
              type="button"
              key={step.label}
              onClick={() => scrollToId(step.id)}
              className="group flex flex-col gap-1.5 min-w-0 text-left cursor-pointer"
            >
              <div
                className={`h-1 rounded-full transition-colors duration-300 ${
                  step.done ? "bg-black" : "bg-gray-100 group-hover:bg-gray-200"
                }`}
              />
              <span
                className={`flex items-center gap-1 text-[10px] tracking-wide truncate transition-colors ${
                  step.done
                    ? "text-gray-700"
                    : "text-gray-300 group-hover:text-gray-500"
                }`}
              >
                {step.done && (
                  <Icon
                    icon="solar:check-read-linear"
                    className="w-3 h-3 shrink-0"
                  />
                )}
                {step.label}
              </span>
            </button>
          ))}
        </div>
        <span className="text-[10px] text-gray-400 tracking-wide whitespace-nowrap pb-0.5">
          {doneCount} of 4 complete
        </span>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col flex-1 min-h-0"
      >
        {/* ---------- Scrolling body ---------- */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-2 -mr-2 custom-scrollbar">
          {errorCount > 0 && (
            <div
              role="alert"
              className="mb-4 flex items-center gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-[11px] text-red-600"
            >
              <Icon
                icon="solar:danger-triangle-linear"
                className="w-4 h-4 shrink-0"
              />
              {errorCount === 1
                ? "1 field needs your attention."
                : `${errorCount} fields need your attention.`}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 pb-2">
            {/* ===== Left column: event info ===== */}
            <div className="flex flex-col gap-6">
              {/* --- Details --- */}
              <Section
                id="sec-details"
                icon="solar:document-text-outline"
                title="Event details"
                subtitle="What is this event about?"
                done={detailsDone}
              >
                <div className="flex flex-col gap-4">
                  <Field name="title" label="Title" error={errors.title}>
                    <input
                      className={inp("title")}
                      name="title"
                      placeholder="e.g. Quarterly planning meeting"
                      value={formData.title}
                      onChange={handleChange}
                      maxLength={120}
                    />
                  </Field>

                  <Field
                    name="description"
                    label="Description"
                    error={errors.description}
                  >
                    <textarea
                      className={inp("description", "min-h-[96px] resize-none")}
                      name="description"
                      placeholder="Agenda, goals or anything attendees should know"
                      value={formData.description}
                      onChange={handleChange}
                    />
                  </Field>
                </div>
              </Section>

              {/* --- Schedule --- */}
              <Section
                id="sec-schedule"
                icon="solar:clock-circle-outline"
                title="Schedule"
                subtitle="When does it start and end?"
                done={scheduleDone}
                aside={
                  durationLabel && (
                    <span className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full bg-black text-white tracking-wide">
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
                    <Field
                      name="start_date"
                      label="Start date"
                      error={errors.start_date}
                    >
                      <DateInput
                        name="start_date"
                        value={formData.start_date}
                        onChange={handleChange}
                        className={inp("start_date")}
                      />
                    </Field>

                    <Field
                      name="start_time"
                      label="Start time"
                      error={errors.start_time}
                    >
                      <input
                        type="time"
                        className={inp("start_time", "uppercase")}
                        name="start_time"
                        value={formData.start_time}
                        onChange={handleChange}
                      />
                    </Field>
                  </div>

                  {/* Quick duration */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] text-gray-400 tracking-wide mr-1">
                      Quick duration
                    </span>
                    {DURATION_PRESETS.map((p) => {
                      const active =
                        p.minutes === "all-day"
                          ? formData.start_time === "00:00" &&
                            formData.end_time === "23:59" &&
                            formData.start_date === formData.end_date
                          : durationMinutes === p.minutes;
                      const disabled =
                        p.minutes === "all-day"
                          ? !formData.start_date
                          : !canPickDuration;
                      return (
                        <button
                          type="button"
                          key={p.label}
                          disabled={disabled}
                          aria-pressed={active}
                          onClick={() => applyDuration(p.minutes)}
                          className={`px-3 py-1.5 rounded-full border text-[10px] tracking-wide transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                            active
                              ? "bg-black text-white border-black"
                              : "bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-black"
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field
                      name="end_date"
                      label="End date"
                      error={errors.end_date}
                    >
                      <DateInput
                        name="end_date"
                        value={formData.end_date}
                        min={formData.start_date || undefined}
                        onChange={handleChange}
                        className={inp("end_date")}
                      />
                    </Field>

                    <Field
                      name="end_time"
                      label="End time"
                      error={errors.end_time}
                    >
                      <input
                        type="time"
                        className={inp("end_time", "uppercase")}
                        name="end_time"
                        value={formData.end_time}
                        onChange={handleChange}
                      />
                    </Field>
                  </div>

                  <Field
                    name="timezone"
                    label="Timezone"
                    error={errors.timezone}
                  >
                    <SelectWrap>
                      <select
                        name="timezone"
                        value={formData.timezone}
                        onChange={handleChange}
                        className={`${selectCls} ${errors.timezone ? inputErrCls : ""}`}
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

              {/* --- Location & reminder --- */}
              <Section
                id="sec-location"
                icon="solar:map-point-outline"
                title="Location & reminder"
                subtitle="Where it happens and when to remind people"
                done={locationDone}
              >
                <div className="flex flex-col gap-4">
                  <Field
                    name="event_type"
                    label="Event type"
                    error={errors.event_type}
                  >
                    <div
                      className={`grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-[#F8F9FA] border ${
                        errors.event_type ? "border-red-300" : "border-gray-100"
                      }`}
                    >
                      {[
                        {
                          value: "online",
                          label: "Online",
                          hint: "Video call or link",
                          icon: "solar:videocamera-record-outline",
                        },
                        {
                          value: "offline",
                          label: "Offline",
                          hint: "In person at a place",
                          icon: "solar:map-point-outline",
                        },
                      ].map((opt) => {
                        const active = formData.event_type === opt.value;
                        return (
                          <button
                            type="button"
                            key={opt.value}
                            aria-pressed={active}
                            onClick={() => setField("event_type", opt.value)}
                            className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all cursor-pointer ${
                              active
                                ? "bg-black text-white shadow-md"
                                : "text-gray-500 hover:bg-white"
                            }`}
                          >
                            <span
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                active
                                  ? "bg-white/15"
                                  : "bg-white border border-gray-100"
                              }`}
                            >
                              <Icon icon={opt.icon} className="w-4 h-4" />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-[12px] leading-none">
                                {opt.label}
                              </span>
                              <span
                                className={`block text-[10px] mt-1 leading-none truncate ${
                                  active ? "text-white/60" : "text-gray-400"
                                }`}
                              >
                                {opt.hint}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </Field>

                  {formData.event_type === "offline" && (
                    <Field name="place" label="Place" error={errors.place}>
                      <div className="relative">
                        <Icon
                          icon="solar:map-point-outline"
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                        />
                        <input
                          className={inp("place", "pl-10")}
                          name="place"
                          placeholder="Conference room, office or address"
                          value={formData.place}
                          onChange={handleChange}
                        />
                      </div>
                    </Field>
                  )}

                  {formData.event_type === "online" && (
                    <Field name="link" label="Meeting link" error={errors.link}>
                      <div className="relative">
                        <Icon
                          icon="solar:link-round-outline"
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                        />
                        <input
                          type="url"
                          className={inp("link", "pl-10")}
                          name="link"
                          placeholder="https://meet.example.com/room"
                          value={formData.link}
                          onChange={handleChange}
                        />
                      </div>
                    </Field>
                  )}

                  <Field
                    name="when_to_notify"
                    label="Remind participants"
                    error={errors.when_to_notify}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {reminderOptions.map((min) => {
                        const active = String(formData.when_to_notify) === min;
                        return (
                          <button
                            type="button"
                            key={min}
                            aria-pressed={active}
                            onClick={() => setField("when_to_notify", min)}
                            className={`px-3.5 py-2 rounded-xl border text-[11px] tracking-wide transition-all cursor-pointer ${
                              active
                                ? "bg-black text-white border-black shadow-md"
                                : "bg-[#F8F9FA] text-gray-600 border-gray-100 hover:border-gray-300 hover:bg-white"
                            }`}
                          >
                            {formatReminder(min)} before
                          </button>
                        );
                      })}

                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="1"
                          inputMode="numeric"
                          placeholder="Custom (min)"
                          value={customReminder}
                          onChange={(e) => setCustomReminder(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              applyCustomReminder();
                            }
                          }}
                          className={`${inputCls} !w-32 !py-2 !px-3 text-[11px]`}
                        />
                        <button
                          type="button"
                          onClick={applyCustomReminder}
                          disabled={!customReminder}
                          className="px-3 py-2 rounded-xl border border-gray-200 text-[11px] text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                        >
                          Set
                        </button>
                      </div>
                    </div>
                  </Field>
                </div>
              </Section>
            </div>

            {/* ===== Right column: participants + summary ===== */}
            <div className="flex flex-col gap-6">
              <Section
                id="sec-people"
                icon="solar:users-group-rounded-outline"
                title="Participants"
                subtitle="Who should attend?"
                className="flex-1 min-h-0"
                done={participantsDone}
                aside={
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-black text-white tracking-wide">
                    {formData.participation.length} selected
                  </span>
                }
              >
                <div className="flex flex-col gap-3 flex-1 min-h-0">
                  {/* Selected chips */}
                  {formData.participation.length > 0 && (
                    <div className="p-3 rounded-2xl border border-gray-100 bg-[#F8F9FA]/60">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] text-gray-400 tracking-wide">
                          Selected
                        </p>
                        <button
                          type="button"
                          onClick={handleClearEmployees}
                          className="text-[10px] text-gray-400 hover:text-red-500 tracking-wide transition-colors cursor-pointer"
                        >
                          Clear all
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar">
                        {formData.participation.map((uuid) => {
                          const emp = staffByUuid[uuid];
                          return (
                            <div
                              key={uuid}
                              className="flex items-center gap-1.5 bg-white border border-gray-100 text-gray-600 pl-1 pr-2 py-1 rounded-full text-[10px] font-normal tracking-wide"
                            >
                              <Avatar
                                src={emp?.image}
                                name={emp?.name}
                                size="w-5 h-5"
                                text="text-[8px]"
                              />
                              <span className="truncate max-w-[130px]">
                                {cleanText(emp?.name) || uuid}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleEmployeeToggle(uuid)}
                                aria-label={`Remove ${cleanText(emp?.name) || "employee"}`}
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

                  {/* Search */}
                  <div className="relative">
                    <Icon
                      icon="solar:magnifer-outline"
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                    />
                    <input
                      type="text"
                      placeholder="Search by name, designation or department"
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

                  {/* Department filter */}
                  {departments.length > 1 && (
                    <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                      {[
                        { name: "all", count: staff.length },
                        ...departments,
                      ].map((d) => {
                        const active = deptFilter === d.name;
                        return (
                          <button
                            type="button"
                            key={d.name}
                            onClick={() => setDeptFilter(d.name)}
                            aria-pressed={active}
                            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] tracking-wide transition-all cursor-pointer ${
                              active
                                ? "bg-black text-white border-black"
                                : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                            }`}
                          >
                            {d.name === "all" ? "All" : d.name}
                            <span
                              className={
                                active ? "text-white/60" : "text-gray-300"
                              }
                            >
                              {d.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-2 text-[10px] text-gray-400 tracking-wide">
                      <span>
                        {filteredStaff.length}{" "}
                        {filteredStaff.length === 1 ? "employee" : "employees"}
                      </span>
                      {filteredStaff.some((e) => e.is_online) && (
                        <span className="flex items-center gap-1 text-emerald-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {filteredStaff.filter((e) => e.is_online).length}{" "}
                          online
                        </span>
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={handleSelectAllFiltered}
                      disabled={staffLoading || filteredStaff.length === 0}
                      className="text-[10px] text-gray-500 hover:text-black tracking-wide transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {allFilteredSelected ? "Deselect all" : "Select all"}
                    </button>
                  </div>

                  {/* Employee list */}
                  <div className="max-h-[320px] min-h-[240px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
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
                        <Icon
                          icon="solar:danger-circle-linear"
                          className="w-8 h-8 text-red-300"
                        />
                        <p className="text-xs text-red-500 tracking-wide">
                          {staffError}
                        </p>
                        <button
                          type="button"
                          onClick={() => setStaffReload((k) => k + 1)}
                          className="px-4 py-1.5 border border-gray-200 rounded-lg text-[11px] text-gray-600 hover:bg-gray-50 transition-all cursor-pointer"
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
                          No employees match your search
                        </p>
                        {(employeeSearch || deptFilter !== "all") && (
                          <button
                            type="button"
                            onClick={() => {
                              setEmployeeSearch("");
                              setDeptFilter("all");
                            }}
                            className="text-[11px] text-gray-500 underline underline-offset-4 hover:text-black cursor-pointer"
                          >
                            Clear filters
                          </button>
                        )}
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
                            className={`flex items-center gap-3 p-2.5 rounded-2xl border transition-all cursor-pointer select-none outline-none focus-visible:border-gray-400 ${
                              isChecked
                                ? "border-zinc-800 bg-zinc-50 shadow-sm"
                                : "border-gray-100 bg-white hover:bg-[#F8F9FA]/60 hover:border-gray-200"
                            }`}
                          >
                            <Avatar
                              src={employee.image}
                              name={employee.name}
                              size="w-9 h-9"
                              online={Boolean(employee.is_online)}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-800 truncate">
                                {cleanText(employee.name)}
                              </p>
                              <p className="text-[10px] text-gray-400 truncate mt-0.5">
                                {designation || "No designation"}
                                {employee.department_name
                                  ? ` · ${employee.department_name}`
                                  : ""}
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
              <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-800 via-zinc-900 to-black text-white p-4 shadow-lg">
                <span className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-white/5" />
                <div className="relative flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                      <Icon
                        icon="solar:clipboard-list-outline"
                        className="w-4 h-4 text-white"
                      />
                    </div>
                    <h3 className="text-[12px] font-normal text-white/80 tracking-wide">
                      Event summary
                    </h3>
                  </div>
                  {formData.event_type && (
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-white/10 text-white/80 tracking-wide capitalize">
                      {formData.event_type}
                    </span>
                  )}
                </div>

                <p
                  className={`relative text-[15px] leading-snug mb-4 break-words ${
                    formData.title ? "text-white" : "text-white/30"
                  }`}
                >
                  {formData.title.trim() || "Untitled event"}
                </p>

                <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
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
                        ? `${formatReminder(formData.when_to_notify)} before`
                        : ""
                    }
                  />
                  <SummaryRow
                    icon="solar:global-outline"
                    label="Timezone"
                    value={tzName}
                  />
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                      <Icon
                        icon="solar:users-group-rounded-outline"
                        className="w-4 h-4 text-white/70"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] text-white/40 uppercase tracking-widest leading-none mb-1">
                        Participants
                      </p>
                      {formData.participation.length ? (
                        <div className="flex items-center">
                          <div className="flex -space-x-2">
                            {formData.participation.slice(0, 4).map((uuid) => (
                              <Avatar
                                key={uuid}
                                src={staffByUuid[uuid]?.image}
                                name={staffByUuid[uuid]?.name}
                                size="w-6 h-6"
                                text="text-[8px]"
                                className="ring-2 ring-zinc-900"
                              />
                            ))}
                            {formData.participation.length > 4 && (
                              <span className="w-6 h-6 rounded-full bg-white/15 ring-2 ring-zinc-900 flex items-center justify-center text-[8px] text-white">
                                +{formData.participation.length - 4}
                              </span>
                            )}
                          </div>
                          <span className="ml-2 text-xs text-white">
                            {formData.participation.length} selected
                          </span>
                        </div>
                      ) : (
                        <p className="text-xs text-white/30">Not set</p>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* ---------- Footer (fixed) ---------- */}
        <div className="shrink-0 pt-4 mt-3 border-t border-gray-100 bg-white flex items-center justify-between gap-4">
          <p className="hidden sm:block text-[10px] text-gray-400 tracking-wide">
            {doneCount === 4
              ? "Everything is filled in"
              : `${4 - doneCount} ${4 - doneCount === 1 ? "section" : "sections"} left`}
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
                    ? "Saving..."
                    : "Creating..."
                  : isEdit
                    ? "Save changes"
                    : "Create event"}
              </GlowButton>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
