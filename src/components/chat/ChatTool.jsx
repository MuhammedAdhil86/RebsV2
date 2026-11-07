import React, { useEffect, useRef, useState } from "react";
import {
  FiFile,
  FiMic,
  FiPaperclip,
  FiSend,
  FiSmile,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { COLORS } from "./chat_sidebar";

const MAX_FILES = 10;
const MAX_FILE_MB = 10;
const MAX_VOICE_SEC = 300; // auto-stop after 5 minutes

// Voice quality: Opus, mono, 192 kbps (about 7 MB for 5 minutes)
const VOICE_BITRATE = 192000;

const EMOJIS = [
  "😀",
  "😂",
  "😍",
  "🥰",
  "😎",
  "🤔",
  "😅",
  "😭",
  "🙏",
  "👍",
  "👎",
  "👏",
  "🙌",
  "🔥",
  "🎉",
  "❤️",
  "✅",
  "❌",
  "⭐",
  "💯",
  "👀",
  "🤝",
  "💪",
  "😴",
];

// bar heights (%) for the recording animation
const WAVE = [
  30, 55, 40, 75, 50, 90, 60, 35, 80, 45, 70, 55, 95, 40, 65, 30, 85, 50, 60,
  40, 75, 35, 90, 55,
];

const formatSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const formatTime = (s) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

// Prefer MP4/AAC (.m4a): the backend accepts it as audio. A WebM voice note
// is sniffed as video/webm and rejected with 415. Opus/WebM is the fallback
// for browsers that cannot record MP4.
const pickMime = () => {
  if (typeof MediaRecorder === "undefined") return "";
  return (
    [
      "audio/mp4;codecs=mp4a.40.2",
      "audio/mp4",
      "audio/webm;codecs=opus",
      "audio/ogg;codecs=opus",
      "audio/webm",
    ].find((t) => MediaRecorder.isTypeSupported?.(t)) || ""
  );
};

const MIC_SUPPORTED =
  typeof navigator !== "undefined" &&
  !!navigator.mediaDevices?.getUserMedia &&
  typeof MediaRecorder !== "undefined";

function RoundButton({ children, className = "", style, ...props }) {
  return (
    <button
      type="button"
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${className}`}
      style={style}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * Props
 *  onSend(text)                     send a text message
 *  onSendFiles(files[], text)       send attachments (File objects) + optional caption
 *  onSendVoice({ file, duration })  send a recorded voice note (File, seconds)
 * onSendFiles / onSendVoice are optional: without them the buttons explain
 * that sending isn't connected yet instead of failing silently.
 */
export default function ChatTool({
  resetKey,
  placeholder,
  onSend,
  onSendFiles,
  onSendVoice,
}) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]); // { id, file, url }
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiRef = useRef(null);
  const filesRef = useRef([]);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const startedAtRef = useRef(0);
  const discardRef = useRef(false);
  const sendVoiceRef = useRef(onSendVoice);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);
  useEffect(() => {
    sendVoiceRef.current = onSendVoice;
  }, [onSendVoice]);

  const hasFiles = files.length > 0;
  const canSend = text.trim().length > 0 || hasFiles;

  // ---------- attachments ----------
  const revoke = (items) =>
    items.forEach((f) => f.url && URL.revokeObjectURL(f.url));

  const clearFiles = () => {
    revoke(filesRef.current);
    setFiles([]);
  };

  const removeFile = (id) => {
    const target = files.find((f) => f.id === id);
    if (target?.url) URL.revokeObjectURL(target.url);
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const addFiles = (list) => {
    const incoming = Array.from(list || []);
    if (!incoming.length) return;

    const tooBig = incoming.filter((f) => f.size > MAX_FILE_MB * 1024 * 1024);
    const ok = incoming.filter((f) => f.size <= MAX_FILE_MB * 1024 * 1024);
    if (tooBig.length)
      toast.error(
        `${tooBig.length} file${tooBig.length > 1 ? "s" : ""} over ${MAX_FILE_MB} MB skipped`,
      );

    const room = Math.max(MAX_FILES - files.length, 0);
    if (ok.length > room)
      toast.error(`You can attach up to ${MAX_FILES} files`);

    const take = ok.slice(0, room).map((f) => ({
      id: `${f.name}-${f.size}-${f.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
      file: f,
      url: f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
    }));
    if (take.length) setFiles((prev) => [...prev, ...take]);
  };

  // ---------- voice note ----------
  const releaseStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const stopRecording = (send) => {
    discardRef.current = !send;
    clearInterval(timerRef.current);
    setRecording(false);
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
    else releaseStream();
  };

  const startRecording = async () => {
    if (recording) return;
    if (!MIC_SUPPORTED) {
      toast.error("Voice recording isn't supported in this browser");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1, // mono is enough for voice
          sampleRate: 48000, // Opus native rate
          echoCancellation: true,
          noiseSuppression: false, // set true if users work in noisy offices
          autoGainControl: false,
        },
      });
      streamRef.current = stream;

      const mime = pickMime();
      const rec = new MediaRecorder(stream, {
        ...(mime && { mimeType: mime }),
        audioBitsPerSecond: VOICE_BITRATE,
      });
      chunksRef.current = [];
      discardRef.current = false;

      rec.ondataavailable = (e) => {
        if (e.data?.size) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        releaseStream();
        const type = rec.mimeType || mime || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        chunksRef.current = [];
        if (discardRef.current || blob.size === 0) return;

        const duration = Math.max(
          1,
          Math.round((Date.now() - startedAtRef.current) / 1000),
        );
        const ext = type.includes("mp4")
          ? "m4a"
          : type.includes("ogg")
            ? "ogg"
            : "webm";
        // strip ";codecs=opus" so the backend sees a plain mime type
        const file = new File([blob], `voice-note-${Date.now()}.${ext}`, {
          type: type.split(";")[0],
        });

        const send = sendVoiceRef.current;
        if (send) send({ file, duration });
        else toast.info("Sending voice notes isn't connected yet");
      };

      recorderRef.current = rec;
      rec.start(250); // flush a chunk every 250 ms
      startedAtRef.current = Date.now();
      setSeconds(0);
      setRecording(true);

      timerRef.current = setInterval(() => {
        const s = Math.round((Date.now() - startedAtRef.current) / 1000);
        setSeconds(s);
        if (s >= MAX_VOICE_SEC) stopRecording(true);
      }, 250);
    } catch (err) {
      releaseStream();
      toast.error(
        err?.name === "NotAllowedError"
          ? "Microphone is blocked. Allow it in your browser settings."
          : "Couldn't start recording",
      );
    }
  };

  // ---------- text ----------
  const submit = () => {
    if (!canSend) return;
    if (hasFiles) {
      if (!onSendFiles) {
        toast.info("Sending attachments isn't connected yet");
        return;
      }
      onSendFiles(
        files.map((f) => f.file),
        text.trim(),
      );
      clearFiles();
      setText("");
      return;
    }
    onSend(text.trim());
    setText("");
  };

  const insertEmoji = (emoji) => {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    setText(text.slice(0, start) + emoji + text.slice(end));
    requestAnimationFrame(() => {
      el?.focus();
      const pos = start + emoji.length;
      el?.setSelectionRange(pos, pos);
    });
  };

  // ---------- effects ----------
  // switching conversation: clear draft, attachments and any recording
  useEffect(() => {
    setText("");
    setEmojiOpen(false);
    clearFiles();
    if (recorderRef.current?.state === "recording") stopRecording(false);
  }, [resetKey]);

  // textarea grows with its content (up to 160px)
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text, recording]);

  // close the emoji picker on outside click / Escape
  useEffect(() => {
    if (!emojiOpen) return;
    const onDown = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target))
        setEmojiOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setEmojiOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [emojiOpen]);

  // unmount: stop the mic, timers and object URLs
  useEffect(
    () => () => {
      discardRef.current = true;
      clearInterval(timerRef.current);
      if (recorderRef.current?.state === "recording")
        recorderRef.current.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      revoke(filesRef.current);
    },
    [],
  );

  return (
    <div className="shrink-0 px-5 pb-4 pt-1">
      <div
        className="relative rounded-2xl border bg-white shadow-sm transition focus-within:border-[#d13843] focus-within:shadow-md focus-within:ring-4 focus-within:ring-[#fbe8ea]"
        style={{ borderColor: COLORS.line }}
        onDragOver={(e) => {
          if (recording) return;
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!recording) addFiles(e.dataTransfer.files);
        }}
      >
        {dragging && (
          <div
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl border-2 border-dashed bg-white/90 text-[14px] font-medium"
            style={{ borderColor: COLORS.link, color: COLORS.link }}
          >
            Drop files to attach
          </div>
        )}

        {/* attachment previews */}
        {hasFiles && !recording && (
          <div className="flex gap-2 overflow-x-auto px-3 pb-1 pt-3">
            {files.map((f) =>
              f.url ? (
                <div key={f.id} className="group relative shrink-0">
                  <img
                    src={f.url}
                    alt={f.file.name}
                    className="h-16 w-16 rounded-lg border object-cover"
                    style={{ borderColor: COLORS.line }}
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(f.id)}
                    aria-label={`Remove ${f.file.name}`}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#1d1d1f] text-white shadow"
                  >
                    <FiX size={12} />
                  </button>
                </div>
              ) : (
                <div
                  key={f.id}
                  className="relative flex shrink-0 items-center gap-2.5 rounded-lg border py-2 pl-2.5 pr-8"
                  style={{ borderColor: COLORS.line, background: COLORS.mist }}
                >
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-md"
                    style={{ background: COLORS.tint, color: COLORS.link }}
                  >
                    <FiFile size={18} />
                  </span>
                  <div className="min-w-0">
                    <div
                      className="max-w-[150px] truncate text-[13px] font-medium"
                      style={{ color: COLORS.text }}
                    >
                      {f.file.name}
                    </div>
                    <div
                      className="text-[11.5px]"
                      style={{ color: COLORS.sub }}
                    >
                      {formatSize(f.file.size)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(f.id)}
                    aria-label={`Remove ${f.file.name}`}
                    className="absolute right-1.5 top-1.5 rounded-full p-1 hover:bg-black/10"
                    style={{ color: COLORS.sub }}
                  >
                    <FiX size={14} />
                  </button>
                </div>
              ),
            )}
          </div>
        )}

        {recording ? (
          /* ---------------- recording bar ---------------- */
          <div className="flex items-center gap-3 px-3 py-3">
            <RoundButton
              onClick={() => stopRecording(false)}
              aria-label="Cancel recording"
              title="Cancel"
              className="hover:bg-[#fbe8ea]"
              style={{ color: COLORS.link }}
            >
              <FiTrash2 size={18} />
            </RoundButton>

            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#d13843]" />
              <span
                className="w-11 text-[14px] font-medium tabular-nums"
                style={{ color: COLORS.text }}
              >
                {formatTime(seconds)}
              </span>
            </div>

            <div className="flex h-8 min-w-0 flex-1 items-center gap-[3px] overflow-hidden">
              {WAVE.map((h, i) => (
                <span
                  key={i}
                  className="w-[3px] shrink-0 animate-pulse rounded-full"
                  style={{
                    height: `${h}%`,
                    background: COLORS.link,
                    opacity: 0.75,
                    animationDelay: `${(i % 8) * 90}ms`,
                  }}
                />
              ))}
            </div>

            <RoundButton
              onClick={() => stopRecording(true)}
              aria-label="Send voice note"
              title="Send voice note"
              style={{ background: COLORS.active, color: "#fff" }}
            >
              <FiSend size={17} />
            </RoundButton>
          </div>
        ) : (
          /* ---------------- normal composer ---------------- */
          <>
            <textarea
              ref={textareaRef}
              rows={1}
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
              onPaste={(e) => {
                const pasted = e.clipboardData?.files;
                if (pasted?.length) {
                  e.preventDefault();
                  addFiles(pasted);
                }
              }}
              placeholder={hasFiles ? "Add a caption (optional)" : placeholder}
              className="block max-h-40 min-h-[44px] w-full resize-none bg-transparent px-4 py-3 text-[15px] leading-[22px] outline-none placeholder:text-[#8a8e8d]"
              style={{ color: COLORS.text }}
            />

            <div className="flex items-center justify-between px-2 pb-2">
              <div
                className="relative flex items-center gap-0.5"
                ref={emojiRef}
              >
                <RoundButton
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Attach files"
                  title="Attach files"
                  className="hover:bg-[#F2F4F3]"
                  style={{ color: COLORS.sub }}
                >
                  <FiPaperclip size={19} />
                </RoundButton>
                <RoundButton
                  onClick={() => setEmojiOpen((o) => !o)}
                  aria-label="Emoji"
                  title="Emoji"
                  className={emojiOpen ? "bg-[#F2F4F3]" : "hover:bg-[#F2F4F3]"}
                  style={{ color: COLORS.sub }}
                >
                  <FiSmile size={19} />
                </RoundButton>

                {emojiOpen && (
                  <div
                    className="absolute bottom-full left-0 z-30 mb-2 w-[264px] rounded-xl border bg-white p-2 shadow-[0_8px_24px_rgba(0,0,0,0.14)]"
                    style={{ borderColor: COLORS.line }}
                  >
                    <div className="grid grid-cols-8 gap-0.5">
                      {EMOJIS.map((e) => (
                        <button
                          key={e}
                          type="button"
                          onClick={() => insertEmoji(e)}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-[19px] hover:bg-[#F2F4F3]"
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = ""; // allow picking the same file again
                  }}
                />
              </div>

              {canSend ? (
                <RoundButton
                  onClick={submit}
                  aria-label="Send message"
                  title="Send"
                  className="hover:brightness-95"
                  style={{ background: COLORS.active, color: "#fff" }}
                >
                  <FiSend size={17} />
                </RoundButton>
              ) : (
                MIC_SUPPORTED && (
                  <RoundButton
                    onClick={startRecording}
                    aria-label="Record voice note"
                    title="Record voice note"
                    className="hover:bg-[#fbe8ea]"
                    style={{ color: COLORS.link }}
                  >
                    <FiMic size={19} />
                  </RoundButton>
                )
              )}
            </div>
          </>
        )}
      </div>

      {!recording && (
        <div
          className="mt-1.5 hidden px-1 text-right text-[11.5px] sm:block"
          style={{ color: COLORS.sub }}
        >
          <span className="font-medium">Enter</span> to send ·{" "}
          <span className="font-medium">Shift + Enter</span> for a new line
        </div>
      )}
    </div>
  );
}
