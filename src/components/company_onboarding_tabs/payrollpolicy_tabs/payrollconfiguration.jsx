import React, { useCallback, useEffect, useState } from "react";
import { RefreshCw, Loader2, AlertCircle, Settings2 } from "lucide-react";
import { toast } from "react-toastify";

import payrollService from "../../../service/payrollService";

const formatLabel = (key) => {
  return String(key)
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Enabled" : "Disabled";
  }

  if (typeof value === "object") {
    return null;
  }

  return String(value);
};

const ConfigurationValue = ({ label, value }) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (Array.isArray(value)) {
    return (
      <div className="border border-gray-200 rounded-lg p-3">
        <p className="text-xs font-medium text-gray-700 mb-3">
          {formatLabel(label)}
        </p>

        {value.length === 0 ? (
          <p className="text-xs text-gray-400">No data available</p>
        ) : (
          <div className="space-y-3">
            {value.map((item, index) => (
              <div key={index} className="bg-gray-50 rounded-md p-3">
                {typeof item === "object" && item !== null ? (
                  <ConfigurationObject data={item} />
                ) : (
                  <p className="text-xs text-gray-700">{formatValue(item)}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (typeof value === "object") {
    return (
      <div className="border border-gray-200 rounded-lg p-3">
        <p className="text-xs font-medium text-gray-700 mb-3">
          {formatLabel(label)}
        </p>
        <ConfigurationObject data={value} />
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-3">
      <p className="text-[11px] text-gray-400 mb-1">{formatLabel(label)}</p>

      <p
        className={`text-xs font-medium ${
          typeof value === "boolean"
            ? value
              ? "text-green-600"
              : "text-red-500"
            : "text-gray-700"
        }`}
      >
        {formatValue(value)}
      </p>
    </div>
  );
};

const ConfigurationObject = ({ data }) => {
  if (!data || typeof data !== "object") {
    return null;
  }

  const entries = Object.entries(data);

  if (entries.length === 0) {
    return (
      <p className="text-xs text-gray-400">No configuration data available</p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {entries.map(([key, value]) => (
        <ConfigurationValue key={key} label={key} value={value} />
      ))}
    </div>
  );
};

const PayrollConfiguration = () => {
  const [configuration, setConfiguration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPayrollConfiguration = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await payrollService.getPayrollConfiguration();

      console.log("Payroll Configuration Data:", response);

      setConfiguration(response);
    } catch (err) {
      console.error("Payroll Configuration Error:", err);

      const message =
        err?.response?.data?.message ||
        "Failed to fetch payroll configuration.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayrollConfiguration();
  }, [fetchPayrollConfiguration]);

  const hasConfiguration =
    configuration &&
    typeof configuration === "object" &&
    Object.keys(configuration).length > 0;

  return (
    <div className="p-1 rounded-xl font-poppins text-[12px]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-medium text-gray-800">
            Payroll Configuration
          </h3>

          <p className="text-[11px] text-gray-400 mt-1">
            View your organization's payroll configuration.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchPayrollConfiguration}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Content */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 min-h-[250px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-[#e11d2e] mb-3" />

            <p className="text-xs text-gray-400">
              Loading payroll configuration...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <AlertCircle size={30} className="text-red-400 mb-3" />

            <p className="text-sm font-medium text-gray-700 mb-1">
              Unable to load configuration
            </p>

            <p className="text-xs text-gray-400 mb-4">{error}</p>

            <button
              type="button"
              onClick={fetchPayrollConfiguration}
              className="px-4 py-2 rounded-lg bg-[#e11d2e] text-white hover:bg-red-700 transition"
            >
              Try Again
            </button>
          </div>
        ) : !hasConfiguration ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Settings2 size={32} className="text-gray-300 mb-3" />

            <h4 className="text-sm font-medium text-gray-700 mb-1">
              No Payroll Configuration
            </h4>

            <p className="text-xs text-gray-400">
              No payroll configuration data is currently available.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Settings2 size={16} className="text-[#e11d2e]" />

              <h4 className="text-sm font-medium text-gray-800">
                Configuration Details
              </h4>
            </div>

            <ConfigurationObject data={configuration} />
          </div>
        )}
      </div>
    </div>
  );
};

export default PayrollConfiguration;
