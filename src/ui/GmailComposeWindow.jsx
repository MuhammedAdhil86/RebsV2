import React, { useState, useRef, useMemo } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import toast from "react-hot-toast";
import {
  X,
  Mail,
  Minus,
  Maximize2,
  Minimize2,
  Paperclip,
  Smile,
  Trash2,
  Loader2,
  FileText,
  Type,
  Undo2,
  Redo2,
  Send,
} from "lucide-react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_TOTAL_BYTES = 25 * 1024 * 1024; // 25 MB attachment limit
const TOOLBAR_ID = "gmail-compose-toolbar";

const EMOJIS = [
  "😀",
  "😃",
  "😄",
  "😁",
  "😆",
  "😅",
  "😂",
  "🤣",
  "😊",
  "🙂",
  "😉",
  "😍",
  "🥰",
  "😘",
  "😎",
  "🤔",
  "😐",
  "😢",
  "😭",
  "😡",
  "👍",
  "👎",
  "👏",
  "🙏",
  "💪",
  "🤝",
  "👋",
  "🎉",
  "🔥",
  "✨",
  "❤️",
  "💙",
  "💯",
  "✅",
  "❌",
  "⭐",
  "📎",
  "📅",
  "📧",
  "🚀",
];

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/* ---------- Recipient row: type an email, press Enter / comma / space ---------- */
/* Each email becomes a chip with a remove (X) button, like Gmail.                  */
const RecipientRow = ({
  label,
  value,
  onChange,
  rightSlot = null,
  autoFocus = false,
  placeholder = "",
}) => {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  // Adds every valid email found in `raw`. Returns true if all were valid.
  const commit = (raw) => {
    const parts = raw
      .split(/[\s,;]+/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length === 0) return true;

    const valid = [];
    const invalid = [];
    parts.forEach((p) => {
      if (!EMAIL_REGEX.test(p)) invalid.push(p);
      else if (!value.includes(p) && !valid.includes(p)) valid.push(p);
    });

    if (valid.length) onChange([...value, ...valid]);
    setError(invalid.length ? "Enter a valid email address" : "");
    setDraft(invalid.join(" "));
    return invalid.length === 0;
  };

  const handleKeyDown = (e) => {
    if (["Enter", ",", ";", " ", "Tab"].includes(e.key)) {
      if (draft.trim()) {
        // Tab only swallows the key when something valid was typed
        if (e.key !== "Tab") e.preventDefault();
        else if (EMAIL_REGEX.test(draft.trim())) e.preventDefault();
        commit(draft);
      } else if (e.key === "Enter") {
        e.preventDefault();
      }
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData?.getData("text");
    if (text && /[\s,;]/.test(text.trim())) {
      e.preventDefault();
      commit(`${draft} ${text}`);
    }
  };

  return (
    <div className="border-b border-zinc-100">
      <div className="flex items-start gap-3 px-6 py-2.5 min-h-[44px]">
        <span className="w-8 shrink-0 pt-1.5 text-[10px] uppercase tracking-widest text-zinc-500">
          {label}
        </span>
        <div className="flex flex-1 flex-wrap items-center gap-1.5">
          {value.map((email) => (
            <span
              key={email}
              className="flex items-center gap-1 bg-zinc-100 text-black rounded-full pl-3 pr-1 py-1 text-[11px]"
            >
              {email}
              <button
                type="button"
                title="Remove"
                onClick={() => onChange(value.filter((v) => v !== email))}
                className="p-0.5 rounded-full bg-zinc-200 hover:bg-black hover:text-white text-zinc-600 transition-colors cursor-pointer"
              >
                <X size={11} />
              </button>
            </span>
          ))}
          <input
            type="text"
            autoFocus={autoFocus}
            value={draft}
            placeholder={value.length === 0 ? placeholder : ""}
            onChange={(e) => {
              setDraft(e.target.value);
              if (error) setError("");
            }}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onBlur={() => commit(draft)}
            className="flex-1 min-w-[140px] py-1.5 bg-transparent outline-none text-[12px] text-black placeholder:text-zinc-400"
          />
        </div>
        {rightSlot}
      </div>
      {error && (
        <p className="text-[10px] text-red-500 px-6 pb-1.5 ml-11">{error}</p>
      )}
    </div>
  );
};

/* ---------- Compose window (Gmail features, our modal theme) ---------- */
const GmailComposeWindow = ({
  onClose,
  onSend, // ({ to, cc, bcc, subject, body_html, attachments })
  loading = false,
  initialTo = [],
  initialCc = [],
  initialBcc = [],
}) => {
  const quillRef = useRef(null);
  const fileInputRef = useRef(null);

  const [to, setTo] = useState(initialTo);
  const [cc, setCc] = useState(initialCc);
  const [bcc, setBcc] = useState(initialBcc);
  const [showCc, setShowCc] = useState(initialCc.length > 0);
  const [showBcc, setShowBcc] = useState(initialBcc.length > 0);
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [attachments, setAttachments] = useState([]);

  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [showFormatting, setShowFormatting] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [dragging, setDragging] = useState(false);

  // Stable modules object (react-quill re-initialises if this changes)
  const modules = useMemo(
    () => ({
      toolbar: {
        container: `#${TOOLBAR_ID}`,
        handlers: {
          undo: () => quillRef.current?.getEditor().history.undo(),
          redo: () => quillRef.current?.getEditor().history.redo(),
        },
      },
      history: { delay: 500, maxStack: 100, userOnly: true },
    }),
    [],
  );

  const formats = [
    "size",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "align",
    "list",
    "bullet",
    "indent",
    "blockquote",
    "link",
    "image",
  ];

  const totalBytes = attachments.reduce((sum, f) => sum + f.size, 0);

  /* ----- Attachments ----- */
  const addFiles = (fileList) => {
    const incoming = Array.from(fileList || []);
    if (incoming.length === 0) return;

    let runningTotal = totalBytes;
    const accepted = [];

    incoming.forEach((file) => {
      const duplicate = [...attachments, ...accepted].some(
        (f) => f.name === file.name && f.size === file.size,
      );
      if (duplicate) return;

      if (runningTotal + file.size > MAX_TOTAL_BYTES) {
        toast.error(`"${file.name}" exceeds the 25 MB attachment limit.`);
        return;
      }
      runningTotal += file.size;
      accepted.push(file);
    });

    if (accepted.length) setAttachments((prev) => [...prev, ...accepted]);
  };

  const removeAttachment = (index) =>
    setAttachments((prev) => prev.filter((_, i) => i !== index));

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer?.files);
  };

  /* ----- Emoji ----- */
  const insertEmoji = (emoji) => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;
    const range = editor.getSelection(true);
    const index = range ? range.index : editor.getLength();
    editor.insertText(index, emoji, "user");
    editor.setSelection(index + emoji.length);
    setShowEmoji(false);
  };

  /* ----- Send ----- */
  const doSend = () => {
    if (loading) return;

    if (to.length === 0) {
      toast.error("Please specify at least one recipient.");
      return;
    }
    if (
      !subject.trim() &&
      !window.confirm("Send this message without a subject?")
    ) {
      return;
    }

    onSend?.({
      to,
      cc,
      bcc,
      subject: subject.trim(),
      body_html: bodyHtml,
      attachments,
    });
  };

  const handleKeyDown = (e) => {
    // Ctrl/Cmd + Enter sends, like Gmail
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      doSend();
    }
  };

  const title = subject.trim() || "New Message";
  const headerBtn =
    "p-2 rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-black transition-colors cursor-pointer";
  const linkClass =
    "pt-1.5 text-[11px] text-zinc-500 hover:text-black hover:underline cursor-pointer";
  const footerIconBtn =
    "p-2 rounded-full text-zinc-500 hover:bg-zinc-200 hover:text-black transition-colors cursor-pointer";

  /* ===== Minimized: only a title bar, docked bottom-right ===== */
  if (minimized) {
    return (
      <div className="fixed bottom-0 right-6 z-[100] w-[300px] font-poppins font-normal shadow-2xl rounded-t-2xl overflow-hidden border border-zinc-200 border-b-0">
        <div
          onClick={() => setMinimized(false)}
          className="flex items-center justify-between bg-black text-white pl-4 pr-2 py-2.5 cursor-pointer"
        >
          <span className="text-[12px] truncate">{title}</span>
          <div
            className="flex items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              title="Restore"
              onClick={() => setMinimized(false)}
              className="p-1.5 rounded-full hover:bg-white/15 cursor-pointer"
            >
              <Maximize2 size={13} />
            </button>
            <button
              type="button"
              title="Close"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/15 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ===== Full compose window (centered) ===== */
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none font-poppins font-normal text-[12px]">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .gmail-quill .ql-container.ql-snow { border: none; font-family: inherit; font-size: 13px; }
            .gmail-quill .ql-editor { padding: 12px 24px; min-height: 160px; line-height: 1.6; color: #000; }
            #${TOOLBAR_ID}.ql-toolbar.ql-snow { border: none; border-top: 1px solid #f4f4f5; padding: 6px 18px; background: #fff; }
            #${TOOLBAR_ID} .ql-picker-options { top: auto !important; bottom: 100%; }
            #${TOOLBAR_ID} .ql-formats { margin-right: 10px; }
            #${TOOLBAR_ID} button.ql-undo, #${TOOLBAR_ID} button.ql-redo { display: inline-flex; align-items: center; justify-content: center; }
            #${TOOLBAR_ID} button:hover, #${TOOLBAR_ID} button.ql-active { color: #000; }
            #${TOOLBAR_ID} button:hover .ql-stroke, #${TOOLBAR_ID} button.ql-active .ql-stroke { stroke: #000; }
            #${TOOLBAR_ID} button:hover .ql-fill, #${TOOLBAR_ID} button.ql-active .ql-fill { fill: #000; }
          `,
        }}
      />

      <div
        onKeyDown={handleKeyDown}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false);
        }}
        onDrop={handleDrop}
        className={`pointer-events-auto relative bg-white rounded-3xl shadow-2xl border border-zinc-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${
          maximized
            ? "w-[min(1000px,96vw)] h-[90vh]"
            : "w-[640px] max-w-full h-[640px] max-h-[90vh]"
        }`}
      >
        {/* Header (same look as the first modal) */}
        <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 bg-black rounded-2xl text-white shrink-0">
              <Mail size={18} />
            </div>
            <h2 className="text-[15px] text-black leading-tight font-normal truncate">
              {title}
            </h2>
          </div>
          <div className="flex items-center shrink-0">
            <button
              type="button"
              title="Minimize"
              onClick={() => setMinimized(true)}
              className={headerBtn}
            >
              <Minus size={16} />
            </button>
            <button
              type="button"
              title={maximized ? "Exit full screen" : "Full screen"}
              onClick={() => setMaximized((v) => !v)}
              className={headerBtn}
            >
              {maximized ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
            <button
              type="button"
              title="Close"
              onClick={onClose}
              className={headerBtn}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Recipients + subject */}
        <div className="shrink-0 max-h-[220px] overflow-y-auto">
          <RecipientRow
            label="To"
            value={to}
            onChange={setTo}
            autoFocus
            placeholder="test@gmail.com, test1@gmail.com"
            rightSlot={
              <div className="flex items-center gap-3 shrink-0">
                {!showCc && (
                  <button
                    type="button"
                    onClick={() => setShowCc(true)}
                    className={linkClass}
                  >
                    Cc
                  </button>
                )}
                {!showBcc && (
                  <button
                    type="button"
                    onClick={() => setShowBcc(true)}
                    className={linkClass}
                  >
                    Bcc
                  </button>
                )}
              </div>
            }
          />
          {showCc && (
            <RecipientRow label="Cc" value={cc} onChange={setCc} autoFocus />
          )}
          {showBcc && (
            <RecipientRow label="Bcc" value={bcc} onChange={setBcc} autoFocus />
          )}
          <div className="border-b border-zinc-100 px-6 py-2.5 min-h-[44px] flex items-center">
            <input
              type="text"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-transparent outline-none text-[12px] text-black placeholder:text-zinc-400"
            />
          </div>
        </div>

        {/* Body (rich text) + attachments */}
        <div className="flex-1 overflow-y-auto gmail-quill">
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={bodyHtml}
            onChange={setBodyHtml}
            modules={modules}
            formats={formats}
          />

          {attachments.length > 0 && (
            <div className="px-6 pb-4 pt-1">
              <div className="flex flex-wrap gap-2">
                {attachments.map((file, i) => (
                  <div
                    key={`${file.name}-${file.size}-${i}`}
                    className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl pl-3 pr-1.5 py-1.5 text-[11px] max-w-[280px]"
                  >
                    <FileText size={15} className="text-zinc-500 shrink-0" />
                    <span className="truncate text-black">{file.name}</span>
                    <span className="text-zinc-400 shrink-0">
                      ({formatSize(file.size)})
                    </span>
                    <button
                      type="button"
                      title="Remove attachment"
                      onClick={() => removeAttachment(i)}
                      className="p-0.5 rounded-full bg-zinc-200 hover:bg-black hover:text-white text-zinc-600 transition-colors cursor-pointer shrink-0"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-zinc-400 mt-2">
                {attachments.length} attachment
                {attachments.length > 1 ? "s" : ""} · {formatSize(totalBytes)}{" "}
                of 25 MB
              </p>
            </div>
          )}
        </div>

        {/* Formatting toolbar (toggled with the "A" button) */}
        <div
          id={TOOLBAR_ID}
          className={`ql-toolbar ql-snow shrink-0 ${showFormatting ? "" : "hidden"}`}
        >
          <span className="ql-formats">
            <button type="button" className="ql-undo" title="Undo">
              <Undo2 size={16} />
            </button>
            <button type="button" className="ql-redo" title="Redo">
              <Redo2 size={16} />
            </button>
          </span>
          <span className="ql-formats">
            <select className="ql-size" defaultValue="">
              <option value="small" />
              <option value="" />
              <option value="large" />
              <option value="huge" />
            </select>
          </span>
          <span className="ql-formats">
            <button type="button" className="ql-bold" />
            <button type="button" className="ql-italic" />
            <button type="button" className="ql-underline" />
            <button type="button" className="ql-strike" />
            <select className="ql-color" />
            <select className="ql-background" />
          </span>
          <span className="ql-formats">
            <select className="ql-align" />
            <button type="button" className="ql-list" value="ordered" />
            <button type="button" className="ql-list" value="bullet" />
            <button type="button" className="ql-indent" value="-1" />
            <button type="button" className="ql-indent" value="+1" />
          </span>
          <span className="ql-formats">
            <button type="button" className="ql-blockquote" />
            <button type="button" className="ql-link" />
            <button type="button" className="ql-image" />
          </span>
        </div>

        {/* Footer (same look as the first modal) */}
        <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between shrink-0 relative">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={loading}
              onClick={doSend}
              className="px-10 py-3 mr-2 bg-black text-white rounded-2xl hover:bg-zinc-800 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-20 shadow-lg font-normal cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <Send size={15} /> Send
                </>
              )}
            </button>

            <button
              type="button"
              title="Formatting options"
              onClick={() => setShowFormatting((v) => !v)}
              className={`${footerIconBtn} ${showFormatting ? "bg-zinc-200 text-black" : ""}`}
            >
              <Type size={18} />
            </button>

            <button
              type="button"
              title="Attach files"
              onClick={() => fileInputRef.current?.click()}
              className={footerIconBtn}
            >
              <Paperclip size={18} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />

            <div className="relative">
              <button
                type="button"
                title="Insert emoji"
                onClick={() => setShowEmoji((v) => !v)}
                className={`${footerIconBtn} ${showEmoji ? "bg-zinc-200 text-black" : ""}`}
              >
                <Smile size={18} />
              </button>
              {showEmoji && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowEmoji(false)}
                  />
                  <div className="absolute bottom-full left-0 mb-2 w-72 bg-white border border-zinc-200 rounded-2xl shadow-2xl z-20 p-3 grid grid-cols-10 gap-1">
                    {EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => insertEmoji(emoji)}
                        className="text-[17px] leading-none p-1 rounded hover:bg-zinc-100 cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            title="Discard draft"
            onClick={onClose}
            className={footerIconBtn}
          >
            <Trash2 size={18} />
          </button>
        </div>

        {/* Drag & drop overlay */}
        {dragging && (
          <div className="absolute inset-0 z-30 bg-white/90 border-2 border-dashed border-black rounded-3xl flex flex-col items-center justify-center gap-2 pointer-events-none">
            <Paperclip size={28} className="text-black" />
            <span className="text-[13px] text-black">
              Drop files here to attach
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GmailComposeWindow;
