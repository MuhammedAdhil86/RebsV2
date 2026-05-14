import React from "react";
import { Icon } from "@iconify/react";

const EducationalDetailsSection = ({ employee }) => {
  const educationData = employee?.education_details || [];

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-800 text-[14px]">Educational Details</h3>
        <Icon
          icon="basil:edit-outline"
          className="w-5 h-5 text-gray-400 cursor-pointer"
        />
      </div>

      {/* Education Records */}
      <div className="space-y-4">
        {educationData.length === 0 ? (
          <div className="text-gray-500 text-[13px]">No educational details available</div>
        ) : (
          educationData.map((edu, index) => (
            <div key={index} className="bg-white ">
              {/* Education Header if multiple entries */}
              {educationData.length > 1 && (
                <div className="text-[14px] font-medium text-gray-800 mb-2 border-b border-gray-200 pb-1">
                  Education {index + 1}
                </div>
              )}

              {/* Institution */}
              <div className="flex justify-between items-center border-b border-gray-100 py-2">
                <span className="text-gray-500 text-[12px]">Institution</span>
                <span className="text-gray-800 text-[13px] flex-1 min-w-0 text-right">
                  {edu.institution_name || "-"}
                </span>
              </div>

              {/* Degree/Diploma */}
              <div className="flex justify-between items-center border-b border-gray-100 py-2">
                <span className="text-gray-500 text-[12px]">Degree/Diploma</span>
                <span className="text-gray-800 text-[13px] flex-1 min-w-0 text-right">
                  {edu.degree || "-"}
                </span>
              </div>

              {/* Specialization */}
              <div className="flex justify-between items-center border-b border-gray-100 py-2">
                <span className="text-gray-500 text-[12px]">Specialization</span>
                <span className="text-gray-800 text-[13px] flex-1 min-w-0 text-right">
                  {edu.specialisation || "-"}
                </span>
              </div>

              {/* Date of Completion */}
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-500 text-[12px]">Date of Completion</span>
                <span className="text-gray-800 text-[13px] flex-1 min-w-0 text-right">
                  {edu.date_of_completion || "-"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EducationalDetailsSection;
