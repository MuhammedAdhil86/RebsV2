// src/service/chatSocket.js
//
// One shared WebSocket for the whole app.
//
// App.jsx:
//   startChatSocket()  -> starts the socket
//   stopChatSocket()   -> stops the socket on logout
//
// useConversations.js:
//   connectChatSocket({ onEvent, onStatus })
//
// Supported incoming events are forwarded unchanged:
//   message
//   chat_message
//   reaction
//   message_deleted
//   chat_conversation_deleted
//   chat_conversation_renamed
//   message_edited
//
// .env.development:
//   VITE_WS_URL=/ws
//
// Live:
//   Uses the DigitalOcean backend unless VITE_WS_URL is configured.

// --------------------------------------------------
// WEBSOCKET URL
// --------------------------------------------------

const LIVE_WS = "wss://rebs-hr-cwhyx.ondigitalocean.app/ws";

const base =
  import.meta.env.VITE_WS_URL || (import.meta.env.DEV ? "/ws" : LIVE_WS);

const WS_URL = base.startsWith("/")
  ? `${window.location.origin.replace(/^http/, "ws")}${base}`
  : base;

// --------------------------------------------------
// CONFIGURATION
// --------------------------------------------------

const MAX_DELAY = 15000;
const PING_EVERY = 25000;

// --------------------------------------------------
// SHARED STATE
// --------------------------------------------------

const eventListeners = new Set();
const statusListeners = new Set();

let ws = null;
let online = false;
let started = false;
let retry = 0;

let reconnectTimer = null;
let pingTimer = null;

// --------------------------------------------------
// CONNECTION STATUS
// --------------------------------------------------

const setOnline = (value) => {
  if (online === value) return;

  online = value;

  statusListeners.forEach((fn) => {
    try {
      fn(value);
    } catch (error) {
      console.error("[WS] status listener error:", error);
    }
  });
};

// --------------------------------------------------
// STOP PING
// --------------------------------------------------

const stopPing = () => {
  if (pingTimer) {
    clearInterval(pingTimer);
    pingTimer = null;
  }
};

// --------------------------------------------------
// EVENT DISPATCHER
// --------------------------------------------------

function dispatchEvent(event) {
  if (!event || typeof event !== "object") return;

  // Ignore WebSocket control frames.
  // All other events are forwarded to subscribers.

  if (["ping", "pong", "connected"].includes(event.type)) {
    return;
  }

  if (import.meta.env.DEV) {
    console.log("[WS] event received:", event);
  }

  eventListeners.forEach((fn) => {
    try {
      fn(event);
    } catch (error) {
      console.error("[WS] event listener error:", error);
    }
  });
}

// --------------------------------------------------
// OPEN WEBSOCKET
// --------------------------------------------------

function open() {
  if (!started) return;

  const token = localStorage.getItem("authToken");

  if (!token) {
    console.warn("[WS] No authentication token found.");
    return;
  }

  // Avoid duplicate connections.

  if (
    ws &&
    (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)
  ) {
    return;
  }

  try {
    const sock = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);

    ws = sock;

    // ----------------------------------------------
    // CONNECTED
    // ----------------------------------------------

    sock.onopen = () => {
      if (ws !== sock) return;

      console.log("[WS] connected");

      retry = 0;
      setOnline(true);

      stopPing();

      // Send ping every 25 seconds.

      pingTimer = setInterval(() => {
        if (sock.readyState === WebSocket.OPEN) {
          try {
            sock.send(JSON.stringify({ type: "ping" }));
          } catch (error) {
            console.error("[WS] ping error:", error);
          }
        }
      }, PING_EVERY);
    };

    // ----------------------------------------------
    // RECEIVE ALL SERVER EVENTS
    // ----------------------------------------------

    sock.onmessage = (e) => {
      if (ws !== sock) return;

      try {
        const event = JSON.parse(e.data);

        // Forward the original event without modifying it.
        dispatchEvent(event);
      } catch (error) {
        console.warn("[WS] non-JSON frame:", error);
      }
    };

    // ----------------------------------------------
    // SOCKET ERROR
    // ----------------------------------------------

    sock.onerror = (error) => {
      if (ws !== sock) return;

      console.error(
        "[WS] connection error. Check Network > WS for status code.",
        error,
      );
    };

    // ----------------------------------------------
    // SOCKET CLOSED
    // ----------------------------------------------

    sock.onclose = (event) => {
      if (ws !== sock) return;

      console.log(`[WS] closed code=${event.code}`);

      stopPing();

      ws = null;

      setOnline(false);

      if (!started) return;

      // Authentication rejected.
      // Do not reconnect until authentication changes.

      if (event.code === 1008) {
        console.error("[WS] Authentication rejected.");
        return;
      }

      // Exponential backoff reconnect.

      const delay = Math.min(1000 * 2 ** retry++, MAX_DELAY);

      console.log(`[WS] reconnecting in ${delay}ms`);

      clearTimeout(reconnectTimer);

      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        open();
      }, delay);
    };
  } catch (error) {
    console.error("[WS] failed to create connection:", error);

    setOnline(false);

    if (!started) return;

    const delay = Math.min(1000 * 2 ** retry++, MAX_DELAY);

    clearTimeout(reconnectTimer);

    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      open();
    }, delay);
  }
}

// --------------------------------------------------
// RECONNECT IMMEDIATELY
// --------------------------------------------------

function reconnectNow() {
  if (!started) return;

  // Already connecting or connected.

  if (
    ws &&
    (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)
  ) {
    return;
  }

  clearTimeout(reconnectTimer);
  reconnectTimer = null;

  retry = 0;

  open();
}

// --------------------------------------------------
// RECONNECT WHEN TAB BECOMES VISIBLE
// --------------------------------------------------

const onVisible = () => {
  if (document.visibilityState === "visible") {
    reconnectNow();
  }
};

// --------------------------------------------------
// START SHARED WEBSOCKET
// --------------------------------------------------

export function startChatSocket() {
  if (started) return;

  const token = localStorage.getItem("authToken");

  if (!token) {
    console.warn("[WS] Cannot start: no auth token.");
    return;
  }

  started = true;
  retry = 0;

  window.addEventListener("online", reconnectNow);

  document.addEventListener("visibilitychange", onVisible);

  open();
}

// --------------------------------------------------
// STOP SHARED WEBSOCKET
// --------------------------------------------------

export function stopChatSocket() {
  started = false;

  clearTimeout(reconnectTimer);
  reconnectTimer = null;

  stopPing();

  window.removeEventListener("online", reconnectNow);

  document.removeEventListener("visibilitychange", onVisible);

  const socket = ws;

  ws = null;

  if (socket && socket.readyState !== WebSocket.CLOSED) {
    socket.close();
  }

  setOnline(false);

  console.log("[WS] stopped");
}

// --------------------------------------------------
// SUBSCRIBE TO EVENTS
// --------------------------------------------------

export function subscribeEvents(fn) {
  if (typeof fn !== "function") {
    return () => {};
  }

  eventListeners.add(fn);

  return () => {
    eventListeners.delete(fn);
  };
}

// --------------------------------------------------
// SUBSCRIBE TO CONNECTION STATUS
// --------------------------------------------------

export function subscribeStatus(fn) {
  if (typeof fn !== "function") {
    return () => {};
  }

  statusListeners.add(fn);

  // Immediately report the current status.

  try {
    fn(online);
  } catch (error) {
    console.error("[WS] status listener error:", error);
  }

  return () => {
    statusListeners.delete(fn);
  };
}

// --------------------------------------------------
// CONNECT CHAT COMPONENT TO SHARED SOCKET
// --------------------------------------------------

export function connectChatSocket({ onEvent, onStatus } = {}) {
  const unsubscribeEvent = subscribeEvents(onEvent);

  const unsubscribeStatus = subscribeStatus(onStatus);

  // App.jsx remains responsible for starting
  // and stopping the shared WebSocket.

  return {
    close() {
      unsubscribeEvent();
      unsubscribeStatus();
    },
  };
}

// --------------------------------------------------
// CHECK CONNECTION STATUS
// --------------------------------------------------

export const isChatSocketOnline = () => online;

// --------------------------------------------------
// SEND DATA THROUGH SHARED WEBSOCKET
// --------------------------------------------------

export function sendChatSocket(data) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.warn("[WS] Cannot send: socket is not connected.");
    return false;
  }

  try {
    ws.send(JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("[WS] send failed:", error);
    return false;
  }
}
