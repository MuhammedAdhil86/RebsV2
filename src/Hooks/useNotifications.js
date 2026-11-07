// src/service/chatNotifications.js
//
// Native (system) notifications for incoming chat messages.
// Reuses the existing socket listener in ChatView; opens no connection.
//
//   app visible + focused  -> nothing here (your React Toastify stays in charge)
//   other tab / minimized  -> native OS notification (if permission granted)
//   no permission / unsupported -> returns false, existing behaviour is kept

import { useCallback, useEffect, useState } from "react";

console.log("[notify] chatNotifications v3 loaded");

// Snapshot of everything that decides whether a notification can show
export const describeState = () => ({
  permission: getPermission(),
  secureContext: typeof window !== "undefined" && window.isSecureContext,
  visibility: document.visibilityState,
  hasFocus: document.hasFocus(),
  appActive: isAppActive(),
});

// Plain-words reason why a system notification can't be shown right now
export const whyNotNative = () => {
  if (!notificationsSupported())
    return "this browser has no Notification support";
  if (!window.isSecureContext)
    return "page is not secure (use localhost or https)";
  if (Notification.permission === "default")
    return "permission not given yet: click the bell in the chat header";
  if (Notification.permission === "denied")
    return "permission is blocked in Chrome site settings for this address";
  if (isAppActive()) return "app is visible and focused";
  return "";
};

// App logo shown in the notification. Adjust to a real file in /public.
const NOTIFICATION_ICON = "/favicon.ico";
const PREVIEW_MAX = 120;
const MAX_TRACKED = 300;

export const notificationsSupported = () =>
  typeof window !== "undefined" && "Notification" in window;

export const getPermission = () =>
  notificationsSupported() ? Notification.permission : "unsupported";

// The user is actually looking at the app: tab visible AND window focused
export const isAppActive = () =>
  document.visibilityState === "visible" && document.hasFocus();

// Native notifications are possible only with permission
export const canUseNative = () => getPermission() === "granted";

// Handy for the place that shows your existing toast:
//   if (shouldShowToast()) toast(...)
// = toast while the app is active, or whenever native isn't available.
export const shouldShowToast = () => isAppActive() || !canUseNative();

// ---------- bookkeeping ----------
const open = new Map(); // tag -> Notification (to clean up)
const shown = new Map(); // message id -> 1 if it had real text, else 0

const remember = (id, rich) => {
  shown.set(id, rich);
  if (shown.size > MAX_TRACKED) shown.delete(shown.keys().next().value);
};

const preview = (text = "") => {
  const t = String(text).replace(/\s+/g, " ").trim();
  return t.length > PREVIEW_MAX ? `${t.slice(0, PREVIEW_MAX - 1)}…` : t;
};

export function closeAllNotifications() {
  open.forEach((n) => {
    n.onclick = null;
    n.onclose = null;
    try {
      n.close();
    } catch {
      /* already closed */
    }
  });
  open.clear();
}

// Returns true when a native notification was shown (or already shown).
export function showChatNotification({ id, convoId, title, body, onOpen }) {
  if (!canUseNative()) {
    console.log("[notify] skipped: permission is", getPermission());
    return false;
  }
  if (isAppActive()) {
    console.log("[notify] skipped: app is visible and focused");
    return false;
  }

  const key = String(id ?? `${convoId}-${Date.now()}`);
  const text = preview(body);
  const rich = text ? 1 : 0;

  // duplicate protection: the same message may arrive as chat_text AND
  // chat_message. Show it once; a later copy only wins if it adds real text
  // (same tag = it replaces the earlier one silently).
  const prior = shown.get(key);
  if (prior !== undefined && prior >= rich) return true;
  remember(key, rich);

  try {
    const tag = `chat-${key}`;
    const n = new Notification(title || "New message", {
      body: text || "New message",
      icon: NOTIFICATION_ICON,
      tag,
      data: { convoId },
    });

    n.onclick = () => {
      window.focus(); // bring the existing app tab forward
      n.close();
      onOpen?.(convoId);
    };
    n.onclose = () => open.delete(tag);
    open.set(tag, n);
    return true;
  } catch (err) {
    // e.g. mobile Chrome only allows notifications via a service worker
    console.warn("[notify] could not show notification", err);
    return false;
  }
}

// Test button helper: shows a notification right away, ignoring the
// active-tab check, so you can tell browser/OS problems from app logic.
export function sendTestNotification() {
  if (!canUseNative()) return getPermission();
  try {
    const n = new Notification("Test notification", {
      body: "If you can see this, system notifications work.",
      icon: NOTIFICATION_ICON,
      tag: "chat-test",
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
    return "shown";
  } catch (err) {
    console.error("[notify] test failed", err);
    return "error";
  }
}

// Ask for permission. Call it only from a click (Enable notifications button).
export async function requestNotificationPermission() {
  if (!notificationsSupported()) return "unsupported";
  if (Notification.permission !== "default") return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

// Current permission, kept in sync (also when changed in browser settings)
export function useNotificationPermission() {
  const [permission, setPermission] = useState(getPermission);

  useEffect(() => {
    if (!notificationsSupported() || !navigator.permissions?.query) return;
    let status;
    let cancelled = false;
    const sync = () => setPermission(getPermission());

    navigator.permissions
      .query({ name: "notifications" })
      .then((s) => {
        if (cancelled) return;
        status = s;
        s.addEventListener("change", sync);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      status?.removeEventListener("change", sync);
    };
  }, []);

  const request = useCallback(async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    return result;
  }, []);

  return [permission, request];
}

// When the user comes back, clear leftover system notifications.
// On unmount, detach click handlers so nothing points at a dead screen.
export function useChatNotificationLifecycle() {
  useEffect(() => {
    const onBack = () => {
      if (isAppActive()) closeAllNotifications();
    };
    window.addEventListener("focus", onBack);
    document.addEventListener("visibilitychange", onBack);
    return () => {
      window.removeEventListener("focus", onBack);
      document.removeEventListener("visibilitychange", onBack);
      closeAllNotifications();
    };
  }, []);
}

// ---------- "open this conversation" (used when a notification is clicked) ----------
// App.jsx navigates to the chat page and calls requestOpenConversation(id).
// ChatView picks it up whether it was already mounted or mounts right after.
let pendingOpen = null;
const openListeners = new Set();

export function requestOpenConversation(id) {
  pendingOpen = String(id);
  if (openListeners.size) {
    const target = pendingOpen;
    pendingOpen = null;
    openListeners.forEach((fn) => fn(target));
  }
}

export function takePendingOpen() {
  const id = pendingOpen;
  pendingOpen = null;
  return id;
}

export function subscribeOpenRequests(fn) {
  openListeners.add(fn);
  return () => openListeners.delete(fn);
}
