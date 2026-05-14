import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore";
import DashboardLayout from "../ui/pagelayout";
import avatar from "../assets/img/avatar.svg";
import { FiUser, FiLock, FiInfo, FiLogOut } from "react-icons/fi";

function Settings() {
  const [activeTab, setActiveTab] = useState("personal");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    jobTitle: "",
    company: "",
    phone: "",
  });

  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully", {
      duration: 3000,
      style: { background: "#333", color: "#fff", borderRadius: "8px" },
    });
    setTimeout(() => navigate("/"), 800);
  };

  // Load user data into form
  useEffect(() => {
    if (user) {
      const u = user.user || user;
      setFormData({
        firstName: u.first_name || "",
        lastName: u.last_name || "",
        email: u.email || "",
        jobTitle: u.designation || "",
        company: u.company || "",
        phone: u.ph_no || "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    toast.success("Profile updated successfully (demo)", {
      duration: 3000,
      style: { background: "#333", color: "#fff" },
    });
  };

  // DELETE USER ACCOUNT
  const handleDeleteAccount = async () => {
    try {
      const userId = user.user?._id || user._id;

      const res = await fetch(
        `${import.meta.env.VITE_API}/delete-user/${userId}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) throw new Error("Failed to delete account");

      toast.success("Account deleted successfully", {
        duration: 3000,
        style: { background: "#333", color: "#fff" },
      });

      logout();
      navigate("/");

    } catch (err) {
      toast.error(err.message || "Something went wrong", {
        duration: 3000,
        style: { background: "#333", color: "#fff" },
      });
    }
  };

  return (
    <DashboardLayout userName={formData.firstName || "User"} onLogout={handleLogout}>
      <div className="bg-white h-[567px] rounded-2xl p-6 overflow-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-lg font-semibold text-gray-800">Settings</h1>
          <div className="w-9 h-9 rounded-full overflow-hidden border">
            <img src={avatar} alt="User" className="w-full h-full object-cover" />
          </div>
        </div>

        <div className="flex gap-6">

          {/* LEFT MENU */}
          <div className="w-72 bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-center shadow-sm">

            <div className="w-24 h-24 rounded-full overflow-hidden mb-4">
              <img src={avatar} alt="User Avatar" className="w-full h-full object-cover" />
            </div>

            <h2 className="text-lg font-semibold text-gray-800">
              {formData.firstName} {formData.lastName}
            </h2>
            <p className="text-sm text-gray-500 mb-6">{formData.email}</p>

            <div className="w-full space-y-2">

              {/* Personal Info */}
              <button
                onClick={() => setActiveTab("personal")}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm ${
                  activeTab === "personal"
                    ? "bg-black text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <FiUser className="text-lg" /> Personal Info
              </button>

              {/* Change Password */}
              <button
                onClick={() => setActiveTab("password")}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm ${
                  activeTab === "password"
                    ? "bg-black text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <FiLock className="text-lg" /> Change Password
              </button>

              {/* About */}
              <button
                onClick={() => setActiveTab("about")}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm ${
                  activeTab === "about"
                    ? "bg-black text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <FiInfo className="text-lg" /> About Us
              </button>

              {/* Delete Account */}
              <button
                onClick={() => setActiveTab("delete")}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm ${
                  activeTab === "delete"
                    ? "bg-red-600 text-white"
                    : "text-red-600 hover:bg-red-100"
                }`}
              >
                🗑 Delete Account
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100"
              >
                <FiLogOut className="text-lg" /> Logout
              </button>
            </div>
          </div>

          {/* RIGHT CONTENT */}
          <div className="flex-1 bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">

            {/* PERSONAL INFO */}
            {activeTab === "personal" && (
              <form onSubmit={handleUpdate} className="grid grid-cols-2 gap-6">

                <div>
                  <label className="block text-sm text-gray-600 mb-2">First name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-2">Last name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-2">Email ID</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-2">Job Title</label>
                  <input
                    type="text"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-2">Company</label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    disabled
                    className="w-full border border-gray-300 bg-gray-100 rounded-md px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-2">Phone number</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-black"
                  />
                </div>

                <div className="col-span-2 flex justify-end">
                  <button
                    type="submit"
                    className="bg-black text-white px-6 py-2 rounded-md text-sm hover:bg-gray-800 transition"
                  >
                    Update
                  </button>
                </div>
              </form>
            )}

            {/* PASSWORD TAB */}
            {activeTab === "password" && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-6">Change Password</h2>
                <p className="text-gray-600 text-sm">
                  This section allows users to update their passwords.
                </p>
              </div>
            )}

            {/* ABOUT TAB */}
            {activeTab === "about" && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-6">About Us</h2>
                <p className="text-gray-600 text-sm">
                  REBS HR System is a comprehensive employee management platform
                  built for efficiency and user-friendliness.
                </p>
              </div>
            )}

            {/* DELETE ACCOUNT */}
            {activeTab === "delete" && (
              <div>
                <h2 className="text-lg font-semibold text-red-600 mb-4">Delete Account</h2>

                <p className="text-sm text-gray-700 mb-6">
                  This action is <strong>permanent</strong>. All your data will be deleted and cannot be recovered.
                </p>

                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-600 text-white px-6 py-2 rounded-md text-sm hover:bg-red-700 transition"
                >
                  Delete My Account
                </button>

                {showDeleteConfirm && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white rounded-xl p-6 w-96 shadow-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Confirm Delete</h3>
                      <p className="text-sm text-gray-600 mb-6">
                        Are you sure you want to delete your account? This action cannot be undone.
                      </p>

                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="px-4 py-2 text-sm rounded-md border"
                        >
                          Cancel
                        </button>

                        <button
                          onClick={handleDeleteAccount}
                          className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700"
                        >
                          Yes, Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Settings;
