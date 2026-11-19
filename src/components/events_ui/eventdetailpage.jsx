import React, { useState, useEffect, useMemo } from "react";
import {
  FiClock,
  FiCalendar,
  FiArrowLeft,
  FiFileText,
  FiTrash2,
  FiEdit2,
  FiMapPin,
  FiVideo,
  FiBell,
  FiGlobe,
  FiUsers,
  FiCopy,
  FiExternalLink,
} from "react-icons/fi";
import { toast } from "react-toastify";
import {
  showApiToast,
  resolveApiSuccess,
  resolveApiError,
} from "../../utils/apiToast";
import { deleteEventApi } from "../../service/eventservice";
import { fetchTimeZone } from "../../service/eventservices";
import { getActiveUsersLight } from "../../service/employeeService";
import DeleteConfirmationModal from "../../ui/deletemodal";
import EventEdit from "./eventedit";

/* ---------- Helpers ---------- */

const PARTICIPANT_PREVIEW = 5;

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

// true only for real IANA names like "Asia/Kolkata" (not ids like "1")
const isValidTimeZone = (tz) => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
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

const cleanText = (value) => (value || "").replace(/\s+/g, " ").trim();

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

// "00:15:00" or "15" -> 15
const reminderToMinutes = (value) => {
  if (value === undefined || value === null || value === "") return 0;
  const str = String(value);
  if (str.includes(":")) {
    const [h = 0, m = 0] = str.split(":").map(Number);
    return h * 60 + m;
  }
  return Number(str) || 0;
};

// Where the event is in time, relative to now
const getStatus = (start, end) => {
  if (!start) return null;
  const now = new Date();
  if (end && now > end) {
    return { label: "Ended", cls: "bg-white/10 text-white/60", pulse: false };
  }
  if (now >= start) {
    return {
      label: "Happening now",
      cls: "bg-emerald-400/20 text-emerald-300",
      pulse: true,
    };
  }
  const diff = Math.round((start - now) / 60000);
  const label =
    diff < 60
      ? `Starts in ${Math.max(diff, 1)} min`
      : diff < 1440
        ? `Starts in ${Math.floor(diff / 60)}h`
        : `Starts in ${Math.floor(diff / 1440)}d`;
  return { label, cls: "bg-white/15 text-white", pulse: false };
};

/* ---------- UI pieces ---------- */

// Photo when the person has one, otherwise a coloured letter avatar
const Avatar = ({ src, name, size = "w-9 h-9", text = "text-[11px]" }) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (src && !failed) {
    return (
      <img
        src={src}
        onError={() => setFailed(true)}
        alt=""
        className={`${size} rounded-full object-cover border border-gray-100 shrink-0`}
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className={`${size} ${text} ${getAvatarTone(name)} rounded-full flex items-center justify-center tracking-wide select-none shrink-0`}
    >
      {getInitials(name)}
    </div>
  );
};

const Card = ({ icon: IconCmp, title, aside, children, className = "" }) => (
  <section
    className={`rounded-2xl border border-gray-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden ${className}`}
  >
    <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[#FBFBFC] border-b border-gray-100">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 text-gray-500 flex items-center justify-center shrink-0">
          <IconCmp size={14} />
        </div>
        <h3 className="text-[12px] font-normal text-gray-800 tracking-wide truncate">
          {title}
        </h3>
      </div>
      {aside}
    </div>
    <div className="p-4">{children}</div>
  </section>
);

// Label + value pair used inside cards
const InfoRow = ({ icon: IconCmp, label, children }) => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-lg bg-[#F8F9FA] text-gray-400 flex items-center justify-center shrink-0">
      <IconCmp size={14} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[9px] text-gray-400 uppercase tracking-widest leading-none mb-1.5">
        {label}
      </p>
      <div className="text-gray-800 text-xs leading-snug break-words">
        {children}
      </div>
    </div>
  </div>
);

/* ---------- Page ---------- */

const EventDetailPage = ({ event, onBack, onDeleteSuccess }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [timeZones, setTimeZones] = useState([]);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showAllPeople, setShowAllPeople] = useState(false);

  // Load the timezone list so an id like "1" can be turned into "Asia/Kolkata"
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

  // Participants only carry a uuid, so look up their names and photos
  const hasParticipants = (event?.participation || []).length > 0;
  useEffect(() => {
    if (!hasParticipants) return undefined;
    let mounted = true;
    setUsersLoading(true);
    getActiveUsersLight()
      .then((data) => {
        if (mounted) setUsers(Array.isArray(data) ? data : []);
      })
      .catch(() => mounted && setUsers([]))
      .finally(() => mounted && setUsersLoading(false));
    return () => {
      mounted = false;
    };
  }, [hasParticipants]);

  const participants = useMemo(() => {
    const byUuid = {};
    users.forEach((u) => {
      byUuid[u.uuid] = u;
    });
    return (event?.participation || [])
      .map((p) => (typeof p === "string" ? { uuid: p } : p))
      .map((p) => {
        const uuid = p.uuid || p.user_id || p.id;
        const user = byUuid[uuid];
        return {
          uuid,
          name: cleanText(user?.name || p.name) || "Unknown employee",
          image: user?.image || p.image || p.imageUrl || "",
          designation: cleanText(user?.designation_name || p.designation_name),
          online: user?.is_online,
        };
      })
      .filter((p) => p.uuid);
  }, [event, users]);

  if (!event) return null;

  // Show the edit window instead of the details
  if (isEditing) {
    return (
      <EventEdit
        event={event}
        onClose={() => setIsEditing(false)}
        onUpdateSuccess={async () => {
          await onDeleteSuccess?.(); // refreshes the React Query cache
          onBack?.(); // closes the drawer
        }}
      />
    );
  }

  // Resolve the event's timezone (id or name) to a valid IANA name
  const resolveTimezone = () => {
    const raw = String(event.time_zone ?? event.timezone ?? "").trim();
    if (!raw) return "Asia/Kolkata";

    const match = timeZones.find(
      (tz) => String(tz.id) === raw || tz.name === raw,
    );
    if (match && isValidTimeZone(match.name)) return match.name;

    if (isValidTimeZone(raw)) return raw;
    return "Asia/Kolkata";
  };

  const targetTimezone = resolveTimezone();

  const fmt = (date, options) => {
    try {
      return new Intl.DateTimeFormat("en-US", {
        ...options,
        timeZone: targetTimezone,
      }).format(date);
    } catch {
      return "";
    }
  };

  const startDate = toDate(event.start_date || event.start);
  const endDate = toDate(event.end_date || event.end);

  const formatTime = (date) =>
    date
      ? fmt(date, { hour: "2-digit", minute: "2-digit", hour12: true })
      : "N/A";

  const longDate = (date) =>
    date
      ? fmt(date, {
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : "Date not set";

  const shortDate = (date) =>
    date ? fmt(date, { weekday: "short", day: "2-digit", month: "short" }) : "";

  const sameDay =
    startDate && endDate && longDate(startDate) === longDate(endDate);

  const durationMinutes =
    startDate && endDate
      ? Math.max(0, Math.round((endDate - startDate) / 60000))
      : 0;

  const status = getStatus(startDate, endDate);
  const isOnline = event.event_type === "online";
  const isOffline = event.event_type === "offline";
  const meetingUrl = event.meeting_url || "";
  const reminderMinutes = reminderToMinutes(event.reminder_before);
  const visiblePeople = showAllPeople
    ? participants
    : participants.slice(0, PARTICIPANT_PREVIEW);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(meetingUrl);
      showApiToast("success", "Meeting link copied");
    } catch {
      showApiToast("error", "Couldn't copy the link");
    }
  };

  const handleConfirmDelete = async () => {
    setIsModalOpen(false);
    setIsDeleting(true);

    const tid = toast.loading("Deleting event...");

    try {
      const eventId = event.id || event._id;
      const res = await deleteEventApi(eventId);
      resolveApiSuccess(tid, res, "Event deleted successfully");
      if (onDeleteSuccess) await onDeleteSuccess();
      if (onBack) onBack();
    } catch (err) {
      console.error("Failed to delete the event:", err);
      resolveApiError(tid, err, "Failed to delete the event. Please try again");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="font-poppins font-normal text-[12px] h-full min-h-0 flex flex-col bg-white text-black">
      {/* ---------- Back ---------- */}
      <button
        type="button"
        onClick={onBack}
        disabled={isDeleting}
        className="shrink-0 self-start flex items-center gap-2 mb-3 pl-2.5 pr-4 py-1.5 rounded-full border border-gray-100 text-gray-500 hover:text-black hover:bg-gray-50 transition-all uppercase tracking-widest text-[10px] cursor-pointer disabled:opacity-50"
      >
        <FiArrowLeft size={13} /> Back to calendar
      </button>

      {/* ---------- Scrolling body ---------- */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-2 -mr-2 space-y-4 custom-scrollbar">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-800 via-zinc-900 to-black text-white p-4 shadow-lg">
          <span className="absolute -right-10 -top-12 w-40 h-40 rounded-full bg-white/5" />
          <span className="absolute right-10 top-14 w-20 h-20 rounded-full bg-white/5" />

          <div className="relative flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-[10px] tracking-wide">
              {isOnline ? <FiVideo size={11} /> : <FiMapPin size={11} />}
              {isOnline ? "Online" : isOffline ? "Offline" : "Event"}
            </span>
            {status && (
              <span
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] tracking-wide ${status.cls}`}
              >
                {status.pulse && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
                {status.label}
              </span>
            )}
          </div>

          <h2 className="relative mt-3 text-[17px] leading-snug break-words">
            {event.title || "Untitled event"}
          </h2>

          <div className="relative mt-4 flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/10 flex flex-col items-center justify-center shrink-0">
              <span className="text-[9px] uppercase tracking-widest text-white/60 leading-none">
                {startDate ? fmt(startDate, { month: "short" }) : "—"}
              </span>
              <span className="text-[22px] leading-none mt-1">
                {startDate ? fmt(startDate, { day: "2-digit" }) : "--"}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-[13px] leading-tight">
                {formatTime(startDate)} – {formatTime(endDate)}
              </p>
              <p className="text-[11px] text-white/60 mt-1 leading-tight">
                {startDate ? fmt(startDate, { weekday: "long" }) : ""}
                {durationMinutes ? ` · ${formatDuration(durationMinutes)}` : ""}
              </p>
            </div>
          </div>
        </section>

        {/* When & where */}
        <Card icon={FiCalendar} title="Date & location">
          <div className="space-y-4">
            <InfoRow icon={FiCalendar} label={sameDay ? "Date" : "Dates"}>
              {sameDay || !endDate ? (
                longDate(startDate)
              ) : (
                <>
                  {shortDate(startDate)}{" "}
                  <span className="text-gray-300">→</span> {shortDate(endDate)}
                </>
              )}
            </InfoRow>

            <InfoRow icon={FiClock} label="Time">
              {formatTime(startDate)} – {formatTime(endDate)}
              {durationMinutes ? (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-[#F8F9FA] text-[10px] text-gray-500">
                  {formatDuration(durationMinutes)}
                </span>
              ) : null}
            </InfoRow>

            <InfoRow icon={FiGlobe} label="Timezone">
              {targetTimezone}
            </InfoRow>

            <InfoRow
              icon={isOnline ? FiVideo : FiMapPin}
              label={isOnline ? "Meeting link" : "Place"}
            >
              {isOnline && meetingUrl ? (
                <div className="flex flex-col gap-2">
                  <p className="text-gray-500 truncate">{meetingUrl}</p>
                  <div className="flex items-center gap-2">
                    <a
                      href={meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black text-white text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-colors"
                    >
                      <FiExternalLink size={11} /> Join
                    </a>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-gray-200 text-gray-600 text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <FiCopy size={11} /> Copy
                    </button>
                  </div>
                </div>
              ) : isOffline && event.place ? (
                event.place
              ) : (
                <span className="text-gray-300">Not specified</span>
              )}
            </InfoRow>

            <InfoRow icon={FiBell} label="Reminder">
              {reminderMinutes ? (
                `${reminderMinutes >= 60 ? formatDuration(reminderMinutes) : `${reminderMinutes} min`} before`
              ) : (
                <span className="text-gray-300">No reminder</span>
              )}
            </InfoRow>
          </div>
        </Card>

        {/* Description */}
        <Card icon={FiFileText} title="Description">
          <p
            className={`leading-relaxed whitespace-pre-line break-words ${
              event.description ? "text-gray-600" : "text-gray-300 italic"
            }`}
          >
            {event.description || "No description provided for this event."}
          </p>
        </Card>

        {/* Participants */}
        <Card
          icon={FiUsers}
          title="Participants"
          aside={
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-black text-white tracking-wide">
              {participants.length}
            </span>
          }
        >
          {participants.length === 0 ? (
            <p className="py-2 text-center text-[11px] text-gray-300 italic">
              No participants added
            </p>
          ) : usersLoading ? (
            <div className="space-y-3">
              {Array.from({ length: Math.min(participants.length, 3) }).map(
                (_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 animate-pulse"
                  >
                    <div className="w-9 h-9 rounded-full bg-gray-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-2.5 w-1/2 bg-gray-100 rounded" />
                      <div className="h-2 w-1/3 bg-gray-100 rounded" />
                    </div>
                  </div>
                ),
              )}
            </div>
          ) : (
            <>
              <ul className="space-y-1">
                {visiblePeople.map((p) => (
                  <li
                    key={p.uuid}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F8F9FA] transition-colors"
                  >
                    <div className="relative">
                      <Avatar src={p.image} name={p.name} />
                      {p.online !== undefined && (
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                            p.online ? "bg-emerald-500" : "bg-gray-300"
                          }`}
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-800 truncate">{p.name}</p>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">
                        {p.designation || "No designation"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              {participants.length > PARTICIPANT_PREVIEW && (
                <button
                  type="button"
                  onClick={() => setShowAllPeople((v) => !v)}
                  className="mt-3 w-full py-2 rounded-xl border border-gray-100 text-[10px] uppercase tracking-widest text-gray-500 hover:bg-gray-50 hover:text-black transition-all cursor-pointer"
                >
                  {showAllPeople
                    ? "Show less"
                    : `Show all ${participants.length}`}
                </button>
              )}
            </>
          )}
        </Card>
      </div>

      {/* ---------- Footer (fixed) ---------- */}
      <div className="shrink-0 pt-4 mt-3 border-t border-gray-100 bg-white flex gap-3">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          disabled={isDeleting}
          className="flex-1 py-3 rounded-xl bg-black text-white hover:bg-zinc-800 active:scale-[0.98] transition-all uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-md"
        >
          <FiEdit2 size={14} /> Edit
        </button>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          disabled={isDeleting}
          className="flex-1 py-3 border border-red-100 text-red-500 rounded-xl hover:bg-red-50 active:scale-[0.98] transition-all uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <FiTrash2 size={14} /> {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </div>

      <DeleteConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={event.title || "this event"}
      />
    </div>
  );
};

export default EventDetailPage;
