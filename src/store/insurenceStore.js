import { create } from "zustand";
import { fetchEmployeeInsuranceDetails } from "../service/insuranceservice";
import toast from "react-hot-toast";

const useInsuranceStore = create((set) => ({
  insuranceData: null,
  loading: false,
  error: null,

  // Action to fetch details by UUID or ID
  getInsuranceDetails: async (uuid) => {
    if (!uuid) return;
    set({ loading: true, error: null });
    try {
      const data = await fetchEmployeeInsuranceDetails(uuid);
      set({ insuranceData: data, loading: false });
    } catch (error) {
      console.error("❌ Failed to fetch insurance details:", error);
      toast.error("Failed to fetch employee insurance details.");
      set({ error, loading: false });
    }
  },

  // Optional: Clear data when switching profiles
  clearInsuranceData: () => set({ insuranceData: null }),
}));

export default useInsuranceStore;