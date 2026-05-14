import React, { createContext, useState, useContext } from "react";

// Create the context
const LoadingContext = createContext();

// Provider to wrap the app
export const LoadingProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);

  const showLoading = () => setLoading(true);
  const hideLoading = () => setLoading(false);

  return (
    <LoadingContext.Provider value={{ loading, showLoading, hideLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};

// Custom hook for convenience
export const useLoading = () => useContext(LoadingContext);
