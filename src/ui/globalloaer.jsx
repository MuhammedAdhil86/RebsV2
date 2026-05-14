import React from "react";
import { useLoading } from "./loadingcontext";

const GlobalLoader = () => {
  const { loading } = useLoading();

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="w-16 h-16 border-4 border-t-4 border-gray-700 border-t-white rounded-full animate-spin"></div>
    </div>
  );
};

export default GlobalLoader;
