import { useEffect, useState, useCallback, useRef } from "react";

const useWebSocket = () => {
  const [messages, setMessages] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const [leave, setLeave] = useState([]);
  const [applyLeave, setApplyLeave] = useState([]);
  const [log, setLog] = useState([]);

  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectDelay = 3000;
  const shouldReconnect = useRef(true); // control reconnection

  // Core WebSocket connection
  const connect = useCallback(() => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      setConnectionStatus("Error: No token available");
      console.error("WebSocket connection failed: No token found in localStorage");
      return;
    }

    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);

    const wsUrl = `wss://rebs-hr-cwhyx.ondigitalocean.app/ws?token=${encodeURIComponent(token)}`;

    try {
      // Close existing socket if present
      if (socketRef.current) socketRef.current.close();

      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log("WebSocket connection opened");
        setConnectionStatus("Connected");
        // Optional: Send greeting to server
        socket.send(JSON.stringify({ message: "Hello, server!" }));
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Message from server:", data);

          // Stop reconnect if unauthorized
          if (data.status === 401 || data.type === "unauthorized" || data.status === null) {
            console.error("Unauthorized access: Stopping reconnection attempts.");
            shouldReconnect.current = false;
            socket.close();
            setConnectionStatus("Unauthorized: Connection closed.");
            return;
          }

          setMessages((prev) => [...prev, data]);

          switch (data.type) {
            case "leave":
              setLeave((prev) => [...prev, data]);
              break;
            case "apply_leave":
              setApplyLeave((prev) => [...prev, data]);
              break;
            case "log":
              setLog((prev) => [...prev, data]);
              break;
            default:
              console.log("Unknown message type:", data.type);
          }
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };

      socket.onclose = (event) => {
        console.warn("WebSocket closed:", event.reason || event.code);
        if (shouldReconnect.current) {
          setConnectionStatus("Reconnecting...");
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log("Attempting to reconnect WebSocket...");
            connect();
          }, reconnectDelay);
        } else {
          setConnectionStatus("Reconnection stopped due to unauthorized access.");
        }
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        setConnectionStatus("Error occurred - Will attempt reconnect...");
      };
    } catch (err) {
      console.error("Error creating WebSocket connection:", err);
      setConnectionStatus("Connection failed - Will attempt reconnect...");
      reconnectTimeoutRef.current = setTimeout(() => connect(), reconnectDelay);
    }
  }, []);

  // Initial connection
  useEffect(() => {
    connect();

    return () => {
      if (socketRef.current) socketRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [connect]);

  // React to token changes in localStorage
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "authToken") {
        shouldReconnect.current = true; // Reset flag for new token
        connect();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [connect]);

  // Ping server every 30s to keep connection alive
  useEffect(() => {
    const pingInterval = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        try {
          socketRef.current.send(JSON.stringify({ type: "ping" }));
        } catch (err) {
          console.error("Error sending ping:", err);
          connect();
        }
      }
    }, 30000);

    return () => clearInterval(pingInterval);
  }, [connect]);

  // Send custom message
  const sendMessage = useCallback((message) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.warn("Cannot send message: WebSocket is not connected");
    }
  }, []);

  return {
    connectionStatus,
    messages,
    leave,
    applyLeave,
    log,
    sendMessage,
  };
};

export default useWebSocket;
