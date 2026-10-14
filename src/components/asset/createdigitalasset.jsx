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
    account_status: "available",
    image: null,
  });

  const selectStyle = `
    appearance-none 
    bg-no-repeat 
    bg-[length:16px] 
    bg-[right_14px_center] 
    w-full bg-white border border-gray-200 rounded-xl pl-4 pr-10 py-3.5 text-[13px]
    outline-none transition-all duration-300 hover:border-gray-300
    focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100
    text-gray-700 font-['Poppins',sans-serif] font-normal
  `;

  // Shared look for every plain text input in this form
  const inputStyle = `
    w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-[13px]
    outline-none transition-all duration-300 hover:border-gray-300
    focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100
    placeholder:text-gray-300 text-gray-700 font-normal
  `;

  const arrowIcon = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7' /%3E%3C/svg%3E")`;

  const parseBackendError = (err) => {
    if (!err) return "An unknown error occurred";

    // Direct error thrown from service
    if (err.message && !err.response) {
      return err.message;
    }

    let raw =
      err.response?.data ||
      err.responseText ||
      err.response?.request?.responseText ||
      err.message ||
      err;

    if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        try {
          raw = JSON.parse(trimmed);
        } catch (e) {
          return trimmed;
        }
      } else {
        return trimmed;
      }
    }

    if (typeof raw === "object" && raw !== null) {
      const msg = raw.message || raw.error || "";
      const detail = raw.data;

      if (msg && detail) {
        const formattedDetail =
          typeof detail === "object" ? JSON.stringify(detail) : detail;
        return `${msg}: ${formattedDetail}`;
      }
      if (msg) return msg;
      if (detail)
        return typeof detail === "object" ? JSON.stringify(detail) : detail;
    }

    return String(raw);
  };

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
          toast.error(parseBackendError(err));
        }
      };
      loadMetadata();
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
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
    payload.append("account_status", formData.account_status);
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
      const errorMessage = parseBackendError(err);
      toast.error(errorMessage, { duration: 6000 });
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
      <div className="h-full flex flex-col bg-white font-['Poppins',sans-serif] font-normal text-[12px]">
        {/* Header */}
        <div className="px-8 py-6 flex items-center justify-between border-b border-gray-100 bg-gradient-to-b from-indigo-50/60 to-white">
          <div>
            <h2 className="text-gray-900 text-[17px] font-normal tracking-wide">
              New Digital Entry
            </h2>
            <p className="text-gray-400 text-[12px] tracking-wide mt-1 font-normal">
              Provide account access details
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-full text-gray-400 transition-all duration-300 hover:bg-white hover:text-gray-700 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
          >
            <FiX size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar"
        >
          {/* Image Upload Area */}
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-indigo-200 rounded-3xl bg-indigo-50/30 hover:bg-indigo-50/70 hover:border-indigo-300 transition-all duration-300 group relative overflow-hidden h-44">
            {imagePreview ? (
              <img
                src={imagePreview}
                className="absolute inset-0 w-full h-full object-cover"
                alt="preview"
              />
            ) : (
              <div className="text-center">
                <FiCamera
                  className="mx-auto text-indigo-300 group-hover:text-indigo-600 transition-colors duration-300 mb-2"
                  size={30}
                />
                <p className="text-gray-400 text-[12px] font-normal tracking-wide">
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
              className="absolute inset-0 w-full h-full bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center text-transparent group-hover:text-white font-normal text-[13px] tracking-wide"
            >
              Change Image
            </button>
          </div>

          {/* Account Name */}
          <div className="space-y-2">
            <label className="block text-gray-500 text-[12px] tracking-wide font-normal ml-1">
              Account Name
            </label>
            <input
              required
              name="account_name"
              value={formData.account_name}
              onChange={handleChange}
              placeholder="e.g. AWS Root Account"
              className={inputStyle}
            />
          </div>

          {/* Dynamic Dropdowns */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-gray-500 text-[12px] tracking-wide font-normal ml-1">
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
              <label className="block text-gray-500 text-[12px] tracking-wide font-normal ml-1">
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

          {/* Account Status */}
          <div className="space-y-2">
            <label className="block text-gray-500 text-[12px] tracking-wide font-normal ml-1">
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
            <label className="block text-gray-500 text-[12px] tracking-wide font-normal ml-1">
              Account URL
            </label>
            <div className="relative group">
              <FiLink className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-300 group-focus-within:text-indigo-500" />
              <input
                name="account_url"
                value={formData.account_url}
                onChange={handleChange}
                className="w-full bg-white border border-gray-200 rounded-xl pl-11 pr-4 py-3.5 text-[13px] outline-none transition-all duration-300 hover:border-gray-300 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 placeholder:text-gray-300 text-gray-700 font-normal"
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Credentials */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-gray-500 text-[12px] tracking-wide font-normal ml-1">
                Username
              </label>
              <input
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={inputStyle}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-gray-500 text-[12px] tracking-wide font-normal ml-1">
                Passkey
              </label>
              <input
                name="passkey"
                value={formData.passkey}
                onChange={handleChange}
                className={inputStyle}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-gray-500 text-[12px] tracking-wide font-normal ml-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={inputStyle}
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-8 py-6 border-t border-gray-100 flex items-center justify-between bg-white sticky bottom-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-8 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-600 text-[13px] tracking-wide hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 transition-all duration-300 font-normal focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2.5 bg-black text-white px-8 py-3.5 rounded-xl text-[13px] font-normal tracking-wide hover:bg-gray-800 transition-all duration-300 shadow-md shadow-gray-300 active:scale-95 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
          >
            {isSubmitting ? "Adding..." : "Add Asset"} <FiPlus />
          </button>
        </div>
      </div>
    </Drawer>
  );
};

export default CreateDigitalAssetDrawer;
