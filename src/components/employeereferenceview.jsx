import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";

const normalizeHexColor = (color, fallback = "#3B82F6") => {
  if (!color || typeof color !== "string") return fallback;
  const trimmed = color.trim();
  if (/^#([0-9a-fA-F]{3})$/.test(trimmed)) {
    return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`.toLowerCase();
  }
  if (/^#([0-9a-fA-F]{6})$/.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  return fallback.toLowerCase();
};

const ConfigView = ({ fetchApi, updateApi, onCreateClick }) => {
  const [formData, setFormData] = useState(null);
  const [savedData, setSavedData] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [loading, setLoading] = useState(false);

  const [newPrefix, setNewPrefix] = useState("");
  const [newSuffix, setNewSuffix] = useState("");

  const loadEmployeeCodeRule = async () => {
    try {
      setFetchingData(true);
      setFetchError(null);

      const response = await fetchApi();
      const apiData = response?.data || response;

      if (apiData && typeof apiData === "object") {
        const cleanColor = normalizeHexColor(apiData.color);
        const sanitizedData = {
          ...apiData,
          color: cleanColor,
        };
        setFormData(sanitizedData);
        setSavedData(sanitizedData);
      } else {
        throw new Error("Invalid response structure received from server.");
      }
    } catch (error) {
      setFetchError(error?.message || "Failed to fetch rule data from API.");
    } finally {
      setFetchingData(false);
    }
  };

  useEffect(() => {
    loadEmployeeCodeRule();
  }, []);

  useEffect(() => {
    if (!submitError) return;
    const timer = setTimeout(() => setSubmitError(null), 10000);
    return () => clearTimeout(timer);
  }, [submitError]);

  // FIX 1: Safely handle controlled inputs without introducing NaN
  const handleChange = (e) => {
    if (!isEditing) return;
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "starting_number" || name === "placeholder_digits"
            ? value === ""
              ? ""
              : Number(value)
            : name === "color"
              ? normalizeHexColor(value)
              : value,
    }));
  };

  const addItem = (type, value, setValue) => {
    if (!isEditing || !value.trim()) return;
    setFormData((prev) => ({
      ...prev,
      [type]: [...(prev[type] || []), value.trim()],
    }));
    setValue("");
  };

  const removeItem = (type, index) => {
    if (!isEditing) return;
    setFormData((prev) => ({
      ...prev,
      [type]: (prev[type] || []).filter((_, i) => i !== index),
    }));
  };

  const handleCancel = () => {
    setFormData(savedData);
    setSubmitError(null);
    setIsEditing(false);
  };

  // FIX 2: Sanitize & validate data strictly to match exact Postman output
  const handleUpdate = async () => {
    const ruleId = formData?.id || savedData?.id || 7;

    setLoading(true);
    setSubmitError(null);

    const safeParseInt = (val, fallback) => {
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? fallback : parsed;
    };

    const payload = {
      rule_name: String(formData?.rule_name || "").trim() || "Employee Code",
      code: String(formData?.code || "").trim() || "EMP",
      color: normalizeHexColor(
        formData?.color,
        savedData?.color || "#3B82F6",
      ).toUpperCase(),
      starting_number: safeParseInt(formData?.starting_number, 1001),
      placeholder_digits: safeParseInt(formData?.placeholder_digits, 4),
      prefixes: Array.isArray(formData?.prefixes)
        ? formData.prefixes
        : ["EMP", "STAFF"],
      suffixes: Array.isArray(formData?.suffixes)
        ? formData.suffixes
        : ["2026", "IND"],
      reuse_starting_number: Boolean(formData?.reuse_starting_number),
    };

    try {
      const response = await updateApi(ruleId, payload);
      const updatedData = response?.data || response;

      const mergedData = {
        ...savedData,
        ...payload,
        ...(typeof updatedData === "object" ? updatedData : {}),
        id: ruleId,
      };

      setSavedData(mergedData);
      setFormData(mergedData);
      setIsEditing(false);

      toast.success("Employee code rule updated successfully!");
    } catch (error) {
      console.error("PUT Request Error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to update rule.";

      setSubmitError(errorMessage);
      toast.error(errorMessage, { duration: 5000, id: "employee-code-error" });
    } finally {
      setLoading(false);
    }
  };

  const prefixes = formData?.prefixes || [];
  const suffixes = formData?.suffixes || [];
  const prefixStr = prefixes.length ? `${prefixes.join("-")}-` : "";
  const suffixStr = suffixes.length ? `-${suffixes.join("-")}` : "";
  const numberStr = String(formData?.starting_number ?? "").padStart(
    formData?.placeholder_digits ?? 0,
    "0",
  );
  const sampleCode = `${prefixStr}${numberStr}${suffixStr}`;
  const isOverLengthLimit = sampleCode.length > 13;

  if (fetchingData) {
    return (
      <div className="w-full bg-white rounded-xl p-12 border border-gray-100 shadow-sm text-center text-gray-500 font-poppins text-[12px]">
        Loading configuration data from API...
      </div>
    );
  }

  if (fetchError && !formData) {
    return (
      <div className="w-full bg-white rounded-xl p-8 border border-red-100 shadow-sm text-center space-y-4 font-poppins">
        <p className="text-[12px] text-red-500">{fetchError}</p>
        <button
          type="button"
          onClick={loadEmployeeCodeRule}
          className="px-6 py-2 bg-black text-white text-[12px] rounded-xl hover:bg-neutral-800 transition-colors font-poppins font-normal"
        >
          Retry Fetching Data
        </button>
      </div>
    );
  }

  const currentColor = normalizeHexColor(formData?.color || savedData?.color);

  return (
    <div className="w-full bg-white rounded-xl p-6 border border-gray-100 shadow-sm space-y-6 font-poppins font-normal">
      <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div>
          <h3 className="text-base text-gray-800 font-poppins font-normal">
            Generated Code Preview
          </h3>
          <p className="text-[12px] text-gray-500 font-poppins font-normal">
            Live preview of the generated employee ID pattern
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`px-4 py-2 text-[12px] font-mono font-normal rounded-md border ${
              isOverLengthLimit
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-blue-50 text-blue-700 border-blue-200"
            }`}
          >
            {sampleCode} ({sampleCode.length}/13)
          </span>

          <button
            type="button"
            onClick={() => onCreateClick(formData)}
            className="px-6 py-2 bg-black text-white text-[12px] rounded-xl hover:bg-neutral-800 transition-colors font-poppins font-normal"
          >
            Create Configuration
          </button>
        </div>
      </div>

      {submitError && (
        <div className="w-full p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-[12px] font-poppins font-normal flex justify-between items-center">
          <span>{submitError}</span>
          <button
            type="button"
            onClick={() => setSubmitError(null)}
            className="text-red-400 hover:text-red-700 text-xs ml-2 font-poppins font-normal"
          >
            ✕
          </button>
        </div>
      )}

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[12px] text-gray-600 mb-1 font-poppins font-normal">
            Rule Name
          </label>
          <input
            type="text"
            name="rule_name"
            disabled={!isEditing}
            value={formData?.rule_name || ""}
            onChange={handleChange}
            className="w-full text-[12px] border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-black font-poppins font-normal disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[12px] text-gray-600 mb-1 font-poppins font-normal">
              Base Code
            </label>
            <input
              type="text"
              name="code"
              disabled={!isEditing}
              value={formData?.code || ""}
              onChange={handleChange}
              className="w-full text-[12px] border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-black font-poppins font-normal disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-[12px] text-gray-600 mb-1 font-poppins font-normal">
              Tag Color
            </label>
            <div
              className={`flex items-center gap-2 border border-gray-300 rounded-md px-2 py-1 ${
                !isEditing ? "bg-gray-50 cursor-not-allowed" : "bg-white"
              }`}
            >
              <input
                type="color"
                name="color"
                disabled={!isEditing}
                value={currentColor}
                onChange={handleChange}
                className="w-8 h-8 rounded border-none cursor-pointer bg-transparent disabled:cursor-not-allowed disabled:opacity-100"
              />
              <span className="text-[12px] text-gray-600 font-mono font-normal uppercase">
                {currentColor}
              </span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[12px] text-gray-600 mb-1 font-poppins font-normal">
            Starting Number
          </label>
          <input
            type="number"
            name="starting_number"
            disabled={!isEditing}
            value={formData?.starting_number ?? ""}
            onChange={handleChange}
            className="w-full text-[12px] border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-black font-poppins font-normal disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-[12px] text-gray-600 mb-1 font-poppins font-normal">
            Padding Digits
          </label>
          <input
            type="number"
            name="placeholder_digits"
            disabled={!isEditing}
            value={formData?.placeholder_digits ?? ""}
            onChange={handleChange}
            className="w-full text-[12px] border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-black font-poppins font-normal disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      <div className="w-full">
        <label className="block text-[12px] text-gray-600 mb-1 font-poppins font-normal">
          Prefixes
        </label>
        {isEditing && (
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Add prefix (e.g. DEPT)"
              value={newPrefix}
              onChange={(e) => setNewPrefix(e.target.value)}
              className="text-[12px] border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-black flex-1 font-poppins font-normal"
            />
            <button
              type="button"
              onClick={() => addItem("prefixes", newPrefix, setNewPrefix)}
              className="px-4 py-1.5 bg-black text-white text-[12px] rounded-md hover:bg-neutral-800 transition font-poppins font-normal"
            >
              Add
            </button>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {prefixes.map((prefix, idx) => (
            <span
              key={idx}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] rounded-full border border-gray-200 font-poppins font-normal ${
                !isEditing
                  ? "bg-gray-50 text-gray-600 border-gray-200"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {prefix}
              {isEditing && (
                <button
                  type="button"
                  onClick={() => removeItem("prefixes", idx)}
                  className="text-gray-400 hover:text-red-500 text-[12px] font-poppins font-normal"
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      </div>

      <div className="w-full">
        <label className="block text-[12px] text-gray-600 mb-1 font-poppins font-normal">
          Suffixes
        </label>
        {isEditing && (
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Add suffix (e.g. REGION)"
              value={newSuffix}
              onChange={(e) => setNewSuffix(e.target.value)}
              className="text-[12px] border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-black flex-1 font-poppins font-normal"
            />
            <button
              type="button"
              onClick={() => addItem("suffixes", newSuffix, setNewSuffix)}
              className="px-4 py-1.5 bg-black text-white text-[12px] rounded-md hover:bg-neutral-800 transition font-poppins font-normal"
            >
              Add
            </button>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {suffixes.map((suffix, idx) => (
            <span
              key={idx}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] rounded-full border border-gray-200 font-poppins font-normal ${
                !isEditing
                  ? "bg-gray-50 text-gray-600 border-gray-200"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {suffix}
              {isEditing && (
                <button
                  type="button"
                  onClick={() => removeItem("suffixes", idx)}
                  className="text-gray-400 hover:text-red-500 text-[12px] font-poppins font-normal"
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      </div>

      <div className="w-full flex items-center justify-between pt-2 border-t border-gray-100">
        <div>
          <span className="text-[12px] text-gray-700 block font-poppins font-normal">
            Reuse Starting Number
          </span>
          <span className="text-[12px] text-gray-400 font-poppins font-normal">
            Allow recycling sequence numbers on employee exit
          </span>
        </div>

        {isEditing ? (
          <input
            type="checkbox"
            name="reuse_starting_number"
            checked={!!formData?.reuse_starting_number}
            onChange={handleChange}
            className="h-4 w-4 accent-black rounded border-gray-300 focus:ring-black cursor-pointer"
          />
        ) : (
          <div
            className={`h-4 w-4 rounded flex items-center justify-center border transition-colors cursor-not-allowed ${
              formData?.reuse_starting_number
                ? "bg-black border-black text-white"
                : "bg-white border-gray-300"
            }`}
          >
            {formData?.reuse_starting_number && (
              <svg
                className="w-3 h-3 stroke-current"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 mt-8 font-poppins font-normal">
        {!isEditing ? (
          <button
            type="button"
            onClick={() => {
              setSubmitError(null);
              setIsEditing(true);
            }}
            className="px-10 py-2 bg-black text-white rounded-xl text-[12px] hover:bg-neutral-800 transition-colors font-poppins font-normal"
          >
            Edit
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleCancel}
              className="px-8 py-2 border border-gray-300 rounded-xl text-[12px] hover:bg-gray-50 transition-colors font-poppins font-normal"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpdate}
              disabled={loading}
              className="px-10 py-2 bg-black text-white rounded-xl text-[12px] hover:bg-neutral-800 transition-colors disabled:bg-gray-400 font-poppins font-normal"
            >
              {loading ? "Updating..." : "Update"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ConfigView;
