import React, { useState, useEffect } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import mainImage from "../assets/img/rebs_login.png";
import logoImage from "../assets/img/Picture1.png"; // <-- Add your logo here
import { useAuthStore } from "../store/authStore";
import { UserLogin } from "../repos/userRepo";

export default function LoginUI() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const { login } = useAuthStore();
  const navigate = useNavigate();

  const slides = [
    { title: "User-Friendly Interface", description: "Intuitive design for effortless navigation and enhanced user experience." },
    { title: "Integration Capabilities", description: "Seamless connectivity with third-party tools and platforms." },
    { title: "Analytics and Reporting", description: "Data-driven insights to optimize performance and decision-making." },
    { title: "Mobile Accessibility", description: "Stay connected and productive on the go with mobile-friendly solutions." },
    { title: "Data Security", description: "Robust protection measures to safeguard sensitive information." },
  ];

  // Slide auto-change
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Remember email
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberEmail");
    if (savedEmail) setEmail(savedEmail);
  }, []);

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Correct payload: username instead of email
      console.log("Logging in with:", { username: email, password });
      const data = await UserLogin({ username: email, password });

      // Save auth in store
      login(data.data.token, data.data.user);

      // Remember email
      if (rememberMe) {
        localStorage.setItem("rememberEmail", email);
      } else {
        localStorage.removeItem("rememberEmail");
      }

      toast.success("Login Successful!", { duration: 3000 });
      navigate("/dashboard");
    } catch (err) {
      console.error("Full Axios error:", err);
      const backendMessage = err.response?.data?.message;
      if (backendMessage) {
        toast.error(backendMessage);
        console.log("Backend message:", backendMessage);
      } else {
        toast.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen bg-black overflow-hidden flex relative">
      <div className="flex w-full h-full">
        {/* Left - Slides */}
        <div className="relative h-full overflow-hidden" style={{ width: "55%" }}>
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
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex gap-2">
                {slides.map((_, index) => (
                  <span
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2 h-2 rounded-full cursor-pointer ${currentSlide === index ? "bg-white" : "bg-gray-400"}`}
                  ></span>
                ))}
              </div>
              <div className="absolute bottom-2 left-2 text-white text-sm">www.rebs.in</div>
            </div>
          </div>
        </div>

        {/* Right - Login Form */}
        <div className="h-full flex flex-col relative" style={{ width: "45%" }}>
          <div className="bg-white w-full h-full flex flex-col">
            <div className="flex-grow flex justify-center items-center px-6 md:px-8 lg:px-12">
              <div className="w-full max-w-md transform scale-90 p-6">
                
{/* Logo - Adjusted to move 5px to the left */}
<div className="mb-4 flex justify-start relative -left-[5px]">
  <img src={logoImage} alt="Logo" className="w-12 h-12 object-contain" />
</div>


                <div className="text-start mb-6">
                  <h1 className="text-3xl font-normal text-black mb-1">Welcome back,</h1>
                  <h1 className="text-3xl font-normal text-black mb-2">Admin</h1>
                  <p className="text-gray-500 text-sm">Welcome back! Please enter your details</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-10">
                  <div>
                    <input
                      type="text"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="username"
                      className="w-full font-sans text-black placeholder-gray-500 border-b border-gray-400 focus:outline-none focus:border-black bg-transparent py-1.5"
                    />
                  </div>

                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      className="w-full font-sans text-black placeholder-gray-500 border-b border-gray-400 focus:outline-none focus:border-black bg-transparent py-1.5 pr-8"
                    />
                    <div
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={() => setRememberMe(!rememberMe)}
                        className="h-4 w-4 text-black border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-gray-700 font-sans">Remember me</label>
                    </div>

                    <Link to="/forgetpass" className="font-sans font-semibold text-black hover:text-gray-800">
                      Recovery Password
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-black hover:bg-gray-800 text-white font-medium rounded-xl transition duration-150"
                  >
                    {loading ? "Logging in..." : "Login"}
                  </button>
                </form>
              </div>
            </div>

            <div className="absolute bottom-2 left-0 w-full px-6 md:px-8 flex justify-between text-center md:text-left">
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
    </div>
  );
}
