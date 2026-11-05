import React from "react";
import DashboardLayout from "../ui/pagelayout";
import ChatView from "../components/chat/ChatView";

function Chat() {
  return (
    <DashboardLayout userName="Admin" onLogout={() => {}}>
      <ChatView />
    </DashboardLayout>
  );
}

export default Chat;
