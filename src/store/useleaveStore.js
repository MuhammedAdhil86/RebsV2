import { create } from "zustand";
import axiosInstance from "../service/axiosinstance";

const useLeaveStore = create((set, get) => ({
  // -------------------------------
  // STATES
  // -------------------------------
  leaves: [],
  employees: [],
  leaveTypes: [],
  loading: false,
  error: null,
  socket: null,

  // -------------------------------
  // FETCH LEAVES
  // -------------------------------
  fetchLeaves: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.get("/admin/leave/get");
      set({ leaves: response.data.data || [], loading: false });
    } catch (error) {
      console.error("Error fetching leaves:", error);
      set({ error: error.message, loading: false });
    }
  },

  // -------------------------------
  // FETCH EMPLOYEES
  // -------------------------------
  fetchEmployees: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.get("/master/staff");
      set({ employees: response.data.data || [], loading: false });
    } catch (error) {
      console.error("Error fetching employees:", error);
      set({ error: error.message, loading: false });
    }
  },

  // -------------------------------
  // FETCH LEAVE TYPES
  // -------------------------------
  fetchLeaveTypes: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.get("/master/leavetype");
      set({ leaveTypes: response.data.data || [], loading: false });
    } catch (error) {
      console.error("Error fetching leave types:", error);
      set({ error: error.message, loading: false });
    }
  },

  // -------------------------------
  // APPLY LEAVE (ADMIN)
  // -------------------------------
applyLeaveAdmin: async (employeeId, leaveData) => {
    set({ loading: true, error: null });

    try {
      // Data Sanitization for Go Backend
      const sanitizedPayload = {
        leave_date: leaveData.leave_date.map((d) => ({
          date: String(d.date),
          half_day: Boolean(d.half_day),
          half_day_type: d.half_day ? Number(d.half_day_type || 1) : 0,
        })),
        reason: leaveData.reason || "Applied by Admin",
        leave_policy: 1,
        lop: false,
        cc: Array.isArray(leaveData.cc) ? leaveData.cc : [], // Ensures valid UUID array
      };

      const response = await axiosInstance.post(
        `/admin/leave/apply?employeeId=${employeeId}`,
        sanitizedPayload
      );

      // Refresh data on success
      await get().fetchLeaves();
      set({ loading: false });
      return response.data;

    } catch (error) {
      // EXTRACTING THE SPECIFIC ERROR (e.g., "Conflicts found")
      const errorData = error.response?.data;
      const serverMessage = typeof errorData === "string" 
        ? errorData 
        : (errorData?.message || error.message || "Internal Server Error");

      set({ error: serverMessage, loading: false });
      
      // Throw the clean string so the Modal can display it
      throw new Error(serverMessage);
    }
  },

  // -------------------------------
  // APPROVE / REJECT LEAVE
  // -------------------------------
  updateLeaveStatus: async ({
    leaveRefNo,
    status,
    remarks,
    role = "admin",
    lop = false,
    dates = [],
  }) => {
    try {
      const localUser = JSON.parse(localStorage.getItem("user"));
      const updated_by = localUser?.id || "2";

      // Use new endpoints
      const endpoint =
        role === "manager"
          ? `/manager/leave/change-status/${leaveRefNo}`
          : `/admin/leave/change-status/${leaveRefNo}`;

      // Prepare payload
      const payload =
        role === "admin"
          ? { status, remarks, lop, dates, updated_by }
          : { status, remarks, updated_by };

      // Send PUT request
      await axiosInstance.put(endpoint, payload);

      // Update state
      set((state) => ({
        ...state,
        leaves: state.leaves.map((l) =>
          l.leave_ref_no === leaveRefNo
            ? {
                ...l,
                status,
                remarks,
                ...(role === "admin" ? { lop, dates } : {}),
              }
            : l
        ),
      }));
    } catch (error) {
      console.error("Error updating leave status:", error);
      throw error;
    }
  },

  // -------------------------------
  // WEBSOCKET CONNECTION
  // -------------------------------
  connectWebSocket: (token) => {
    if (get().socket) return; // prevent multiple connections

    const socket = new WebSocket(
      `wss://rebs-hr-cwhyx.ondigitalocean.app/ws?token=${encodeURIComponent(token)}`
    );

    socket.onopen = () => {
      console.log("✅ WebSocket connected");
      socket.send(JSON.stringify({ type: "greeting", content: "Hello server" }));
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (
          (msg.type === "apply_leave" || msg.type === "manager_leave_approval") &&
          msg.data
        ) {
          set((state) => {
            const exists = state.leaves.some(
              (req) => req.leave_ref_no === msg.data.leave_ref_no
            );

            if (!exists) {
              return { ...state, leaves: [msg.data, ...state.leaves] };
            }

            return {
              ...state,
              leaves: state.leaves.map((req) =>
                req.leave_ref_no === msg.data.leave_ref_no
                  ? { ...req, ...msg.data }
                  : req
              ),
            };
          });
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };

    socket.onclose = () => {
      console.warn("⚠️ WebSocket closed. Reconnecting in 2s...");
      setTimeout(() => get().connectWebSocket(token), 2000);
    };

    socket.onerror = (err) => console.error("WebSocket error:", err);

    set({ socket });
  },
}));

export default useLeaveStore;
