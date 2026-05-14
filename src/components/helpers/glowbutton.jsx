import React from "react";

export default function GlowButton({ children = "Edit in Chat", onClick }) {
  return (
    <>
      <button className="chat-btn" onClick={onClick}>
        <span className="label">{children}</span>
        <span className="glow" />
      </button>

      <style>{`
        .chat-btn {
          position: relative;
          padding: 10px 35px;
          border: none;
          border-radius: 8px;
          font-weight: 100;
          font-family: "Poppins", sans-serif;
          font-size: 12px;
          background: linear-gradient(180deg, #14161c, #0d0f14);
          color: white;
          overflow: visible;
          cursor: pointer;
          transition: transform 180ms cubic-bezier(.22, .61, .36, 1);
        }

        .chat-btn::before {
          content: "";
          position: absolute;
          inset: 0;
          padding: 0px 0px 3px 0px;
          border-radius: inherit;
          background: linear-gradient(90deg, #6d7cff, #a855f7, #ec4899, #6d7cff);
          background-size: 300% 100%;
          animation: slide 3s linear infinite;
          transition: padding 180ms cubic-bezier(.22, .61, .36, 1);
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
        }

        .chat-btn:hover::before {
          padding: 1px 1px 5px 1px;
        }

        .chat-btn:hover .glow {
          opacity: 0.8;
          filter: blur(18px);
        }

        .glow {
          position: absolute;
          left: 12%;
          right: 12%;
          bottom: -8px;
          height: 10px;
          border-radius: 9999px;
          background: linear-gradient(90deg, #6d7cff, #a855f7, #ec4899, #6d7cff);
          background-size: 300% 100%;
          animation: slide 3s linear infinite;
          filter: blur(16px);
          opacity: 0.55;
          transition: opacity 180ms ease, filter 180ms ease;
        }

        @keyframes slide {
          from { background-position: 0% 0; }
          to { background-position: 300% 0; }
        }

        .label {
          position: relative;
          z-index: 2;
        }
      `}</style>
    </>
  );
}
