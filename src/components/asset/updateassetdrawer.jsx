import React, { useState, useEffect, useRef } from "react";
import { Drawer } from "@mui/material";
import { FiX, FiCamera, FiCheck, FiTool, FiEdit2 } from "react-icons/fi";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import { updateAsset, assetType } from "../../service/assetservice";

const UpdateAssetDrawer = ({ open, onClose, asset, onAssetUpdated }) => {
  const fileInputRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assetTypes, setAssetTypes] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    asset_name: "",
    asset_type: "",
    condition: "new",
    purchase_date: "",
    last_maintenance: "",
    asset_status: "available",
    image: null,
  });

  // Custom Select Style for perfect arrow positioning
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

  // Hides the browser's own calendar icon and stretches its click area over
  // the whole field, so our Iconify icon is the only visible picker icon.
  const datePickerReset = `
    [&::-webkit-calendar-picker-indicator]:absolute
    [&::-webkit-calendar-picker-indicator]:inset-0
    [&::-webkit-calendar-picker-indicator]:w-full
    [&::-webkit-calendar-picker-indicator]:h-full
    [&::-webkit-calendar-picker-indicator]:opacity-0
    [&::-webkit-calendar-picker-indicator]:cursor-pointer
  `;

  // SVG for the down arrow
  const arrowIcon = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7' /%3E%3C/svg%3E")`;

  const formatDateForInput = (isoString) => {
    if (!isoString) return "";
    return isoString.split("T")[0];
  };

  useEffect(() => {
    if (open && asset) {
      const loadMetadata = async () => {
        try {
          const res = await assetType();
          setAssetTypes(res || []);
        } catch (err) {
          toast.error("Failed to load asset types");
        }
      };
      loadMetadata();

      setFormData({
        asset_name: asset.asset_name || "",
        asset_type: asset.asset_type_id || asset.asset_type || "",
        condition: (asset.condition || "new").toLowerCase(),
        purchase_date: formatDateForInput(asset.purchase_date),
        last_maintenance: formatDateForInput(asset.last_maintenance),
        asset_status: (asset.asset_status || "available").toLowerCase(),
        image: null,
      });

      setImagePreview(asset.image_url || asset.image || null);
    }
  }, [open, asset]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Logic: Convert status and condition to lowercase for backend compatibility
    const finalValue =
      name === "asset_status" || name === "condition"
        ? value.toLowerCase()
        : value;

    setFormData((prev) => ({ ...prev, [name]: finalValue }));
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
    payload.append("asset_name", formData.asset_name);
    payload.append("asset_type", formData.asset_type);
    payload.append("asset_status", formData.asset_status);
    payload.append("condition", formData.condition);

    if (formData.purchase_date) {
      payload.append(
        "purchase_date",
        new Date(formData.purchase_date).toISOString(),
      );
    }
    if (formData.last_maintenance) {
      payload.append(
        "last_maintenance",
        new Date(formData.last_maintenance).toISOString(),
      );
    }
    if (formData.image) {
      payload.append("image", formData.image);
    }

    try {
      await updateAsset(asset.id, payload);
      toast.success("Asset updated successfully");
      onAssetUpdated();
      onClose();
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.errors) {
        setErrors(errorData.errors);
        Object.values(errorData.errors)
          .flat()
          .forEach((msg) => toast.error(msg));
      } else {
        toast.error(errorData?.message || "Internal Server Error");
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
      <div className="h-full flex flex-col bg-white font-['Poppins',sans-serif] text-[12px] font-normal">
        {/* Header */}
        <div className="px-8 py-6 flex items-center justify-between border-b border-gray-100 bg-gradient-to-b from-indigo-50/60 to-white">
          <div>
            <h2 className="text-gray-900 text-[17px] font-normal tracking-wide">
              Update Physical Asset
            </h2>
            <p className="text-gray-400 text-[12px] tracking-wide mt-1 font-normal">
              ID: #{asset?.id || "N/A"} • Modify details
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 transition-all duration-300 hover:bg-white hover:text-gray-700 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
          >
            <FiX size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar"
        >
          {/* Image Area */}
          <div className="relative group h-44 w-full border-2 border-dashed border-indigo-200 rounded-3xl bg-indigo-50/30 hover:bg-indigo-50/70 hover:border-indigo-300 overflow-hidden flex items-center justify-center transition-all duration-300">
            {imagePreview ? (
              <>
                <img
                  src={imagePreview}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  alt="asset"
                />
                <div
                  onClick={() => fileInputRef.current.click()}
                  className="absolute inset-0 bg-black/30 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center cursor-pointer"
                >
                  <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-full shadow-xl border border-white/20 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                    <FiEdit2 size={14} className="text-indigo-600" />
                    <span className="text-gray-800 font-normal tracking-wide text-[12px]">
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
                <div className="p-4 rounded-full bg-white mb-3 shadow-sm">
                  <FiCamera
                    size={24}
                    className="text-indigo-300 group-hover:text-indigo-600 transition-colors duration-300"
                  />
                </div>
                <p className="text-gray-400 text-[12px] font-normal tracking-wide">
                  Upload Asset Image
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

          {/* Asset Name */}
          <div className="space-y-2">
            <label className="block text-gray-500 text-[12px] tracking-wide font-normal ml-1">
              Asset Name
            </label>
            <input
              required
              name="asset_name"
              value={formData.asset_name}
              onChange={handleChange}
              placeholder="e.g. Dell UltraSharp 27"
              className={`w-full bg-white border ${errors.asset_name ? "border-red-400 focus:border-red-400 focus:ring-red-100" : "border-gray-200 focus:border-indigo-300 focus:ring-indigo-100"} rounded-xl px-4 py-3.5 text-[13px] outline-none transition-all duration-300 hover:border-gray-300 focus:ring-2 placeholder:text-gray-300 text-gray-700 font-normal`}
            />
          </div>

          {/* Type and Condition Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-gray-500 text-[12px] tracking-wide font-normal ml-1">
                Asset Type
              </label>
              <select
                required
                name="asset_type"
                value={formData.asset_type}
                onChange={handleChange}
                style={{ backgroundImage: arrowIcon }}
                className={selectStyle}
              >
                <option value="">Select Type</option>
                {assetTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name || t.asset_type}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-gray-500 text-[12px] tracking-wide font-normal ml-1">
                Condition
              </label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                style={{ backgroundImage: arrowIcon }}
                className={selectStyle}
              >
                <option value="new">New</option>
                <option value="used">Used</option>
                <option value="refurbished">Refurbished</option>
                <option value="damaged">Damaged</option>
              </select>
            </div>
          </div>

          {/* Dates Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-gray-500 text-[12px] tracking-wide font-normal ml-1">
                Purchase Date
              </label>
              <div className="relative group">
                <input
                  type="date"
                  name="purchase_date"
                  value={formData.purchase_date}
                  onChange={handleChange}
                  className={`${datePickerReset} w-full bg-white border border-gray-200 rounded-xl pl-4 pr-11 py-3.5 text-[13px] outline-none transition-all duration-300 hover:border-gray-300 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 text-gray-700 font-normal`}
                />
                <Icon
                  icon="solar:calendar-outline"
                  className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-800 transition-colors duration-300 group-hover:text-black group-focus-within:text-black"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-gray-500 text-[12px] tracking-wide font-normal ml-1">
                Maintenance
              </label>
              <div className="relative group">
                <FiTool className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-300 group-focus-within:text-indigo-500" />
                <input
                  type="date"
                  name="last_maintenance"
                  value={formData.last_maintenance}
                  onChange={handleChange}
                  className={`${datePickerReset} w-full bg-white border border-gray-200 rounded-xl pl-11 pr-11 py-3.5 text-[13px] outline-none transition-all duration-300 hover:border-gray-300 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 text-gray-700 font-normal`}
                />
                <Icon
                  icon="solar:calendar-outline"
                  className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-800 transition-colors duration-300 group-hover:text-black group-focus-within:text-black"
                />
              </div>
            </div>
          </div>

          {/* Status Field */}
          <div className="space-y-2">
            <label className="block text-gray-500 text-[12px] tracking-wide font-normal ml-1">
              Current Status
            </label>
            <select
              name="asset_status"
              value={formData.asset_status}
              onChange={handleChange}
              style={{ backgroundImage: arrowIcon }}
              className={selectStyle}
            >
              <option value="available">Available</option>
              <option value="allocated">Allocated</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
            </select>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-8 py-6 border-t border-gray-100 flex items-center justify-between bg-white sticky bottom-0">
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-600 text-[13px] tracking-wide hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 transition-all duration-300 font-normal focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2.5 bg-black text-white px-8 py-3.5 rounded-xl text-[13px] font-normal tracking-wide hover:bg-gray-800 transition-all duration-300 shadow-md shadow-gray-300 active:scale-95 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
          >
            {isSubmitting ? "Updating..." : "Save Changes"} <FiCheck />
          </button>
        </div>
      </div>
    </Drawer>
  );
};

export default UpdateAssetDrawer;
