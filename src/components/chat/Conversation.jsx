import React, { useState } from "react";
import { titleOf } from "./chat_sidebar";
import ChatViewHead from "./ChatViewHead";
import ChatViewer, { prefixOf } from "./ChatViewer";
import ChatTool from "./ChatTool";
import ChatInfoPanel from "./ChatInfoPanel";

export default function Conversation({
  convo,
  onBack,
  onSend,
  onSendFiles,
  onSendVoice,
  onReact,
  onPin,
  onUnpin,
  onAddParticipants,
  onRemoveParticipants,
  people,
  peopleLoading,
  onLoadPeople,
  onlineIds,
  onDelete,
  onDeleteMessage,
  currentUser,
}) {
  const [replyTo, setReplyTo] = useState(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const title = titleOf(convo);
  const placeholder =
    convo.kind === "dm"
      ? `Message ${title}`
      : `Message ${prefixOf(convo)}${title}`;

  // scroll to a message (used by "Go to message" in the Pinned tab)
  const goToMessage = (id) => {
    const el = document.querySelector(`[data-mid="${id}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.style.transition = "background 0.3s";
    el.style.background = "#fbe8ea";
    setTimeout(() => {
      el.style.background = "";
    }, 1600);
  };

  return (
    <div className="relative flex h-full bg-white">
      <div className="flex h-full min-w-0 flex-1 flex-col">
        <ChatViewHead
          convo={convo}
          onBack={onBack}
          onlineIds={onlineIds}
          onDelete={onDelete}
          onInfo={() => setInfoOpen((o) => !o)}
        />
        <ChatViewer
          convo={convo}
          currentUserId={currentUser?.uuid}
          onReact={onReact}
          onReply={setReplyTo}
          onDelete={onDeleteMessage}
          onPin={onPin}
          onUnpin={onUnpin}
        />
        <ChatTool
          resetKey={convo.id}
          placeholder={placeholder}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          onSend={(text) => {
            onSend(convo.id, text, replyTo);
            setReplyTo(null);
          }}
          onSendFiles={(files, text) => {
            onSendFiles(convo.id, files, text); // File[] + caption
            setReplyTo(null); // attachments can't carry a reply
          }}
          onSendVoice={({ file, duration }) => {
            onSendVoice(convo.id, file, duration); // File + seconds
            setReplyTo(null);
          }}
        />
      </div>

      {infoOpen && (
        <ChatInfoPanel
          convo={convo}
          onClose={() => setInfoOpen(false)}
          onGoTo={(id) => {
            goToMessage(id);
            // on mobile the panel covers the chat, so close it
            if (window.innerWidth < 768) setInfoOpen(false);
          }}
          onUnpin={onUnpin}
          onAddParticipants={onAddParticipants}
          onRemoveParticipants={onRemoveParticipants}
          onlineIds={onlineIds}
          currentUserId={currentUser?.uuid}
          people={people}
          peopleLoading={peopleLoading}
          onLoadPeople={onLoadPeople}
        />
      )}
    </div>
  );
}
