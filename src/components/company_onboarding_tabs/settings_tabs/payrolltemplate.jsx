import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import axiosInstance from "../../../service/axiosinstance";

export default function PayrollTemplates({ employee }) {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await axiosInstance.get(
          `${axiosInstance.baseURL2}api/payroll/templates?status=active`
        );

        const items = response.data?.data?.items || [];
        console.log("Payroll Templates fetched:", items);
        setTemplates(items);

        if (items.length > 0) setSelectedTemplateId(items[0].id);
      } catch (error) {
        console.error("Failed to fetch payroll templates:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const handleSave = () => {
    const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
    console.log("Saved template:", selectedTemplate);
    setIsEditing(false);
    // TODO: call your API to save selection
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-800 text-[14px]">
          Payroll Templates
        </h3>

        {isEditing ? (
          <button
            onClick={handleSave}
            className="text-sm text-blue-600 font-medium hover:underline"
          >
            Save
          </button>
        ) : (
          <Icon
            icon="basil:edit-outline"
            className="w-5 h-5 text-gray-400 cursor-pointer"
            onClick={() => setIsEditing(true)}
          />
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-gray-500 text-sm">Loading templates...</div>
      ) : templates.length === 0 ? (
        <div className="text-gray-500 text-sm">No active templates found.</div>
      ) : (
        <ul className="text-sm space-y-2">
          {templates.map((tpl) => {
            const isSelected = tpl.id === selectedTemplateId;
            return (
              <li
                key={tpl.id}
                className={`flex justify-between items-center border-b border-gray-100 py-2 px-2 rounded cursor-pointer 
                  ${isEditing && isSelected ? "bg-blue-50" : "hover:bg-gray-50"}`}
                onClick={() => isEditing && setSelectedTemplateId(tpl.id)}
                title={`Annual CTC: ₹${tpl.annual_ctc}\nDescription: ${tpl.description}`}
              >
                <span className="text-gray-800 text-[13px]">{tpl.name}</span>
                <span className="text-gray-500 text-[12px]">{tpl.status}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
