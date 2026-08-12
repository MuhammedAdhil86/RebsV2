// import React, { useState } from "react";
// import toast from "react-hot-toast";

// // Helper: Guarantee valid Hex string
// const normalizeHexColor = (color, fallback = "#3B82F6") => {
//   if (!color || typeof color !== "string") return fallback;
//   const trimmed = color.trim();

//   if (/^#([0-9a-fA-F]{3})$/.test(trimmed)) {
//     return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`.toLowerCase();
//   }

//   if (/^#([0-9a-fA-F]{6})$/.test(trimmed)) {
//     return trimmed.toLowerCase();
//   }

//   return fallback.toLowerCase();
// };

// const CreateConfig = ({ createApi, onSuccess, onCancel }) => {
//   // Empty default state for fresh entries
//   const [formData, setFormData] = useState({
//     rule_name: "",
//     code: "",
//     color: "#3b82f6",
//     starting_number: 1,
//     placeholder_digits: 4,
//     prefixes: [],
//     suffixes: [],
//     reuse_starting_number: false,
//   });

//   const [loading, setLoading] = useState(false);
//   const [submitError, setSubmitError] = useState(null);

//   const [newPrefix, setNewPrefix] = useState("");
//   const [newSuffix, setNewSuffix] = useState("");

//   // Input Change Handler
//   const handleChange = (e) => {
//     const { name, value, type, checked } = e.target;

//     setFormData((prev) => ({
//       ...prev,
//       [name]:
//         type === "checkbox"
//           ? checked
//           : name === "starting_number" || name === "placeholder_digits"
//             ? value === ""
//               ? ""
//               : Number(value)
//             : name === "color"
//               ? normalizeHexColor(value)
//               : value,
//     }));
//   };

//   // Prefixes & Suffixes Management
//   const addItem = (type, value, setValue) => {
//     if (!value.trim()) return;
//     setFormData((prev) => ({
//       ...prev,
//       [type]: [...(prev[type] || []), value.trim()],
//     }));
//     setValue("");
//   };

//   const removeItem = (type, index) => {
//     setFormData((prev) => ({
//       ...prev,
//       [type]: (prev[type] || []).filter((_, i) => i !== index),
//     }));
//   };

//   // Submit Handler for Fresh Rules
//   const handleSubmit = async () => {
//     if (!formData.rule_name?.trim() || !formData.code?.trim()) {
//       setSubmitError("Rule Name and Base Code are required fields.");
//       return;
//     }

//     setLoading(true);
//     setSubmitError(null);

//     const ensureNumber = (val, fallback) => {
//       const num = Number(val);
//       return isNaN(num) || val === "" || val === null ? fallback : num;
//     };

//     // Clean payload with user-entered values
//     const payload = {
//       rule_name: String(formData.rule_name).trim(),
//       code: String(formData.code).trim(),
//       color: normalizeHexColor(formData.color, "#3B82F6").toUpperCase(),
//       starting_number: ensureNumber(formData.starting_number, 1),
//       placeholder_digits: ensureNumber(formData.placeholder_digits, 4),
//       prefixes: Array.isArray(formData.prefixes) ? formData.prefixes : [],
//       suffixes: Array.isArray(formData.suffixes) ? formData.suffixes : [],
//       reuse_starting_number: Boolean(formData.reuse_starting_number),
//     };

//     try {
//       await createApi(payload);
//       toast.success("Employee code rule created successfully!");
//       if (onSuccess) onSuccess();
//     } catch (error) {
//       console.error("Create API Failure Details:", error);
//       const errorMessage =
//         error?.message || "Failed to create configuration rule.";

//       setSubmitError(errorMessage);
//       toast.error(errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Live Pattern Preview
//   const prefixes = formData?.prefixes || [];
//   const suffixes = formData?.suffixes || [];
//   const prefixStr = prefixes.length ? `${prefixes.join("-")}-` : "";
//   const suffixStr = suffixes.length ? `-${suffixes.join("-")}` : "";
//   const numberStr = String(formData?.starting_number ?? "").padStart(
//     formData?.placeholder_digits ?? 0,
//     "0",
//   );
//   const sampleCode = `${prefixStr}${numberStr}${suffixStr}`;
//   const isOverLengthLimit = sampleCode.length > 13;

//   return (
//     <div className="w-full bg-white rounded-xl p-6 border border-gray-100 shadow-sm space-y-6 font-poppins font-normal">
//       {/* Code Preview Header */}
//       <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
//         <div>
//           <h3 className="text-base text-gray-800 font-poppins font-normal">
//             New Configuration Preview
//           </h3>
//           <p className="text-[12px] text-gray-500 font-poppins font-normal">
//             Live preview of the generated employee ID pattern
//           </p>
//         </div>

//         <div className="flex items-center gap-3">
//           <span
//             className={`px-4 py-2 text-[12px] font-mono font-normal rounded-md border ${
//               isOverLengthLimit
//                 ? "bg-red-50 text-red-700 border-red-200"
//                 : "bg-blue-50 text-blue-700 border-blue-200"
//             }`}
//           >
//             {sampleCode} ({sampleCode.length}/13)
//           </span>
//         </div>
//       </div>

//       {/* Error Banner */}
//       {submitError && (
//         <div className="w-full p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-[12px] font-poppins font-normal flex justify-between items-center">
//           <span>{submitError}</span>
//           <button
//             type="button"
//             onClick={() => setSubmitError(null)}
//             className="text-red-400 hover:text-red-700 text-xs ml-2 font-poppins font-normal"
//           >
//             ✕
//           </button>
//         </div>
//       )}

//       {/* Form Inputs Grid */}
//       <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
//         <div>
//           <label className="block text-[12px] text-gray-600 mb-1 font-poppins font-normal">
//             Rule Name *
//           </label>
//           <input
//             type="text"
//             name="rule_name"
//             placeholder="e.g. Staff ID Rule"
//             value={formData.rule_name}
//             onChange={handleChange}
//             className="w-full text-[12px] border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-black font-poppins font-normal"
//           />
//         </div>

//         <div className="grid grid-cols-2 gap-2">
//           <div>
//             <label className="block text-[12px] text-gray-600 mb-1 font-poppins font-normal">
//               Base Code *
//             </label>
//             <input
//               type="text"
//               name="code"
//               placeholder="e.g. EMP"
//               value={formData.code}
//               onChange={handleChange}
//               className="w-full text-[12px] border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-black font-poppins font-normal"
//             />
//           </div>
//           <div>
//             <label className="block text-[12px] text-gray-600 mb-1 font-poppins font-normal">
//               Tag Color
//             </label>
//             <div className="flex items-center gap-2 border border-gray-300 rounded-md px-2 py-1 bg-white">
//               <input
//                 type="color"
//                 name="color"
//                 value={formData.color}
//                 onChange={handleChange}
//                 className="w-8 h-8 rounded border-none cursor-pointer bg-transparent"
//               />
//               <span className="text-[12px] text-gray-600 font-mono font-normal uppercase">
//                 {formData.color}
//               </span>
//             </div>
//           </div>
//         </div>

//         <div>
//           <label className="block text-[12px] text-gray-600 mb-1 font-poppins font-normal">
//             Starting Number *
//           </label>
//           <input
//             type="number"
//             name="starting_number"
//             placeholder="e.g. 1"
//             value={formData.starting_number}
//             onChange={handleChange}
//             className="w-full text-[12px] border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-black font-poppins font-normal"
//           />
//         </div>

//         <div>
//           <label className="block text-[12px] text-gray-600 mb-1 font-poppins font-normal">
//             Padding Digits *
//           </label>
//           <input
//             type="number"
//             name="placeholder_digits"
//             placeholder="e.g. 4"
//             value={formData.placeholder_digits}
//             onChange={handleChange}
//             className="w-full text-[12px] border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-black font-poppins font-normal"
//           />
//         </div>
//       </div>

//       {/* Prefixes */}
//       <div className="w-full">
//         <label className="block text-[12px] text-gray-600 mb-1 font-poppins font-normal">
//           Prefixes
//         </label>
//         <div className="flex gap-2 mb-2">
//           <input
//             type="text"
//             placeholder="Add prefix (e.g. DEPT)"
//             value={newPrefix}
//             onChange={(e) => setNewPrefix(e.target.value)}
//             className="text-[12px] border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-black flex-1 font-poppins font-normal"
//           />
//           <button
//             type="button"
//             onClick={() => addItem("prefixes", newPrefix, setNewPrefix)}
//             className="px-4 py-1.5 bg-black text-white text-[12px] rounded-md hover:bg-neutral-800 transition font-poppins font-normal"
//           >
//             Add
//           </button>
//         </div>
//         <div className="flex flex-wrap gap-2">
//           {prefixes.map((prefix, idx) => (
//             <span
//               key={idx}
//               className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] rounded-full border border-gray-200 font-poppins font-normal bg-gray-100 text-gray-700"
//             >
//               {prefix}
//               <button
//                 type="button"
//                 onClick={() => removeItem("prefixes", idx)}
//                 className="text-gray-400 hover:text-red-500 text-[12px] font-poppins font-normal"
//               >
//                 ×
//               </button>
//             </span>
//           ))}
//         </div>
//       </div>

//       {/* Suffixes */}
//       <div className="w-full">
//         <label className="block text-[12px] text-gray-600 mb-1 font-poppins font-normal">
//           Suffixes
//         </label>
//         <div className="flex gap-2 mb-2">
//           <input
//             type="text"
//             placeholder="Add suffix (e.g. 2026)"
//             value={newSuffix}
//             onChange={(e) => setNewSuffix(e.target.value)}
//             className="text-[12px] border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-black flex-1 font-poppins font-normal"
//           />
//           <button
//             type="button"
//             onClick={() => addItem("suffixes", newSuffix, setNewSuffix)}
//             className="px-4 py-1.5 bg-black text-white text-[12px] rounded-md hover:bg-neutral-800 transition font-poppins font-normal"
//           >
//             Add
//           </button>
//         </div>
//         <div className="flex flex-wrap gap-2">
//           {suffixes.map((suffix, idx) => (
//             <span
//               key={idx}
//               className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] rounded-full border border-gray-200 font-poppins font-normal bg-gray-100 text-gray-700"
//             >
//               {suffix}
//               <button
//                 type="button"
//                 onClick={() => removeItem("suffixes", idx)}
//                 className="text-gray-400 hover:text-red-500 text-[12px] font-poppins font-normal"
//               >
//                 ×
//               </button>
//             </span>
//           ))}
//         </div>
//       </div>

//       {/* Reuse Starting Number Toggle */}
//       <div className="w-full flex items-center justify-between pt-2 border-t border-gray-100">
//         <div>
//           <span className="text-[12px] text-gray-700 block font-poppins font-normal">
//             Reuse Starting Number
//           </span>
//           <span className="text-[12px] text-gray-400 font-poppins font-normal">
//             Allow recycling sequence numbers on employee exit
//           </span>
//         </div>
//         <input
//           type="checkbox"
//           name="reuse_starting_number"
//           checked={formData.reuse_starting_number}
//           onChange={handleChange}
//           className="h-4 w-4 accent-black rounded border-gray-300 focus:ring-black cursor-pointer"
//         />
//       </div>

//       {/* Action Buttons */}
//       <div className="flex justify-end gap-3 mt-8 font-poppins font-normal">
//         <button
//           type="button"
//           onClick={onCancel}
//           className="px-8 py-2 border border-gray-300 rounded-xl text-[12px] hover:bg-gray-50 transition-colors font-poppins font-normal"
//         >
//           Cancel
//         </button>
//         <button
//           type="button"
//           onClick={handleSubmit}
//           disabled={loading || isOverLengthLimit}
//           className="px-10 py-2 bg-black text-white rounded-xl text-[12px] hover:bg-neutral-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-poppins font-normal"
//         >
//           {loading ? "Saving..." : "Save Configuration"}
//         </button>
//       </div>
//     </div>
//   );
// };

// export default CreateConfig;
import React, { useState } from "react";
import toast from "react-hot-toast";

// Helper: Guarantee valid Hex string
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

const CreateConfig = ({ createApi, onSuccess, onCancel }) => {
  // Fresh, empty state with no pre-populated inputs
  const [formData, setFormData] = useState({
    rule_name: "",
    code: "",
    color: "#3b82f6",
    starting_number: 1,
    placeholder_digits: 4,
    prefixes: [],
    suffixes: [],
    reuse_starting_number: false,
  });

  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [newPrefix, setNewPrefix] = useState("");
  const [newSuffix, setNewSuffix] = useState("");

  // Input Change Handler
  const handleChange = (e) => {
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

  // Prefixes & Suffixes Management
  const addItem = (type, value, setValue) => {
    if (!value.trim()) return;
    setFormData((prev) => ({
      ...prev,
      [type]: [...(prev[type] || []), value.trim()],
    }));
    setValue("");
  };

  const removeItem = (type, index) => {
    setFormData((prev) => ({
      ...prev,
      [type]: (prev[type] || []).filter((_, i) => i !== index),
    }));
  };

  // Submit Handler purely driving dynamic backend messages
  const handleSubmit = async () => {
    setLoading(true);
    setSubmitError(null);

    const ensureNumber = (val, fallback) => {
      const num = Number(val);
      return isNaN(num) || val === "" || val === null ? fallback : num;
    };

    const payload = {
      rule_name: String(formData.rule_name || "").trim(),
      code: String(formData.code || "").trim(),
      color: normalizeHexColor(formData.color, "#3B82F6").toUpperCase(),
      starting_number: ensureNumber(formData.starting_number, 1),
      placeholder_digits: ensureNumber(formData.placeholder_digits, 4),
      prefixes: Array.isArray(formData.prefixes) ? formData.prefixes : [],
      suffixes: Array.isArray(formData.suffixes) ? formData.suffixes : [],
      reuse_starting_number: Boolean(formData.reuse_starting_number),
    };

    try {
      const response = await createApi(payload);

      // Extract backend success message strictly
      const backendSuccessMsg =
        (typeof response?.data === "string" ? response.data : null) ||
        response?.message ||
        response?.data?.message;

      if (backendSuccessMsg) {
        toast.success(backendSuccessMsg);
      }

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Create API Error:", error);

      const errData = error?.response?.data;

      // Extract backend error directly (Prioritizes "data", then "message")
      const backendErrorMsg =
        (typeof errData?.data === "string" ? errData.data : null) ||
        errData?.message ||
        error?.message;

      if (backendErrorMsg) {
        setSubmitError(backendErrorMsg);
        toast.error(backendErrorMsg, { duration: 6000 });
      }
    } finally {
      setLoading(false);
    }
  };

  // Live Pattern Preview
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

  return (
    <div className="w-full bg-white rounded-xl p-6 border border-gray-100 shadow-sm space-y-6 font-poppins font-normal">
      {/* Preview Header */}
      <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div>
          <h3 className="text-base text-gray-800 font-poppins font-normal">
            New Configuration Preview
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
        </div>
      </div>

      {/* Backend Error Banner */}
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

      {/* Inputs Grid */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[12px] text-gray-600 mb-1 font-poppins font-normal">
            Rule Name *
          </label>
          <input
            type="text"
            name="rule_name"
            placeholder="e.g. Employee Code"
            value={formData.rule_name}
            onChange={handleChange}
            className="w-full text-[12px] border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-black font-poppins font-normal"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[12px] text-gray-600 mb-1 font-poppins font-normal">
              Base Code *
            </label>
            <input
              type="text"
              name="code"
              placeholder="e.g. EMP"
              value={formData.code}
              onChange={handleChange}
              className="w-full text-[12px] border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-black font-poppins font-normal"
            />
          </div>
          <div>
            <label className="block text-[12px] text-gray-600 mb-1 font-poppins font-normal">
              Tag Color
            </label>
            <div className="flex items-center gap-2 border border-gray-300 rounded-md px-2 py-1 bg-white">
              <input
                type="color"
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="w-8 h-8 rounded border-none cursor-pointer bg-transparent"
              />
              <span className="text-[12px] text-gray-600 font-mono font-normal uppercase">
                {formData.color}
              </span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[12px] text-gray-600 mb-1 font-poppins font-normal">
            Starting Number *
          </label>
          <input
            type="number"
            name="starting_number"
            placeholder="e.g. 1"
            value={formData.starting_number}
            onChange={handleChange}
            className="w-full text-[12px] border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-black font-poppins font-normal"
          />
        </div>

        <div>
          <label className="block text-[12px] text-gray-600 mb-1 font-poppins font-normal">
            Padding Digits *
          </label>
          <input
            type="number"
            name="placeholder_digits"
            placeholder="e.g. 4"
            value={formData.placeholder_digits}
            onChange={handleChange}
            className="w-full text-[12px] border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-black font-poppins font-normal"
          />
        </div>
      </div>

      {/* Prefixes */}
      <div className="w-full">
        <label className="block text-[12px] text-gray-600 mb-1 font-poppins font-normal">
          Prefixes
        </label>
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
        <div className="flex flex-wrap gap-2">
          {prefixes.map((prefix, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] rounded-full border border-gray-200 font-poppins font-normal bg-gray-100 text-gray-700"
            >
              {prefix}
              <button
                type="button"
                onClick={() => removeItem("prefixes", idx)}
                className="text-gray-400 hover:text-red-500 text-[12px] font-poppins font-normal"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Suffixes */}
      <div className="w-full">
        <label className="block text-[12px] text-gray-600 mb-1 font-poppins font-normal">
          Suffixes
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Add suffix (e.g. 2026)"
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
        <div className="flex flex-wrap gap-2">
          {suffixes.map((suffix, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] rounded-full border border-gray-200 font-poppins font-normal bg-gray-100 text-gray-700"
            >
              {suffix}
              <button
                type="button"
                onClick={() => removeItem("suffixes", idx)}
                className="text-gray-400 hover:text-red-500 text-[12px] font-poppins font-normal"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Reuse Starting Number Toggle */}
      <div className="w-full flex items-center justify-between pt-2 border-t border-gray-100">
        <div>
          <span className="text-[12px] text-gray-700 block font-poppins font-normal">
            Reuse Starting Number
          </span>
          <span className="text-[12px] text-gray-400 font-poppins font-normal">
            Allow recycling sequence numbers on employee exit
          </span>
        </div>
        <input
          type="checkbox"
          name="reuse_starting_number"
          checked={formData.reuse_starting_number}
          onChange={handleChange}
          className="h-4 w-4 accent-black rounded border-gray-300 focus:ring-black cursor-pointer"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 mt-8 font-poppins font-normal">
        <button
          type="button"
          onClick={onCancel}
          className="px-8 py-2 border border-gray-300 rounded-xl text-[12px] hover:bg-gray-50 transition-colors font-poppins font-normal"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || isOverLengthLimit}
          className="px-10 py-2 bg-black text-white rounded-xl text-[12px] hover:bg-neutral-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-poppins font-normal"
        >
          {loading ? "Saving..." : "Save Configuration"}
        </button>
      </div>
    </div>
  );
};

export default CreateConfig;