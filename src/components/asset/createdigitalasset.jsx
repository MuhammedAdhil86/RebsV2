import React, { useState, useEffect, useRef } from "react";
import { Drawer } from "@mui/material";
import { FiX, FiPlus, FiCamera, FiLink } from "react-icons/fi";
import toast from "react-hot-toast";
import {
  createDigitalAsset,
  fetchAccountTypes,
  fetchAuthenticators,
} from "../../service/assetservice";

const CreateDigitalAssetDrawer = ({ open, onClose, onAssetCreated }) => {
  const fileInputRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accountTypes, setAccountTypes] = useState([]);
  const [authenticators, setAuthenticators] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    account_name: "",
    account_type: "",
    username: "",
    password: "",
    account_url: "",
    authentication_mode: "",
    passkey: "",
    account_status: "available", // Default set to lowercase
    image: null,
  });

  // Custom styling for the select arrow to ensure perfect positioning
  const selectStyle = `
    appearance-none 
    bg-no-repeat 
    bg-[length:16px] 
    bg-[right_10px_center] 
    w-full bg-white border border-gray-300 rounded-2xl px-5 py-4 outline-none focus:ring-1 focus:ring-black text-gray-700
  `;

  // Standard SVG for the down arrow
  const arrowIcon = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7' /%3E%3C/svg%3E")`;

  useEffect(() => {
    if (open) {
      const loadMetadata = async () => {
        try {
          const [types, auths] = await Promise.all([
            fetchAccountTypes(),
            fetchAuthenticators(),
          ]);
          setAccountTypes(types || []);
          setAuthenticators(auths || []);
        } catch (err) {
          toast.error("Failed to load metadata");
        }
      };
      loadMetadata();
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Logic: Force lowercase for status so backend is happy
    const finalValue = name === "account_status" ? value.toLowerCase() : value;
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
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

    const payload = new FormData();
    payload.append("account_name", formData.account_name);
    payload.append("account_type", formData.account_type);
    payload.append("username", formData.username);
    payload.append("password", formData.password);
    payload.append("account_url", formData.account_url);
    payload.append("authentication_mode", formData.authentication_mode);
    payload.append("passkey", formData.passkey);
    payload.append("account_status", formData.account_status); // Lowercase
    payload.append("created_date", new Date().toISOString().split("T")[0]);

    if (formData.image) {
      payload.append("image", formData.image);
    }

    try {
      await createDigitalAsset(payload);
      toast.success("Successfully added digital Asset");
      onAssetCreated();
      handleClose();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Internal Server Error";
      toast.error(`Push Failed: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      account_name: "",
      account_type: "",
      username: "",
      password: "",
      account_url: "",
      authentication_mode: "",
      passkey: "",
      account_status: "available",
      image: null,
    });
    setImagePreview(null);
    onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      PaperProps={{ className: "w-full max-w-[500px] border-none shadow-2xl" }}
    >
      <div className="h-full flex flex-col bg-white font-poppins text-[12px]">
        {/* Header */}
        <div className="px-8 py-6 flex items-center justify-between border-b border-gray-100 bg-white">
          <div>
            <h2 className="text-gray-900 text-[16px] font-medium tracking-tight uppercase">
              New Digital Entry
            </h2>
            <p className="text-gray-400 text-[10px] tracking-wider mt-1 font-bold uppercase">
              Provide account access details
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-400"
          >
            <FiX size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar"
        >
          {/* Image Upload Area */}
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-[2rem] bg-gray-50 hover:bg-gray-100 transition-all group relative overflow-hidden h-44">
            {imagePreview ? (
              <img
                src={imagePreview}
                className="absolute inset-0 w-full h-full object-cover"
                alt="preview"
              />
            ) : (
              <div className="text-center">
                <FiCamera
                  className="mx-auto text-gray-300 group-hover:text-black transition-colors mb-2"
                  size={30}
                />
                <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">
                  Icon / Proof
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
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="absolute inset-0 w-full h-full bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center text-transparent group-hover:text-white font-bold"
            >
              Change Image
            </button>
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
              placeholder="e.g. AWS Root Account"
              className="w-full bg-white border border-gray-300 rounded-2xl px-5 py-4 outline-none focus:ring-1 focus:ring-black text-gray-700 font-medium"
            />
          </div>

          {/* Dynamic Dropdowns */}
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
                style={{ backgroundImage: arrowIcon }}
                className={selectStyle}
              >
                <option value="">Select Type</option>
                {accountTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name || t.id}
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
                style={{ backgroundImage: arrowIcon }}
                className={selectStyle}
              >
                <option value="">Select Mode</option>
                {authenticators.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name || a.id}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Account Status - ADDED */}
          <div className="space-y-2">
            <label className="text-gray-400 text-[10px] tracking-widest uppercase font-bold ml-1">
              Account Status
            </label>
            <select
              name="account_status"
              value={formData.account_status}
              onChange={handleChange}
              style={{ backgroundImage: arrowIcon }}
              className={selectStyle}
            >
              <option value="available">Available</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          {/* URL */}
          <div className="space-y-2">
            <label className="text-gray-400 text-[10px] tracking-widest uppercase font-bold ml-1">
              Account URL
            </label>
            <div className="relative">
              <FiLink className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                name="account_url"
                value={formData.account_url}
                onChange={handleChange}
                className="w-full bg-white border border-gray-300 rounded-2xl pl-12 pr-5 py-4 outline-none focus:ring-1 focus:ring-black text-gray-700"
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Credentials */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-gray-400 text-[10px] tracking-widest uppercase font-bold ml-1">
                Username
              </label>
              <input
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full bg-white border border-gray-300 rounded-2xl px-5 py-4 outline-none focus:ring-1 focus:ring-black text-gray-700"
              />
            </div>
            <div className="space-y-2">
              <label className="text-gray-400 text-[10px] tracking-widest uppercase font-bold ml-1">
                Passkey
              </label>
              <input
                name="passkey"
                value={formData.passkey}
                onChange={handleChange}
                className="w-full bg-white border border-gray-300 rounded-2xl px-5 py-4 outline-none focus:ring-1 focus:ring-black text-gray-700"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-gray-400 text-[10px] tracking-widest uppercase font-bold ml-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-white border border-gray-300 rounded-2xl px-5 py-4 outline-none focus:ring-1 focus:ring-black text-gray-700"
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-8 border-t border-gray-100 flex items-center justify-between bg-white sticky bottom-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-10 py-4 bg-white border border-black rounded-2xl text-black hover:bg-gray-50 transition-all font-bold uppercase tracking-widest"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-3 bg-black text-white px-10 py-4 rounded-2xl font-bold uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? "Adding..." : "Add Asset"} <FiPlus />
          </button>
        </div>
      </div>
    </Drawer>
  );
};

export default CreateDigitalAssetDrawer;
