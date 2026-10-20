import { create } from 'zustand';
import { resetUserPassword, logoutStaff } from '../service/authservice';

export const useAuthStore = create((set) => ({
  // --- Initial State ---
  isAuthenticated: !!localStorage.getItem('authToken'),
  user: (() => {
    const userData = localStorage.getItem('user');
    try {
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  })(),
  isProcessing: false, // To handle button loading states

  // --- Actions ---
  login: (token, userData) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('lastAuthUpdate', Date.now().toString());
    set({
      isAuthenticated: true,
      user: userData,
    });
  },

  // --- Logout via API: POST /api_v1/staff/logout ---
  // logoutStaff() removes authToken/token from localStorage itself.
  // The store state is always reset afterwards, even if the API call fails
  // (expired token, network error), so the user is never stuck logged in.
  // Returns true if the server confirmed the logout, false otherwise.
  logout: async () => {
    set({ isProcessing: true });
    let serverLoggedOut = false;
    try {
      await logoutStaff();
      serverLoggedOut = true;
    } catch (error) {
      console.error('Logout API failed, clearing local session anyway:', error);
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('lastAuthUpdate');
      set({
        isAuthenticated: false,
        user: null,
        isProcessing: false,
      });
    }
    return serverLoggedOut;
  },

  // --- Reset Password Action ---
  handleResetPassword: async (oldPassword, newPassword) => {
    set({ isProcessing: true });
    try {
      const payload = {
        old_password: oldPassword,
        new_password: newPassword,
      };

      const response = await resetUserPassword(payload);

      // Return response so the UI can show a success toast
      return response;
    } catch (error) {
      // Throw error so UI catch block can show error toast
      throw error;
    } finally {
      set({ isProcessing: false });
    }
  },
}));