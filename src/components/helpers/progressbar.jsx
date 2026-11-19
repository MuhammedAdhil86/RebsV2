import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

/* ---------- learned duration (keeps pacing realistic) ---------- */
const MIN_MS = 2000;
const MAX_MS = 60000;
const clamp = (n) => Math.min(MAX_MS, Math.max(MIN_MS, n));

const readSaved = (key) => {
  try {
    const v = Number(localStorage.getItem(key));
    return v > 0 ? clamp(v) : null;
  } catch {
    return null;
  }
};
const writeSaved = (key, ms) => {
  try {
    localStorage.setItem(key, String(Math.round(ms)));
  } catch {}
};

/* ---------- visual bar (same RGB look as GlowButton) ---------- */
export default function ProgressBar({ progress = 0, label = "" }) {
  const value = Math.min(100, Math.max(0, progress));

  return (
    <div className="glow-progress w-full font-poppins text-[12px]">
      <div className="flex justify-between items-center mb-2 text-gray-700">
        <span className="font-medium">{label}</span>
        <span className="text-gray-500">{Math.round(value)}%</span>
      </div>

      <div className="glow-progress-track">
        <div className="glow-progress-glow" style={{ width: `${value}%` }} />
        <div className="glow-progress-fill" style={{ width: `${value}%` }} />
      </div>

      <style>{`
        .glow-progress-track {
          position: relative; height: 6px; width: 100%;
          border-radius: 9999px; background: #eceef3; margin-bottom: 6px;
        }
        .glow-progress-fill {
          position: relative; z-index: 2; height: 100%; border-radius: 9999px;
          background: linear-gradient(90deg, #6d7cff, #a855f7, #ec4899, #6d7cff);
          background-size: 300% 100%;
          animation: glow-progress-slide 3s linear infinite;
          transition: width 250ms cubic-bezier(.22,.61,.36,1);
        }
        .glow-progress-glow {
          position: absolute; left: 0; top: 4px; height: 8px;
          border-radius: 9999px;
          background: linear-gradient(90deg, #6d7cff, #a855f7, #ec4899, #6d7cff);
          background-size: 300% 100%;
          animation: glow-progress-slide 3s linear infinite;
          filter: blur(8px); opacity: .55;
          transition: width 250ms cubic-bezier(.22,.61,.36,1);
        }
        @keyframes glow-progress-slide {
          from { background-position: 0% 0; } to { background-position: 300% 0; }
        }
      `}</style>
    </div>
  );
}

/* ---------- toast body: animates itself, no toast.update needed ---------- */
function ProgressToastBody({ ctrl, label, expectedMs, cap }) {
  const [progress, setProgress] = useState(2);

  useEffect(() => {
    const timer = setInterval(() => {
      if (ctrl.done) return setProgress(100);

      const t = (Date.now() - ctrl.startedAt) / expectedMs;
      const base = cap - 10;
      const fake =
        t <= 1
          ? base * (1 - Math.pow(1 - t, 2))
          : base + 10 * (1 - Math.exp(-(t - 1) * 1.5));
      const real = cap + (ctrl.real * (100 - cap)) / 100;

      setProgress((p) =>
        Math.max(p, Math.min(cap, fake), ctrl.real ? real : 0),
      );
    }, 100);

    return () => clearInterval(timer);
  }, [ctrl, expectedMs, cap]);

  return (
    <ProgressBar
      progress={progress}
      label={progress < cap ? `${label}...` : "Downloading..."}
    />
  );
}

/* ---------- public API ---------- */
export function startProgressToast({
  label = "Loading...",
  storageKey = "progress_duration_ms",
  defaultMs = 8000,
  cap = 90,
} = {}) {
  const id = `progress-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const expectedMs = readSaved(storageKey) ?? defaultMs;
  const ctrl = { startedAt: Date.now(), real: 0, done: false };

  toast(
    <ProgressToastBody
      ctrl={ctrl}
      label={label}
      expectedMs={expectedMs}
      cap={cap}
    />,
    {
      toastId: id,
      autoClose: false,
      closeButton: false,
      closeOnClick: false,
      draggable: false,
      icon: false,
    },
  );

  const finalize = (message, type) => {
    const options = {
      render: message,
      type,
      icon: undefined,
      autoClose: type === "success" ? 3000 : 5000,
      closeButton: true,
      closeOnClick: true,
      draggable: true,
    };
    if (toast.isActive(id)) toast.update(id, options);
    else type === "success" ? toast.success(message) : toast.error(message);
  };

  return {
    setReal: (pct) => {
      ctrl.real = Math.max(ctrl.real, pct);
    },

    finish: (message = "Done") => {
      ctrl.done = true;

      const took = Date.now() - ctrl.startedAt;
      const prev = readSaved(storageKey);
      writeSaved(storageKey, clamp(prev ? (prev + took) / 2 : took));

      setTimeout(() => finalize(message, "success"), 700);
    },

    fail: (message = "Something went wrong") => {
      ctrl.done = true;
      finalize(message, "error");
    },
  };
}
