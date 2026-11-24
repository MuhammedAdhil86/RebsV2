import { create } from "zustand";
import {
  getStaffDetails,
  getActiveUsersLight,
} from "../service/employeeService";
import axiosInstance from "../service/axiosinstance";
import { getEmployeeDetails } from "../api/api"; // your API endpoint

const useEmployeeStore = create((set, get) => ({
  employees: [],
  loading: false,
  error: null,
  selectedEmployee: null,
  drawerOpen: false,
  refreshTrigger: 0,

  // Light users state ({ id, name, uuid, image })
  lightUsers: [],
  lightLoading: false,
  lightError: null,

  setSelectedDay: (day) => set({ selectedDay: day }),
  setSelectedEmployee: (emp) => set({ selectedEmployee: emp }),
  setDrawerOpen: (open) => set({ drawerOpen: open }),
  setEmployees: (emps) => set({ employees: emps }),
  triggerRefresh: () => set((s) => ({ refreshTrigger: s.refreshTrigger + 1 })),

  // Fetch employees. filters = { branch_id, department_id, designation_id }
  fetchEmployees: async (filters = {}) => {
    try {
      set({ loading: true, error: null });
      const data = await getStaffDetails(filters);
      set({
        employees: data || [],
        selectedEmployee: data?.[0] || null,
        loading: false,
      });
    } catch (error) {
      console.error("Error fetching employee details:", error);
      set({ employees: [], error, loading: false });
    }
  },

  // Fetch light list of active users  (renamed from fetchUsers)
  fetchLightUsers: async () => {
    try {
      set({ lightLoading: true, lightError: null });
      const data = await getActiveUsersLight();
      set({ lightUsers: data || [], lightLoading: false });
    } catch (error) {
      console.error("Error fetching light users:", error);
      set({ lightError: error, lightLoading: false });
    }
  },

  // Old name kept so existing usages don't break
  fetchUsers: () => get().fetchLightUsers(),

  // Fetch single employee by ID
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
