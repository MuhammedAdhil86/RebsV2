import React, { useState, useEffect, useRef } from "react";
import { Drawer } from "@mui/material";
import {
  FiX,
  FiCamera,
  FiCheck,
  FiGlobe,
  FiUser,
  FiLock,
  FiShield,
  FiEdit2,
} from "react-icons/fi";
import toast from "react-hot-toast";
import {
  editDigitalAsset,
  fetchAccountTypes,
  fetchAuthenticators,
} from "../../service/assetservice";

const UpdateDigitalAssetDrawer = ({ open, onClose, asset, onAssetUpdated }) => {
  const fileInputRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accountTypes, setAccountTypes] = useState([]);
  const [authenticators, setAuthenticators] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    account_name: "",
    account_type: "",
    username: "",
    password: "",
    account_url: "",
    authentication_mode: "",
    passkey: "",
    account_status: "Available",
    image: null,
  });

  const capitalize = (str) => {
    if (!str) return "Available";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  useEffect(() => {
    if (open && asset) {
      const loadMetadata = async () => {
        try {
          const [types, auths] = await Promise.all([
            fetchAccountTypes(),
            fetchAuthenticators(),
          ]);
          setAccountTypes(types || []);
          setAuthenticators(auths || []);

          // --- LOGIC TO FIND ID IF BACKEND ONLY SENT NAME ---
          let authId =
            asset.authentication_mode_id || asset.authentication_mode;

          // If the value is a string (like "Google Authentication"), find its ID in the metadata list
          if (isNaN(authId) && auths) {
            const found = auths.find((a) => a.name === authId);
            if (found) authId = found.id;
          }

          let typeId = asset.account_type_id || asset.account_type;
          if (isNaN(typeId) && types) {
            const found = types.find((t) => t.name === typeId);
            if (found) typeId = found.id;
          }

          setFormData({
            account_name: asset.account_name || "",
            account_type: typeId || "",
            username: asset.username || "",
            password: asset.password || "",
            account_url: asset.account_url || "",
            authentication_mode: authId || "",
            passkey: asset.passkey || "",
            account_status: capitalize(asset.account_status),
            image: null,
          });
        } catch (err) {
          toast.error("Failed to load metadata");
        }
      };
      loadMetadata();
      setImagePreview(asset.image_url || asset.image || null);
    }
  }, [open, asset]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const payload = new FormData();
    // Force IDs to be integers just in case
    payload.append("account_name", formData.account_name);
    payload.append("account_type", formData.account_type);
    payload.append("authentication_mode", formData.authentication_mode);
    payload.append("username", formData.username);
    payload.append("password", formData.password);
    payload.append("account_url", formData.account_url);
    payload.append("passkey", formData.passkey);
    payload.append("account_status", formData.account_status);

    if (formData.image) {
      payload.append("image", formData.image);
    }

    try {
      await editDigitalAsset(asset.id, payload);
      toast.success("Asset updated successfully");
      onAssetUpdated();
      onClose();
    } catch (err) {
      const errorData = err.response?.data;
      // Show the actual DB error message so we know if it's still a type error
      const backendError =
        errorData?.data || errorData?.message || "Internal Server Error";

      if (errorData?.errors) {
        setErrors(errorData.errors);
        Object.values(errorData.errors)
          .flat()
          .forEach((msg) => toast.error(msg));
      } else {
        toast.error(`Push Failed: ${backendError}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ className: "w-full max-w-[500px] border-none shadow-2xl" }}
    >
      <div className="h-full flex flex-col bg-white font-poppins text-[12px]">
        {/* Header */}
        <div className="px-8 py-6 flex items-center justify-between border-b border-gray-100">
          <div>
            <h2 className="text-gray-900 text-[16px] font-medium tracking-tight uppercase">
              Update Digital Asset
            </h2>
            <p className="text-gray-400 text-[10px] tracking-wider mt-1 font-bold uppercase">
              Modify Security & Access
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-400"
          >
            <FiX size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar"
        >
          {/* Professional Image Area */}
          <div className="relative group h-44 w-full border-2 border-dashed border-gray-300 rounded-[2rem] bg-gray-50 overflow-hidden flex items-center justify-center transition-all duration-300 hover:border-black/20 hover:bg-gray-100">
            {imagePreview ? (
              <>
                <img
                  src={imagePreview}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  alt="asset"
                />
                <div
                  onClick={() => fileInputRef.current.click()}
                  className="absolute inset-0 bg-black/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center cursor-pointer"
                >
                  <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-full shadow-xl border border-white/20 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                    <FiEdit2 size={14} className="text-black" />
                    <span className="text-black font-bold uppercase tracking-[0.1em] text-[10px]">
                      Edit Photo
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div
                onClick={() => fileInputRef.current.click()}
                className="text-center cursor-pointer flex flex-col items-center"
              >
                <FiCamera size={24} className="text-gray-400 mb-2" />
                <p className="text-gray-400 text-[10px] uppercase font-bold tracking-[0.15em]">
                  Upload Account Icon
                </p>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
          </div>

          {/* Account Name */}
          <div className="space-y-2">
            <label className="text-gray-400 text-[10px] tracking-widest uppercase font-bold ml-1">
              Account Name
            </label>
            <input
              required
              name="account_name"
              value={formData.account_name}
              onChange={handleChange}
              className={`w-full bg-white border ${errors.account_name ? "border-red-500" : "border-gray-300"} rounded-2xl px-5 py-4 outline-none focus:ring-1 focus:ring-black text-gray-700 font-medium`}
            />
          </div>

          {/* Dynamic Dropdowns - Crucial for ID mapping */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-gray-400 text-[10px] tracking-widest uppercase font-bold ml-1">
                Account Type
              </label>
              <select
                required
                name="account_type"
                value={formData.account_type}
                onChange={handleChange}
                className="w-full bg-white border border-gray-300 rounded-2xl px-5 py-4 outline-none focus:ring-1 focus:ring-black text-gray-700"
              >
                <option value="">Select Type</option>
                {accountTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-gray-400 text-[10px] tracking-widest uppercase font-bold ml-1">
                Auth Mode
              </label>
              <select
                required
                name="authentication_mode"
                value={formData.authentication_mode}
                onChange={handleChange}
                className="w-full bg-white border border-gray-300 rounded-2xl px-5 py-4 outline-none focus:ring-1 focus:ring-black text-gray-700"
              >
                <option value="">Select Mode</option>
                {authenticators.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-gray-400 text-[10px] tracking-widest uppercase font-bold ml-1">
              URL
            </label>
            <div className="relative">
              <FiGlobe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                name="account_url"
                value={formData.account_url}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full bg-white border border-gray-300 rounded-2xl pl-12 pr-5 py-4 outline-none focus:ring-1 focus:ring-black text-gray-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-gray-400 text-[10px] tracking-widest uppercase font-bold ml-1">
                Username
              </label>
              <div className="relative">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full bg-white border border-gray-300 rounded-2xl pl-12 pr-5 py-4 outline-none focus:ring-1 focus:ring-black text-gray-700"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-gray-400 text-[10px] tracking-widest uppercase font-bold ml-1">
                Passkey
              </label>
              <div className="relative">
                <FiShield className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  name="passkey"
                  value={formData.passkey}
                  onChange={handleChange}
                  className="w-full bg-white border border-gray-300 rounded-2xl pl-12 pr-5 py-4 outline-none focus:ring-1 focus:ring-black text-gray-700"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-gray-400 text-[10px] tracking-widest uppercase font-bold ml-1">
              Password
            </label>
            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-white border border-gray-300 rounded-2xl pl-12 pr-5 py-4 outline-none focus:ring-1 focus:ring-black text-gray-700"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-gray-400 text-[10px] tracking-widest uppercase font-bold ml-1">
              Status
            </label>
            <select
              name="account_status"
              value={formData.account_status}
              onChange={handleChange}
              className="w-full bg-white border border-gray-300 rounded-2xl px-5 py-4 outline-none focus:ring-1 focus:ring-black text-gray-700"
            >
              <option value="Available">Available</option>
              <option value="Allocated">Allocated</option>
            </select>
          </div>
        </form>

        <div className="p-8 border-t border-gray-100 flex items-center justify-between bg-white sticky bottom-0">
          <button
            type="button"
            onClick={onClose}
            className="px-10 py-4 bg-white border border-black rounded-2xl text-black font-bold uppercase tracking-widest"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-3 bg-black text-white px-10 py-4 rounded-2xl font-bold uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50 transition-all shadow-lg active:scale-95"
          >
            {isSubmitting ? "Updating..." : "Save Changes"} <FiCheck />
          </button>
        </div>
      </div>
    </Drawer>
  );
};

export default UpdateDigitalAssetDrawer;
