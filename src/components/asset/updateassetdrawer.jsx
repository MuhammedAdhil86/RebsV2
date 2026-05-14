import React, { useState, useEffect, useRef } from "react";
import { Drawer } from "@mui/material";
import {
  FiX,
  FiCamera,
  FiCheck,
  FiCalendar,
  FiTool,
  FiEdit2,
} from "react-icons/fi";
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
    bg-[right_1.25rem_center] 
    w-full bg-white border border-gray-300 rounded-2xl px-5 py-4 outline-none focus:ring-1 focus:ring-black text-gray-700 font-normal
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
      <div className="h-full flex flex-col bg-white font-poppins text-[12px] font-normal">
        {/* Header */}
        <div className="px-8 py-6 flex items-center justify-between border-b border-gray-100">
          <div>
            <h2 className="text-gray-900 text-[16px] font-normal tracking-tight uppercase">
              Update Physical Asset
            </h2>
            <p className="text-gray-400 text-[10px] tracking-wider mt-1 font-normal uppercase">
              ID: #{asset?.id || "N/A"} • Modify details
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar"
        >
          {/* Image Area */}
          <div className="relative group h-44 w-full border-2 border-dashed border-gray-300 rounded-[2rem] bg-gray-50 overflow-hidden flex items-center justify-center transition-all duration-300">
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
                    <span className="text-black font-normal uppercase tracking-[0.1em] text-[10px]">
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
                  <FiCamera size={24} className="text-gray-400" />
                </div>
                <p className="text-gray-400 text-[10px] uppercase font-normal tracking-[0.15em]">
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
            <label className="text-gray-400 text-[10px] tracking-widest uppercase font-normal ml-1">
              Asset Name
            </label>
            <input
              required
              name="asset_name"
              value={formData.asset_name}
              onChange={handleChange}
              placeholder="e.g. Dell UltraSharp 27"
              className={`w-full bg-white border ${errors.asset_name ? "border-red-500" : "border-gray-300"} rounded-2xl px-5 py-4 outline-none focus:ring-1 focus:ring-black text-gray-700 font-normal transition-all`}
            />
          </div>

          {/* Type and Condition Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-gray-400 text-[10px] tracking-widest uppercase font-normal ml-1">
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
              <label className="text-gray-400 text-[10px] tracking-widest uppercase font-normal ml-1">
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
              <label className="text-gray-400 text-[10px] tracking-widest uppercase font-normal ml-1">
                Purchase Date
              </label>
              <div className="relative">
                <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  name="purchase_date"
                  value={formData.purchase_date}
                  onChange={handleChange}
                  className="w-full bg-white border border-gray-300 rounded-2xl pl-12 pr-5 py-4 outline-none focus:ring-1 focus:ring-black text-gray-700 font-normal"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-gray-400 text-[10px] tracking-widest uppercase font-normal ml-1">
                Maintenance
              </label>
              <div className="relative">
                <FiTool className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  name="last_maintenance"
                  value={formData.last_maintenance}
                  onChange={handleChange}
                  className="w-full bg-white border border-gray-300 rounded-2xl pl-12 pr-5 py-4 outline-none focus:ring-1 focus:ring-black text-gray-700 font-normal"
                />
              </div>
            </div>
          </div>

          {/* Status Field */}
          <div className="space-y-2">
            <label className="text-gray-400 text-[10px] tracking-widest uppercase font-normal ml-1">
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
        <div className="p-8 border-t border-gray-100 flex items-center justify-between bg-white sticky bottom-0">
          <button
            type="button"
            onClick={onClose}
            className="px-10 py-4 bg-white border border-black rounded-2xl text-black hover:bg-gray-50 transition-all font-normal uppercase tracking-widest"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-3 bg-black text-white px-10 py-4 rounded-2xl font-normal uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? "Updating..." : "Save Changes"} <FiCheck />
          </button>
        </div>
      </div>
    </Drawer>
  );
};

export default UpdateAssetDrawer;
