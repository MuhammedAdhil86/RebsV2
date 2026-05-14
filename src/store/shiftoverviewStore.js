import { create } from "zustand";
import axiosInstance from "../service/axiosinstance";

const useShiftDashboardStore = create((set) => ({
  loading: false,

  // ---------- Dropdown ----------
  availableShifts: [],
  selectedShiftName: "",

  // ---------- Dashboard Data ----------
  stats: {},
  shiftDetails: [],
  policyDetails: null,
  shiftRules: null,

  // ---------- NEW: Shift Ratio ----------
  shiftRatios: [],

  /* ---------- Fetch default dashboard ---------- */
  fetchDashboard: async () => {
    try {
      set({ loading: true });

      const res = await axiosInstance.get("/shifts/dashboard/stats");
      const data = res.data.data;

      set({
        availableShifts: data.shift_details.map((s) => s.shift_name),
        selectedShiftName: data.shift_details?.[0]?.shift_name,
        stats: {
          totalEmployees: data.total_employees,
          totalShifts: data.total_shifts,
          unallocatedShifts: data.unallocated_shifts,
        },
        shiftDetails: data.shift_details,
        policyDetails: data.policy_details,
        shiftRules: data.shift_rules,
        loading: false,
      });
    } catch (error) {
      console.error("❌ Error fetching dashboard:", error);
      set({ loading: false });
    }
  },

  /* ---------- Change shift ---------- */
  changeShift: async (shiftName) => {
    try {
      set({ loading: true, selectedShiftName: shiftName });

      const res = await axiosInstance.get("/shifts/dashboard/stats", {
        params: { shift_name: shiftName },
      });

      const data = res.data.data;

      set({
        stats: {
          totalEmployees: data.total_employees,
          totalShifts: data.total_shifts,
          unallocatedShifts: data.unallocated_shifts,
        },
        shiftDetails: data.shift_details,
        policyDetails: data.policy_details,
        shiftRules: data.shift_rules,
        loading: false,
      });
    } catch (error) {
      console.error("❌ Error changing shift:", error);
      set({ loading: false });
    }
  },

  /* ---------- NEW: Fetch Shift Ratio ---------- */
  fetchShiftRatios: async () => {
    try {
      set({ loading: true });

      const res = await axiosInstance.get(
        `shifts/ratio`
      );

      set({
        shiftRatios: res.data.data || [],
        loading: false,
      });
    } catch (error) {
      console.error("❌ Error fetching shift ratios:", error);
      set({ loading: false });
    }
  },
}));

export default useShiftDashboardStore;
