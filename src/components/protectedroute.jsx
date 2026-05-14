// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore"; // ✅ adjust path based on your alias setup

/**
 * ✅ ProtectedRoute
 * Used to protect private pages.
 * Checks Zustand's isAuthenticated state.
 * Redirects to "/" (Login) if user is not authenticated.
 */
const ProtectedRoute = ({ element: Component }) => {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    // redirect unauthenticated users to login
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // ✅ Render protected component if authenticated
  return <Component />;
};

export default ProtectedRoute;
