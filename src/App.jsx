import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { Toaster } from "react-hot-toast";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import GlobalLoader from "./ui/globalloaer";
import {
  startChatSocket,
  stopChatSocket,
  subscribeEvents,
  subscribeStatus,
} from "../src/ws/useChatSocket";
import announceService from "../src/service/announceService";
import { getActiveUsersLight } from "../src/service/employeeService";
import {
  describeState,
  isAppActive,
  requestOpenConversation,
  showChatNotification,
  useChatNotificationLifecycle,
  whyNotNative,
} from "./Hooks/useNotifications";

// Connects the shared WebSocket as soon as a token exists,
// and disconnects when the token is removed (logout).
function useChatSocketAuth() {
  useEffect(() => {
    let running = false;

    const sync = () => {
      const hasToken = !!localStorage.getItem("authToken");
      if (hasToken && !running) {
        running = true;
        startChatSocket(); // token found, connect
      } else if (!hasToken && running) {
        running = false;
        stopChatSocket(); // logged out, disconnect
      }
    };

    sync(); // on app open
    const timer = setInterval(sync, 1000); // catches login/logout in this tab
    window.addEventListener("storage", sync); // catches other tabs

    return () => {
      clearInterval(timer);
      window.removeEventListener("storage", sync);
      stopChatSocket();
    };
  }, []);
}

/* ------------------------- live notification toasts ------------------------- */

// Confirm the real event name(s) your backend sends for notifications.
const NOTIFY_TYPES = new Set(["notification", "new_notification"]);
// While the socket is down, GET the list this often and toast anything new.
const FALLBACK_POLL_MS = 30000;
// Don't toast chat messages while the user is already inside chat.
const CHAT_PATH = "/chat";

// TEMPORARY: shows an on-screen note explaining what happened with each
// system notification. Set to false once it works.
const NOTIFY_DEBUG = true;
const debugToast = (msg) =>
  NOTIFY_DEBUG && toast.warn(`[notify debug] ${msg}`, { autoClose: false });

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

// uuid -> name map, loaded once and reused (socket often sends sender_name "")
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

// One key per real-world event, shared by socket and GET so nothing toasts twice
const keyOf = (n) =>
  n.type === "chat_text" && n.data?.message_id != null
    ? `msg-${n.data.message_id}`
    : n.id != null
      ? `n-${n.id}`
      : null;

// Title + body text for a notification (same shape from socket and GET)
const textOf = (n) => {
  const d = n.data ?? {};
  switch (n.type) {
    case "chat_text":
      return {
        title: `${d.sender_name || "Someone"} sent you a message`,
        body: d.preview || "",
      };
    case "announcement":
      return {
        title: d.title || "New announcement",
        body: d.description || "",
      };
    case "announcement_like":
      return {
        title: `New like on ${d.title || "an announcement"}`,
        body: "",
      };
    case "announcement_comment":
      return {
        title: `New comment on ${d.title || "an announcement"}`,
        body: d.description || "",
      };
    case "leave":
      return {
        title: `${d.name || "Employee"} applied for leave`,
        body: d.reason || "",
      };
    case "shift_swap":
      return {
        title: `${d.requester_name || "Someone"} requested a shift swap`,
        body: d.target_name ? `With ${d.target_name}` : "",
      };
    default:
      return {
        title: n.action ? String(n.action) : "New notification",
        body: "",
      };
  }
};

const showToast = (key, { title, body }) => {
  toast.info(
    <div>
      <div style={{ fontWeight: 600, fontSize: 14 }}>{title}</div>
      {body && (
        <div
          style={{
            fontSize: 12,
            opacity: 0.75,
            marginTop: 2,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {body}
        </div>
      )}
    </div>,
    { toastId: key || undefined }, // same id = never shown twice
  );
};

/* Socket first, GET second:
   - socket connected: every event becomes a toast straight away
   - socket down: poll the list every 30s and toast unread items not seen yet
   - socket back: one catch-up GET

   Chat messages (chat_text):
   - app visible + focused  -> React Toastify (not while inside /chat)
   - tab hidden / minimized / window unfocused -> system notification
     (if permission is granted; otherwise the old toast behaviour)       */
function useLiveNotificationToasts(navigateRef) {
  useEffect(() => {
    const seen = new Set();
    let poll = null;
    let needSync = false;
    let baselineDone = false; // first GET only records what already exists

    const remember = (key) => {
      if (!key) return true;
      if (seen.has(key)) return false;
      seen.add(key);
      if (seen.size > 500) seen.delete(seen.values().next().value);
      return true;
    };

    // GET fallback: toast unread items we haven't seen
    const syncFromServer = async () => {
      try {
        const list = await announceService.fetchNotifications();
        const rows = Array.isArray(list) ? list : [];
        if (!baselineDone) {
          rows.forEach((n) => remember(keyOf(n)));
          baselineDone = true;
          return;
        }
        const me = getMyUuid();
        const fresh = rows
          .filter((n) => !n.is_read)
          .filter(
            (n) =>
              !(n.type === "chat_text" && String(n.data?.sender_id) === me),
          )
          .filter((n) => remember(keyOf(n)))
          .reverse(); // oldest first
        for (const n of fresh) {
          if (
            n.type === "chat_text" &&
            window.location.pathname.startsWith(CHAT_PATH)
          )
            continue;
          showToast(keyOf(n), textOf(n));
        }
      } catch (err) {
        console.warn("[toast] fallback GET failed", err);
      }
    };

    const stopPoll = () => {
      clearInterval(poll);
      poll = null;
    };

    const offEvents = subscribeEvents(async (evt) => {
      const isChat = evt.type === "chat_text";
      if (!isChat && !NOTIFY_TYPES.has(evt.type)) return;

      // chat_text: the event data is the chat payload; others: a full notification
      const n = isChat
        ? { type: "chat_text", data: evt.data ?? {} }
        : { ...(evt.data ?? {}), data: evt.data?.data ?? {} };

      let inChat = false;
      let background = false;

      if (isChat) {
        const d = n.data;
        if (d.message_id == null) return;
        if (String(d.sender_id) === getMyUuid()) return; // my own message

        inChat = window.location.pathname.startsWith(CHAT_PATH);
        background = !isAppActive();
        console.log("[notify] chat_text", {
          message_id: d.message_id,
          inChat,
          ...describeState(),
        });

        // reading the chat right now: no toast, no system notification
        if (inChat && !background) return;
      }

      const key = keyOf(n);
      if (!remember(key)) return;

      if (isChat && !n.data.sender_name) {
        n.data = { ...n.data, sender_name: await nameOf(n.data.sender_id) };
      }

      // not looking at the app: try a system notification first
      if (isChat && background) {
        const d = n.data;
        const shown = showChatNotification({
          id: d.message_id,
          convoId: d.conversation_id,
          title: d.sender_name || "New message",
          body: d.preview || "",
          onOpen: (convoId) => {
            navigateRef.current?.(CHAT_PATH);
            requestOpenConversation(convoId);
          },
        });
        if (shown) {
          debugToast(
            "system notification was sent to the OS. If you did not see it, check Windows/macOS notification settings (Do Not Disturb / Focus Assist) and that Chrome is allowed there.",
          );
          return; // system notification replaces the toast
        }
        debugToast(
          `no system notification: ${whyNotNative() || "the browser refused to show it"}`,
        );
        if (inChat) return; // old behaviour: no toast inside chat
      }

      showToast(key, textOf(n));
    });

    const offStatus = subscribeStatus((isOnline) => {
      if (isOnline) {
        stopPoll();
        if (needSync) {
          needSync = false;
          syncFromServer(); // catch up on what arrived while offline
        }
      } else {
        needSync = true;
        if (!poll) {
          poll = setInterval(() => {
            if (document.visibilityState === "visible") syncFromServer();
          }, FALLBACK_POLL_MS);
        }
      }
    });

    // record what already exists so old unread items don't toast on page load
    if (localStorage.getItem("authToken")) syncFromServer();

    return () => {
      offEvents();
      offStatus();
      stopPoll();
    };
  }, []);
}

function App() {
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate; // always the latest, no stale closure

  useChatSocketAuth();
  useLiveNotificationToasts(navigateRef);
  useChatNotificationLifecycle(); // closes leftover system notifications on return

  return (
    <>
      {/* Global Loader */}
      <GlobalLoader />

      {/* App Shell with Scrollbars Completely Suppressed */}
      <div
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
        className="h-screen w-screen overflow-auto scrollbar-none [&::-webkit-scrollbar]:hidden relative"
      >
        <AppRoutes />
      </div>

      {/* React-Toastify: live notifications (top right) */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        limit={4}
        newestOnTop
        pauseOnHover
        pauseOnFocusLoss={false}
        closeOnClick
        theme="light"
        style={{ zIndex: 2147483647, top: "24px", right: "24px" }}
      />

      {/* Old react-hot-toast: keep until every toast call in the project is
          moved to react-toastify, then delete this block and its import. */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerStyle={{
          position: "fixed",
          zIndex: 2147483647,
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
    </>
  );
}

export default App;
