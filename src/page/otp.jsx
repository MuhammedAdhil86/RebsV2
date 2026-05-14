import React, { useState, useEffect } from "react";
import { HiChevronLeft, HiOutlineEye, HiOutlineEyeOff } from "react-icons/hi";
import mainImage from "../assets/img/rebs_login.png";
import { useNavigate, useLocation } from "react-router-dom";
import {
  verifyForgotPasswordOTP,
  finalizeForgotPassword,
} from "../service/authservice";
import toast, { Toaster } from "react-hot-toast";

export default function OtpUi() {
  const navigate = useNavigate();
  const location = useLocation();

  // --- Background Context ---
  const emailFromProps = location.state?.email || "";

  // --- UI States ---
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "User-Friendly Interface",
      description: "Intuitive design for effortless navigation.",
    },
    {
      title: "Integration Capabilities",
      description: "Seamless connectivity with platforms.",
    },
    {
      title: "Analytics and Reporting",
      description: "Data-driven insights to optimize performance.",
    },
    { title: "Mobile Accessibility", description: "Stay connected on the go." },
    {
      title: "Data Security",
      description: "Robust protection for sensitive info.",
    },
  ];

  // --- Auto Slide Logic ---
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // --- OTP Input Handler (Numeric 4-Digit Only) ---
  const handleOtpChange = (e) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length <= 4) {
      setOtp(val);
    }
  };

  // --- Step 1: Verify OTP ---
  const handleVerifyOtp = async () => {
    if (otp.length !== 4) return toast.error("Please enter the 4-digit OTP");
    setLoading(true);
    try {
      const payload = { username: emailFromProps, otp: otp };
      const response = await verifyForgotPasswordOTP(payload);

      if (response.status_code === 200) {
        // ✅ SAVE TOKEN: This is used by the finalize service
        if (response.data?.token) {
          localStorage.setItem("resetToken", response.data.token);
        }
        toast.success("OTP Verified Successfully!");
        setIsOtpVerified(true);
      } else {
        toast.error(response.message || "Invalid OTP code.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  // --- Step 2: Finalize Password ---
  const handleFinalReset = async () => {
    if (!newPassword) return toast.error("Please enter a new password");
    setLoading(true);
    try {
      // Body matches Postman: { "password": "..." }
      const payload = { password: newPassword };
      const response = await finalizeForgotPassword(payload);

      if (response.status_code === 200) {
        toast.success("Password updated successfully!");
        localStorage.removeItem("resetToken"); // Cleanup
        setTimeout(() => navigate("/"), 2000);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Reset failed. Session may have expired.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    isOtpVerified ? handleFinalReset() : handleVerifyOtp();
  };

  return (
    <div className="w-full h-screen bg-black flex justify-center items-center p-4 font-poppins text-[12px]">
      <Toaster position="top-right" />
      <div className="flex h-full w-full rounded-2xl overflow-hidden shadow-2xl">
        {/* ---------- Left Panel (Slideshow) ---------- */}
        <div className="relative w-[55%] overflow-hidden rounded-l-2xl">
          <img
            src={mainImage}
            alt="Office"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-8">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`absolute w-full left-0 text-center transition-opacity duration-1000 ${
                  currentSlide === index ? "opacity-100" : "opacity-0"
                }`}
              >
                <h2 className="text-white text-2xl font-bold mb-4 tracking-tight">
                  {slide.title}
                </h2>
                <p className="text-white/70 px-12 mb-20">{slide.description}</p>
              </div>
            ))}
            <div className="flex justify-center gap-2 mb-12">
              {slides.map((_, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    currentSlide === i ? "bg-white scale-125" : "bg-white/30"
                  }`}
                ></span>
              ))}
            </div>
            <div className="text-white/40 text-[10px] tracking-widest uppercase font-bold">
              WWW.REBS.IN
            </div>
          </div>
        </div>

        <div className="w-2 bg-black"></div>

        {/* ---------- Right Panel (Form) ---------- */}
        <div className="w-[45%] bg-white rounded-r-2xl flex flex-col justify-between p-12">
          <div className="flex-grow flex items-center justify-center">
            <div className="w-full max-w-sm">
              <div className="flex items-center mb-8">
                <div
                  className="flex items-center cursor-pointer group"
                  onClick={() => navigate("/forgot-password")}
                >
                  <HiChevronLeft
                    className="text-slate-400 group-hover:text-black transition-colors"
                    size={24}
                  />
                  <div className="w-px h-5 bg-slate-200 mx-2"></div>
                </div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  {isOtpVerified ? "Set Password" : "Authentication"}
                </h1>
              </div>

              <p className="text-slate-500 mb-10 leading-relaxed font-normal">
                <span className="font-bold text-slate-900 italic ">
                  Target Account:
                </span>{" "}
                {emailFromProps || "User"}
                <br />
                {isOtpVerified
                  ? "Identity verified. Please create your new secure password."
                  : "Enter the 4-digit verification code sent to your registered email address."}
              </p>

              <form onSubmit={handleSubmit} className="space-y-10">
                {!isOtpVerified ? (
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={handleOtpChange}
                    placeholder="• • • •"
                    className="w-full text-slate-900 border-b border-slate-200 focus:outline-none focus:border-black bg-transparent py-2 font-bold text-center text-xl tracking-[1.2em] placeholder:text-slate-200"
                    required
                    disabled={loading}
                  />
                ) : (
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New Password"
                      className="w-full text-slate-900 border-b border-slate-200 focus:outline-none focus:border-black bg-transparent py-2 font-medium animate-in fade-in"
                      required
                      disabled={loading}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors"
                    >
                      {showPassword ? (
                        <HiOutlineEyeOff size={18} />
                      ) : (
                        <HiOutlineEye size={18} />
                      )}
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-xl transition-all shadow-lg shadow-slate-200 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
                  ) : isOtpVerified ? (
                    "FINALIZE RESET"
                  ) : (
                    "VERIFY CODE"
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center opacity-40">
            <p className="text-[10px] font-bold tracking-tight uppercase">
              POWERED BY TEQBAE INNOVATIONS
            </p>
            <div className="flex gap-4 text-[10px] font-bold uppercase">
              <a href="#" className="hover:text-black transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-black transition-colors">
                Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
