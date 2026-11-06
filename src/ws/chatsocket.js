// src/service/chatSocket.js
//
// One shared WebSocket for the whole app.
// App.jsx starts it when a token exists and stops it on logout.
// Chat just subscribes to events and status.
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

const eventListeners = new Set();
const statusListeners = new Set();

let ws = null;
let online = false;
let started = false;
let retry = 0;
let reconnectTimer = null;
let pingTimer = null;

const setOnline = (value) => {
  if (online === value) return;
  online = value;
  statusListeners.forEach((fn) => fn(value));
};

const stopPing = () => clearInterval(pingTimer);

function open() {
  if (!started) return;

  const token = localStorage.getItem("authToken");
  if (!token) return;

  const sock = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);
  ws = sock;

  sock.onopen = () => {
    if (ws !== sock) return;
    console.log("[WS] connected");
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
    if (ws !== sock) return;
    console.error(
      "[WS] connection error (see Network > WS for the status code)",
    );
  };

  sock.onclose = (e) => {
    if (ws !== sock) return;
    console.log(`[WS] closed code=${e.code}`);
    stopPing();
    setOnline(false);

    if (!started) return;
    if (e.code === 1008) return; // rejected token, do not retry

    const delay = Math.min(1000 * 2 ** retry++, MAX_DELAY);
    reconnectTimer = setTimeout(open, delay);
  };
}

// reconnect right away when the network or the tab comes back
function reconnectNow() {
  if (!started) return;
  if (ws && ws.readyState <= WebSocket.OPEN) return; // already connecting or open
  clearTimeout(reconnectTimer);
  retry = 0;
  open();
}

const onVisible = () => {
  if (document.visibilityState === "visible") reconnectNow();
};

// Safe to call many times
export function startChatSocket() {
  if (started) return;
  if (!localStorage.getItem("authToken")) return;
  started = true;
  retry = 0;
  window.addEventListener("online", reconnectNow);
  document.addEventListener("visibilitychange", onVisible);
  open();
}

export function stopChatSocket() {
  started = false;
  clearTimeout(reconnectTimer);
  stopPing();
  window.removeEventListener("online", reconnectNow);
  document.removeEventListener("visibilitychange", onVisible);
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
