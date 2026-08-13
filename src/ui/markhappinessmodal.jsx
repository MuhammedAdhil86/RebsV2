import React, { useState } from "react";
import dashboardService from "../service/dashboardService";
import { toast } from "react-hot-toast";

// Black & White Glow Button Component
function GlowSubmitButton({ children = "Submit", onClick, disabled }) {
  return (
    <>
      <button
        type="button"
        className="chat-btn"
        onClick={onClick}
        disabled={disabled}
      >
        <span className="label">{children}</span>
        <span className="glow" />
      </button>

      <style>{`
        .chat-btn {
          position: relative;
          padding: 10px 24px;
          border: none;
          border-radius: 12px;
          font-weight: 400; /* Regular weight */
          font-family: inherit;
          font-size: 14px;
          background: linear-gradient(180deg, #14161c, #0d0f14);
          color: white;
          overflow: visible;
          cursor: pointer;
          transition: transform 180ms cubic-bezier(.22, .61, .36, 1);
          width: 100%;
        }

        .chat-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .chat-btn::before {
          content: "";
          position: absolute;
          inset: 0;
          padding: 0px 0px 3px 0px;
          border-radius: inherit;
          background: linear-gradient(90deg, #ffffff, #888888, #333333, #ffffff);
          background-size: 300% 100%;
          animation: slide 3s linear infinite;
          transition: padding 180ms cubic-bezier(.22, .61, .36, 1);
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
        }

        .chat-btn:hover:not(:disabled)::before {
          padding: 1px 1px 5px 1px;
        }

        .chat-btn:hover:not(:disabled) .glow {
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
          background: linear-gradient(90deg, #ffffff, #888888, #333333, #ffffff);
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

const MarkHappinessModal = ({ isOpen, onClose, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Validation: Star rating is required
    if (!rating) {
      toast.error("Please select a star rating before submitting!");
      return;
    }

    // 2. Validation: Feedback is mandatory for 1 and 2 stars
    if ((rating === 1 || rating === 2) && !feedback.trim()) {
      toast.error("Please provide feedback explaining your rating!");
      return;
    }

    try {
      setLoading(true);

      await dashboardService.submitHappinessRating({
        rating,
        feedback: rating <= 2 ? feedback.trim() : "", // Only pass feedback for 1 and 2 stars
      });

      toast.success("Thank you for sharing your feedback!");
      onSuccess();
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast.error("Failed to submit rating. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-normal">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <h2 className="text-xl font-normal text-gray-900 mb-2 text-center">
          How are you feeling today?
        </h2>
        <p className="text-sm font-normal text-gray-500 mb-6 text-center">
          Please rate your overall happiness for today.
        </p>

        {/* Star Rating System (1 to 5) */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`w-10 h-10 rounded-xl text-xl font-normal transition-all flex items-center justify-center ${
                star <= rating
                  ? "bg-black text-white scale-105"
                  : "bg-gray-100 text-gray-400 hover:bg-gray-200"
              }`}
            >
              ★
            </button>
          ))}
        </div>

        {/* Mandatory Feedback Field - ONLY for 1 and 2 stars */}
        {(rating === 1 || rating === 2) && (
          <div className="mb-6">
            <textarea
              className="w-full border border-gray-300 rounded-xl p-3 text-sm font-normal focus:outline-none focus:ring-1 focus:ring-black resize-none text-gray-800"
              rows="3"
              placeholder="Feedback is required for this rating. Tell us what can be improved..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Remind Me Later: White Background with Black Border */}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5  rounded-xl text-black bg-white border border-black hover:bg-gray-50 font-normal text-sm transition-all"
          >
            Remind Me Later
          </button>

          {/* Black and White Glow Submit Button */}
          <div className="flex-1">
            <GlowSubmitButton onClick={handleSubmit} disabled={loading}>
              {loading ? "Submitting..." : "Submit"}
            </GlowSubmitButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkHappinessModal;
