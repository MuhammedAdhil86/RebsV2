import React, { useState, useEffect } from "react";
import axiosInstance from "../../../service/axiosinstance";
import payrollService from "../../../service/payrollService";
import Earnings from "./salary_component_tabs/component_earnings_tab";
import Reimbursements from "./salary_component_tabs/reimbursements";
import EditSalaryComponent from "./salary_component_tabs/component_edit_earning ";

const SalaryComponents = () => {
  const [activeSubTab, setActiveSubTab] = useState("earnings");
  const [earningsData, setEarningsData] = useState([]);
  const [reimbursementData, setReimbursementData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState(null);

  const subTabs = [
    { id: "earnings", label: "Earnings" },
    { id: "deductions", label: "Deductions" },
    { id: "benefits", label: "Benefits" },
    { id: "reimbursements", label: "Reimbursements" },
  ];

  const fetchAllData = async (signal) => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch from both sources
      const [compRes, reimbursements] = await Promise.all([
        axiosInstance.get("/api/payroll/components", { signal }),
        payrollService.getReimbursements(signal),
      ]);

      // 1. Set Earnings - Fixed mapping to match API key "component_type"
      const compItems = compRes.data?.data?.items;
      if (Array.isArray(compItems)) {
        // Updated from item.type to item.component_type
        const filteredEarnings = compItems.filter(
          (item) => item.component_type === "earning",
        );
        setEarningsData(filteredEarnings);
      } else {
        setEarningsData([]);
      }

      // 2. Set Reimbursements
      setReimbursementData(reimbursements || []);
    } catch (err) {
      if (err.name !== "CanceledError") {
        setError(err.message || "Failed to load payroll data.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchAllData(controller.signal);
    return () => controller.abort();
  }, []);

  const handleEditRow = (rowData) => {
    setSelectedComponent(rowData);
    setIsEditing(true);
  };

  const handleCloseEdit = () => {
    setIsEditing(false);
    setSelectedComponent(null);
    fetchAllData();
  };

  if (isEditing) {
    return (
      <EditSalaryComponent
        data={selectedComponent}
        onCancel={handleCloseEdit}
      />
    );
  }

  if (isLoading)
    return <div className="p-10 text-center font-poppins">Loading...</div>;

  return (
    <div className="w-full p-4">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded text-sm font-poppins">
          {error}
        </div>
      )}

      <div className="flex border-b border-gray-200 mb-4">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors font-poppins ${
              activeSubTab === tab.id
                ? "border-pink-500 text-pink-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="fade-in">
        {activeSubTab === "earnings" && (
          <Earnings
            data={earningsData}
            onEdit={handleEditRow}
            onRefresh={fetchAllData}
          />
        )}

        {activeSubTab === "reimbursements" && (
          <Reimbursements
            data={reimbursementData}
            onEdit={handleEditRow}
            onRefresh={fetchAllData}
          />
        )}

        {["deductions", "benefits"].includes(activeSubTab) && (
          <div className="py-20 text-center text-gray-400 italic font-poppins">
            {activeSubTab.charAt(0).toUpperCase() + activeSubTab.slice(1)}{" "}
            coming soon.
          </div>
        )}
      </div>
    </div>
  );
};

export default SalaryComponents;
