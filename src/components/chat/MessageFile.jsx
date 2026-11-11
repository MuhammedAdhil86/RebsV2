import React from "react";
import { FiFile, FiFilm, FiMic, FiX } from "react-icons/fi";

const formatSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

// Telegram-style round progress button: ring = progress, X = cancel
function UploadRing({ percent = 0, onCancel, size = 40 }) {
  const stroke = 3;
  const r = (size - stroke * 2) / 2;
  const c = 2 * Math.PI * r;
  const shown = Math.min(100, Math.max(percent, 4)); // always a small arc
  return (
    <button
      type="button"
      onClick={onCancel}
      title="Cancel upload"
      aria-label="Cancel upload"
      className="relative flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: "rgba(29,29,31,0.6)",
        color: "#fff",
      }}
    >
      <svg
        width={size}
        height={size}
        className="absolute inset-0 -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#fff"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - shown / 100)}
          style={{ transition: "stroke-dashoffset 0.2s linear" }}
        />
      </svg>
      <FiX size={16} />
    </button>
  );
}

/**
 * Renders the attachment of one message.
 * file = { name, size, url, mime, uploading, progress, cancel }
 *   progress = { loaded, total, percent }   (bytes sent so far)
 *   cancel() = stops the upload
 */
export default function MessageFile({ file }) {
  if (!file?.url) return null;

  const mime = file.mime || "";
  const dim = file.uploading ? "opacity-60" : "";

  // ---------------- uploading: size, MB sent so far, cancel ----------------
  if (file.uploading) {
    const p = file.progress ?? { loaded: 0, total: file.size, percent: 0 };
    const total = p.total || file.size || 0;
    const label = `${formatSize(p.loaded)} / ${formatSize(total)}`;

    if (mime.startsWith("image/")) {
      return (
        <div className="relative mt-1 inline-block max-w-full">
          <img
            src={file.url}
            alt={file.name}
            className="max-h-64 max-w-full rounded-lg border object-cover opacity-70"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
            <UploadRing percent={p.percent} onCancel={file.cancel} size={46} />
            <span className="rounded-full bg-black/55 px-2 py-0.5 text-[11.5px] text-white">
              {label}
            </span>
          </div>
        </div>
      );
    }

    const Icon = mime.startsWith("audio/")
      ? FiMic
      : mime.startsWith("video/")
        ? FiFilm
        : FiFile;

    return (
      <div className="mt-1 flex w-[270px] max-w-full items-center gap-3 rounded-lg border px-3 py-2">
        <UploadRing percent={p.percent} onCancel={file.cancel} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-[13px] font-medium">
            <Icon size={14} className="shrink-0 opacity-70" />
            <span className="truncate">{file.name}</span>
          </span>
          <span className="block text-[11.5px] opacity-70">
            {label} · {p.percent}%
          </span>
          <span className="mt-1 block h-1 w-full overflow-hidden rounded-full bg-black/10">
            <span
              className="block h-full rounded-full transition-[width] duration-200"
              style={{ width: `${p.percent}%`, background: "#d13843" }}
            />
          </span>
        </span>
      </div>
    );
  }

  // ---------------- sent: normal view ----------------
  if (mime.startsWith("image/")) {
    return (
      <a href={file.url} target="_blank" rel="noreferrer" className={dim}>
        <img
          src={file.url}
          alt={file.name}
          className="mt-1 max-h-64 max-w-full rounded-lg border object-cover"
          loading="lazy"
        />
      </a>
    );
  }

  if (mime.startsWith("audio/")) {
    return (
      <audio
        controls
        preload="metadata"
        src={file.url}
        className={`mt-1 h-10 w-64 max-w-full ${dim}`}
      />
    );
  }

  if (mime.startsWith("video/")) {
    return (
      <video
        controls
        preload="metadata"
        src={file.url}
        className={`mt-1 max-h-64 max-w-full rounded-lg ${dim}`}
      />
    );
  }

  return (
    <a
      href={file.url}
      target="_blank"
      rel="noreferrer"
      download={file.name}
      className={`mt-1 flex w-fit max-w-full items-center gap-2.5 rounded-lg border px-3 py-2 hover:bg-black/5 ${dim}`}
    >
      <FiFile size={18} />
      <span className="min-w-0">
        <span className="block max-w-[200px] truncate text-[13px] font-medium">
          {file.name}
        </span>
        <span className="block text-[11.5px] opacity-70">
          {formatSize(file.size)}
        </span>
      </span>
    </a>
  );
}
