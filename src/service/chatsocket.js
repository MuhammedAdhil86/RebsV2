// src/service/chatSocket.js

// Dev:  VITE_WS_URL=/ws  (goes through the Vite proxy)
// Prod: VITE_WS_URL=wss://rebs-hr-cwhyx.ondigitalocean.app/ws
const base = import.meta.env.VITE_WS_URL || "/ws";
const WS_URL = base.startsWith("/")
  ? `${window.location.origin.replace(/^http/, "ws")}${base}`
  : base;

const MAX_DELAY = 15000; // cap reconnect delay at 15s
const PING_EVERY = 25000; // keep the connection alive through proxies

export function connectChatSocket({ onEvent, onStatus }) {
  let ws = null;
  let retry = 0;
  let closed = false;
  let reconnectTimer = null;
  let pingTimer = null;

  const stopPing = () => clearInterval(pingTimer);

  const open = () => {
    // read the token fresh on every (re)connect
    const token = localStorage.getItem("authToken");
    if (!token) return; // logged out: don't connect

    ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);

    ws.onopen = () => {
      retry = 0;
      onStatus?.(true);

      stopPing();
      pingTimer = setInterval(() => {
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, PING_EVERY);
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data?.type === "pong") return; // ignore keep-alive replies
        console.log("[WS] event:", data); // remove once handleEvent is final
        onEvent?.(data);
      } catch (err) {
        console.warn("[WS] non-JSON frame:", e.data);
      }
    };

    ws.onerror = () => {
      ws?.close();
    };

    ws.onclose = (e) => {
      stopPing();
      onStatus?.(false);
      if (closed) return;

      // 1008 = policy violation (usually a rejected token): stop retrying
      if (e.code === 1008) return;

      const delay = Math.min(1000 * 2 ** retry++, MAX_DELAY);
      reconnectTimer = setTimeout(open, delay);
    };
  };

  open();

  return {
    send: (obj) => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(obj));
        return true;
      }
      return false;
    },
    close: () => {
      closed = true;
      clearTimeout(reconnectTimer);
      stopPing();
      ws?.close();
    },
  };
}
