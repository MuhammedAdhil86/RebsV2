import { create } from "zustand";
import axiosInstance from "../service/axiosinstance";

const useShiftDashboardStore = create((set, get) => ({
  loading: false,

  // ---------- Dropdown Master States ----------
  allShiftsMaster: [], // Permanent list of shifts to keep UI dropdowns full
  selectedShiftName: "",
  selectedShiftId: null, 
  selectedPolicyId: null,

  // ---------- Live Filtered Dashboard Data ----------
  stats: {},
  shiftDetails: [],
  policyDetails: null,
  shiftRules: null,
  shiftRatios: [],

  /* ---------- Base API Fetcher ---------- */
  fetchDashboard: async (shiftId = null, policyId = null) => {
    try {
      set({ loading: true });

      const params = {};
      if (shiftId) params.shift_id = shiftId;
      if (policyId) params.policy_id = policyId;

      const res = await axiosInstance.get("/shifts/dashboard/stats", { params });
      const data = res.data.data;

      let currentShiftName = get().selectedShiftName;
      let currentShiftId = shiftId || get().selectedShiftId;

      if (data.shift_details && data.shift_details.length > 0) {
        // Fallback initialization for the first dashboard load
        if (!currentShiftName) {
          currentShiftName = data.shift_details[0].shift_name;
        }
        
        // Find the active shift object to grab its real backend ID mapping
        const activeShiftObj = data.shift_details.find(
          (s) => s.shift_name === currentShiftName
        );
        if (activeShiftObj) {
          currentShiftId = activeShiftObj.shift_id || activeShiftObj.id || currentShiftId;
        }
      }

      set((state) => ({
        // Cache the full baseline shifts array context only on zero-filter mount execution
        allShiftsMaster: !shiftId && !policyId ? data.shift_details : state.allShiftsMaster,
        selectedShiftName: currentShiftName,
        selectedShiftId: currentShiftId,
        selectedPolicyId: policyId,
        stats: {
          totalEmployees: data.total_employees,
          totalShifts: data.total_shifts,
          unallocatedShifts: data.unallocated_shifts,
        },
        shiftDetails: data.shift_details || [],
        policyDetails: data.policy_details || null,
        shiftRules: data.shift_rules || null,
        loading: false,
      }));
    } catch (error) {
      console.error("❌ Error fetching dashboard metrics baseline data:", error);
      set({ loading: false });
    }
  },

  /* ---------- Change Shift View (Preserves selected policy filters if applicable) ---------- */
  changeShift: async (targetShiftObj) => {
    try {
      const shiftName = targetShiftObj.shift_name;
      const shiftId = targetShiftObj.shift_id || targetShiftObj.id;
      const activePolicyId = get().selectedPolicyId;

      set({ loading: true, selectedShiftName: shiftName, selectedShiftId: shiftId });

      // Request data with BOTH the new shift selection and the existing policy constraint
      const params = { shift_name: shiftName };
      if (shiftId) params.shift_id = shiftId;
      if (activePolicyId) params.policy_id = activePolicyId;

      const res = await axiosInstance.get("/shifts/dashboard/stats", { params });
      const data = res.data.data;

      set({
        stats: {
          totalEmployees: data.total_employees,
          totalShifts: data.total_shifts,
          unallocatedShifts: data.unallocated_shifts,
        },
        shiftDetails: data.shift_details || [],
        policyDetails: data.policy_details || null,
        shiftRules: data.shift_rules || null,
        loading: false,
      });
    } catch (error) {
      console.error("❌ Error running switch transition matrix operations:", error);
      set({ loading: false });
    }
  },

  /* ---------- Change Policy Filter Context ---------- */
  changePolicy: async (policyId) => {
    const currentShiftId = get().selectedShiftId;
    await get().fetchDashboard(currentShiftId, policyId);
  },

  /* ---------- Fetch Shift Ratio Graph Data ---------- */
  fetchShiftRatios: async () => {
    try {
      set({ loading: true });
      const res = await axiosInstance.get("/shifts/ratio");
      set({
        shiftRatios: res.data.data || [],
        loading: false,
      });
    } catch (error) {
      console.error("❌ Error executing ratio fetch analytics request:", error);
      set({ loading: false });
    }
  },
}));

export default useShiftDashboardStore;