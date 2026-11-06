// src/service/chatSocket.js
//
// One shared WebSocket for the whole app.
// App.jsx starts it when a token exists and stops it on logout.
// Chat (or anything else) just subscribes to events and status.
//
// .env:
// VITE_WS_URL=wss://rebs-hr-cwhyx.ondigitalocean.app/ws
// (or VITE_WS_URL=/ws to go through the Vite proxy in dev)

const base = import.meta.env.VITE_WS_URL || "/ws";
const WS_URL = base.startsWith("/")
  ? `${window.location.origin.replace(/^http/, "ws")}${base}`
  : base;

const MAX_DELAY = 15000;
const PING_EVERY = 25000;

// hides the middle of the token so it never shows fully in the console
const mask = (t = "") =>
  t.length > 12 ? `${t.slice(0, 6)}…${t.slice(-4)}` : t;

console.log(
  "[WS] VITE_WS_URL =",
  import.meta.env.VITE_WS_URL,
  "→ using",
  WS_URL,
);

const eventListeners = new Set();
const statusListeners = new Set();

let ws = null;
let online = false;
let started = false;
let retry = 0;
let reconnectTimer = null;
let pingTimer = null;

const setOnline = (v) => {
  online = v;
  statusListeners.forEach((fn) => fn(v));
};

const stopPing = () => clearInterval(pingTimer);

function open() {
  if (!started) return;

  const token = localStorage.getItem("authToken");
  if (!token) {
    console.warn("[WS] no authToken in localStorage, not connecting");
    return;
  }

  console.log(
    `[WS] connecting → ${WS_URL}?token=${mask(token)} (attempt ${retry + 1})`,
  );

  const sock = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);
  ws = sock;

  sock.onopen = () => {
    if (ws !== sock) return;
    console.log("%c[WS] ✅ CONNECTED", "color:green;font-weight:bold");
    retry = 0;
    setOnline(true);

    stopPing();
    pingTimer = setInterval(() => {
      if (sock.readyState === WebSocket.OPEN) {
        sock.send(JSON.stringify({ type: "ping" }));
      }
    }, PING_EVERY);
  };

  sock.onmessage = (e) => {
    if (ws !== sock) return;
    try {
      const data = JSON.parse(e.data);
      if (["ping", "pong", "connected"].includes(data?.type)) return;
      console.log("[WS] event:", data);
      eventListeners.forEach((fn) => {
        try {
          fn(data);
        } catch (err) {
          console.error("[WS] listener error:", err);
        }
      });
    } catch {
      console.warn("[WS] non-JSON frame");
    }
  };

  sock.onerror = () => {
    console.error(
      "[WS] ❌ error: open devtools > Network > WS and read the status code",
    );
  };

  sock.onclose = (e) => {
    if (ws !== sock) return; // an old socket, ignore
    console.log(`[WS] closed code=${e.code} reason="${e.reason}"`);
    stopPing();
    setOnline(false);

    if (!started) return;
    if (e.code === 1008) {
      console.warn("[WS] rejected (bad token), not retrying");
      return;
    }

    const delay = Math.min(1000 * 2 ** retry++, MAX_DELAY);
    console.log(`[WS] reconnecting in ${delay / 1000}s`);
    reconnectTimer = setTimeout(open, delay);
  };
}

// Safe to call many times
export function startChatSocket() {
  if (started) return;
  if (!localStorage.getItem("authToken")) return;
  started = true;
  retry = 0;
  open();
}

export function stopChatSocket() {
  started = false;
  clearTimeout(reconnectTimer);
  stopPing();
  const s = ws;
  ws = null;
  s?.close();
  setOnline(false);
}

export function subscribeEvents(fn) {
  eventListeners.add(fn);
  return () => eventListeners.delete(fn);
}

export function subscribeStatus(fn) {
  statusListeners.add(fn);
  fn(online); // report the current state immediately
  return () => statusListeners.delete(fn);
}

export const isChatSocketOnline = () => online;
