// leavePolicyUtils.jsx
export const globalFont = "font-['Poppins'] font-normal text-[12px]";
export const labelClass = `${globalFont} text-gray-700 mb-1.5 block`;
export const inputClass = `w-full px-4 py-2 bg-[#F4F6F8] border border-gray-200 rounded-xl ${globalFont} focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all`;
export const cardClass =
  "bg-white p-5 rounded-2xl border border-gray-200 shadow-sm";
export const sectionTitle = `${globalFont} text-gray-800 mb-4 uppercase tracking-wide`;

export const CheckboxRow = ({ label, checked, onChange }) => (
  <div className="flex items-center gap-2">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="accent-black w-4 h-4 rounded border-gray-200 shadow-sm cursor-pointer"
    />
    <span className="text-[11px] text-gray-700 font-normal">{label}</span>
  </div>
);

export const RadioRow = ({ label, checked, onClick }) => (
  <div className="flex items-center gap-2 cursor-pointer" onClick={onClick}>
    <div
      className={`w-3.5 h-3.5 border rounded-full flex items-center justify-center ${checked ? "border-black" : "border-gray-300"}`}
    >
      {checked && <div className="w-2 h-2 bg-black rounded-full" />}
    </div>
    <span
      className={`text-[11px] font-normal ${checked ? "text-gray-900" : "text-gray-500"}`}
    >
      {label}
    </span>
  </div>
);
