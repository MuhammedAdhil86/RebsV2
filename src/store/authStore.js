import { create } from 'zustand';
import { resetUserPassword } from '../service/authservice';

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
  isProcessing: false, // New: To handle button loading states

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

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('lastAuthUpdate');
    set({
      isAuthenticated: false,
      user: null,
    });
  },

  // --- NEW: Reset Password Action ---
  handleResetPassword: async (oldPassword, newPassword) => {
    set({ isProcessing: true });
    try {
      const payload = {
        old_password: oldPassword,
        new_password: newPassword
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
  }
}));