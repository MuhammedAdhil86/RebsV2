import React, { useState } from "react";
import { HiChevronLeft } from "react-icons/hi";
import mainImage from "../assets/img/rebs_login.png";
import { useNavigate } from "react-router-dom";

export default function NewPasswordUI() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Forgot Password Email:", email);
    // Navigate to OTP page
    navigate("/otp");
  };

  return (
    <div className="w-full h-screen bg-black flex justify-center items-center p-4">
      <div className="flex h-full w-full rounded-2xl overflow-hidden">
        {/* Left panel */}
        <div className="relative w-[55%] overflow-hidden rounded-l-2xl ">
          <img src={mainImage} alt="Office" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 flex flex-col">
            <div className="relative flex flex-col justify-end h-full p-4">
              {slides.map((slide, index) => (
                <div
                  key={index}
                  className={`absolute w-full flex flex-col items-center text-center transition-opacity duration-500 ${
                    currentSlide === index ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <h2 className="text-white text-2xl mb-4">{slide.title}</h2>
                  <p className="text-white text-sm mb-20">{slide.description}</p>
                </div>
              ))}

              {/* Dots */}
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex gap-2">
                {slides.map((_, index) => (
                  <span
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2 h-2 rounded-full cursor-pointer ${
                      currentSlide === index ? "bg-white" : "bg-gray-400"
                    }`}
                  ></span>
                ))}
              </div>

              {/* Website */}
              <div className="absolute bottom-2 left-2 text-white text-sm">
                www.rebs.in
              </div>
            </div>
          </div>
        </div>

        {/* Gap */}
        <div className="w-2 bg-black"></div>

        {/* Right panel */}
        <div className="w-[45%] bg-white rounded-r-2xl flex flex-col justify-between">
          {/* Form area */}
          <div className="flex-grow flex justify-center items-center px-6 md:px-8 lg:px-12">
            <div className="w-full max-w-md transform scale-90 p-6">
              {/* Header: Chevron + Vertical Bar */}
              <div className="flex items-center mb-6">
                <div
                  className="flex items-center cursor-pointer mr-2"
                  onClick={() => navigate("/")}
                >
                  <HiChevronLeft className="text-gray-700 mr-1" size={24} />
                  <div className="w-px h-5 bg-gray-400 mr-2"></div>
                </div>
                <h1 className="text-xl font-medium text-black">Forgot Password</h1>
              </div>

              {/* Description */}
              <p className="text-gray-500 text-sm mb-6">
                <span className="font-semibold text-black">Hi,</span> Welcome to the password reset page, <br />
                Enter your email first.
              </p>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="New Password"
                  className="w-full text-black border-b border-gray-300 focus:outline-none focus:border-black bg-transparent py-1.5"
                  required
                />
                 <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Conform Password"
                  className="w-full text-black border-b border-gray-300 focus:outline-none focus:border-black bg-transparent py-1.5 "
                  required
                />
                <button
                  type="submit"
                  className="w-full py-2.5 bg-black hover:bg-gray-800 text-white font-medium rounded-xl transition duration-150"
                >
                  Next
                </button>
              </form>
            </div>
          </div>

          {/* Footer inside right panel */}
          <div className="w-full px-6 md:px-8 py-4 flex justify-between text-center md:text-left">
            <div>
              <p className="text-[12px] text-gray-800">
                Powered by{" "}
                <a href="https://teqbae.com/" className="text-black font-medium">
                  Teqbae
                </a>{" "}
                innovations and solution India Pvt Ltd
              </p>
            </div>
            <div className="ml-auto space-x-4">
              <a href="#" className="text-[12px] text-gray-800">
                Privacy Policy
              </a>
              <a href="#" className="text-[12px] text-gray-800">
                Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
