import React, { useMemo } from "react";
import DashboardLayout from "../ui/pagelayout";
import ChatView from "../components/chat/ChatView";

// Reads uuid from the JWT ("Uuid" claim); name/image from localStorage if you store them
function getCurrentUser() {
  try {
    const token = localStorage.getItem("authToken");
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    const saved = JSON.parse(localStorage.getItem("user") || "{}"); // adjust to your key
    return {
      uuid: String(payload.Uuid),
      name: saved.name || "Me",
      image: saved.image || "",
    };
  } catch {
    return { uuid: "", name: "Me", image: "" };
  }
}

function Chat() {
  const currentUser = useMemo(getCurrentUser, []);

  return (
    <DashboardLayout userName={currentUser.name} onLogout={() => {}}>
      <ChatView currentUser={currentUser} />
    </DashboardLayout>
  );
}

export default Chat;
