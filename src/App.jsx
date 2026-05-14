import React from "react";
import AppRoutes from "./routes/AppRoutes";
import { Toaster } from "react-hot-toast";
import GlobalLoader from "./ui/globalloaer";

function App() {
  return (
    <>
      {/* Global Loader */}
      <GlobalLoader />

      {/* Toaster notifications */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 3000, // auto close after 3 seconds
          style: { borderRadius: "8px" },
        }}
      />

      {/* Scrollable App Content */}
      <div className="h-screen w-screen overflow-auto scrollbar-hide">
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
