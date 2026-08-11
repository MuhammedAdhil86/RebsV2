import { create } from "zustand";
import {
  fetchEmailTemplates,
  fetchDefaultEmailTemplates,
  deleteEmailTemplateService,
} from "../service/mainServices";

/**
 * Helper to safely extract backend error messages across Axios, fetch, or custom objects
 */
const extractErrorMessage = (error, defaultMsg) => {
  if (typeof error === "string") return error;
  return (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.error ||
    error?.data?.error ||
    error?.data?.message ||
    error?.message ||
    defaultMsg
  );
};

/**
 * Zustand store for fetching and managing email templates
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
  // FETCH ALL EMAIL TEMPLATES
  // -------------------------------
  loadTemplates: async () => {
    set({ loading: true, error: null });
    try {
      const data = await fetchEmailTemplates();
      set({
        templates: Array.isArray(data) ? data : [],
        loading: false,
      });
      return data;
    } catch (error) {
      const errorMsg = extractErrorMessage(
        error,
        "Failed to fetch email templates",
      );
      console.error("Error fetching email templates:", error);
      set({
        error: errorMsg,
        loading: false,
      });
      throw error;
    }
  },

  // -------------------------------
  // FETCH DEFAULT EMAIL TEMPLATES
  // -------------------------------
  loadDefaultTemplates: async () => {
    set({ loading: true, error: null });
    try {
      const data = await fetchDefaultEmailTemplates();
      set({
        defaultTemplates: Array.isArray(data) ? data : [],
        loading: false,
      });
      return data;
    } catch (error) {
      const errorMsg = extractErrorMessage(
        error,
        "Failed to fetch default email templates",
      );
      console.error("Error fetching default email templates:", error);
      set({
        error: errorMsg,
        loading: false,
      });
      throw error;
    }
  },

  // -------------------------------
  // DELETE EMAIL TEMPLATE
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
      const errorMsg = extractErrorMessage(error, "Failed to delete template");
      console.error("Error deleting template:", error);
      set({ error: errorMsg });
      throw error;
    }
  },
}));

export default useEmailTemplateStore;