import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.jsx";
import { LoadingProvider } from "./ui/loadingcontext.jsx";
import "./index.css";

/**
 * ADVANCED ERROR SUPPRESSION
 * We keep StrictMode ON for code health, but we proxy console.error
 * to filter out legacy library warnings specifically from react-quill.
 */
if (import.meta.env.DEV) {
  const originalError = console.error;
  console.error = (...args) => {
    const errorMsg = args[0];

    // Check if the error is the specific findDOMNode warning
    const isFindDOMNodeWarning =
      typeof errorMsg === "string" &&
      errorMsg.includes("findDOMNode is deprecated");

    // Check if the warning is coming from ReactQuill
    const isQuillInternal = args.some(
      (arg) => typeof arg === "string" && arg.includes("ReactQuill"),
    );

    if (isFindDOMNodeWarning && isQuillInternal) {
      return; // Ignore only this specific match
    }

    originalError(...args);
  };
}

const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <LoadingProvider>
          <App />
        </LoadingProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
