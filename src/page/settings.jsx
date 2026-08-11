import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../ui/pagelayout";
import HeaderGlobal from "../ui/headerglobal";
import avatar from "../assets/img/avatar.svg";
import { FiUser, FiInfo, FiLogOut, FiCamera } from "react-icons/fi";
import {
  getMyPersonalProfile,
  updateMyPersonalProfile,
  updateProfileImage,
} from "../service/employeeService";
import SettingsProfile from "../components/settingsprofile";
import LogoutConfirmationModal from "../ui/conformationmodal";
import { useAuthStore } from "../store/authStore";

function Settings() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem("settings_active_tab");
    return saved && saved !== "password" ? saved : "personal";
  });

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  // Avatar Image Upload States
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    jobTitle: "",
    company: "",
    phone: "",
    image: "",
    uan: "",
    aadhar: "",
    pan: "",
    epfNumber: "",
    esiNumber: "",
    dateOfBirth: "",
    maritalStatus: "",
    presentAddress: "",
    permanentAddress: "",
    bloodGroup: "",
  });

  useEffect(() => {
    localStorage.setItem("settings_active_tab", activeTab);
  }, [activeTab]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await getMyPersonalProfile();
      const data = response.data || response;

      if (data) {
        setUserId(data._id || data.id);
        setFormData({
          firstName: data.first_name || "",
          lastName: data.last_name || "",
          email: data.email || "",
          jobTitle: data.job_title || data.designation || "",
          company: data.company || "",
          phone: data.phone_number || data.ph_no || "",
          image: data.image || "",
          uan: data.uan || "",
          aadhar: data.aadhar || "",
          pan: data.pan || "",
          epfNumber: data.epf_number || "",
          esiNumber: data.esi_number || "",
          dateOfBirth: data.date_of_birth
            ? data.date_of_birth.split("T")[0]
            : "",
          maritalStatus: data.marital_status || "",
          presentAddress: data.present_address || "",
          permanentAddress:
            data.permanant_address || data.permanent_address || "",
          bloodGroup: data.blood_group || "",
        });
      }
    } catch (error) {
      console.error("Error fetching personal profile:", error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // --- PROFILE IMAGE HANDLERS ---
  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleImageUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploadingImage(true);
      const res = await updateProfileImage(selectedFile);
      const newImageUrl = res?.data?.image || res?.image || res?.url;

      if (newImageUrl) {
        setFormData((prev) => ({
          ...prev,
          image: newImageUrl,
        }));
      } else {
        await fetchProfile();
      }

      toast.success("Profile photo updated successfully");
    } catch (error) {
      toast.error(error.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
      setSelectedFile(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleCancelImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // --- PERSONAL PROFILE UPDATE HANDLER ---
  const handleUpdate = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const rawPayload = {
      first_name: formData.firstName.trim(),
      last_name: formData.lastName.trim(),
      email: formData.email.trim(),
      phone_number: formData.phone.trim(),
      uan: formData.uan.trim(),
      aadhar: formData.aadhar.trim(),
      pan: formData.pan.trim(),
      epf_number: formData.epfNumber.trim(),
      esi_number: formData.esiNumber.trim(),
      date_of_birth: formData.dateOfBirth
        ? `${formData.dateOfBirth}T00:00:00Z`
        : null,
      marital_status: formData.maritalStatus.trim(),
      present_address: formData.presentAddress.trim(),
      permanant_address: formData.permanentAddress.trim(),
      blood_group: formData.bloodGroup.trim(),
    };

    const payload = {};
    Object.keys(rawPayload).forEach((key) => {
      if (rawPayload[key] !== "" && rawPayload[key] !== null) {
        payload[key] = rawPayload[key];
      }
    });

    console.log(
      "📤 Sending Payload to Backend:",
      JSON.stringify(payload, null, 2),
    );

    try {
      const res = await updateMyPersonalProfile(payload);
      console.log("📥 Received Response from Backend:", res);

      const updatedData = res?.data || res;

      setFormData((prev) => ({
        ...prev,
        firstName: updatedData.first_name || prev.firstName,
        lastName: updatedData.last_name || prev.lastName,
        email: updatedData.email || prev.email,
        phone: updatedData.phone_number || prev.phone,
        uan: updatedData.uan || prev.uan,
        aadhar: updatedData.aadhar || prev.aadhar,
        pan: updatedData.pan || prev.pan,
        epfNumber: updatedData.epf_number || prev.epfNumber,
        esiNumber: updatedData.esi_number || prev.esiNumber,
        dateOfBirth: updatedData.date_of_birth
          ? updatedData.date_of_birth.split("T")[0]
          : prev.dateOfBirth,
        maritalStatus: updatedData.marital_status || prev.maritalStatus,
        presentAddress: updatedData.present_address || prev.presentAddress,
        permanentAddress:
          updatedData.permanant_address ||
          updatedData.permanent_address ||
          prev.permanentAddress,
        bloodGroup: updatedData.blood_group || prev.bloodGroup,
      }));

      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("❌ Error updating profile:", error);
      if (error?.response) {
        console.error("❌ Backend Response Body:", error.response.data);
      }
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to update profile";
      toast.error(errorMsg);
      throw error;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // --- LOGOUT HANDLERS ---
  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    logout();
    navigate("/", { replace: true });
  };

  const handleDeleteAccount = async () => {
    try {
      if (!userId) throw new Error("User ID not found");

      const res = await fetch(
        `${import.meta.env.VITE_API}/delete-user/${userId}`,
        { method: "DELETE" },
      );

      if (!res.ok) throw new Error("Failed to delete account");

      toast.success("Account deleted successfully", {
        duration: 3000,
        style: { background: "#333", color: "#fff" },
      });

      logout();
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err.message || "Something went wrong", {
        duration: 3000,
        style: { background: "#333", color: "#fff" },
      });
    }
  };

  const fullName =
    `${formData.firstName} ${formData.lastName}`.trim() || "User";
  const displayAvatar = imagePreview || formData.image || avatar;

  return (
    <DashboardLayout
      userName={fullName}
      onLogout={() => setShowLogoutModal(true)}
    >
      <div className="w-full space-y-4">
        <HeaderGlobal
          userName={fullName}
          userImage={formData.image || avatar}
        />

        <div className="bg-white min-h-[567px] rounded-2xl p-6 shadow-sm border border-gray-100">
          {loading ? (
            <div className="flex justify-center items-center h-[400px]">
              <p className="text-gray-500 text-sm font-normal">
                Loading profile settings...
              </p>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-6">
              {/* LEFT NAVIGATION MENU */}
              <div className="w-full md:w-72 bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-center shadow-sm">
                {/* AVATAR WITH HOVER OVERLAY */}
                <div
                  onClick={handleAvatarClick}
                  className="relative w-24 h-24 rounded-full overflow-hidden mb-3 border border-gray-200 group cursor-pointer"
                >
                  <img
                    src={displayAvatar}
                    alt="User Avatar"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white text-xs font-normal">
                    <FiCamera className="text-lg mb-0.5" />
                    <span>Change</span>
                  </div>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                {/* INLINE IMAGE UPDATE & CANCEL BUTTONS */}
                {selectedFile && (
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      type="button"
                      onClick={handleImageUpload}
                      disabled={uploadingImage}
                      className="bg-black text-white px-3 py-1 rounded text-xs font-normal hover:bg-gray-800 transition-all disabled:opacity-50"
                    >
                      {uploadingImage ? "Updating..." : "Update Image"}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelImage}
                      disabled={uploadingImage}
                      className="px-3 py-1 rounded text-xs font-normal border border-gray-300 text-gray-700 hover:bg-gray-100 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                <h2 className="text-lg text-gray-800 text-center font-normal">
                  {fullName}
                </h2>
                <p className="text-sm text-gray-500 mb-6 text-center font-normal">
                  {formData.email}
                </p>

                <div className="w-full space-y-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("personal")}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all font-normal ${
                      activeTab === "personal"
                        ? "bg-black text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <FiUser className="text-lg" /> Personal Info
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("about")}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all font-normal ${
                      activeTab === "about"
                        ? "bg-black text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <FiInfo className="text-lg" /> About Us
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("delete")}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all font-normal ${
                      activeTab === "delete"
                        ? "bg-red-600 text-white"
                        : "text-red-600 hover:bg-red-50"
                    }`}
                  >
                    🗑 Delete Account
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowLogoutModal(true)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-normal text-gray-700 hover:bg-gray-100 transition-all"
                  >
                    <FiLogOut className="text-lg" /> Logout
                  </button>
                </div>
              </div>

              {/* RIGHT CONTENT TAB PANELS */}
              <div className="flex-1 bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                {activeTab === "personal" && (
                  <SettingsProfile
                    formData={formData}
                    handleChange={handleChange}
                    handleUpdate={handleUpdate}
                  />
                )}

                {activeTab === "about" && (
                  <div>
                    <h2 className="text-lg text-gray-800 mb-4 font-normal">
                      About Us
                    </h2>
                    <p className="text-gray-600 text-sm font-normal">
                      REBS HR System is a comprehensive employee management
                      platform built for efficiency and user-friendliness.
                    </p>
                  </div>
                )}

                {activeTab === "delete" && (
                  <div>
                    <h2 className="text-lg text-red-600 mb-4 font-normal">
                      Delete Account
                    </h2>
                    <p className="text-sm text-gray-700 mb-6 font-normal">
                      This action is permanent. All your data will be deleted
                      and cannot be recovered.
                    </p>

                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="bg-red-600 text-white px-6 py-2 rounded-md text-sm hover:bg-red-700 transition-all font-normal"
                    >
                      Delete My Account
                    </button>

                    {showDeleteConfirm && (
                      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-96 shadow-lg">
                          <h3 className="text-lg text-gray-800 mb-3 font-normal">
                            Confirm Delete
                          </h3>
                          <p className="text-sm text-gray-600 mb-6 font-normal">
                            Are you sure you want to delete your account? This
                            action cannot be undone.
                          </p>

                          <div className="flex justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => setShowDeleteConfirm(false)}
                              className="px-4 py-2 text-sm rounded-md border hover:bg-gray-50 font-normal"
                            >
                              Cancel
                            </button>

                            <button
                              type="button"
                              onClick={handleDeleteAccount}
                              className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 font-normal"
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
          )}
        </div>
      </div>

      {/* REUSABLE LOGOUT CONFIRMATION MODAL */}
      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
      />
    </DashboardLayout>
  );
}

export default Settings;
