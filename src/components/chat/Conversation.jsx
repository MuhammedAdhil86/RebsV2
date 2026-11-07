import React, { useState } from "react";
import { titleOf } from "./chat_sidebar";
import ChatViewHead from "./ChatViewHead";
import ChatViewer, { prefixOf } from "./ChatViewer";
import ChatTool from "./ChatTool";

export default function Conversation({
  convo,
  onBack,
  onSend,
  onSendFiles,
  onSendVoice,
  onReact,
  onlineIds,
  onDelete,
  onDeleteMessage,
  currentUser,
}) {
  const [replyTo, setReplyTo] = useState(null);
  const title = titleOf(convo);
  const placeholder =
    convo.kind === "dm"
      ? `Message ${title}`
      : `Message ${prefixOf(convo)}${title}`;

  return (
    <div className="flex h-full flex-col bg-white">
      <ChatViewHead
        convo={convo}
        onBack={onBack}
        onlineIds={onlineIds}
        onDelete={onDelete}
      />
      <ChatViewer
        convo={convo}
        currentUserId={currentUser?.uuid}
        onReact={onReact}
        onReply={setReplyTo}
        onDelete={onDeleteMessage}
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
        onSendFiles={(files, text) => onSendFiles(convo.id, files, text)} // File[] + caption
        onSendVoice={({ file, duration }) =>
          onSendVoice(convo.id, file, duration)
        } // File + seconds
      />
    </div>
  );
}
