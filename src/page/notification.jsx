import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import announceService from "../service/announceService";
import { getActiveUsersLight } from "../service/employeeService"; // adjust path/file name if different
import { subscribeEvents, subscribeStatus } from "../ws/useChatSocket";
import {
  Calendar,
  Bell,
  MessageSquare,
  ThumbsUp,
  Megaphone,
  XCircle,
  Paperclip,
  Layers,
  RefreshCw,
  ChevronDown,
  CheckCheck,
  Check,
  X,
  MessageCircle,
} from "lucide-react";

/* ----------------------------- helpers ----------------------------- */

const IMAGE_TYPES = ["png", "jpg", "jpeg", "gif", "webp", "svg"];

const isValidDate = (s) => s && !String(s).startsWith("0001");

const formatFullDate = (s) => {
  if (!isValidDate(s)) return "N/A";
  return new Date(s).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatShortDate = (s) => {
  if (!isValidDate(s)) return "N/A";
  return new Date(s).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const timeAgo = (s) => {
  if (!isValidDate(s)) return "";
  const diff = Math.floor((Date.now() - new Date(s).getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatShortDate(s);
};

/* Every notification is shown, even when the server sends empty `data`
   (e.g. a like whose announcement was removed). The cards below have fallback
   text for that, which keeps the list in sync with the server count. */
const hasContent = () => true;

const TABS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "announcement", label: "Announcements" },
  { key: "leave", label: "Leave" },
  { key: "shift_swap", label: "Shifts" },
  { key: "activity", label: "Activity" },
  { key: "chat_text", label: "Messages" },
];

// uuid -> name map, loaded once from the teammates API and reused
let peopleMapPromise = null;
const nameOf = async (uuid) => {
  if (!peopleMapPromise) {
    peopleMapPromise = getActiveUsersLight()
      .then(
        (list) =>
          new Map(
            (Array.isArray(list) ? list : []).map((p) => [
              String(p.uuid),
              p.name || "",
            ]),
          ),
      )
      .catch(() => {
        peopleMapPromise = null; // try again next time
        return new Map();
      });
  }
  const map = await peopleMapPromise;
  return map.get(String(uuid)) || "";
};

// uuid of the logged-in user, read from the JWT ("Uuid" claim)
const getMyUuid = () => {
  try {
    const token = localStorage.getItem("authToken");
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return String(JSON.parse(atob(payload)).Uuid ?? "");
  } catch {
    return "";
  }
};

const tabOf = (type) =>
  type === "announcement_like" || type === "announcement_comment"
    ? "activity"
    : type;

const STATUS_STYLES = {
  approved: {
    icon: "bg-green-50 text-green-600",
    pill: "bg-green-100 text-green-700",
  },
  rejected: {
    icon: "bg-red-50 text-red-600",
    pill: "bg-red-100 text-red-700",
  },
  pending: {
    icon: "bg-amber-50 text-amber-600",
    pill: "bg-amber-100 text-amber-700",
  },
  cancelled: {
    icon: "bg-gray-100 text-gray-600",
    pill: "bg-gray-200 text-gray-700",
  },
};

const statusStyle = (status) =>
  STATUS_STYLES[(status || "pending").toLowerCase()] || STATUS_STYLES.pending;

/* ----------------------------- main ----------------------------- */

const CURTAIN_MS = 300;
// A row counts as "seen" once ~60% of it has been on screen this long.
const SEEN_DELAY_MS = 800;

// WebSocket is the first source. GET is only used for the first load,
// the refresh button, and as a fallback while the socket is down.
// Confirm the real event name(s) your backend sends for notifications.
const NOTIFY_TYPES = new Set(["notification", "new_notification"]);
const FALLBACK_POLL_MS = 30000;

const Notification = ({ onClose }) => {
  const [notifications, setNotifications] = useState([]);
  // Server-side unread total (from GET /employee/notification/count)
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  // Snapshot of which items were unread when the list loaded. Sections use
  // this so rows don't jump around while you scroll and they get marked read.
  const [newIds, setNewIds] = useState(() => new Set());
  // Ids already sent to the server, so each one is only sent once.
  const requestedRef = useRef(new Set());
  // Ids already inserted from the socket, so duplicates are ignored.
  const pushedRef = useRef(new Set());

  /* Curtain animation: mount closed, then drop down on the next frame.
     Closing slides it back up first, then tells the parent to unmount. */
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setIsOpen(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Once the close animation finishes we render nothing at all, so the
  // full-screen backdrop can never be left behind blocking clicks.
  const [closed, setClosed] = useState(false);

  const handleClose = useCallback(() => {
    if (!onClose) {
      console.warn(
        "<Notification> closed without an onClose prop: the parent still thinks it is open, so the next click on the bell will not reopen it. Pass onClose={() => setShow(false)}.",
      );
    }
    setIsOpen(false);
    setTimeout(() => {
      setClosed(true);
      if (onClose) onClose();
    }, CURTAIN_MS);
  }, [onClose]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && handleClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose]);

  const load = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      setActionError(null);

      const [list, count] = await Promise.all([
        announceService.fetchNotifications(),
        // The badge is non-critical: a failing count must not break the list.
        announceService.fetchNotificationCount().catch((e) => {
          console.error("Failed to load notification count:", e);
          return null;
        }),
      ]);

      const rows = Array.isArray(list) ? list : [];
      setNotifications(rows);
      setNewIds(
        new Set(
          rows.filter((n) => hasContent(n) && !n.is_read).map((n) => n.id),
        ),
      );
      setUnreadTotal(
        count && typeof count.unread === "number"
          ? count.unread
          : rows.filter((n) => hasContent(n) && !n.is_read).length,
      );
    } catch (err) {
      console.error("Failed to load notifications:", err);
      setError(
        "We couldn't load your notifications. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* Mark one notification as read — optimistic, rolls back on failure. */
  const markRead = useCallback(async (id) => {
    if (requestedRef.current.has(id)) return;
    requestedRef.current.add(id);

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    setUnreadTotal((c) => Math.max(0, c - 1));
    setActionError(null);

    // Rows built from a socket event have no server id yet: local only.
    // The next GET returns the real row with the right read state.
    if (String(id).startsWith("ws-")) return;

    try {
      await announceService.markNotificationRead(id);
    } catch (err) {
      console.error("Failed to mark notification read:", err);
      requestedRef.current.delete(id); // allow a retry on the next view
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: false } : n)),
      );
      setUnreadTotal((c) => c + 1);
      setActionError("Couldn't update that notification. Please try again.");
    }
  }, []);

  /* Mark everything as read. We re-sync from the server afterwards so the
     list and badge reflect the real final state. */
  const markAllRead = useCallback(async () => {
    setMarkingAll(true);
    setActionError(null);
    try {
      await announceService.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadTotal(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      setActionError("Couldn't mark all as read. Please try again.");
    } finally {
      setMarkingAll(false);
    }
  }, []);

  /* A notification pushed over the socket: insert it straight into the list.
     If the payload isn't a full notification, fall back to one GET. */
  const pushNotification = useCallback(
    (payload) => {
      if (!payload || payload.id == null || !payload.type) {
        load(true);
        return;
      }

      const key = String(payload.id);
      if (pushedRef.current.has(key)) return;
      pushedRef.current.add(key);

      setNotifications((prev) =>
        prev.some((n) => String(n.id) === key)
          ? prev
          : [{ is_read: false, ...payload }, ...prev],
      );

      if (!payload.is_read) {
        // keep it under "New notifications" and bump the badge
        setNewIds((prev) => new Set(prev).add(payload.id));
        setUnreadTotal((c) => c + 1);
      }
    },
    [load],
  );

  /* Socket first, GET second:
     - socket connected: new items arrive as events, no polling
     - socket down: poll every 30s, then one catch-up GET on reconnect */
  useEffect(() => {
    let poll = null;
    let needSync = false;

    const stopPoll = () => {
      clearInterval(poll);
      poll = null;
    };

    const offEvents = subscribeEvents(async (evt) => {
      // chat message notification: { conversation_id, message_id,
      // sender_id, sender_name, preview } -> build a row straight away
      if (evt.type === "chat_text") {
        const d = evt.data ?? {};
        if (d.message_id == null) return;
        if (String(d.sender_id) === getMyUuid()) return; // my own message

        const key = `msg-${d.message_id}`;
        if (pushedRef.current.has(key)) return;
        pushedRef.current.add(key);

        // the socket often sends sender_name "": look the person up by uuid
        const senderName = d.sender_name || (await nameOf(d.sender_id));

        const row = {
          id: `ws-${d.message_id}`,
          type: "chat_text",
          action: "",
          created_at: evt.created_at || new Date().toISOString(),
          is_read: false,
          data: { ...d, sender_name: senderName },
        };
        setNotifications((prev) =>
          prev.some((n) => String(n.data?.message_id) === String(d.message_id))
            ? prev
            : [row, ...prev],
        );
        setNewIds((prev) => new Set(prev).add(row.id));
        setUnreadTotal((c) => c + 1);
        return;
      }

      if (!NOTIFY_TYPES.has(evt.type)) return;
      pushNotification(evt.data);
    });

    const offStatus = subscribeStatus((isOnline) => {
      if (isOnline) {
        stopPoll();
        if (needSync) {
          needSync = false;
          load(true);
        }
      } else {
        needSync = true;
        if (!poll) {
          poll = setInterval(() => {
            if (document.visibilityState === "visible") load(true);
          }, FALLBACK_POLL_MS);
        }
      }
    });

    return () => {
      offEvents();
      offStatus();
      stopPoll();
    };
  }, [load, pushNotification]);

  const visible = useMemo(
    () =>
      notifications
        .filter(hasContent)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [notifications],
  );

  const counts = useMemo(() => {
    const c = { all: visible.length, unread: 0 };
    visible.forEach((n) => {
      const k = tabOf(n.type);
      c[k] = (c[k] || 0) + 1;
      if (!n.is_read) c.unread += 1;
    });
    return c;
  }, [visible]);

  const grouped = useMemo(() => {
    let list = visible;
    if (activeTab === "unread") list = visible.filter((n) => newIds.has(n.id));
    else if (activeTab !== "all")
      list = visible.filter((n) => tabOf(n.type) === activeTab);

    // New (unread) first; old (read) always shown below.
    // If nothing is new, only the "Old notifications" header appears.
    const fresh = list.filter((n) => newIds.has(n.id));
    const old = list.filter((n) => !newIds.has(n.id));
    const sections = [];
    if (fresh.length)
      sections.push({ label: "New notifications", items: fresh });
    if (old.length) sections.push({ label: "Old notifications", items: old });
    return sections;
  }, [visible, activeTab, newIds]);

  if (closed) return null;

  // Portal to <body> so no parent (overflow, transform, z-index) can clip
  // or trap the full-screen curtain.
  return createPortal(
    <>
      {/* Dim backdrop */}
      <div
        onClick={handleClose}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 motion-reduce:transition-none ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Curtain panel: full width, 80% of viewport height */}
      <div
        role="dialog"
        aria-label="Notifications"
        className={`fixed inset-x-0 top-0 z-50 w-full h-[80vh] bg-white rounded-b-2xl shadow-2xl flex flex-col overflow-hidden transition-transform duration-300 ease-out motion-reduce:transition-none ${
          isOpen ? "translate-y-0" : "-translate-y-full pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3 bg-white shrink-0 border-b border-gray-100">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-black">Notifications</h2>
                {unreadTotal > 0 && (
                  <span
                    className="text-[10px] font-semibold bg-black text-white px-1.5 py-0.5 rounded-full leading-none"
                    aria-label={`${unreadTotal} unread notifications`}
                  >
                    {unreadTotal > 99 ? "99+" : unreadTotal}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-500">
                Announcements, leave and shift updates
              </p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => load(true)}
                disabled={refreshing || loading}
                aria-label="Refresh notifications"
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-black disabled:opacity-50 transition-colors"
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                />
              </button>
              <button
                onClick={handleClose}
                aria-label="Close notifications"
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-black transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter tabs */}
          <div
            className="flex gap-1.5 mt-3 overflow-x-auto [scrollbar-width:none]"
            role="tablist"
          >
            {TABS.map((tab) => {
              const count = counts[tab.key] || 0;
              const active = activeTab === tab.key;
              if (tab.key !== "all" && count === 0 && !active) return null;
              return (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.key)}
                  className={`shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors ${
                    active
                      ? "bg-black text-white"
                      : "bg-gray-100 text-black hover:bg-gray-200"
                  }`}
                >
                  {tab.label}
                  <span
                    className={
                      active ? "ml-1 opacity-80" : "ml-1 text-gray-400"
                    }
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {actionError && (
            <p
              role="alert"
              className="mt-2 text-[11px] text-red-600 bg-red-50 border border-red-100 rounded px-2 py-1"
            >
              {actionError}
            </p>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:thin]">
          {loading ? (
            <Skeleton />
          ) : error ? (
            <div className="p-8 text-center">
              <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <h3 className="text-xs font-semibold text-black">
                Couldn't load notifications
              </h3>
              <p className="text-[11px] text-gray-500 mt-1 mb-3">{error}</p>
              <button
                onClick={() => load()}
                className="text-[11px] font-semibold text-black hover:bg-gray-200 bg-gray-100 px-3 py-1.5 rounded-lg"
              >
                Try again
              </button>
            </div>
          ) : grouped.length === 0 ? (
            <div className="p-12 text-center">
              <Layers className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs font-medium text-black">
                You're all caught up
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                New announcements and requests will show up here.
              </p>
            </div>
          ) : (
            grouped.map((group) => (
              <section key={group.label}>
                <h3 className="sticky top-0 px-4 py-1.5 text-[11px] font-semibold text-gray-500 bg-gray-50/95 backdrop-blur border-y border-gray-100">
                  {group.label}
                </h3>
                <div className="divide-y divide-gray-50">
                  {group.items.map((n) => (
                    <NotificationCard key={n.id} item={n} onRead={markRead} />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </>,
    document.body,
  );
};

/* ----------------------------- pieces ----------------------------- */

const Skeleton = () => (
  <div className="divide-y divide-gray-50" aria-busy="true">
    {[0, 1, 2, 3].map((i) => (
      <div key={i} className="p-3.5 flex gap-3 animate-pulse">
        <div className="w-8 h-8 rounded-xl bg-gray-100 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-gray-100 rounded w-2/3" />
          <div className="h-2.5 bg-gray-100 rounded w-full" />
          <div className="h-2.5 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

/* Unread rows are marked read automatically once they've been on screen
   (≥60% visible) for SEEN_DELAY_MS — no click needed. */
const Row = ({
  icon,
  iconClass = "bg-gray-100 text-black",
  time,
  createdAt,
  children,
  tint = "",
  unread = false,
  onMarkRead,
}) => {
  const rowRef = useRef(null);
  const onSeenRef = useRef(onMarkRead);
  onSeenRef.current = onMarkRead;

  useEffect(() => {
    const el = rowRef.current;
    if (!unread || !el || typeof IntersectionObserver === "undefined") return;

    let timer;
    const io = new IntersectionObserver(
      ([entry]) => {
        clearTimeout(timer);
        if (entry.isIntersecting) {
          timer = setTimeout(() => onSeenRef.current?.(), SEEN_DELAY_MS);
        }
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      clearTimeout(timer);
      io.disconnect();
    };
  }, [unread]);

  return (
    <div
      ref={rowRef}
      className={`p-3.5 hover:bg-gray-50 transition-colors duration-700 flex items-start gap-3 ${
        unread ? "bg-gray-50" : tint
      }`}
    >
      <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${iconClass}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">{children.head}</div>
          <div className="flex items-center gap-1.5 shrink-0">
            <time
              dateTime={createdAt}
              title={formatFullDate(createdAt)}
              className="text-[10px] text-gray-400 font-medium"
            >
              {time}
            </time>
            {!unread && (
              <Check
                className="w-3.5 h-3.5 text-green-600"
                strokeWidth={3}
                aria-label="Read"
              />
            )}
          </div>
        </div>
        {children.body}
      </div>
    </div>
  );
};

const ExpandableText = ({ text }) => {
  const [open, setOpen] = useState(false);
  const long = text.length > 140;
  return (
    <div className="mt-1">
      <p
        className={`text-[11px] text-black whitespace-pre-line leading-relaxed ${
          !open && long ? "line-clamp-2" : ""
        }`}
      >
        {text}
      </p>
      {long && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpen((o) => !o);
          }}
          className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] font-semibold text-black underline hover:text-gray-600"
        >
          {open ? "Show less" : "Read more"}
          <ChevronDown
            className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
      )}
    </div>
  );
};

const Attachment = ({ url, type }) => {
  const [open, setOpen] = useState(false);
  const [broken, setBroken] = useState(false);
  const isImage = IMAGE_TYPES.includes((type || "").toLowerCase()) && !broken;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-black bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-lg border border-gray-200 transition-colors"
      >
        <Paperclip className="w-3.5 h-3.5" />
        Attachment{type ? ` · ${type.toUpperCase()}` : ""}
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="mt-2">
          {isImage ? (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="block overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
            >
              <img
                src={url}
                alt="Announcement attachment"
                loading="lazy"
                onError={() => setBroken(true)}
                className="w-full max-h-72 object-contain"
              />
            </a>
          ) : (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-black underline hover:text-gray-600"
            >
              <Paperclip className="w-3 h-3" />
              {broken ? "Couldn't preview — open file" : "Open file"}
            </a>
          )}
        </div>
      )}
    </div>
  );
};

/* ----------------------------- cards ----------------------------- */

const NotificationCard = ({ item, onRead }) => {
  const { id, type, created_at, data = {} } = item;
  const time = timeAgo(created_at);
  const unread = !item.is_read;
  const markRead = () => onRead(id);

  if (type === "leave") {
    const s = statusStyle(data.status);
    return (
      <Row
        icon={<Calendar className="w-4 h-4" />}
        iconClass={s.icon}
        time={time}
        createdAt={created_at}
        unread={unread}
        onMarkRead={markRead}
      >
        {{
          head: (
            <p className="text-xs text-black leading-snug">
              <span className="font-semibold text-black">
                {data.name || "Employee"}
              </span>
              {data.designation ? ` (${data.designation})` : ""} applied for
              leave.
            </p>
          ),
          body: (
            <>
              {data.reason && (
                <p className="text-[11px] text-black mt-1.5 bg-gray-50 px-2 py-1.5 rounded border border-gray-100">
                  {data.reason}
                </p>
              )}
              <div className="flex items-center gap-2.5 mt-2 text-[10px] font-medium text-gray-500">
                {data.no_of_days && (
                  <span className="bg-gray-100 text-black px-1.5 py-0.5 rounded">
                    {data.no_of_days}{" "}
                    {Number(data.no_of_days) === 1 ? "day" : "days"}
                  </span>
                )}
                {data.leave_ref_no && (
                  <span className="text-gray-400">
                    Ref #{data.leave_ref_no}
                  </span>
                )}
                <span
                  className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ml-auto ${s.pill}`}
                >
                  {data.status || "Pending"}
                </span>
              </div>
            </>
          ),
        }}
      </Row>
    );
  }

  if (type === "announcement") {
    return (
      <Row
        icon={<Megaphone className="w-4 h-4" />}
        time={time}
        createdAt={created_at}
        unread={unread}
        onMarkRead={markRead}
      >
        {{
          head: (
            <h4 className="text-xs font-bold text-black truncate">
              {data.title || "Announcement"}
            </h4>
          ),
          body: (
            <>
              {data.description && <ExpandableText text={data.description} />}
              {data.attachment && (
                <Attachment url={data.attachment} type={data.attachment_type} />
              )}
              {!data.title && !data.description && !data.attachment && (
                <p className="text-[11px] text-gray-500 mt-1">
                  No details available for this announcement.
                </p>
              )}
            </>
          ),
        }}
      </Row>
    );
  }

  if (type === "announcement_like" || type === "announcement_comment") {
    const isLike = type === "announcement_like";
    return (
      <Row
        icon={
          isLike ? (
            <ThumbsUp className="w-3.5 h-3.5" />
          ) : (
            <MessageSquare className="w-3.5 h-3.5" />
          )
        }
        time={time}
        createdAt={created_at}
        unread={unread}
        onMarkRead={markRead}
      >
        {{
          head: (
            <p className="text-xs text-black leading-snug">
              <span className="font-semibold text-black">
                {isLike ? "New like on " : "New comment on "}
              </span>
              {data.title || "an announcement"}
            </p>
          ),
          body: data.description ? (
            <p
              className={`text-[11px] mt-1 line-clamp-2 ${
                isLike ? "text-gray-500" : "text-black italic"
              }`}
            >
              {isLike ? data.description : `"${data.description}"`}
            </p>
          ) : null,
        }}
      </Row>
    );
  }

  if (type === "chat_text") {
    return (
      <Row
        icon={<MessageCircle className="w-4 h-4" />}
        time={time}
        createdAt={created_at}
        unread={unread}
        onMarkRead={markRead}
      >
        {{
          head: (
            <p className="text-xs text-black leading-snug">
              <span className="font-semibold text-black">
                {data.sender_name || "Someone"}
              </span>{" "}
              sent you a message.
            </p>
          ),
          body: data.preview ? (
            <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">
              {data.preview}
            </p>
          ) : null,
        }}
      </Row>
    );
  }

  if (type === "shift_swap") {
    const s = statusStyle(data.status);
    return (
      <Row
        icon={<RefreshCw className="w-3.5 h-3.5" />}
        iconClass={s.icon}
        time={time}
        createdAt={created_at}
        unread={unread}
        onMarkRead={markRead}
      >
        {{
          head: (
            <p className="text-xs text-black leading-snug">
              <span className="font-semibold text-black">
                {data.requester_name || "Someone"}
              </span>{" "}
              requested a shift swap with{" "}
              <span className="font-semibold text-black">
                {data.target_name || "a teammate"}
              </span>
              {isValidDate(data.swap_date) && (
                <>
                  {" "}
                  on{" "}
                  <span className="font-medium text-black">
                    {formatShortDate(data.swap_date)}
                  </span>
                </>
              )}
              .
            </p>
          ),
          body: (
            <div className="mt-2">
              <span
                className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${s.pill}`}
              >
                {data.status || "Pending"}
              </span>
            </div>
          ),
        }}
      </Row>
    );
  }

  // Unknown types still get a row, so nothing is silently hidden.
  return (
    <Row
      icon={<Bell className="w-4 h-4" />}
      time={time}
      createdAt={created_at}
      unread={unread}
      onMarkRead={markRead}
    >
      {{
        head: (
          <p className="text-xs text-black leading-snug">
            {item.action ? String(item.action) : "New notification"}
          </p>
        ),
        body: null,
      }}
    </Row>
  );
};

export default Notification;
