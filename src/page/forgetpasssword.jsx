import React, { useState, useEffect } from "react";
import { HiChevronLeft } from "react-icons/hi";
import mainImage from "../assets/img/rebs_login.png";
import { useNavigate } from "react-router-dom";
import { requestPasswordResetEmail } from "../service/authservice";
import toast, { Toaster } from "react-hot-toast";

export default function ForgotPasswordUI() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(false);

  const slides = [
    {
      title: "User-Friendly Interface",
      description:
        "Intuitive design for effortless navigation and enhanced user experience.",
    },
    {
      title: "Integration Capabilities",
      description: "Seamless connectivity with third-party tools and platforms",
    },
    {
      title: "Analytics and Reporting",
      description:
        "Data-driven insights to optimize performance and decision-making.",
    },
    {
      title: "Mobile Accessibility",
      description:
        "Stay connected and productive on the go with mobile-friendly solutions.",
    },
    {
      title: "Data Security",
      description:
        "Robust protection measures to safeguard sensitive information",
    },
  ];

  // ✅ Auto-slide logic for left panel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      // payload: { email: "user@example.com" }
      const response = await requestPasswordResetEmail({ email });

      if (response.status_code === 200 || response.success) {
        toast.success("OTP sent successfully!");
        // ✅ Navigate to OTP page, passing the email in state for the next step
        setTimeout(() => {
          navigate("/otp", { state: { email } });
        }, 1000);
      } else {
        toast.error(
          response.message || "Failed to send OTP. Please check your email.",
        );
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Connection error. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen bg-black flex justify-center items-center p-4 font-sans">
      <Toaster position="top-right" />
      <div className="flex h-full w-full rounded-2xl overflow-hidden">
        {/* ---------- Left panel ---------- */}
        <div className="relative w-[55%] overflow-hidden rounded-l-2xl">
          <img
            src={mainImage}
            alt="Office"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 flex flex-col">
            <div className="relative flex flex-col justify-end h-full p-4">
              {slides.map((slide, index) => (
                <div
                  key={index}
                  className={`absolute w-full flex flex-col items-center text-center transition-opacity duration-1000 ease-in-out ${
                    currentSlide === index ? "opacity-100" : "opacity-0"
                  }`}
                  style={{ bottom: "120px", left: "0", right: "0" }}
                >
                  <h2 className="text-white text-2xl mb-4 font-bold">
                    {slide.title}
                  </h2>
                  <p className="text-white text-sm px-10">
                    {slide.description}
                  </p>
                </div>
              ))}

              {/* Dots */}
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex gap-2">
                {slides.map((_, index) => (
                  <span
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2 h-2 rounded-full cursor-pointer transition-all duration-300 ${
                      currentSlide === index
                        ? "bg-white scale-125"
                        : "bg-gray-400 opacity-50"
                    }`}
                  ></span>
                ))}
              </div>

              {/* Website */}
              <div className="absolute bottom-2 left-2 text-white text-sm opacity-60">
                www.rebs.in
              </div>
            </div>
          </div>
        </div>

        {/* ---------- Right panel ---------- */}
        <div className="w-[45%] bg-white rounded-r-2xl flex flex-col justify-between">
          <div className="flex-grow flex justify-center items-center px-6 md:px-8 lg:px-12">
            <div className="w-full max-w-md transform scale-90 p-6">
              <div className="flex items-center mb-8">
                <div
                  className="flex items-center cursor-pointer mr-2"
                  onClick={() => navigate("/")}
                >
                  <HiChevronLeft className="text-gray-700 mr-1" size={24} />
                  <div className="w-px h-5 bg-gray-400 mr-2"></div>
                </div>
                <h1 className="text-xl font-medium text-black font-sans">
                  Forgot Password
                </h1>
              </div>

              <p className="text-gray-500 text-sm mb-8 leading-relaxed font-sans">
                <span className="font-semibold text-black">Hi,</span> Welcome to
                the password reset page. <br />
                Please enter your email below to continue.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full text-black placeholder-gray-500 border-b border-gray-300 focus:outline-none focus:border-black bg-transparent py-2 font-sans"
                  required
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-black hover:bg-gray-800 text-white font-medium rounded-xl transition duration-150 font-sans flex justify-center items-center min-h-[48px]"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    "Next"
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Footer */}
          <div className="w-full px-6 md:px-8 py-4 flex justify-between text-center md:text-left">
            <div>
              <p className="text-[12px] text-gray-800">
                Powered by{" "}
                <a
                  href="https://teqbae.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-black font-medium"
                >
                  Teqbae
                </a>{" "}
                innovations and solution India Pvt Ltd
              </p>
            </div>
            <div className="ml-auto space-x-4">
              <a
                href="#"
                className="text-[12px] text-gray-800 hover:text-black"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-[12px] text-gray-800 hover:text-black"
              >
                Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
