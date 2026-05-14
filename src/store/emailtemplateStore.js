import { create } from "zustand";
import {
  fetchEmailTemplates,
  fetchDefaultEmailTemplates,
  deleteEmailTemplateService, // ✅ Added import
} from "../service/mainServices";

/**
 * Zustand store for fetching email templates
 */
const useEmailTemplateStore = create((set) => ({
  // -------------------------------
  // STATES
  // -------------------------------
  templates: [],
  defaultTemplates: [],
  loading: false,
  error: null,

  // -------------------------------
  // FETCH ALL EMAIL TEMPLATES (Untouched)
  // -------------------------------
  loadTemplates: async () => {
    set({ loading: true, error: null });
    try {
      const data = await fetchEmailTemplates();
      set({
        templates: Array.isArray(data) ? data : [],
        loading: false,
      });
    } catch (error) {
      console.error("Error fetching email templates:", error);
      set({
        error: error.message || "Failed to fetch email templates",
        loading: false,
      });
    }
  },

  // -------------------------------
  // FETCH DEFAULT EMAIL TEMPLATES (Untouched)
  // -------------------------------
  loadDefaultTemplates: async () => {
    set({ loading: true, error: null });
    try {
      const data = await fetchDefaultEmailTemplates();
      set({
        defaultTemplates: Array.isArray(data) ? data : [],
        loading: false,
      });
    } catch (error) {
      console.error("Error fetching default email templates:", error);
      set({
        error: error.message || "Failed to fetch default email templates",
        loading: false,
      });
    }
  },

  // -------------------------------
  // DELETE EMAIL TEMPLATE ✅ NEW LOGIC
  // -------------------------------
  removeTemplate: async (id) => {
    try {
      await deleteEmailTemplateService(id);
      // Update local state by filtering out the deleted template
      set((state) => ({
        templates: state.templates.filter((t) => t.id !== id),
      }));
      return { success: true };
    } catch (error) {
      console.error("Error deleting template:", error);
      throw error;
    }
  },
}));

export default useEmailTemplateStore;