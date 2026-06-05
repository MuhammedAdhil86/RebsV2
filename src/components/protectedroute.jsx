import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

/**
 * 🔐 ProtectedRoute
 * Stops logged-out users from accessing dashboard pages.
 */
export const ProtectedRoute = ({ element: Element }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Element />;
};

/**
 * 🔓 PublicRoute
 * Stops logged-in users from going back to the login screen.
 */
export const PublicRoute = ({ element: Element }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Element />;
};
