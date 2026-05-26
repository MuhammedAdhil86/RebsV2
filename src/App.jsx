import React from "react";
import AppRoutes from "./routes/AppRoutes";
import { Toaster } from "react-hot-toast";
import GlobalLoader from "./ui/globalloaer";

function App() {
  return (
    <>
      {/* Global Loader */}
      <GlobalLoader />

      {/* Scrollable App Content Container */}
      <div className="h-screen w-screen overflow-auto scrollbar-hide relative">
        {/* FIXED TOASTER CONFIGURATION:
          We use position: "fixed" and an ultra-high z-index layer 
          to force the alerts out of local component HTML stacking frames.
        */}
        <Toaster
          position="top-right"
          reverseOrder={false}
          containerStyle={{
            position: "fixed", // Bypasses local scrollable div container limits
            zIndex: 999999, // Forces priority above your z-[999] modals
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

      {/* CSS to hide scrollbars in all browsers */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
}

export default App;
