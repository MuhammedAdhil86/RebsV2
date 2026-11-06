import React, { useEffect } from "react";
import AppRoutes from "./routes/AppRoutes";
import { Toaster } from "react-hot-toast";
import GlobalLoader from "./ui/globalloaer";
import { startChatSocket, stopChatSocket } from "./service/chatSocket";

// Connects the shared WebSocket as soon as a token exists,
// and disconnects when the token is removed (logout).
function useChatSocketAuth() {
  useEffect(() => {
    let running = false;

    const sync = () => {
      const hasToken = !!localStorage.getItem("authToken");
      if (hasToken && !running) {
        running = true;
        startChatSocket(); // token found, connect
      } else if (!hasToken && running) {
        running = false;
        stopChatSocket(); // logged out, disconnect
      }
    };

    sync(); // on app open
    const timer = setInterval(sync, 1000); // catches login/logout in this tab
    window.addEventListener("storage", sync); // catches other tabs

    return () => {
      clearInterval(timer);
      window.removeEventListener("storage", sync);
      stopChatSocket();
    };
  }, []);
}

function App() {
  useChatSocketAuth();

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
        <AppRoutes />
      </div>

      {/* Global Toaster: outside the scroll container and rendered last,
          so it always sits on top of the loader, modals and the page */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerStyle={{
          position: "fixed",
          zIndex: 2147483647,
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
    </>
  );
}

export default App;
