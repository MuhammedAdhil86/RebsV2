import React from "react";
import { FiFile } from "react-icons/fi";

const formatSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

/**
 * Renders the attachment of one message.
 * Usage inside ChatViewer, where the message text is rendered:
 *
 *   import MessageFile from "./MessageFile";
 *   ...
 *   {msg.file && <MessageFile file={msg.file} />}
 *
 * file = { name, size, url, mime, uploading }
 */
export default function MessageFile({ file }) {
  if (!file?.url) return null;

  const mime = file.mime || "";
  const dim = file.uploading ? "opacity-60" : "";

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
