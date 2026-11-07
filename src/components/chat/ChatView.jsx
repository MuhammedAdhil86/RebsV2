import React from "react";
import ChatSidebar, { COLORS } from "./chat_sidebar";
import Conversation from "./Conversation";
import useConversations from "./useConversations";
import useAppSidebarWidth from "./useAppSidebarWidth";

export default function ChatView({ currentUser }) {
  const {
    convos,
    active,
    activeId,
    loading,
    online,
    onlineIds,
    people,
    peopleLoading,
    loadPeople,
    departments,
    loadDepartments,
    startDirect,
    createChannel,
    createTeam,
    select,
    clearActive,
    sendMessage,
    sendFiles,
    sendVoice,
    toggleReaction,
    deleteMessage,
    deleteConversation,
    unavailable,
  } = useConversations(currentUser);
  const left = useAppSidebarWidth();

  return (
    <div
      className="fixed bottom-0 right-0 top-0 z-30 flex bg-white font-normal"
      style={{ left, fontFamily: "Poppins, sans-serif" }}
    >
      <aside
        className={`${active ? "hidden md:block" : "block"} h-full w-full shrink-0 md:w-[250px] lg:w-[280px]`}
      >
        <ChatSidebar
          convos={convos}
          activeId={activeId}
          loading={loading}
          online={online}
          onlineIds={onlineIds}
          currentUser={currentUser}
          onSelect={select}
          people={people}
          peopleLoading={peopleLoading}
          onLoadPeople={loadPeople}
          onStartDm={startDirect}
          onCreateChannel={createChannel}
          departments={departments}
          onLoadDepartments={loadDepartments}
          onCreateTeam={createTeam}
        />
      </aside>

      <section
        className={`${active ? "block" : "hidden md:block"} h-full min-w-0 flex-1`}
      >
        {!active ? (
          <div
            className="hidden h-full items-center justify-center text-[15px] md:flex"
            style={{ color: COLORS.sub }}
          >
            {unavailable
              ? "This conversation is no longer available."
              : "Select a conversation to start chatting"}
          </div>
        ) : (
          <Conversation
            key={active.id}
            convo={active}
            onBack={clearActive}
            onSend={sendMessage}
            onSendFiles={sendFiles}
            onSendVoice={sendVoice}
            onReact={toggleReaction}
            onlineIds={onlineIds}
            onDelete={deleteConversation}
            onDeleteMessage={deleteMessage}
            currentUser={currentUser}
          />
        )}
      </section>
    </div>
  );
}
