import React, { useEffect, useState } from "react";
import { COLORS, Icon } from "./chat_sidebar";

const FORMAT_BUTTONS = [
  ["B", "font-medium"],
  ["I", "italic"],
  ["S", "line-through"],
];

export default function ChatTool({ resetKey, placeholder, onSend }) {
  const [text, setText] = useState("");
  const canSend = text.trim().length > 0;

  useEffect(() => setText(""), [resetKey]);

  const submit = () => {
    if (!canSend) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <div className="shrink-0 px-5 pb-4">
      <div
        className="rounded-lg border focus-within:border-[#1d1d1f]"
        style={{ borderColor: "#b9bdbb" }}
      >
        <div
          className="flex items-center gap-0.5 rounded-t-lg bg-[#F2F4F3] px-2 py-1"
          style={{ color: COLORS.sub }}
        >
          {FORMAT_BUTTONS.map(([label, cls]) => (
            <button
              key={label}
              className={`h-7 w-7 rounded text-[14px] hover:bg-[#dfe3e1] ${cls}`}
            >
              {label}
            </button>
          ))}
          <span className="mx-1 h-4 w-px bg-[#cfd3d1]" />
          <button className="rounded p-1.5 text-[13px] font-medium hover:bg-[#dfe3e1]">
            &lt;/&gt;
          </button>
        </div>

        <textarea
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !e.nativeEvent.isComposing
            ) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder}
          className="block max-h-40 w-full resize-none bg-transparent px-3 py-2 text-[15px] outline-none placeholder:text-[#8a8e8d]"
          style={{ color: COLORS.text }}
        />

        <div
          className="flex items-center justify-between px-2 pb-1.5"
          style={{ color: COLORS.sub }}
        >
          <div className="flex items-center gap-0.5">
            <button
              className="rounded p-1.5 hover:bg-[#F2F4F3]"
              aria-label="Attach file"
            >
              <Icon name="clip" size={18} />
            </button>
            <button
              className="rounded p-1.5 hover:bg-[#F2F4F3]"
              aria-label="Emoji"
            >
              <Icon name="smile" size={18} />
            </button>
            <button
              className="rounded p-1.5 hover:bg-[#F2F4F3]"
              aria-label="Mention"
            >
              <Icon name="at" size={18} />
            </button>
          </div>
          <button
            onClick={submit}
            disabled={!canSend}
            aria-label="Send message"
            className="flex items-center rounded-md px-2.5 py-1.5 transition disabled:cursor-not-allowed"
            style={{
              background: canSend ? COLORS.active : "#dfe3e1",
              color: canSend ? "#fff" : "#9a9e9d",
            }}
          >
            <Icon name="send" size={16} />
          </button>
        </div>
      </div>

      <div
        className="mt-1 px-1 text-right text-[11.5px]"
        style={{ color: COLORS.sub }}
      >
        <span className="font-medium">Enter</span> to send ·{" "}
        <span className="font-medium">Shift + Enter</span> for a new line
      </div>
    </div>
  );
}
