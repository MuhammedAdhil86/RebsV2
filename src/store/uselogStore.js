// src/store/useLogStore.js
import { create } from "zustand";
import { getLogEntriesForDate } from "../../service/logService";
import dayjs from "dayjs";

const useLogStore = create((set, get) => ({
  logs: [],
  websocketLogs: [],
  loading: false,
  error: null,
  selectedDate: new Date(),

  // Merge logs from API and websocket
  mergeLogs: (historical, websocket) => {
    const map = new Map();
    historical.forEach((entry) => map.set(entry.id, entry));
    websocket.forEach((entry) => {
      const existing = map.get(entry.id);
      if (existing) {
        const combinedAttendance = new Map();
        [...(existing.attendance || []), ...(entry.attendance || [])].forEach(
          (att) => combinedAttendance.set(att.id, att)
        );
        map.set(entry.id, { ...entry, attendance: Array.from(combinedAttendance.values()) });
      } else {
        map.set(entry.id, entry);
      }
    });
    return Array.from(map.values());
  },

  // Fetch logs from API
  fetchLogs: async (date) => {
    const { websocketLogs, mergeLogs } = get();
    set({ loading: true, error: null });

    try {
      const data = await getLogEntriesForDate(date);
      const merged = mergeLogs(Array.isArray(data) ? data : [], websocketLogs);
      set({ logs: merged, loading: false });
      console.log("Employee log table data:", merged);
    } catch (err) {
      console.error("Error fetching logs:", err);
      set({
        error: err.response?.data || err.message || "Unknown error",
        logs: [],
        loading: false,
      });
    }
  },

  // Set websocket logs and auto-merge them
  setWebsocketLogs: (newLogs) => {
    const { logs, mergeLogs } = get();
    const merged = mergeLogs(logs, newLogs);
    set({ websocketLogs: newLogs, logs: merged });
  },

  // Update selected date
  setSelectedDate: (date) => set({ selectedDate: date }),
}));

export default useLogStore;
