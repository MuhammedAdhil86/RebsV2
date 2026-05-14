import React, { useState } from "react";
import GlowButton from "../helpers/glowbutton";

export default function AddBankInfo() {
  const [formData, setFormData] = useState({
    customerBankId: "",
    bankName: "Kotak", // ✅ default Kotak
    bankingCountry: "India", // ✅ default India
    modeOfTransaction: "",
    companyAccount: "",
    bankCode: "",
    remarks: "",
  });

  /* ================= HANDLERS ================= */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      customer_bank_id: formData.customerBankId,
      bank_name: formData.bankName,
      banking_country: formData.bankingCountry,
      mode_of_transaction: formData.modeOfTransaction,
      company_account: formData.companyAccount,
      bank_code: formData.bankCode,
      remarks: formData.remarks,
    };

    console.log("BANK INFO PAYLOAD:", payload);
    alert("Bank info saved successfully");
  };

  return (
    <div>
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        {/* ===== FORM ===== */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Row 1 */}
          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Customer Bank Id<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="customerBankId"
                value={formData.customerBankId}
                onChange={handleChange}
                placeholder="Enter customer bank id"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-black"
              />
            </div>

            {/* Bank Name Dropdown */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Bank Name<span className="text-red-500">*</span>
              </label>
              <select
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                className="w-full appearance-none border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:border-black"
              >
                <option value="Kotak">Kotak</option>
                <option value="SBI">SBI</option>
                <option value="HDFC">HDFC</option>
                <option value="ICICI">ICICI</option>
                <option value="Axis">Axis</option>
                <option value="Other">Other Banks</option>
              </select>
            </div>

            {/* Banking Country (default India) */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Banking Country<span className="text-red-500">*</span>
              </label>
              <select
                name="bankingCountry"
                value={formData.bankingCountry}
                onChange={handleChange}
                className="w-full appearance-none border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:border-black"
              >
                <option value="India">India</option>
                <option value="USA">USA</option>
                <option value="UK">UK</option>
                <option value="UAE">UAE</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Mode of Transaction<span className="text-red-500">*</span>
              </label>
              <select
                name="modeOfTransaction"
                value={formData.modeOfTransaction}
                onChange={handleChange}
                className="w-full appearance-none border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:border-black"
              >
                <option value="">Select</option>
                <option value="NEFT">NEFT</option>
                <option value="RTGS">RTGS</option>
                <option value="IMPS">IMPS</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Company Account<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="companyAccount"
                value={formData.companyAccount}
                onChange={handleChange}
                placeholder="Enter company account"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Bank Code<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="bankCode"
                value={formData.bankCode}
                onChange={handleChange}
                placeholder="Enter bank code"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-black"
              />
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-3">
              <label className="block text-sm text-gray-700 mb-1">
                Remarks
              </label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                placeholder="Enter remarks"
                className="w-full h-[80px] border border-gray-300 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:border-black"
              ></textarea>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              className="border border-gray-300 text-gray-700 px-6 rounded-md text-sm hover:bg-gray-100 transition"
            >
              Cancel
            </button>

            <GlowButton onClick={handleSubmit}>Save</GlowButton>
          </div>
        </form>
      </div>
    </div>
  );
}
