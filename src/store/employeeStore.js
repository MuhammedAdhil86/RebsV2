import { create } from "zustand";
import { getStaffDetails } from "../service/employeeService";
import axiosInstance from "../service/axiosinstance";
import { getEmployeeDetails } from "../api/api"; // your API endpoint

const useEmployeeStore = create((set) => ({
  employees: [],
  loading: false,
  error: null,
  selectedEmployee: null,
  drawerOpen: false,
  refreshTrigger: 0,

  setSelectedDay: (day) => set({ selectedDay: day }),
  setSelectedEmployee: (emp) => set({ selectedEmployee: emp }),
  setDrawerOpen: (open) => set({ drawerOpen: open }),
  setEmployees: (emps) => set({ employees: emps }),
  triggerRefresh: () => set((s) => ({ refreshTrigger: s.refreshTrigger + 1 })),

  fetchEmployees: async () => {
    try {
      set({ loading: true });
      const data = await getStaffDetails();
      set({ employees: data, selectedEmployee: data[0] || null, loading: false });
    } catch (error) {
      console.error("Error fetching employee details:", error);
      set({ error, loading: false });
    }
  },

  // ✅ New: Fetch single employee by ID
  fetchEmployeeById: async (id) => {
    try {
      set({ loading: true });
      const response = await axiosInstance.get(`${getEmployeeDetails}/${id}`);
      set({ selectedEmployee: response.data.data, loading: false });
    } catch (error) {
      console.error("Error fetching employee by ID:", error);
      set({ error, loading: false });
    }
  },
}));

export default useEmployeeStore;
