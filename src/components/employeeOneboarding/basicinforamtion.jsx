import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { ChevronDown } from "lucide-react";
import CommonUploadActions from "../../ui/commonupload";
import { addBasicInformation } from "../../service/employeeService";
import payrollService from "../../service/payrollService";
import { calculatePayroll } from "../../service/payrollother"; // use your real service file name
import toast from "react-hot-toast";

const initialFormData = {
  first_name: "",
  last_name: "",
  nick_name: "",
  email: "",
  ph_no: "",
  basic_salary: "",
  image: null,
};

// The 6 text fields that must be filled before the payroll area appears
const REQUIRED_FOR_PAYROLL = [
  "first_name",
  "last_name",
  "nick_name",
  "email",
  "ph_no",
  "basic_salary",
];

const formatMoney = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const formatCalcType = (type) =>
  String(type || "-")
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());

/**
 * Pull the backend's { message, data } out of whatever the service threw.
 * Handles: axios errors (error.response.data), XHR-style errors
 * (error.responseText / error.response as a JSON string), or a plain object.
 */
const parseBackendError = (error) => {
  const candidates = [
    error?.response?.data,
    error?.responseText,
    error?.response,
    error,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;

    let body = candidate;
    if (typeof candidate === "string") {
      try {
        body = JSON.parse(candidate);
      } catch {
        continue;
      }
    }

    if (body && typeof body === "object" && (body.message || body.data)) {
      return {
        message: typeof body.message === "string" ? body.message : "",
        detail: typeof body.data === "string" ? body.data : "",
      };
    }
  }

  return {
    message:
      error?.message ||
      error?.error ||
      error?.detail ||
      "Something went wrong. Please try again.",
    detail: "",
  };
};

const showBackendError = (error) => {
  const { message, detail } = parseBackendError(error);

  toast.error(
    <div>
      <p className="font-medium">{message}</p>
      {detail && <p className="text-sm">{detail}</p>}
    </div>,
  );
};

const BasicInformation = ({ goNextStep, onStepComplete }) => {
  // 🧠 Local form state
  const [formData, setFormData] = useState(initialFormData);

  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 💰 Payroll state
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [payrollResult, setPayrollResult] = useState(null);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  // ✅ Payroll area shows only when all 6 fields have a value
  const isBasicComplete = REQUIRED_FOR_PAYROLL.every(
    (key) => String(formData[key] ?? "").trim() !== "",
  );

  // 🧩 Load saved form (restore from localStorage)
  useEffect(() => {
    const saved = localStorage.getItem("basicInfoForm");
    if (saved) {
      try {
        setFormData((prev) => ({ ...prev, ...JSON.parse(saved) }));
      } catch {
        console.error("Failed to parse saved form data");
      }
    }
  }, []);

  // 💾 Auto-save form data to localStorage
  // (a File object can't be serialized, so the image is left out of the draft)
  useEffect(() => {
    const { image, ...draft } = formData; // eslint-disable-line no-unused-vars
    localStorage.setItem(
      "basicInfoForm",
      JSON.stringify({ ...draft, image: null }),
    );
  }, [formData]);

  // 📋 Fetch payroll templates (same call SalarySection uses)
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const data = await payrollService.getSalaryTemplates();
        setTemplates(data || []);
      } catch (err) {
        toast.error(
          err?.response?.data?.message || "Failed to fetch payroll templates",
        );
      }
    };
    fetchTemplates();
  }, []);

  // 🧩 Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // The old calculation no longer matches the new salary: clear it so
    // the template is picked again and recalculated
    if (name === "basic_salary") {
      setSelectedTemplateId("");
      setPayrollResult(null);
      setShowPayrollModal(false);
    }
  };

  // 🧩 Handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));

      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // 💰 Template picked: calculate straight away and show the result in a modal
  // (annual_ctc = Annual Salary field, strict is fixed to false in the service)
  const handleTemplateChange = async (e) => {
    const templateId = e.target.value ? Number(e.target.value) : "";
    setSelectedTemplateId(templateId);
    setPayrollResult(null);

    if (!templateId) return;

    if (!(Number(formData.basic_salary) > 0)) {
      toast.error("Enter a valid annual salary.");
      setSelectedTemplateId("");
      return;
    }

    try {
      setIsCalculating(true);
      const result = await calculatePayroll({
        annual_ctc: formData.basic_salary,
        template_id: templateId,
      });
      // Accept either { ok, data: {...} } or the inner data object itself
      const data = result?.data ?? result;
      if (!data || typeof data !== "object") {
        throw new Error("No payroll data returned.");
      }
      setPayrollResult(data);
      setShowPayrollModal(true);
    } catch (error) {
      console.error("Error calculating payroll:", error);
      setSelectedTemplateId("");
      showBackendError(error);
    } finally {
      setIsCalculating(false);
    }
  };

  // ✅ Submit form and trigger parent progress
  const handleSubmit = async () => {
    if (isSubmitting) return;

    // Build the payload exactly as the backend expects
    const payload = {
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      nick_name: formData.nick_name.trim(),
      email: formData.email.trim().toLowerCase(),
      ph_no: formData.ph_no.trim(),
      basic_salary: String(formData.basic_salary).trim(),
      image: formData.image, // File -> backend uploads to DigitalOcean Spaces
    };

    // Validation
    if (!payload.first_name || !payload.last_name || !payload.email) {
      toast.error("Please fill out all required fields.");
      return;
    }

    // Empty optional fields are skipped so the backend stores them as NULL
    const formDataToSend = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== null && value !== "") {
        formDataToSend.append(key, value);
      }
    });

    try {
      setIsSubmitting(true);
      const response = await addBasicInformation(formDataToSend);

      // Store backend employee ID for next steps
      const employeeId = response?.data?.id;
      if (employeeId) {
        localStorage.setItem("employeeId", employeeId);
      }

      // ✅ Show success toast (rendered by the global <Toaster /> in App.jsx)
      toast.success("Employee created successfully!");

      // 🧹 Remove saved form data
      localStorage.removeItem("basicInfoForm");

      // 🧠 Save progress in localStorage
      localStorage.setItem("basicInfoCompleted", "true");

      // Reset local form
      setFormData(initialFormData);
      setImagePreview(null);
      setSelectedTemplateId("");
      setPayrollResult(null);
      setShowPayrollModal(false);

      // ✅ Notify parent (progress to next step)
      if (onStepComplete) {
        onStepComplete();
      } else if (goNextStep) {
        goNextStep();
      }
    } catch (error) {
      console.error("Error creating employee:", error);
      showBackendError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 p-3 bg-[#f9fafb]">
      {/* Header */}
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-medium text-gray-900">
            Basic Information
          </h2>
          <span className="text-sm text-gray-500">Step 01</span>
        </div>
        <CommonUploadActions />
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-lg shadow-sm p-6 pb-10 relative mt-2">
        {/* Profile Picture */}
        <div className="relative inline-block mb-6">
          <label htmlFor="file-upload" className="cursor-pointer">
            <img
              src={imagePreview || "https://i.pravatar.cc/100?img=12"}
              alt="profile"
              className="w-20 h-20 rounded-full border-2 border-gray-300 object-cover"
            />
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <div
              className="absolute bottom-2 left-1/2 transform -translate-x-1/2 
                backdrop-blur-md rounded-full p-1.5 shadow-md transition"
            >
              <Icon
                icon="solar:camera-outline"
                className="w-5 h-5 text-white opacity-90"
              />
            </div>
          </label>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-2 gap-4">
          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              First Name
            </label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              placeholder="Enter first name"
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white p-2 text-gray-700 text-sm"
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Last Name
            </label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              placeholder="Enter last name"
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white p-2 text-gray-700 text-sm"
            />
          </div>

          {/* Nick Name */}
          <div className="mt-5">
            <label className="block text-sm font-medium text-gray-700">
              Nick Name
            </label>
            <input
              type="text"
              name="nick_name"
              value={formData.nick_name}
              onChange={handleInputChange}
              placeholder="Enter nick name"
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white p-2 text-gray-700 text-sm"
            />
          </div>

          {/* Email */}
          <div className="mt-5">
            <label className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter email"
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white p-2 text-gray-700 text-sm"
            />
          </div>

          {/* Phone Number */}
          <div className="mt-5">
            <label className="block text-sm font-medium text-gray-700">
              Contact Number
            </label>
            <input
              type="text"
              name="ph_no"
              value={formData.ph_no}
              onChange={handleInputChange}
              placeholder="Enter phone number"
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white p-2 text-gray-700 text-sm"
            />
          </div>

          {/* Salary */}
          <div className="mt-5">
            <label className="block text-sm font-medium text-gray-700">
              Annual Salary
            </label>
            <input
              type="text"
              name="basic_salary"
              value={formData.basic_salary}
              onChange={handleInputChange}
              placeholder="Annual Salary"
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white p-2 text-gray-700 text-sm"
            />
          </div>
        </div>
      </div>

      {/* 💰 Salary Template (appears after the 6 fields are filled) */}
      {isBasicComplete && (
        <div className="bg-white rounded-lg shadow-sm p-6 mt-4">
          <h3 className="text-base font-medium text-gray-900 mb-3">
            Payroll Calculation
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {/* Annual CTC (from Annual Salary, read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Annual CTC
              </label>
              <input
                type="text"
                value={formData.basic_salary}
                readOnly
                className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-100 p-2 text-gray-700 text-sm cursor-not-allowed"
              />
            </div>

            {/* Salary Template: picking one calculates and opens the modal */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Salary Template
                </label>
                {isCalculating && (
                  <span className="text-xs text-gray-500">Calculating...</span>
                )}
                {!isCalculating && payrollResult && (
                  <button
                    type="button"
                    onClick={() => setShowPayrollModal(true)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    View breakdown
                  </button>
                )}
              </div>
              <div className="relative">
                <select
                  value={selectedTemplateId}
                  onChange={handleTemplateChange}
                  disabled={isCalculating}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white pl-2 pr-9 py-2 text-gray-700 text-sm appearance-none disabled:opacity-60"
                >
                  <option value="">Choose Payroll Template</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={14}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Save Button */}
      <div className="flex justify-end mt-6">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-[#111827] hover:bg-black text-white text-sm px-5 py-2 rounded-md shadow disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : "Save & Complete"}
        </button>
      </div>

      {/* 📊 Payroll result modal */}
      {showPayrollModal && payrollResult && (
        <PayrollResultModal
          result={payrollResult}
          templateName={
            templates.find((t) => t.id === selectedTemplateId)?.name || ""
          }
          onClose={() => setShowPayrollModal(false)}
        />
      )}

      {/* No <Toaster /> here: the single global one lives in App.jsx */}
    </div>
  );
};

/* ================= Sub-components ================= */

function SummaryRow({ label, value, strong }) {
  return (
    <div className="flex justify-between items-center py-1.5">
      <span className="text-[12px] text-gray-500">{label}</span>
      <span
        className={`text-[13px] ${
          strong ? "font-medium text-gray-900" : "text-gray-800"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function PayrollResultModal({ result, templateName, onClose }) {
  const mappings = result?.mappings || [];

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-[560px] max-w-full max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-[16px] text-gray-900">Payroll Breakdown</h3>
            {templateName && (
              <p className="text-[11px] text-gray-500 mt-0.5">
                Template: {templateName}
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label="Close"
            className="text-gray-400 hover:text-black transition-colors"
            onClick={onClose}
          >
            <Icon icon="material-symbols:close" className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto space-y-5">
          {/* Components */}
          <div className="border border-gray-200 rounded-lg overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-gray-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Component</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium text-right">Monthly</th>
                  <th className="px-3 py-2 font-medium text-right">Annual</th>
                </tr>
              </thead>
              <tbody>
                {mappings.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-4 text-center text-gray-500"
                    >
                      No components in this template.
                    </td>
                  </tr>
                )}
                {mappings.map((m) => (
                  <tr key={m.id} className="border-t border-gray-100">
                    <td className="px-3 py-2 text-gray-800">
                      Component #{m.component_id}
                      {m.is_balancing_component && (
                        <span className="ml-2 text-[10px] text-gray-600 bg-slate-100 border border-gray-200 rounded-full px-2 py-0.5">
                          Balancing
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      {formatCalcType(m.calculation_type)}
                      {m.calculation_type === "percentage_ctc"
                        ? ` (${m.value}%)`
                        : ""}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-800">
                      {formatMoney(m.monthly_amount)}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-800">
                      {formatMoney(m.annual_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="divide-y divide-gray-100">
            <SummaryRow
              label="Basic Salary (annual)"
              value={formatMoney(result?.basic_salary)}
            />
            <SummaryRow
              label="Total CTC (monthly)"
              value={formatMoney(result?.total_monthly_ctc)}
            />
            <SummaryRow
              label="Total CTC (annual)"
              value={formatMoney(result?.total_annual_ctc)}
              strong
            />
            <SummaryRow
              label="Deductions (monthly)"
              value={formatMoney(result?.total_monthly_deductions)}
            />
            <SummaryRow
              label="Deductions (annual)"
              value={formatMoney(result?.total_annual_deductions)}
            />
            <SummaryRow
              label="Net Pay (monthly)"
              value={formatMoney(result?.net_monthly)}
            />
            <SummaryRow
              label="Net Pay (annual)"
              value={formatMoney(result?.net_annual)}
              strong
            />
          </div>

          {/* Statutory (only when the response has entries) */}
          {Object.keys(result?.statutory || {}).length > 0 && (
            <div className="divide-y divide-gray-100">
              {Object.entries(result.statutory).map(([key, value]) => (
                <SummaryRow
                  key={key}
                  label={formatCalcType(key)}
                  value={
                    typeof value === "object"
                      ? JSON.stringify(value)
                      : formatMoney(value)
                  }
                />
              ))}
            </div>
          )}

          {/* CTC match */}
          <div
            className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-xs ${
              result?.ctc_matched
                ? "bg-green-50 text-green-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            <span>
              {result?.ctc_matched
                ? "Template total matches the annual CTC"
                : `Template total differs from the annual CTC by ${formatMoney(
                    result?.ctc_difference,
                  )}`}
            </span>
            <span>Expected {formatMoney(result?.expected_annual_ctc)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-gray-100 bg-slate-50/60 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-[12px] hover:bg-gray-800 transition-all shadow-sm cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default BasicInformation;
