import React from "react";
import AppRoutes from "./routes/AppRoutes";
import { Toaster } from "react-hot-toast";
import GlobalLoader from "./ui/globalloaer";

function App() {
  return (
    <>
      {/* Global Loader */}
      <GlobalLoader />

      {/* App Shell with Scrollbars Completely Suppressed */}
      <div
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
        className="h-screen w-screen overflow-auto scrollbar-none [&::-webkit-scrollbar]:hidden relative"
      >
        <Toaster
          position="top-right"
          reverseOrder={false}
          containerStyle={{
            position: "fixed",
            zIndex: 999999,
            top: "24px",
            right: "24px",
          }}
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: "12px",
              background: "#FFFFFF",
              color: "#000000",
              fontSize: "14px",
              padding: "12px 20px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            },
          }}
        />

        <AppRoutes />
      </div>
    </>
  );
}

export default App;
