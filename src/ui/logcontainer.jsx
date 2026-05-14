import React, { useEffect, useState, useCallback } from "react";
import LogTable from "../components/tables/logtable";
import { getLogEntriesForToday, getGeolocation, calculateDistance, DateTimeFormatter } from "../service/logService";
import useWebSocket from "../Hooks/useWebsocket";

const OFFICE_LAT = 12.9716; // Example: Bangalore latitude
const OFFICE_LON = 77.5946; // Example: Bangalore longitude

const LogContainer = () => {
  const { messages: websocketLogs } = useWebSocket();
  const [logEntries, setLogEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState({}); // store fetched geolocations

  // Merge historical + websocket logs
  const mergeLogs = useCallback((historical, ws) => {
    const map = new Map();
    historical.forEach(entry => map.set(entry.id, entry));
    ws.forEach(entry => map.set(entry.id, entry));
    const merged = Array.from(map.values());
    console.log("Merged logs:", merged);
    return merged;
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const logs = await getLogEntriesForToday();
      console.log("Historical Logs:", logs);
      setLogEntries(prev => mergeLogs(logs || [], prev));
    } catch (err) {
      console.error("Error fetching logs:", err);
      setLogEntries([]);
    } finally {
      setLoading(false);
    }
  }, [mergeLogs]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  useEffect(() => {
    const logMessages = websocketLogs.filter(msg => msg.type === "log");
    if (logMessages.length > 0) {
      console.log("New WebSocket logs:", logMessages);
      setLogEntries(prev => mergeLogs(prev, logMessages));
    }
  }, [websocketLogs, mergeLogs]);

  // Fetch readable locations
  useEffect(() => {
    logEntries.forEach(entry => {
      entry.attendance?.forEach(async att => {
        if (att.latitude && att.longitude && !locations[att.id]) {
          const loc = await getGeolocation(att.latitude, att.longitude);
          setLocations(prev => ({ ...prev, [att.id]: loc || "Unknown location" }));
        }
      });
    });
  }, [logEntries, locations]);

  if (loading) return <p className="p-4">Loading logs...</p>;

  const tableData = logEntries.flatMap(entry =>
    entry.attendance?.map(att => {
      const [date, relativeTime] = DateTimeFormatter(att.time);
      const distance =
        att.latitude && att.longitude
          ? calculateDistance(OFFICE_LAT, OFFICE_LON, att.latitude, att.longitude).toFixed(2)
          : null;

      return {
        id: att.id,
        name: att.name,
        role: att.role || "Employee",
        device: att.location_info?.device || "Unknown",
        time: `${date} (${relativeTime})`,
        location: locations[att.id] || att.location_info?.name || "Unknown",
        status: att.status === "IN" ? "Login" : "Logout",
        distance: distance ? `${distance} km` : "-",
        img: att.image || `https://randomuser.me/api/portraits/lego/${att.id % 10}.jpg`,
      };
    }) || []
  );

  console.log("Table Data:", tableData);

  return <LogTable logs={tableData} />;
};

export default LogContainer;
